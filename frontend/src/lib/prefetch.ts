import type { QueryClient } from '@tanstack/react-query'
import { fetchClients, fetchDashboard, fetchInstrumentCoworkers, fetchSites } from '../services/surveyQueries'
import { queryKeys } from './queryKeys'
import { STALE_TIMES } from './staleTimes'

export async function prefetchAfterLogin(
  qc: QueryClient,
  year: string,
  instrumentId: string | null | undefined,
) {
  const scope = { year, instrumentId }
  await Promise.allSettled([
    qc.prefetchQuery({
      queryKey: queryKeys.dashboard(year, instrumentId),
      queryFn: () => fetchDashboard(year, instrumentId),
      staleTime: STALE_TIMES.dashboard,
    }),
    qc.prefetchQuery({
      queryKey: queryKeys.clients(year, instrumentId),
      queryFn: () => fetchClients(year, instrumentId),
      staleTime: STALE_TIMES.clients,
    }),
    qc.prefetchQuery({
      queryKey: queryKeys.sites(year, instrumentId),
      queryFn: () => fetchSites(year, instrumentId),
      staleTime: STALE_TIMES.sites,
    }),
    instrumentId
      ? qc.prefetchQuery({
          queryKey: queryKeys.instrumentsCoworkers(instrumentId),
          queryFn: () => fetchInstrumentCoworkers(instrumentId),
          staleTime: STALE_TIMES.admins,
        })
      : Promise.resolve(),
  ])
}
