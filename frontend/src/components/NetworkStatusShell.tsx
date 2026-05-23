import type { ReactNode } from 'react'
import { OfflineBanner } from './OfflineBanner'
import { useOnlineReconnect } from '../hooks/useOnlineReconnect'

/** Offline banner + automatic refetch when the browser comes back online. */
export function NetworkStatusShell({ children }: { children: ReactNode }) {
  useOnlineReconnect()
  return (
    <>
      <OfflineBanner />
      {children}
    </>
  )
}
