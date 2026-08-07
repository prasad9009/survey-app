import {
  Activity,
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  ChevronDown,
  ChevronUp,
  CircleUserRound,
  ClipboardList,
  Clock,
  FileText,
  Filter,
  History,
  IndianRupee,
  Info,
  LayoutGrid,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  UserCheck,
  UsersRound,
  Wallet,
  X,
} from 'lucide-react'
import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { AccountManagerSidebarBlock } from '../AccountManagerSidebarBlock'
import { CollaborationBrandMark } from '../CollaborationBrandMark'
import { LayoutFooter } from '../LayoutFooter'
import { AppSelect } from '../components/AppSelect'
import { HeaderAdminBadge } from '../components/HeaderAdminBadge'
import { HeaderYearSelect } from '../components/HeaderYearSelect'
import { BackgroundRefreshIndicator } from '../components/BackgroundRefreshIndicator'
import { PageRefreshButton } from '../components/PageRefreshButton'
import { useAuth } from '../context/AuthContext'
import { useSelectedYear } from '../context/SelectedYearContext'
import { signOut } from '../signOut'
import http from '../services/http'
import { CardPanel, CardShell, StatCard, toolbarSearchInputClass, toolbarSecondaryButtonClass } from '../dashboardCards'

type ActivityLogsProps = {
  onNavigate: (path: string) => void
}

type LogItem = {
  id: string
  companyId: string
  userId: string
  userName: string
  userRole: string
  action: string
  entityType: string
  entityId: string | null
  summary: string
  details: Record<string, unknown> | null
  createdAt: string
}

type Meta = {
  total: number
  page: number
  limit: number
  pages: number
}

type NavItem = {
  label: string
  icon: ReactNode
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutGrid size={16} /> },
  { label: 'Account Manager', icon: <Briefcase size={16} /> },
  { label: 'Clients & Sites', icon: <UsersRound size={16} /> },
  { label: 'Site Visits', icon: <ClipboardList size={16} /> },
  { label: 'History', icon: <Activity size={16} /> },
  { label: 'Settings', icon: <Building2 size={16} /> },
  { label: 'Log Out', icon: <LogOut size={16} /> },
]

