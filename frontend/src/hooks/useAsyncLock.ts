import { useCallback, useRef, useState } from 'react'

/**
 * Runs an async function at most once at a time. Uses a ref so rapid double-clicks
 * are ignored before React re-renders with a disabled button.
 */
export function useAsyncLock() {
  const lockedRef = useRef(false)
  const [locked, setLocked] = useState(false)

  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    if (lockedRef.current) return undefined
    lockedRef.current = true
    setLocked(true)
    try {
      return await fn()
    } finally {
      lockedRef.current = false
      setLocked(false)
    }
  }, [])

  return { run, locked }
}
