import { useQuery } from '@tanstack/react-query'
import { fetchClients } from '../../services/surveyQueries'
import { queryKeys } from '../../lib/queryKeys'
import { STALE_TIMES } from '../../lib/staleTimes'
import { useQueryScope } from '../useScopeQuery'
import { useQueryCacheError } from '../useQueryCacheError'

export function useClients() {
  const { year, instrumentId, enabled } = useQueryScope()
  const query = useQuery({
    queryKey: queryKeys.clients(year, instrumentId),
    queryFn: () => fetchClients(year, instrumentId),
    enabled,
    staleTime: STALE_TIMES.clients,
  })

  useQueryCacheError({
    isError: query.isError,
    hasCachedData: query.data !== undefined,
    enabled,
  })

  return query
}
