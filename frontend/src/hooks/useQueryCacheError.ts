import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

const CACHE_ERROR_TOAST = 'Showing saved data. Could not fetch latest updates.'

/** Warn once per error spell when stale cached data is still shown. */
export function useQueryCacheError(options: {
  isError: boolean
  hasCachedData: boolean
  enabled?: boolean
}) {
  const { isError, hasCachedData, enabled = true } = options
  const toastedRef = useRef(false)

  useEffect(() => {
    if (!enabled) return
    if (isError && hasCachedData) {
      if (!toastedRef.current) {
        toastedRef.current = true
        toast.warning(CACHE_ERROR_TOAST)
      }
    } else {
      toastedRef.current = false
    }
  }, [isError, hasCachedData, enabled])
}
