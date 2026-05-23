import { RefreshCw } from 'lucide-react'

type BackgroundRefreshIndicatorProps = {
  isFetching: boolean
  hasData?: boolean
  className?: string
}

/** Small non-blocking hint while stale cache is shown and a refetch runs. */
export function BackgroundRefreshIndicator({
  isFetching,
  hasData = true,
  className = '',
}: BackgroundRefreshIndicatorProps) {
  if (!isFetching || !hasData) return null
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-600 ring-1 ring-black/5',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="status"
      aria-live="polite"
    >
      <RefreshCw size={12} className="animate-spin" aria-hidden />
      Updating…
    </span>
  )
}
