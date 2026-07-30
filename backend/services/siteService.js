import mongoose from 'mongoose'
import Site from '../models/Site.js'
import Client from '../models/Client.js'
import SiteVisit from '../models/SiteVisit.js'
import Transaction from '../models/Transaction.js'
import Invoice from '../models/Invoice.js'
import SurveyFile from '../models/SurveyFile.js'
import { ApiError } from '../utils/ApiError.js'
import { resolveInstrumentScope, sharedInstrumentOperationalScope } from '../utils/scope.js'
import { reconcileSiteCreditsForInstrument } from './visitCreditAllocation.js'
import { visitDateRangeForYear } from '../utils/yearQuery.js'
import { decAmount, effectivePaidAmount } from '../utils/visitPaymentMath.js'
import * as uploadService from './uploadService.js'
import { parsePagination } from '../utils/pagination.js'
import { logActivity, getActorInfo } from './activityLogService.js'


function formatInr(n) {
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

function statusLabel(s) {
  if (s === 'active') return 'Active'
  if (s === 'on_hold') return 'On Hold'
  return 'Completed'
}

async function siteFinancials(siteId, visitDateRange, instrumentId) {
  const q = {
    siteId,
    ...(instrumentId ? { instrumentId } : {}),
    ...(visitDateRange ? { visitDate: visitDateRange } : {}),
  }
  const visits = await SiteVisit.find(q).select('amount paymentStatus paidAmount').lean()
  let total = 0
  let received = 0
  for (const v of visits) {
    const a = decAmount(v.amount)
    total += a
    received += effectivePaidAmount(v)
  }
  return { revenue: total, received, pending: Math.max(0, total - received) }
}

async function lastVisitLabelForSite(siteId, visitDateRange, fallbackLastVisitAt) {
  if (!visitDateRange) {
    if (!fallbackLastVisitAt) return '—'
    return new Date(fallbackLastVisitAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }
  const v = await SiteVisit.findOne({ siteId, visitDate: visitDateRange })
    .sort({ visitDate: -1 })
    .select('visitDate')
    .lean()
  if (!v?.visitDate) return '—'
  return new Date(v.visitDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export async function listSitesForClient(req, clientId) {
  const { effectiveInstrumentId } = await resolveInstrumentScope(req)
  const client = await Client.findOne({
    _id: clientId,
    companyId: req.user.companyId,
    ...(await sharedInstrumentOperationalScope(req)),
  }).lean()
  if (!client) throw new ApiError(404, 'Client not found')

  const visitYearRange = visitDateRangeForYear(req.query?.year)
  const sites = await Site.find({
    clientId,
    companyId: req.user.companyId,
    ...(effectiveInstrumentId ? { instrumentId: effectiveInstrumentId } : {}),
  })
    .select('name locationLabel address status lastVisitAt updatedAt')
    .sort({ updatedAt: -1 })
    .limit(200)
    .lean()
  const out = []
  for (const s of sites) {
    const { received, pending } = await siteFinancials(s._id, visitYearRange, effectiveInstrumentId)
    const lastVisit = await lastVisitLabelForSite(s._id, visitYearRange, s.lastVisitAt)
    out.push({
      id: s._id.toString(),
      name: s.name,
      location: s.locationLabel || s.address || '—',
      lastVisit,
      status: statusLabel(s.status),
      received: formatInr(received),
      pending: formatInr(pending),
    })
  }
  return out
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export async function updateSite(req, siteId, body) {
  const { effectiveInstrumentId } = await resolveInstrumentScope(req)
  const site = await Site.findOne({
    _id: siteId,
    companyId: req.user.companyId,
    ...(await sharedInstrumentOperationalScope(req)),
  })
  if (!site) throw new ApiError(404, 'Site not found')

  const patch = {}
  if (body.name != null) {
    const name = body.name.trim()
    if (!name) throw new ApiError(400, 'Site name is required')
    const dup = await Site.findOne({
      companyId: req.user.companyId,
      clientId: site.clientId,
      _id: { $ne: site._id },
      name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
    }).lean()
    if (dup) throw new ApiError(409, 'A site with this name already exists for this client')
    patch.name = name
  }
  if (body.locationLabel !== undefined) {
    patch.locationLabel = body.locationLabel?.trim() || undefined
  }
  if (body.status != null) {
    patch.status = body.status
  }

  if (Object.keys(patch).length === 0) {
    throw new ApiError(400, 'No changes to save')
  }

  Object.assign(site, patch)
  await site.save()

  const actor = getActorInfo(req)
  logActivity({
    ...actor,
    action: 'UPDATE_SITE',
    entityType: 'site',
    entityId: site._id,
    summary: `${actor.userName} updated site '${site.name}'`,
    details: { name: site.name, status: site.status, locationLabel: site.locationLabel },
  })

  const visitYearRange = visitDateRangeForYear(req.query?.year)
  const { received, pending } = await siteFinancials(site._id, visitYearRange, effectiveInstrumentId)
  const lastVisit = await lastVisitLabelForSite(site._id, visitYearRange, site.lastVisitAt)
  return {
    id: site._id.toString(),
    name: site.name,
    location: site.locationLabel || site.address || '—',
    lastVisit,
    status: statusLabel(site.status),
    received: formatInr(received),
    pending: formatInr(pending),
  }
}

export async function createSite(req, { clientId, name, locationLabel }) {
  const { effectiveInstrumentId, allowedInstrumentIds } = await resolveInstrumentScope(req)
  const client = await Client.findOne({
    _id: clientId,
    companyId: req.user.companyId,
    ...(await sharedInstrumentOperationalScope(req)),
  })
  if (!client) throw new ApiError(404, 'Client not found')
  const site = await Site.create({
    companyId: req.user.companyId,
    adminId: client.adminId,
    instrumentId: effectiveInstrumentId ?? client.instrumentId,
    clientId: client._id,
    name: name.trim(),
    locationLabel: locationLabel?.trim(),
    status: 'active',
  })

  const actor = getActorInfo(req)
  logActivity({
    ...actor,
    action: 'CREATE_SITE',
    entityType: 'site',
    entityId: site._id,
    summary: `${actor.userName} added new site '${site.name}' for client '${client.name}'`,
    details: { siteName: site.name, clientName: client.name, locationLabel: site.locationLabel },
  })

  return {
    id: site._id.toString(),
    name: site.name,
    location: site.locationLabel || '—',
    lastVisit: '—',
    status: 'Active',
    received: formatInr(0),
    pending: formatInr(0),
  }
}

export async function listAllSites(req) {
  const { effectiveInstrumentId } = await resolveInstrumentScope(req)
  if (effectiveInstrumentId) {
    await reconcileSiteCreditsForInstrument(req.user.companyId, effectiveInstrumentId)
  }
  const visitYearRange = visitDateRangeForYear(req.query?.year)
  const { limit, skip, paginated } = parsePagination(req.query, { defaultLimit: 500, maxLimit: 500 })
  const match = {
    companyId: req.user.companyId,
    ...(await sharedInstrumentOperationalScope(req)),
  }
  const baseQuery = Site.find(match)
    .select('name locationLabel address status lastVisitAt updatedAt clientId instrumentId')
    .populate('clientId', 'name')
    .populate('instrumentId', 'name category')
    .sort({ updatedAt: -1 })
  const [total, sites] = await Promise.all([
    paginated ? Site.countDocuments(match) : Promise.resolve(null),
    baseQuery.skip(skip).limit(limit).lean(),
  ])
  const out = []
  for (const s of sites) {
    const { received, pending } = await siteFinancials(s._id, visitYearRange, effectiveInstrumentId)
    const lastVisit = await lastVisitLabelForSite(s._id, visitYearRange, s.lastVisitAt)
    const inst = s.instrumentId && typeof s.instrumentId === 'object' ? s.instrumentId : null
    out.push({
      id: s._id.toString(),
      clientName: s.clientId?.name ?? '',
      name: s.name,
      location: s.locationLabel || s.address || '—',
      lastVisit,
      status: statusLabel(s.status),
      received: formatInr(received),
      pending: formatInr(pending),
      instrumentName: inst?.name ?? '',
      instrumentCategory: inst?.category ?? '',
    })
  }
  if (paginated && total != null) {
    return { sites: out, meta: { total, page: Math.floor(skip / limit) + 1, limit } }
  }
  return out
}

/**
 * Removes one site plus its visits, invoices tied to that site or those visits,
 * related transactions, and linked survey files (Cloudinary + DB).
 */
export async function deleteSiteWithRelated(req, siteId) {
  const site = await Site.findOne({
    _id: siteId,
    companyId: req.user.companyId,
    ...(await sharedInstrumentOperationalScope(req)),
  }).select('_id name clientId')
  if (!site) throw new ApiError(404, 'Site not found')

  const client = await Client.findOne({ _id: site.clientId, companyId: req.user.companyId }).select('name').lean()

  const visits = await SiteVisit.find({ siteId: site._id, companyId: req.user.companyId })
    .select('_id photoFileIds photoUrls invoiceId')
    .lean()
  const visitIds = visits.map((v) => v._id)
  const visitInvoiceIds = [...new Set(visits.map((v) => v.invoiceId).filter(Boolean).map((id) => id.toString()))].map(
    (id) => new mongoose.Types.ObjectId(id),
  )

  const invoiceOr = [{ siteId: site._id }]
  if (visitIds.length) invoiceOr.push({ siteVisitIds: { $in: visitIds } })
  if (visitInvoiceIds.length) invoiceOr.push({ _id: { $in: visitInvoiceIds } })

  const invoices = await Invoice.find({
    companyId: req.user.companyId,
    $or: invoiceOr,
  })
    .select('pdfFileId')
    .lean()

  const fileIdSet = new Set()
  for (const v of visits) {
    for (const fid of v.photoFileIds ?? []) {
      if (fid) fileIdSet.add(fid.toString())
    }
  }
  for (const inv of invoices) {
    if (inv.pdfFileId) fileIdSet.add(inv.pdfFileId.toString())
  }
  const fileObjectIds = [...fileIdSet].map((id) => new mongoose.Types.ObjectId(id))

  const txOr = [{ siteId: site._id }]
  if (site.clientId) txOr.push({ clientId: site.clientId })
  if (visitIds.length) txOr.push({ siteVisitId: { $in: visitIds } })
  if (site.name) {
    txOr.push({ reason: new RegExp(escapeRegex(site.name), 'i') })
  }
  if (client?.name) {
    txOr.push({ reason: new RegExp(escapeRegex(client.name), 'i') })
  }

  if (fileObjectIds.length) {
    await uploadService.purgeCloudinaryForSurveyFileIds(req.user.companyId, fileObjectIds)
  }
  await uploadService.purgeCloudinaryForPhotoUrls(visits.flatMap((v) => v.photoUrls ?? []))

  await Transaction.deleteMany({ companyId: req.user.companyId, $or: txOr })
  await Invoice.deleteMany({ companyId: req.user.companyId, $or: invoiceOr })
  await SiteVisit.deleteMany({ siteId: site._id, companyId: req.user.companyId })
  if (fileObjectIds.length) {
    await SurveyFile.deleteMany({ companyId: req.user.companyId, _id: { $in: fileObjectIds } })
  }
  await Site.deleteOne({ _id: site._id, companyId: req.user.companyId })

  const delActor = getActorInfo(req)
  logActivity({
    ...delActor,
    action: 'DELETE_SITE',
    entityType: 'site',
    entityId: site._id,
    summary: `${delActor.userName} deleted site '${site.name}'`,
    details: { siteName: site.name },
  })
}
