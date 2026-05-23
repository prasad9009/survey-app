import { QueryClient } from '@tanstack/react-query'
import { SURVEY_CACHE_ROOT } from './queryKeys'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24,
      staleTime: 60_000,
      retry: 2,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      retry: 0,
    },
  },
})

export function shouldPersistSurveyQuery(query: { queryKey: readonly unknown[] }) {
  const root = query.queryKey[0]
  return root === SURVEY_CACHE_ROOT
}