/** Human readable action configurations */
function getActionConfig(action: string) {
  switch (action) {
    case 'CREATE_CLIENT':
      return { label: 'Added New Client', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', category: 'Create' }
    case 'UPDATE_CLIENT':
      return { label: 'Updated Client Details', badge: 'bg-amber-50 text-amber-700 ring-amber-600/20', category: 'Update' }
    case 'DELETE_CLIENT':
      return { label: 'Deleted Client', badge: 'bg-rose-50 text-rose-700 ring-rose-600/20', category: 'Delete' }
    case 'CREATE_SITE':
      return { label: 'Added New Site', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', category: 'Create' }
    case 'UPDATE_SITE':
      return { label: 'Updated Site Details', badge: 'bg-amber-50 text-amber-700 ring-amber-600/20', category: 'Update' }
    case 'DELETE_SITE':
      return { label: 'Deleted Site', badge: 'bg-rose-50 text-rose-700 ring-rose-600/20', category: 'Delete' }
    case 'CREATE_VISIT':
      return { label: 'Logged Site Visit', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', category: 'Create' }
    case 'UPDATE_VISIT':
      return { label: 'Updated Site Visit', badge: 'bg-amber-50 text-amber-700 ring-amber-600/20', category: 'Update' }
    case 'DELETE_VISIT':
      return { label: 'Deleted Site Visit', badge: 'bg-rose-50 text-rose-700 ring-rose-600/20', category: 'Delete' }
    case 'CREATE_TRANSACTION':
      return { label: 'Recorded Payment / Entry', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', category: 'Create' }
    case 'DELETE_TRANSACTION':
      return { label: 'Removed Payment Entry', badge: 'bg-rose-50 text-rose-700 ring-rose-600/20', category: 'Delete' }
    default:
      if (action.startsWith('CREATE')) {
        return { label: action.replace(/^CREATE_/, 'Created '), badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', category: 'Create' }
      }
      if (action.startsWith('UPDATE')) {
        return { label: action.replace(/^UPDATE_/, 'Updated '), badge: 'bg-amber-50 text-amber-700 ring-amber-600/20', category: 'Update' }
      }
      if (action.startsWith('DELETE')) {
        return { label: action.replace(/^DELETE_/, 'Deleted '), badge: 'bg-rose-50 text-rose-700 ring-rose-600/20', category: 'Delete' }
      }
      return { label: action.replace(/_/g, ' '), badge: 'bg-neutral-100 text-neutral-700 ring-neutral-200', category: 'Other' }
  }
}

/** Icon for entity type */
function EntityIcon({ type }: { type: string }) {
  switch (type) {
    case 'client':
      return <UsersRound size={16} className="text-blue-600" />
    case 'site':
      return <MapPin size={16} className="text-emerald-600" />
    case 'site_visit':
      return <ClipboardList size={16} className="text-amber-600" />
    case 'transaction':
      return <IndianRupee size={16} className="text-purple-600" />
    default:
      return <FileText size={16} className="text-neutral-600" />
  }
}

/** Human entity name */
function getEntityName(type: string): string {
  const map: Record<string, string> = {
    client: 'Client',
    site: 'Site',
    site_visit: 'Site Visit',
    transaction: 'Payment Ledger',
    instrument: 'Instrument',
    settings: 'Settings',
  }
  return map[type] || type
}

/** Format initials avatar */
function getAdminInitials(name: string) {
  const clean = (name || '').replace(/^Er\.\s*/i, '').trim()
  const parts = clean.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'A'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

/** Strip 'Er.' prefix and 'and related sites' from summary strings */
function cleanSummary(summary: string): string {
  if (!summary) return ''
  return summary
    .replace(/^Er\.\s*/i, '')
    .replace(/\bEr\.\s*/gi, '')
    .replace(/\s+and related sites\b/gi, '')
    .trim()
}

/** Strip 'Er.' prefix from user names */
function cleanUserName(name: string): string {
  if (!name) return ''
  return name.replace(/^Er\.\s*/i, '').trim()
}

/** Format friendly timestamp */
function formatFriendlyDate(isoString: string) {
  const dateObj = new Date(isoString)
  if (isNaN(dateObj.getTime())) return isoString

  const now = new Date()
  const isToday =
    dateObj.getDate() === now.getDate() &&
    dateObj.getMonth() === now.getMonth() &&
    dateObj.getFullYear() === now.getFullYear()

  const timeStr = dateObj.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  if (isToday) {
    return `Today at ${timeStr}`
  }

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday =
    dateObj.getDate() === yesterday.getDate() &&
    dateObj.getMonth() === yesterday.getMonth() &&
    dateObj.getFullYear() === yesterday.getFullYear()

  if (isYesterday) {
    return `Yesterday at ${timeStr}`
  }

  const dateStr = dateObj.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return `${dateStr}, ${timeStr}`
}

/** User-friendly Key-Value Field Viewer instead of raw JSON */
function FriendlyDetailsViewer({ details }: { details: Record<string, unknown> }) {
  const fieldLabelMap: Record<string, string> = {
    name: 'Name',
    clientName: 'Client Name',
    siteName: 'Site Name',
    phone: 'Phone Number',
    amount: 'Amount',
    totalAmount: 'Total Amount',
    paidAmount: 'Paid Amount',
    pendingAmount: 'Pending Amount',
    visitDate: 'Visit Date',
    date: 'Date',
    machine: 'Machine / Instrument',
    notes: 'Notes / Remarks',
    work: 'Work Description',
    paymentMode: 'Payment Mode',
    paymentStatus: 'Payment Status',
    type: 'Transaction Type',
    description: 'Description',
  }

  const entries = Object.entries(details).filter(
    ([k, v]) => v !== null && v !== undefined && v !== '' && !['id', '_id', '__v', 'companyId'].includes(k),
  )

  if (entries.length === 0) {
    return <p className="text-xs font-semibold text-neutral-500 italic">No additional details recorded.</p>
  }

  const formatValue = (key: string, val: unknown): string => {
    if (typeof val === 'number') {
      if (key.toLowerCase().includes('amount') || key.toLowerCase().includes('rate')) {
        return `₹${val.toLocaleString('en-IN')}`
      }
      return String(val)
    }
    if (typeof val === 'boolean') {
      return val ? 'Yes' : 'No'
    }
    if (typeof val === 'object' && val !== null) {
      return JSON.stringify(val)
    }
    return String(val)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2">
      {entries.map(([key, value]) => {
        const label = fieldLabelMap[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())
        const formattedVal = formatValue(key, value)

        return (
          <div
            key={key}
            className="flex flex-col gap-0.5 rounded-lg border border-neutral-200/60 bg-white p-2.5 shadow-2xs"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">{label}</span>
            <span className="text-xs font-bold text-neutral-800 break-words">{formattedVal}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function ActivityLogs({ onNavigate }: ActivityLogsProps) {
  const { user, companyAdmins } = useAuth()
  const { selectedYear } = useSelectedYear()
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [logs, setLogs] = useState<LogItem[]>([])
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: 20, pages: 1 })
  const [loading, setLoading] = useState(true)

  // Filter states
  const [selectedAdminId, setSelectedAdminId] = useState<string>('all')
  const [selectedActionCategory, setSelectedActionCategory] = useState<string>('all')
  const [selectedEntityType, setSelectedEntityType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [page, setPage] = useState<number>(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedYear) params.set('year', selectedYear)
      if (selectedAdminId !== 'all') params.set('userId', selectedAdminId)
      if (selectedEntityType !== 'all') params.set('entityType', selectedEntityType)
      if (searchQuery.trim()) params.set('search', searchQuery.trim())
      params.set('page', String(page))
      params.set('limit', '20')

      const res = await http.get<{ ok: boolean; logs: LogItem[]; meta: Meta }>(
        `/api/activity-logs?${params.toString()}`,
      )
      if (res.status === 200 && res.data?.ok) {
        let fetchedLogs = res.data.logs ?? []

        // Client-side action category filtering if selected
        if (selectedActionCategory !== 'all') {
          fetchedLogs = fetchedLogs.filter((log) => {
            const config = getActionConfig(log.action)
            return config.category === selectedActionCategory
          })
        }

        setLogs(fetchedLogs)
        setMeta(res.data.meta ?? { total: 0, page: 1, limit: 20, pages: 1 })
      }
    } catch (err) {
      console.error('Failed to fetch activity logs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [selectedYear, selectedAdminId, selectedActionCategory, selectedEntityType, page])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchLogs()
  }

  const handleNavClick = async (label: string) => {
    if (label === 'Log Out') {
      await signOut()
      setIsSidebarOpen(false)
      onNavigate('/login')
      return
    }
    const routeMap: Record<string, string> = {
      Dashboard: '/dashboard',
      'Account Manager': '/account-manager',
      'Clients & Sites': '/clients-sites',
      'Site Visits': '/site-visits',
      History: '/activity-logs',
      Reports: '/reports',
      Settings: '/settings',
    }
    const nextPath = routeMap[label]
    if (nextPath) onNavigate(nextPath)
    setIsSidebarOpen(false)
  }

  const mobileBottomNav = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutGrid },
    { label: 'Accounts', path: '/account-manager', icon: Briefcase },
    { label: 'Clients', path: '/clients-sites', icon: UsersRound },
    { label: 'Visits', path: '/site-visits', icon: MapPin },
    { label: 'History', path: '/activity-logs', icon: Activity },
    { label: 'Settings', path: '/settings', icon: Building2 },
  ] as const

  // Calculate summary counts for top cards
  const statsSummary = useMemo(() => {
    let creates = 0
    let updates = 0
    let deletes = 0

    logs.forEach((l) => {
      if (l.action.startsWith('CREATE')) creates++
      else if (l.action.startsWith('UPDATE')) updates++
      else if (l.action.startsWith('DELETE')) deletes++
    })

    return {
      total: meta.total,
      creates,
      updates,
      deletes,
    }
  }, [logs, meta.total])

  return (
    <div className="app-layout-root flex flex-col overflow-hidden bg-black md:h-dvh md:max-h-dvh md:min-h-dvh md:bg-neutral-100">
      <div className="flex min-h-0 flex-1 w-full max-w-none">
        {/* Desktop Sidebar */}
        <aside className="fixed inset-y-0 left-0 z-20 hidden w-[280px] flex-col bg-gradient-to-b from-[#050505] via-[#0b0b0b] to-[#040404] pb-20 text-white lg:flex">
          <div className="px-6 pt-7">
            <CollaborationBrandMark variant="desktopSidebar" />
          </div>

          <nav className="mt-5 flex-1 px-3">
            <div className="space-y-1">
              {navItems.map((item) => {
                if (item.label === 'Account Manager') {
                  return (
                    <AccountManagerSidebarBlock
                      key="account-manager"
                      pathname={location.pathname}
                      onNavigate={onNavigate}
                      onAfterNavigate={() => setIsSidebarOpen(false)}
                    />
                  )
                }
                const active = item.label === 'History'
                const isLogout = item.label === 'Log Out'
                return (
                  <button
                    type="button"
                    key={item.label}
                    onClick={() => handleNavClick(item.label)}
                    className={[
                      'group flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13px] font-semibold transition',
                      isLogout
                        ? 'bg-red-500/15 text-red-300 ring-1 ring-red-400/35 hover:bg-red-500/20 hover:text-red-200'
                        : active
                          ? 'bg-[#f39b03]/18 text-[#f39b03] ring-1 ring-[#f39b03]/30'
                          : 'text-white/85 hover:bg-white/5 hover:text-white',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'grid h-8 w-8 place-items-center rounded-lg',
                        isLogout ? 'bg-red-500/18 text-red-300' : active ? 'bg-[#f39b03]/14' : 'bg-white/5',
                      ].join(' ')}
                    >
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </button>
                )
              })}
            </div>
          </nav>
        </aside>

        {isSidebarOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            aria-label="Close sidebar overlay"
            onClick={() => setIsSidebarOpen(false)}
          />
        ) : null}

        <aside
          className={[
            'fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col overflow-y-auto bg-gradient-to-b from-[#050505] via-[#0b0b0b] to-[#040404] pb-20 text-white transition-transform duration-300 lg:hidden',
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
          ].join(' ')}
          aria-label="Profile"
        >
          <div className="flex items-center justify-between px-5 pt-6">
            <span className="text-sm font-extrabold tracking-tight text-white">Profile</span>
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 hover:bg-white/20"
              aria-label="Close profile"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-6 px-5">
            <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <div className="flex flex-col items-center text-center">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/10 text-white ring-1 ring-white/15">
                  <CircleUserRound size={32} strokeWidth={1.75} />
                </div>
                <div className="mt-3 text-base font-extrabold text-white">Er. {user?.fullName || 'User'}</div>
                <div className="mt-1 text-xs font-semibold text-white/65">{user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}</div>
              </div>
              <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                <a
                  href="mailto:samarthlandsurveyors@gmail.com"
                  className="flex items-center gap-2 rounded-xl px-2 py-2 text-left text-xs font-semibold text-white/90 hover:bg-white/5"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10 text-[#f39b03]">
                    <Mail size={15} />
                  </span>
                  <span className="min-w-0 truncate">samarthlandsurveyors@gmail.com</span>
                </a>
                <a
                  href="tel:+918643001010"
                  className="flex items-center gap-2 rounded-xl px-2 py-2 text-left text-xs font-semibold text-white/90 hover:bg-white/5"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10 text-[#f39b03]">
                    <Phone size={15} />
                  </span>
                  <span>+91 86430 01010</span>
                </a>
              </div>
            </div>
          </div>

          <div className="mt-5 px-5">
            <div className="text-[11px] font-extrabold uppercase tracking-wide text-white/45">Quick navigation</div>
            <div className="mt-2 space-y-2">
              <AccountManagerSidebarBlock
                pathname={location.pathname}
                onNavigate={onNavigate}
                onAfterNavigate={() => setIsSidebarOpen(false)}
              />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {[
                { label: 'Dashboard', path: '/dashboard', icon: LayoutGrid },
                { label: 'Clients', path: '/clients-sites', icon: UsersRound },
                { label: 'Visits', path: '/site-visits', icon: MapPin },
                { label: 'History', path: '/activity-logs', icon: Activity },
              ].map(({ label, path, icon: Icon }) => (
                <button
                  type="button"
                  key={path}
                  onClick={() => {
                    onNavigate(path)
                    setIsSidebarOpen(false)
                  }}
                  className={[
                    'flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-[11px] font-bold ring-1 transition',
                    path === '/activity-logs'
                      ? 'bg-white/10 text-[#f39b03] ring-[#f39b03]/35'
                      : 'bg-white/5 text-white/85 ring-white/10 hover:bg-white/10',
                  ].join(' ')}
                >
                  <Icon size={18} />
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex-1 px-5">
            <button
              type="button"
              onClick={() => handleNavClick('Log Out')}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/15 py-3 text-sm font-bold text-red-200 ring-1 ring-red-400/35 hover:bg-red-500/25"
            >
              <LogOut size={18} />
              Log Out
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col lg:ml-[280px]">
          {/* Header */}
          <header className="sticky top-0 z-10 shrink-0 bg-white backdrop-blur">
            <div className="border-b border-white/10 bg-black md:hidden">
              <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-4 py-3">
                <button
                  type="button"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-white ring-1 ring-white/15 transition hover:bg-white/15"
                  aria-label="Open menu"
                  onClick={() => setIsSidebarOpen(true)}
                >
                  <Menu size={18} strokeWidth={2.25} className="text-white" />
                </button>
                <div className="flex min-w-0 justify-center px-1">
                  <CollaborationBrandMark variant="mobileHeader" />
                </div>
                <PageRefreshButton variant="onDark" />
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3">
                <h1 className="min-w-0 truncate text-left text-base font-extrabold leading-tight tracking-tight text-white flex items-center gap-2">
                  <Activity size={18} className="text-[#f39b03]" />
                  History
                </h1>
                <div className="flex shrink-0 items-center gap-2">
                  <BackgroundRefreshIndicator isFetching={loading} />
                  <HeaderYearSelect variant="onDark" compact />
                </div>
              </div>
            </div>

            <div className="relative hidden w-full items-center justify-between gap-4 border-b border-neutral-200 bg-white px-4 py-2.5 shadow-[0_6px_20px_rgba(16,24,40,0.05)] sm:px-6 md:flex md:px-6 md:py-4 lg:px-8">
              <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white shadow-sm ring-1 ring-black/5 hover:bg-neutral-50 md:h-10 md:w-10 md:shadow-[0_10px_30px_rgba(16,24,40,0.06)] lg:hidden"
                  aria-label="Open menu"
                  onClick={() => setIsSidebarOpen(true)}
                >
                  <Menu size={18} className="text-neutral-900" />
                </button>
                <div>
                  <h1 className="text-xl font-extrabold text-neutral-900 sm:text-2xl flex items-center gap-2.5">
                    <Activity className="h-6 w-6 text-[#f39b03]" />
                    Activity & Modification History
                  </h1>
                  <p className="text-xs font-semibold text-neutral-500">
                    Real-time transparent history of modifications performed by admins
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <BackgroundRefreshIndicator isFetching={loading} />
                <PageRefreshButton variant="onLight" />
                <HeaderYearSelect variant="onLight" />
                <HeaderAdminBadge />
              </div>
            </div>
          </header>

          {/* Body Section */}
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-white p-3.5 pb-[calc(3.65rem+max(12px,env(safe-area-inset-bottom,0px)))] sm:p-6 sm:pb-[calc(3.65rem+max(12px,env(safe-area-inset-bottom,0px)))] md:p-6 md:pb-24 lg:p-8 lg:pb-28 space-y-4 sm:space-y-6">
            {/* Quick Metrics Bar */}
            <section className="grid grid-cols-2 gap-1.5 md:gap-4 xl:grid-cols-4">
              <StatCard
                title="Total History"
                value={String(meta.total)}
                subtitle="Logged admin actions"
                icon={<History size={20} className="text-neutral-700 md:text-[#f39b03]" />}
                toneClass="bg-neutral-200 md:bg-[#f39b03]/12"
                mobileCardTint="bg-neutral-900/[0.07]"
                loading={loading}
              />
              <StatCard
                title="Added"
                value={String(statsSummary.creates)}
                subtitle="New records created"
                icon={<Plus size={20} className="text-emerald-600" />}
                toneClass="bg-emerald-100"
                mobileCardTint="bg-emerald-50/90"
                loading={loading}
              />
              <StatCard
                title="Modified"
                value={String(statsSummary.updates)}
                subtitle="Records updated"
                icon={<FileText size={20} className="text-amber-600" />}
                toneClass="bg-amber-100"
                mobileCardTint="bg-amber-50/90"
                loading={loading}
              />
              <StatCard
                title="Deleted"
                value={String(statsSummary.deletes)}
                subtitle="Records removed"
                icon={<Trash2 size={20} className="text-rose-600" />}
                toneClass="bg-rose-100"
                mobileCardTint="bg-rose-50/90"
                loading={loading}
              />
            </section>

            {/* Sleek Toolbar & Filter Bar matching Clients & Sites */}
            <CardPanel className="my-3 flex flex-col gap-2.5 p-2.5 md:my-4 md:flex-row md:items-center md:justify-between md:gap-4 md:p-4">
              <div className="w-full md:max-w-[480px]">
                <input
                  type="text"
                  placeholder="Search client, site, or admin..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setPage(1)
                  }}
                  className={toolbarSearchInputClass}
                />
              </div>
              <div className="flex w-full flex-nowrap items-center gap-1.5 md:w-auto md:flex-wrap md:justify-start md:gap-2">
                <AppSelect
                  value={selectedAdminId}
                  onChange={(val) => {
                    setSelectedAdminId(val)
                    setPage(1)
                  }}
                  className={[toolbarSecondaryButtonClass, 'min-w-0 flex-1 md:min-w-[8.5rem] md:flex-none'].join(' ')}
                  aria-label="Filter by Admin"
                  options={[
                    { value: 'all', label: 'All Admins' },
                    ...companyAdmins.map((adm) => ({
                      value: adm.id,
                      label: adm.fullName ? adm.fullName.replace(/^Er\.\s*/i, '') : 'Admin',
                    })),
                  ]}
                />

                <AppSelect
                  value={selectedActionCategory}
                  onChange={(val) => {
                    setSelectedActionCategory(val)
                    setPage(1)
                  }}
                  className={[toolbarSecondaryButtonClass, 'min-w-0 flex-1 md:min-w-[8.5rem] md:flex-none'].join(' ')}
                  aria-label="Filter by Action"
                  options={[
                    { value: 'all', label: 'All Actions' },
                    { value: 'Create', label: 'Additions' },
                    { value: 'Update', label: 'Modifications' },
                    { value: 'Delete', label: 'Deletions' },
                  ]}
                />

                <AppSelect
                  value={selectedEntityType}
                  onChange={(val) => {
                    setSelectedEntityType(val)
                    setPage(1)
                  }}
                  className={[toolbarSecondaryButtonClass, 'min-w-0 flex-1 md:min-w-[8.5rem] md:flex-none'].join(' ')}
                  aria-label="Filter by Module"
                  options={[
                    { value: 'all', label: 'All Modules' },
                    { value: 'client', label: 'Clients' },
                    { value: 'site', label: 'Sites' },
                    { value: 'site_visit', label: 'Site Visits' },
                    { value: 'transaction', label: 'Payments' },
                  ]}
                />
              </div>
            </CardPanel>

            {/* Visual Activity Timeline Feed */}
            <CardShell
              title="Activity & Modification History"
              leadingIcon={<Activity size={18} />}
              headerEnd={
                <span className="text-xs font-semibold text-neutral-500">
                  {meta.total} total records
                </span>
              }
              bodyClassName="p-0 overflow-hidden"
            >
              {loading ? (
                <div className="flex h-64 flex-col items-center justify-center gap-2 text-sm font-bold text-neutral-500">
                  <RefreshCw className="h-6 w-6 animate-spin text-[#f39b03]" />
                  Loading activity timeline...
                </div>
              ) : logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-neutral-100 text-neutral-400">
                    <History size={32} />
                  </div>
                  <p className="mt-4 text-base font-extrabold text-neutral-800">No activity history found</p>
                  <p className="mt-1 text-xs font-medium text-neutral-500 max-w-sm">
                    No transition logs match your current filter criteria. Try changing filters or clearing search.
                  </p>
                </div>
              ) : (
                <>
                  {/* Mobile View: Single-line clean horizontal cards matching Clients & Sites */}
                  <div className="md:hidden">
                    <ul className="flex flex-col gap-1.5 px-3 pb-4 pt-1.5">
                      {logs.map((log) => {
                        const actionCfg = getActionConfig(log.action)
                        const isExpanded = expandedId === log.id
                        const timeAgo = formatFriendlyDate(log.createdAt)
                        const initials = getAdminInitials(log.userName)
                        const hasDetails = Boolean(log.details && Object.keys(log.details).length > 0)

                        return (
                          <li key={log.id}>
                            <div className="flex flex-col rounded-xl border border-neutral-200 bg-white p-2 shadow-sm ring-1 ring-black/5">
                              <div className="flex items-center gap-2">
                                {/* Main content block */}
                                <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-0.5 text-left">
                                  {/* Initials Avatar matching Clients & Sites */}
                                  <div
                                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f39b03]/15 text-[10px] font-extrabold text-[#c97702] ring-1 ring-[#f39b03]/25"
                                    aria-hidden
                                  >
                                    {initials}
                                  </div>

                                  {/* Info Column */}
                                  <div className="min-w-0 flex-1">
                                    {/* Action badge & timestamp */}
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span className={`inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[9px] font-extrabold ring-1 ${actionCfg.badge}`}>
                                        {actionCfg.label}
                                      </span>
                                      <span className="text-[10px] font-semibold text-neutral-400">•</span>
                                      <span className="text-[10px] font-semibold text-neutral-500">{timeAgo}</span>
                                    </div>
                                    {/* Summary text below action type */}
                                    <div className="mt-0.5 truncate text-xs font-extrabold text-neutral-900">
                                      {cleanSummary(log.summary)}
                                    </div>
                                  </div>
                                </div>

                                {/* View Details Action Button */}
                                {hasDetails ? (
                                  <button
                                    type="button"
                                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                                    className="inline-flex h-7 px-2 shrink-0 items-center justify-center gap-1 rounded-lg border border-neutral-200 bg-white text-[10px] font-bold text-neutral-700 transition hover:bg-neutral-50 self-center"
                                    aria-label={isExpanded ? 'Hide Details' : 'View Details'}
                                  >
                                    <span>{isExpanded ? 'Hide' : 'Details'}</span>
                                    <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                  </button>
                                ) : null}
                              </div>

                              {/* Expandable Details Drawer */}
                              {isExpanded && log.details ? (
                                <div className="mt-2 border-t border-neutral-100 pt-2 px-1 pb-1">
                                  <div className="text-[10px] font-extrabold uppercase tracking-wide text-neutral-500 mb-1 flex items-center gap-1">
                                    <Info size={12} className="text-[#f39b03]" />
                                    Changed Details
                                  </div>
                                  <FriendlyDetailsViewer details={log.details} />
                                </div>
                              ) : null}
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </div>

                  {/* Desktop View: Structured table matching Clients & Sites */}
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[980px] border-collapse">
                      <thead className="bg-neutral-50">
                        <tr className="text-left text-xs font-extrabold uppercase tracking-wide text-neutral-500">
                          <th className="px-6 py-4">Performed By</th>
                          <th className="px-4 py-4">Action & Entity</th>
                          <th className="px-4 py-4">Activity Summary</th>
                          <th className="px-4 py-4">Date & Time</th>
                          <th className="px-4 py-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm font-semibold text-neutral-800">
                        {logs.map((log) => {
                          const actionCfg = getActionConfig(log.action)
                          const isExpanded = expandedId === log.id
                          const timeAgo = formatFriendlyDate(log.createdAt)
                          const initials = getAdminInitials(log.userName)
                          const hasDetails = Boolean(log.details && Object.keys(log.details).length > 0)

                          return (
                            <Fragment key={log.id}>
                              <tr className="border-t border-neutral-200 hover:bg-neutral-50/60 transition-colors">
                                {/* Performed By */}
                                <td className="px-6 py-3.5">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f39b03]/15 text-xs font-extrabold text-[#c97702] ring-1 ring-[#f39b03]/25"
                                      aria-hidden
                                    >
                                      {initials}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="truncate font-extrabold text-neutral-950">{cleanUserName(log.userName)}</div>
                                      <div className="mt-0.5 text-xs font-semibold text-neutral-500">
                                        Role: <span className="uppercase">{log.userRole}</span>
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* Action & Entity */}
                                <td className="px-4 py-3.5 whitespace-nowrap">
                                  <div className="flex flex-col gap-1 items-start">
                                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-extrabold ring-1 ${actionCfg.badge}`}>
                                      {actionCfg.label}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-600">
                                      <EntityIcon type={log.entityType} />
                                      {getEntityName(log.entityType)}
                                    </span>
                                  </div>
                                </td>

                                {/* Activity Summary */}
                                <td className="px-4 py-3.5 font-extrabold text-neutral-900 max-w-xs xl:max-w-md truncate">
                                  {cleanSummary(log.summary)}
                                </td>

                                {/* Date & Time */}
                                <td className="px-4 py-3.5 text-xs font-semibold text-neutral-600 whitespace-nowrap">
                                  {timeAgo}
                                </td>

                                {/* Action */}
                                <td className="px-4 py-3.5 text-center whitespace-nowrap">
                                  {hasDetails ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setExpandedId(isExpanded ? null : log.id)
                                      }}
                                      className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold text-neutral-700 shadow-2xs transition hover:bg-neutral-50"
                                    >
                                      <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
                                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                    </button>
                                  ) : (
                                    <span className="text-xs font-medium text-neutral-400">—</span>
                                  )}
                                </td>
                              </tr>

                              {/* Expandable Details Accordion Row */}
                              {isExpanded && log.details ? (
                                <tr className="bg-neutral-50/70 border-t border-neutral-100">
                                  <td colSpan={5} className="px-6 py-4">
                                    <div className="rounded-xl border border-neutral-200/70 bg-white p-3.5">
                                      <div className="flex items-center justify-between border-b border-neutral-200/60 pb-2 mb-2">
                                        <span className="text-xs font-extrabold uppercase tracking-wide text-neutral-500 flex items-center gap-1.5">
                                          <Info size={14} className="text-[#f39b03]" />
                                          Changed Details
                                        </span>
                                      </div>
                                      <FriendlyDetailsViewer details={log.details} />
                                    </div>
                                  </td>
                                </tr>
                              ) : null}
                            </Fragment>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Pagination */}
              {meta.pages > 1 && (
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between border-t border-neutral-200/80 bg-neutral-50/60 px-4 py-3 text-center sm:text-left sm:px-6">
                  <div className="text-xs font-bold text-neutral-600">
                    Showing Page {meta.page} of {meta.pages} ({meta.total} total recorded history logs)
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={meta.page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold text-neutral-700 shadow-2xs transition hover:bg-neutral-100 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={meta.page >= meta.pages}
                      onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
                      className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold text-neutral-700 shadow-2xs transition hover:bg-neutral-100 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </CardShell>
          </div>

          <nav
            className="fixed inset-x-0 bottom-0 z-50 flex w-full flex-col border-t border-white/10 bg-black [transform:translate3d(0,0,0)] md:hidden"
            aria-label="Mobile primary navigation"
          >
            <div className="mx-auto flex w-full max-w-lg items-stretch justify-between gap-0 px-1 pt-1.5 pb-1">
              {mobileBottomNav.map((item) => {
                const active = item.path === '/activity-logs' || item.path === '/history'
                const Icon = item.icon
                return (
                  <button
                    type="button"
                    key={item.path}
                    onClick={() => onNavigate(item.path)}
                    className={[
                      'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1 text-[10px] font-bold transition',
                      active ? 'text-[#f39b03]' : 'text-white/50 hover:text-white/80',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'grid h-8 w-8 place-items-center rounded-lg transition',
                        active ? 'bg-[#f39b03]/20 text-[#f39b03]' : 'bg-white/5 text-white/55',
                      ].join(' ')}
                    >
                      <Icon size={18} strokeWidth={active ? 2.25 : 2} />
                    </span>
                    <span className="truncate">{item.label}</span>
                  </button>
                )
              })}
            </div>
            <div aria-hidden className="mobile-nav-safe-spacer" />
          </nav>

          <LayoutFooter />
        </main>
      </div>
    </div>
  )
}
