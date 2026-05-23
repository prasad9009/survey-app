import http from './http'
import { buildScopeParams } from '../lib/scopeParams'

export type DashboardPayload = {
  recentVisits: Array<{
    id: string
    visitMongoId?: string
    site: string
    client: string
    date: string
    amount: string
    machine: string
    paymentMode: string
    paymentStatus: string
    notes: string
    work: string
  }>
  pendingAmountByClient: [string, string][]
  stats: {
    totalRevenue: string
    received: string
    pending: string
    totalSites: number
    totalClients: number
  }
}

export async function fetchDashboard(year: string, instrumentId: string | null | undefined) {
  const res = await http.get<{ ok: boolean } & DashboardPayload>('/api/dashboard', {
    params: buildScopeParams(year, instrumentId),
  })
  if (!res.data?.ok) throw new Error('Could not load dashboard')
  return {
    recentVisits: res.data.recentVisits ?? [],
    pendingAmountByClient: res.data.pendingAmountByClient ?? [],
    stats: res.data.stats,
  }
}

export type ClientDto = {
  id: string
  name: string
  phone: string
  adminId?: string
  sites: number
  revenue: string
  received: string
  pending: string
  advance: string
}

export async function fetchClients(year: string, instrumentId: string | null | undefined) {
  const res = await http.get<{ ok: boolean; clients: ClientDto[] }>('/api/clients', {
    params: buildScopeParams(year, instrumentId),
  })
  if (!res.data?.ok) throw new Error('Could not load clients')
  return res.data.clients ?? []
}

export type SiteDto = {
  id: string
  clientName: string
  name: string
  location: string
  lastVisit: string
  status: string
  received: string
  pending: string
  instrumentName?: string
  instrumentCategory?: string
}

export async function fetchSites(year: string, instrumentId: string | null | undefined) {
  const res = await http.get<{ ok: boolean; sites: SiteDto[] }>('/api/sites', {
    params: buildScopeParams(year, instrumentId),
  })
  if (!res.data?.ok) throw new Error('Could not load sites')
  return res.data.sites ?? []
}

export type VisitDto = {
  id: string
  _id?: string
  visitMongoId?: string
  visitNo?: number
  instrumentId?: string
  client: string
  site: string
  date: string
  machine: string
  work: string
  amount: string
  pendingAmount?: string
  paymentMode: string
  paymentStatus: string
  notes: string
  siteAddress?: string
  sitePhone?: string
  photoUrls?: string[]
}

export async function fetchVisits(year: string, instrumentId: string | null | undefined) {
  const res = await http.get<{ ok: boolean; visits: VisitDto[] }>('/api/visits', {
    params: buildScopeParams(year, instrumentId),
  })
  if (!res.data?.ok) throw new Error('Could not load visits')
  return res.data.visits ?? []
}

export type AccountRowDto = {
  name: string
  phone: string
  sites: number
  revenue: string
  received: string
  pending: string
  lastVisit?: string
}

export type LedgerMetaDto = {
  slug: string
  fullName: string
  shortName: string
  phone: string
  adminId: string
}

export type LedgerSummaryDto = {
  totalDebit: number
  totalCredit: number
  netBalance: number
  pendingTotal: number
  globalPendingTotal?: number
}

export async function fetchAccountManagerAccounts(managerId: string, year: string) {
  const res = await http.get<{
    ok: boolean
    accounts: AccountRowDto[]
    manager?: LedgerMetaDto
    summary?: LedgerSummaryDto
  }>(`/api/account-managers/${managerId}/accounts`, { params: { year } })
  if (!res.data?.ok) throw new Error('Could not load account manager')
  return {
    accounts: res.data.accounts ?? [],
    manager: res.data.manager ?? null,
    summary: res.data.summary ?? null,
  }
}

export type TransactionDto = {
  id: string
  type: string
  amount: number
  date: string
  reason?: string
  client?: string
  site?: string
}

export async function fetchAccountManagerTransactions(managerId: string, year: string) {
  const res = await http.get<{ ok: boolean; transactions: TransactionDto[] }>(
    `/api/transactions/${managerId}`,
    { params: { year } },
  )
  if (!res.data?.ok) throw new Error('Could not load transactions')
  return res.data.transactions ?? []
}

export async function fetchAccountManagerClientSites(managerId: string) {
  const res = await http.get<{ ok: boolean; clientSites: Record<string, string[]> }>(
    `/api/account-managers/${managerId}/client-sites`,
  )
  if (!res.data?.ok) throw new Error('Could not load client sites')
  return res.data.clientSites ?? {}
}

export type InstrumentCoworkerDto = {
  adminId: string
  accountManagerSlug: string | null
  fullName: string
  shortName: string
  phone: string
  email: string
}

export async function fetchInstrumentCoworkers(instrumentId: string) {
  const res = await http.get<{ ok: boolean; admins: InstrumentCoworkerDto[] }>('/api/instruments/coworkers', {
    params: { instrumentId },
  })
  if (!res.data?.ok) throw new Error('Could not load instrument coworkers')
  return res.data.admins ?? []
}

export type ReportRowDto = {
  id: string
  type: string
  client: string
  site: string
  date: string
  machine: string
  status: 'Completed' | 'Pending'
}

export type ReportFilters = {
  reportType: string
  clientFilter: string
  siteFilter: string
  fromDate: string
  toDate: string
  machineType: string
  searchQuery: string
  statusFilter: string
}

export async function fetchReportRows(filters: ReportFilters) {
  const res = await http.get<{ ok: boolean; rows: ReportRowDto[] }>('/api/reports/rows', { params: filters })
  if (!res.data?.ok) throw new Error('Could not load report')
  return res.data.rows ?? []
}

export type SettingsCompanyDto = {
  name: string
  ownerName?: string
  contactPhone?: string
  email?: string
  officeAddress?: string
  gstNumber?: string
  settings?: Record<string, unknown>
  invoiceDefaults?: Record<string, unknown>
  branding?: { logoUrl?: string | null }
  storage?: {
    usedBytes: number
    quotaBytes: number
    lastBackupAt?: string | null
    fileCount: number
  }
}

export async function fetchSettingsCompany() {
  const res = await http.get<{ ok: boolean; company: SettingsCompanyDto }>('/api/settings/company')
  if (!res.data?.ok) throw new Error('Could not load company settings')
  return res.data.company
}

export type SettingsMeDto = {
  email: string
  profile?: { fullName?: string; phone?: string }
  preferences?: { theme?: string; language?: string }
  bankDetails?: Record<string, unknown>
  bankSignatureUrl?: string | null
}

export async function fetchSettingsMe() {
  const res = await http.get<{ ok: boolean } & SettingsMeDto>('/api/settings/me')
  if (!res.data?.ok) throw new Error('Could not load profile settings')
  const { ok: _ok, ...rest } = res.data
  return rest
}

export async function fetchAdmins() {
  const res = await http.get<{ ok: boolean; admins: Array<{ id: string }> }>('/api/admins')
  if (!res.data?.ok) throw new Error('Could not load admins')
  return res.data.admins ?? []
}
