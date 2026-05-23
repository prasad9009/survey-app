import { useQuery } from '@tanstack/react-query'
import { fetchInstrumentCoworkers, type InstrumentCoworkerDto } from '../../api/surveyQueries'
import { queryKeys } from '../../lib/queryKeys'
import { STALE_TIMES } from '../../lib/staleTimes'
import { useAuth } from '../../context/AuthContext'

export type { InstrumentCoworkerDto }

export function useInstrumentCoworkers() {
  const { token, activeInstrumentId } = useAuth()

  const query = useQuery({
    queryKey: queryKeys.instrumentsCoworkers(activeInstrumentId),
    queryFn: () => fetchInstrumentCoworkers(activeInstrumentId!),
    enabled: Boolean(token && activeInstrumentId),
    staleTime: STALE_TIMES.admins,
  })

  return {
    coworkers: query.data ?? [],
    isLoading: query.isLoading,
    isFetched: query.isFetched,
    isError: query.isError,
  }
}
