import { useMemo } from 'react'
import { useClients } from './useClients'
import { useSites } from './useSites'

export type ClientRowFromQuery = {
  id?: string
  name: string
  phone: string
  adminId?: string
  sites: number
  revenue: string
  received: string
  pending: string
}

export type SiteRowFromQuery = {
  id?: string
  name: string
  location: string
  lastVisit: string
  status: 'Active' | 'On Hold' | 'Completed'
  received: string
  pending: string
}

export function useClientsAndSites() {
  const clientsQuery = useClients()
  const sitesQuery = useSites()

  const clients = useMemo((): ClientRowFromQuery[] => {
    if (!clientsQuery.data) return []
    return clientsQuery.data.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      adminId: c.adminId,
      sites: c.sites,
      revenue: c.revenue,
      received: c.received,
      pending: c.pending,
    }))
  }, [clientsQuery.data])

  const clientSitesMap = useMemo((): Record<string, SiteRowFromQuery[]> => {
    if (!sitesQuery.data) return {}
    const grouped: Record<string, SiteRowFromQuery[]> = {}
    for (const s of sitesQuery.data) {
      if (!grouped[s.clientName]) grouped[s.clientName] = []
      grouped[s.clientName].push({
        id: s.id,
        name: s.name,
        location: s.location,
        lastVisit: s.lastVisit,
        status: s.status as SiteRowFromQuery['status'],
        received: s.received ?? '₹0',
        pending: s.pending,
      })
    }
    return grouped
  }, [sitesQuery.data])

  const isLoading = clientsQuery.isLoading || sitesQuery.isLoading
  const isFetching = clientsQuery.isFetching || sitesQuery.isFetching
  const isError = clientsQuery.isError && sitesQuery.isError && !clients.length && !Object.keys(clientSitesMap).length
  const hasData = clientsQuery.data !== undefined || sitesQuery.data !== undefined

  return {
    clients,
    clientSitesMap,
    clientsQuery,
    sitesQuery,
    isLoading,
    isFetching,
    isError,
    hasData,
  }
}
