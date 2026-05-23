import { useOnlineStatus } from '../hooks/useOnlineStatus'

/** Small non-blocking banner when the browser is offline. */
export function OfflineBanner() {
  const isOnline = useOnlineStatus()
  if (isOnline) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center px-3 pt-[max(0.5rem,env(safe-area-inset-top))]"
      role="status"
      aria-live="polite"
    >
      <p className="rounded-full bg-amber-600/95 px-3 py-1 text-center text-[11px] font-semibold tracking-wide text-white shadow-md ring-1 ring-black/10">
        No Internet Available
      </p>
    </div>
  )
}
