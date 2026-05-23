/** Root prefix for persisted API cache — never use for auth/passwords. */
export const SURVEY_CACHE_ROOT = 'survey' as const

export type ScopeParams = { year: string; instrumentId?: string }

function scopeKey(year: string, instrumentId: string | null | undefined) {
  return [year, instrumentId ?? ''] as const
}

export const queryKeys = {
  all: [SURVEY_CACHE_ROOT] as const,
  dashboard: (year: string, instrumentId: string | null | undefined) =>
    [SURVEY_CACHE_ROOT, 'dashboard', ...scopeKey(year, instrumentId)] as const,
  clients: (year: string, instrumentId: string | null | undefined) =>
    [SURVEY_CACHE_ROOT, 'clients', ...scopeKey(year, instrumentId)] as const,
  sites: (year: string, instrumentId: string | null | undefined) =>
    [SURVEY_CACHE_ROOT, 'sites', ...scopeKey(year, instrumentId)] as const,
  visits: (year: string, instrumentId: string | null | undefined) =>
    [SURVEY_CACHE_ROOT, 'visits', ...scopeKey(year, instrumentId)] as const,
  accountManagerAccounts: (managerId: string, year: string) =>
    [SURVEY_CACHE_ROOT, 'accountManager', 'accounts', managerId, year] as const,
  accountManagerTransactions: (managerId: string, year: string) =>
    [SURVEY_CACHE_ROOT, 'accountManager', 'transactions', managerId, year] as const,
  accountManagerClientSites: (managerId: string) =>
    [SURVEY_CACHE_ROOT, 'accountManager', 'clientSites', managerId] as const,
  reports: (filters: Record<string, string>) =>
    [SURVEY_CACHE_ROOT, 'reports', filters] as const,
  settingsCompany: () => [SURVEY_CACHE_ROOT, 'settings', 'company'] as const,
  settingsMe: () => [SURVEY_CACHE_ROOT, 'settings', 'me'] as const,
  admins: () => [SURVEY_CACHE_ROOT, 'admins'] as const,
  instrumentsCoworkers: (instrumentId: string | null | undefined) =>
    [SURVEY_CACHE_ROOT, 'instruments', 'coworkers', instrumentId ?? ''] as const,
}
