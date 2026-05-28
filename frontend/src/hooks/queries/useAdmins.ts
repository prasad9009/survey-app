import { useQuery } from '@tanstack/react-query'
import { fetchAdmins } from '../../services/surveyQueries'
import { queryKeys } from '../../lib/queryKeys'
import { STALE_TIMES } from '../../lib/staleTimes'
import { useAuth } from '../../context/AuthContext'

export function useAdmins(enabledOverride?: boolean) {
  const { token } = useAuth()
  return useQuery({
    queryKey: queryKeys.admins(),
    queryFn: fetchAdmins,
    enabled: enabledOverride ?? Boolean(token),
    staleTime: STALE_TIMES.admins,
  })
}
