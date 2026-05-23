import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from './queryKeys'

export function invalidateAfterClientChange(qc: QueryClient, year: string, instrumentId: string | null | undefined) {
  void qc.invalidateQueries({ queryKey: queryKeys.clients(year, instrumentId) })
  void qc.invalidateQueries({ queryKey: queryKeys.dashboard(year, instrumentId) })
}

export function invalidateAfterSiteChange(qc: QueryClient, year: string, instrumentId: string | null | undefined) {
  void qc.invalidateQueries({ queryKey: queryKeys.sites(year, instrumentId) })
  invalidateAfterClientChange(qc, year, instrumentId)
}

export function invalidateAfterVisitChange(qc: QueryClient, year: string, instrumentId: string | null | undefined) {
  void qc.invalidateQueries({ queryKey: queryKeys.visits(year, instrumentId) })
  invalidateAfterSiteChange(qc, year, instrumentId)
  void qc.invalidateQueries({ queryKey: [queryKeys.all[0], 'reports'] })
}

export function invalidateAfterTransactionChange(
  qc: QueryClient,
  managerId: string,
  year: string,
  instrumentId: string | null | undefined,
) {
  void qc.invalidateQueries({ queryKey: queryKeys.accountManagerTransactions(managerId, year) })
  void qc.invalidateQueries({ queryKey: queryKeys.accountManagerAccounts(managerId, year) })
  void qc.invalidateQueries({ queryKey: queryKeys.dashboard(year, instrumentId) })
  void qc.invalidateQueries({ queryKey: [queryKeys.all[0], 'reports'] })
}

export function invalidateAfterSettingsChange(qc: QueryClient) {
  void qc.invalidateQueries({ queryKey: queryKeys.settingsCompany() })
  void qc.invalidateQueries({ queryKey: queryKeys.settingsMe() })
}

export function invalidateAccountManager(
  qc: QueryClient,
  managerId: string,
  year: string,
  instrumentId: string | null | undefined,
) {
  void qc.invalidateQueries({ queryKey: queryKeys.accountManagerAccounts(managerId, year) })
  void qc.invalidateQueries({ queryKey: queryKeys.accountManagerTransactions(managerId, year) })
  void qc.invalidateQueries({ queryKey: queryKeys.accountManagerClientSites(managerId) })
  void qc.invalidateQueries({ queryKey: queryKeys.dashboard(year, instrumentId) })
}
