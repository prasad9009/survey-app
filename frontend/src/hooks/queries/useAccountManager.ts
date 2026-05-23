import { useQueries } from '@tanstack/react-query'
import {
  fetchAccountManagerAccounts,
  fetchAccountManagerClientSites,
  fetchAccountManagerTransactions,
} from '../../api/surveyQueries'
import { queryKeys } from '../../lib/queryKeys'
import { STALE_TIMES } from '../../lib/staleTimes'
import { useAuth } from '../../context/AuthContext'
import { useSelectedYear } from '../../context/SelectedYearContext'
import { useQueryCacheError } from '../useQueryCacheError'

export function useAccountManager(managerId: string | undefined) {
  const { token } = useAuth()
  const { selectedYear: year } = useSelectedYear()
  const enabled = Boolean(token && managerId)

  const [accountsQuery, transactionsQuery, clientSitesQuery] = useQueries({
    queries: [
      {
        queryKey: queryKeys.accountManagerAccounts(managerId ?? '', year),
        queryFn: () => fetchAccountManagerAccounts(managerId!, year),
        enabled,
        staleTime: STALE_TIMES.accountManager,
      },
      {
        queryKey: queryKeys.accountManagerTransactions(managerId ?? '', year),
        queryFn: () => fetchAccountManagerTransactions(managerId!, year),
        enabled,
        staleTime: STALE_TIMES.accountManager,
      },
      {
        queryKey: queryKeys.accountManagerClientSites(managerId ?? ''),
        queryFn: () => fetchAccountManagerClientSites(managerId!),
        enabled,
        staleTime: STALE_TIMES.accountManager,
      },
    ],
  })

  const hasData =
    accountsQuery.data !== undefined ||
    transactionsQuery.data !== undefined ||
    clientSitesQuery.data !== undefined

  useQueryCacheError({
    isError: accountsQuery.isError || transactionsQuery.isError,
    hasCachedData: hasData,
    enabled,
  })

  const isLoading =
    accountsQuery.isLoading || transactionsQuery.isLoading || clientSitesQuery.isLoading
  const isFetching =
    accountsQuery.isFetching || transactionsQuery.isFetching || clientSitesQuery.isFetching

  return {
    accountsQuery,
    transactionsQuery,
    clientSitesQuery,
    accounts: accountsQuery.data?.accounts ?? [],
    manager: accountsQuery.data?.manager ?? null,
    summary: accountsQuery.data?.summary ?? null,
    transactions: transactionsQuery.data ?? [],
    clientSites: clientSitesQuery.data ?? {},
    isLoading,
    isFetching,
    isError: accountsQuery.isError && !accountsQuery.data,
    hasData,
  }
}
