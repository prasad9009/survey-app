import ActivityLog from '../models/ActivityLog.js'
import { parseObjectId } from '../utils/instrumentAccess.js'
import { visitDateRangeForYear } from '../utils/yearQuery.js'

/**
 * Record a mutating transition (create, update, delete) asynchronously.
 * Read/view operations are explicitly NOT logged.
 */
export async function logActivity({
  companyId,
  userId,
  userName,
  userRole,
  action,
  entityType,
  entityId,
  summary,
  details,
}) {
  try {
    if (!companyId || !userId || !action || !entityType || !summary) return null
    return await ActivityLog.create({
      companyId,
      userId,
      userName: userName || 'Admin',
      userRole: userRole || 'admin',
      action,
      entityType,
      entityId: entityId || null,
      summary,
      details: details || null,
    })
  } catch (err) {
    console.error('[activity-log] Failed to log activity:', err)
    return null
  }
}

/**
 * Helper to extract actor information from Express request object
 */
export function getActorInfo(req) {
  const user = req?.user ?? {}
  return {
    companyId: user.companyId,
    userId: user.id || user._id,
    userName: user.profile?.fullName || user.fullName || user.email || 'Admin',
    userRole: user.role || 'admin',
  }
}

/**
 * Fetch paginated activity log transitions transparently for all company admins
 */
export async function listActivityLogs(req, query = {}) {
  const companyId = req.user.companyId
  const { search, userId, entityType, action, startDate, endDate, year, page = 1, limit = 20 } = query

  const filter = { companyId }

  if (userId) {
    try {
      filter.userId = parseObjectId(userId, 'userId')
    } catch {
      // Ignore invalid userId filter
    }
  }

  if (entityType && entityType !== 'all') filter.entityType = entityType
  if (action && action !== 'all') filter.action = action

  const yearRange = visitDateRangeForYear(year)
  if (yearRange) {
    filter.createdAt = yearRange
  } else if (startDate || endDate) {
    filter.createdAt = {}
    if (startDate) filter.createdAt.$gte = new Date(startDate)
    if (endDate) filter.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999))
  }

  if (search && typeof search === 'string' && search.trim()) {
    const re = new RegExp(search.trim(), 'i')
    filter.$or = [{ summary: re }, { userName: re }, { action: re }, { entityType: re }]
  }

  const pageNum = Math.max(1, parseInt(String(page), 10) || 1)
  const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20))
  const skip = (pageNum - 1) * limitNum

  const [total, logs] = await Promise.all([
    ActivityLog.countDocuments(filter),
    ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
  ])

  return {
    logs: logs.map((l) => ({
      id: l._id.toString(),
      companyId: l.companyId.toString(),
      userId: l.userId.toString(),
      userName: l.userName,
      userRole: l.userRole,
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId ? l.entityId.toString() : null,
      summary: l.summary,
      details: l.details ?? null,
      createdAt: l.createdAt.toISOString(),
    })),
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum) || 1,
    },
  }
}
