import { useQuery } from '@tanstack/react-query'
import { fetchDashboard } from '../../api/surveyQueries'
import { queryKeys } from '../../lib/queryKeys'
import { STALE_TIMES } from '../../lib/staleTimes'
import { useQueryScope } from '../useScopeQuery'
import { useQueryCacheError } from '../useQueryCacheError'

export function useDashboardStats() {
  const { year, instrumentId, enabled } = useQueryScope()
  const query = useQuery({
    queryKey: queryKeys.dashboard(year, instrumentId),
    queryFn: () => fetchDashboard(year, instrumentId),
    enabled,
    staleTime: STALE_TIMES.dashboard,
  })

  useQueryCacheError({
    isError: query.isError,
    hasCachedData: query.data !== undefined,
    enabled,
  })

  return query
}
