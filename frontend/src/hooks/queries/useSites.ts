import { useQuery } from '@tanstack/react-query'
import { fetchSites } from '../../api/surveyQueries'
import { queryKeys } from '../../lib/queryKeys'
import { STALE_TIMES } from '../../lib/staleTimes'
import { useQueryScope } from '../useScopeQuery'
import { useQueryCacheError } from '../useQueryCacheError'

export function useSites() {
  const { year, instrumentId, enabled } = useQueryScope()
  const query = useQuery({
    queryKey: queryKeys.sites(year, instrumentId),
    queryFn: () => fetchSites(year, instrumentId),
    enabled,
    staleTime: STALE_TIMES.sites,
  })

  useQueryCacheError({
    isError: query.isError,
    hasCachedData: query.data !== undefined,
    enabled,
  })

  return query
}
