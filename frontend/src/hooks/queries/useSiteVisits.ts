import { useQuery } from '@tanstack/react-query'
import { fetchVisits } from '../../services/surveyQueries'
import { queryKeys } from '../../lib/queryKeys'
import { STALE_TIMES } from '../../lib/staleTimes'
import { useQueryScope } from '../useScopeQuery'
import { useQueryCacheError } from '../useQueryCacheError'

export function useSiteVisits() {
  const { year, instrumentId, enabled } = useQueryScope()
  const query = useQuery({
    queryKey: queryKeys.visits(year, instrumentId),
    queryFn: () => fetchVisits(year, instrumentId),
    enabled,
    staleTime: STALE_TIMES.visits,
  })

  useQueryCacheError({
    isError: query.isError,
    hasCachedData: query.data !== undefined,
    enabled,
  })

  return query
}
