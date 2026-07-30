import { CircleUserRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

type HeaderAdminBadgeProps = {
  name?: string
  roleLabel?: string
  /** Prefix "Er." when the name is present (Account Manager pages). */
  withErPrefix?: boolean
  variant?: 'desktop' | 'mobile'
}

function formatDisplayName(name: string | undefined, withErPrefix: boolean) {
  const raw = typeof name === 'string' ? name : ''
  const trimmed = raw.trim().replace(/^Er\.\s*/i, '').trim()
  if (!trimmed) return '—'
  if (withErPrefix) return `Er. ${trimmed}`
  return trimmed
}

export function HeaderAdminBadge({
  name,
  roleLabel,
  withErPrefix = false,
  variant = 'desktop',
}: HeaderAdminBadgeProps) {
  const { user } = useAuth()
  const resolvedName = name ?? user?.fullName ?? user?.email ?? ''
  const resolvedRole = roleLabel ?? (user?.role === 'super_admin' ? 'Super Admin' : 'Admin')
  const displayName = formatDisplayName(resolvedName, withErPrefix)

  if (variant === 'mobile') {
    return (
      <div
        className="mt-1 flex min-w-0 max-w-full items-center gap-1.5"
        title={displayName === '—' ? undefined : displayName}
      >
        <CircleUserRound size={14} className="shrink-0 text-[#f39b03]" aria-hidden />
        <span className="min-w-0 truncate text-[11px] font-extrabold leading-tight text-white/90">
          {displayName}
        </span>
        {resolvedRole ? (
          <span className="shrink-0 text-[10px] font-semibold text-white/55">· {resolvedRole}</span>
        ) : null}
      </div>
    )
  }

  return (
    <div
      className="hidden min-w-0 max-w-[min(100%,240px)] items-center gap-3 rounded-xl bg-neutral-100 px-3 py-2 ring-1 ring-black/5 md:flex sm:px-4 sm:py-2.5"
      title={displayName === '—' ? undefined : displayName}
    >
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#f39b03]/15 text-[#f39b03]">
        <CircleUserRound size={18} aria-hidden />
      </div>
      <div className="min-w-0 text-left">
        <div className="truncate text-xs font-extrabold text-neutral-900 sm:text-sm">{displayName}</div>
        <div className="truncate text-[11px] font-semibold text-neutral-600">{resolvedRole}</div>
      </div>
    </div>
  )
}
