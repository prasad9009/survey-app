import { useQueries } from '@tanstack/react-query'
import { fetchSettingsCompany, fetchSettingsMe } from '../../api/surveyQueries'
import { queryKeys } from '../../lib/queryKeys'
import { STALE_TIMES } from '../../lib/staleTimes'
import { useAuth } from '../../context/AuthContext'
import { useQueryCacheError } from '../useQueryCacheError'

export function useSettings() {
  const { token } = useAuth()
  const enabled = Boolean(token)

  const [companyQuery, meQuery] = useQueries({
    queries: [
      {
        queryKey: queryKeys.settingsCompany(),
        queryFn: fetchSettingsCompany,
        enabled,
        staleTime: STALE_TIMES.settings,
      },
      {
        queryKey: queryKeys.settingsMe(),
        queryFn: fetchSettingsMe,
        enabled,
        staleTime: STALE_TIMES.settings,
      },
    ],
  })

  const hasData = companyQuery.data !== undefined || meQuery.data !== undefined

  useQueryCacheError({
    isError: companyQuery.isError || meQuery.isError,
    hasCachedData: hasData,
    enabled,
  })

  const isLoading = companyQuery.isLoading || meQuery.isLoading
  const isFetching = companyQuery.isFetching || meQuery.isFetching

  return {
    companyQuery,
    meQuery,
    company: companyQuery.data,
    me: meQuery.data,
    isLoading,
    isFetching,
    isError: companyQuery.isError && meQuery.isError && !hasData,
    hasData,
  }
}
