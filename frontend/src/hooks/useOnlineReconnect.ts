import { useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { queryClient } from '../lib/queryClient'
import { useOnlineStatus } from './useOnlineStatus'

/** When connectivity returns, refetch active queries and refresh the auth session. */
export function useOnlineReconnect() {
  const isOnline = useOnlineStatus()
  const { token, refreshSession } = useAuth()
  const wasOfflineRef = useRef(false)

  useEffect(() => {
    if (!isOnline) {
      wasOfflineRef.current = true
      return
    }

    if (!wasOfflineRef.current) return
    wasOfflineRef.current = false

    void queryClient.refetchQueries({ type: 'active' })
    if (token) void refreshSession()
  }, [isOnline, token, refreshSession])
}
