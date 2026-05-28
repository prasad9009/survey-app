import { useQuery } from '@tanstack/react-query'
import { fetchReportRows, type ReportFilters } from '../../services/surveyQueries'
import { queryKeys } from '../../lib/queryKeys'
import { STALE_TIMES } from '../../lib/staleTimes'
import { useAuth } from '../../context/AuthContext'
import { useQueryCacheError } from '../useQueryCacheError'

export function useReports(filters: ReportFilters) {
  const { token } = useAuth()
  const enabled = Boolean(token)
  const filterKey = {
    reportType: filters.reportType,
    clientFilter: filters.clientFilter,
    siteFilter: filters.siteFilter,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    machineType: filters.machineType,
    searchQuery: filters.searchQuery,
    statusFilter: filters.statusFilter,
  }

  const query = useQuery({
    queryKey: queryKeys.reports(filterKey),
    queryFn: () => fetchReportRows(filters),
    enabled: enabled && Boolean(filters.fromDate && filters.toDate),
    staleTime: STALE_TIMES.reports,
  })

  useQueryCacheError({
    isError: query.isError,
    hasCachedData: query.data !== undefined,
    enabled,
  })

  return query
}
