import {
  Activity,
  Briefcase,
  Building2,
  CircleUserRound,
  ClipboardList,
  Landmark,
  LayoutGrid,
  LogOut,
  Mail,
  Menu,
  Phone,
  ShieldCheck,
  UsersRound,
  X,
} from 'lucide-react'
import { Fragment, useCallback, useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import http from '../services/http'
import { useAsyncLock } from '../hooks/useAsyncLock'
import { useSettings } from '../hooks/queries'
import { invalidateAfterSettingsChange } from '../lib/invalidate'
import { AccountManagerSidebarBlock } from '../AccountManagerSidebarBlock'
import { CollaborationBrandMark } from '../CollaborationBrandMark'
import { LayoutFooter } from '../LayoutFooter'
import { CardShell } from '../dashboardCards'
import { HeaderAdminBadge } from '../components/HeaderAdminBadge'
import { HeaderYearSelect } from '../components/HeaderYearSelect'
import { PageRefreshButton } from '../components/PageRefreshButton'
import { BackgroundRefreshIndicator } from '../components/BackgroundRefreshIndicator'
import { useAuth } from '../context/AuthContext'
import { getApiErrorMessage } from '../services/request'
import { signOut } from '../signOut'
import { notify } from '../utils/notify'

type NavItem = {
  label: string
  icon: ReactNode
}

type SettingsProps = {
  onNavigate: (path: string) => void
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-bold text-neutral-700">{label}</span>
      {children}
    </label>
  )
}

export default function Settings({ onNavigate }: SettingsProps) {
  const queryClient = useQueryClient()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { pathname } = useLocation()
  const { user } = useAuth()
  const { meQuery, isLoading: settingsQueryLoading, isFetching: settingsFetching, hasData: settingsHasData } =
    useSettings()
  const { refreshSession } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'
  const displayName = user?.fullName?.trim() || user?.email || 'User'

  const [pageLoading, setPageLoading] = useState(true)
  const saveLock = useAsyncLock()

  // Admin profile
  const [adminFullName, setAdminFullName] = useState('')
  const [adminPhone, setAdminPhone] = useState('')
  const [adminEmail, setAdminEmail] = useState('')

  // Security
  const [currentPassword, setCurrentPassword] = useState('')
  const [changePassword, setChangePassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const passwordLock = useAsyncLock()

  const [bdAccountName, setBdAccountName] = useState('')
  const [bdAccountNumber, setBdAccountNumber] = useState('')
  const [bdIfsc, setBdIfsc] = useState('')
  const [bdBankName, setBdBankName] = useState('')
  const [bdBranch, setBdBranch] = useState('')
  const [bdUpiPhone, setBdUpiPhone] = useState('')

  const applySettingsFromCache = useCallback(() => {
    try {
      const me = meQuery.data
      setAdminEmail(me?.email ?? user?.email ?? '')
      setAdminFullName(me?.profile?.fullName?.trim() ?? user?.fullName?.trim() ?? '')
      setAdminPhone(me?.profile?.phone?.trim() ?? user?.phone?.trim() ?? '')
      const bd = me?.bankDetails
      if (bd) {
        setBdAccountName(String(bd.accountName ?? ''))
        setBdAccountNumber(String(bd.accountNumber ?? ''))
        setBdIfsc(String(bd.ifscCode ?? ''))
        setBdBankName(String(bd.bankName ?? ''))
        setBdBranch(String(bd.branch ?? ''))
        setBdUpiPhone(String(bd.upiPhone ?? ''))
      } else {
        setBdAccountName('')
        setBdAccountNumber('')
        setBdIfsc('')
        setBdBankName('')
        setBdBranch('')
        setBdUpiPhone('')
      }
    } catch (err) {
      notify.apiError(err, 'Could not load settings.')
    }
  }, [meQuery.data, user?.email, user?.fullName, user?.phone])

  useEffect(() => {
    if (settingsQueryLoading && !settingsHasData) {
      setPageLoading(true)
      return
    }
    if (meQuery.data) {
      applySettingsFromCache()
    }
    setPageLoading(false)
  }, [applySettingsFromCache, settingsQueryLoading, settingsHasData, meQuery.data])

  const reloadSettings = useCallback(() => {
    invalidateAfterSettingsChange(queryClient)
  }, [queryClient])

  const navItems: NavItem[] = [
    { label: 'Dashboard', icon: <LayoutGrid size={16} /> },
    { label: 'Account Manager', icon: <Briefcase size={16} /> },
    { label: 'Clients & Sites', icon: <UsersRound size={16} /> },
    { label: 'Site Visits', icon: <ClipboardList size={16} /> },
    { label: 'History', icon: <Activity size={16} /> },
    // { label: 'Reports', icon: <FileBarChart size={16} /> },
    { label: 'Settings', icon: <Building2 size={16} /> },
    { label: 'Log Out', icon: <LogOut size={16} /> },
  ]

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
    { label: 'Sites', path: '/site-visits', icon: ClipboardList },
    { label: 'History', path: '/activity-logs', icon: Activity },
    { label: 'Settings', path: '/settings', icon: Building2 },
  ] as const

  const handleUpdatePassword = async () => {
    if (!currentPassword.trim()) {
      notify.error('Please enter your current password.')
      return
    }
    if (!changePassword || !confirmPassword) {
      notify.error('Please fill in both new password fields.')
      return
    }
    if (changePassword !== confirmPassword) {
      notify.error('New passwords do not match.')
      return
    }
    if (changePassword.length < 8) {
      notify.error('New password must be at least 8 characters.')
      return
    }
    void passwordLock.run(async () => {
      const toastId = notify.loading('Updating password…')
      try {
        await http.post('/api/auth/change-password', {
          currentPassword,
          newPassword: changePassword,
        })
        notify.dismiss(toastId)
        notify.success('Password updated successfully.')
        setCurrentPassword('')
        setChangePassword('')
        setConfirmPassword('')
      } catch (err) {
        notify.dismiss(toastId)
        const msg = getApiErrorMessage(err, 'Could not update password.')
        notify.error(/current password is incorrect/i.test(msg) ? 'Current password is incorrect' : msg)
      }
    })
  }

  const handleCancel = () => {
    applySettingsFromCache()
  }

  const handleSaveSettings = () => {
    void saveLock.run(async () => {
      const toastId = notify.loading('Saving settings…')
      try {
        await http.patch('/api/settings/me', {
          profile: {
            fullName: adminFullName.trim(),
            phone: adminPhone.trim(),
          },
          bankDetails: {
            accountName: bdAccountName.trim(),
            accountNumber: bdAccountNumber.trim(),
            ifscCode: bdIfsc.trim(),
            bankName: bdBankName.trim(),
            branch: bdBranch.trim(),
            upiPhone: bdUpiPhone.trim(),
          },
        })
        notify.dismiss(toastId)
        notify.success('Settings saved successfully.')
        reloadSettings()
        await refreshSession()
      } catch (err) {
        notify.dismiss(toastId)
        notify.apiError(err, 'Could not save settings.')
      }
    })
  }

  return (
    <div className="app-layout-root flex flex-col overflow-hidden bg-black md:h-dvh md:max-h-dvh md:min-h-dvh md:bg-neutral-100">
      <div className="flex min-h-0 flex-1 w-full max-w-none">
        {/* Sidebar */}
        <aside className="fixed inset-y-0 left-0 z-20 hidden w-[280px] flex-col bg-gradient-to-b from-[#050505] via-[#0b0b0b] to-[#040404] pb-20 text-white lg:flex">
          <div className="px-6 pt-7">
            <CollaborationBrandMark variant="desktopSidebar" />
          </div>

          <nav className="mt-5 flex-1 px-3">
            <div className="space-y-1">
              {navItems.map((item) => {
                if (item.label === 'Account Manager') {
                  return (
                    <Fragment key="account-manager">
                      <AccountManagerSidebarBlock
                        pathname={pathname}
                        onNavigate={onNavigate}
                        onAfterNavigate={() => setIsSidebarOpen(false)}
                      />
                    </Fragment>
                  )
                }
                const active = item.label === 'Settings'
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
                        isLogout
                          ? 'bg-red-500/18 text-red-300'
                          : active
                            ? 'bg-[#f39b03]/14'
                            : 'bg-white/5',
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
                <div className="mt-3 text-base font-extrabold text-white">Er. {displayName}</div>
                <div className="mt-1 text-xs font-semibold text-white/65">
                  {isSuperAdmin ? 'Super admin' : 'Admin'}
                </div>
              </div>
              <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                {user?.email ? (
                  <div className="flex items-center gap-2 rounded-xl px-2 py-2 text-left text-xs font-semibold text-white/90">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10 text-[#f39b03]">
                      <Mail size={15} />
                    </span>
                    <span className="min-w-0 truncate">{user.email}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-xl px-2 py-2 text-left text-xs font-semibold text-white/50">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10 text-[#f39b03]">
                      <Mail size={15} />
                    </span>
                    <span className="min-w-0 truncate">—</span>
                  </div>
                )}
                {user?.phone ? (
                  <div className="flex items-center gap-2 rounded-xl px-2 py-2 text-left text-xs font-semibold text-white/90">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10 text-[#f39b03]">
                      <Phone size={15} />
                    </span>
                    <span>{user.phone}</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-5 px-5">
            <div className="text-[11px] font-extrabold uppercase tracking-wide text-white/45">Quick navigation</div>
            <div className="mt-2 space-y-2">
              <AccountManagerSidebarBlock
                pathname={pathname}
                onNavigate={onNavigate}
                onAfterNavigate={() => setIsSidebarOpen(false)}
              />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {[
                { label: 'Dashboard', path: '/dashboard', icon: LayoutGrid },
                { label: 'Clients', path: '/clients-sites', icon: UsersRound },
                { label: 'Visits', path: '/site-visits', icon: ClipboardList },
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
                    path === '/settings'
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

        {/* Main */}
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
                  <Building2 size={18} className="text-[#f39b03]" />
                  Settings
                </h1>
                <div className="flex shrink-0 items-center gap-2">
                  <BackgroundRefreshIndicator isFetching={settingsFetching} hasData={settingsHasData} />
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
                    <Building2 className="h-6 w-6 text-[#f39b03]" />
                    Company Settings
                  </h1>
                  <p className="text-xs font-semibold text-neutral-500">
                    Manage company profile, admins, instrument setup, and preferences
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <BackgroundRefreshIndicator isFetching={settingsFetching} hasData={settingsHasData} />
                <PageRefreshButton variant="onLight" />
                <HeaderYearSelect variant="onLight" />
                <HeaderAdminBadge
                  name={displayName}
                  roleLabel={isSuperAdmin ? 'Super admin' : 'Admin'}
                />
              </div>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-white p-3 pb-[calc(3.65rem+max(10px,env(safe-area-inset-bottom,0px)))] sm:px-5 sm:pt-5 sm:pb-[calc(3.65rem+max(10px,env(safe-area-inset-bottom,0px)))] md:p-6 md:pb-24 lg:p-8 lg:pb-28">
            <section className="mx-auto w-full max-w-[1600px]">
              {pageLoading ? (
                <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50 text-sm font-semibold text-neutral-600">
                  Loading settings…
                </div>
              ) : (
                <>
              <div className="grid grid-cols-1 gap-3 md:gap-5 xl:grid-cols-2">
                {/* Admin profile */}
                <div className="xl:col-span-2">
                  <CardShell
                    title="Admin details"
                    leadingIcon={<CircleUserRound size={18} strokeWidth={2.25} />}
                  >
                    <p className="text-xs font-semibold leading-relaxed text-neutral-600">
                      Your name and phone appear on PDF reports and invoices for instruments you work on. Email is
                      managed by your account login and cannot be changed here.
                    </p>
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Field label="Full name">
                        <input
                          value={adminFullName}
                          onChange={(e) => setAdminFullName(e.target.value)}
                          placeholder="Er. Your name"
                          className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[#f39b03]/80 focus:ring-2 focus:ring-[#f39b03]/20"
                        />
                      </Field>
                      <Field label="Phone">
                        <input
                          value={adminPhone}
                          onChange={(e) => setAdminPhone(e.target.value)}
                          placeholder="+91 …"
                          className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[#f39b03]/80 focus:ring-2 focus:ring-[#f39b03]/20"
                        />
                      </Field>
                      <Field label="Email">
                        <input
                          value={adminEmail}
                          readOnly
                          className="h-11 w-full cursor-not-allowed rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm font-semibold text-neutral-500 outline-none sm:col-span-2"
                        />
                      </Field>
                    </div>
                  </CardShell>
                </div>

                {/* Account & Security */}
                <div className="xl:col-span-2">
                  <CardShell
                    title="Security Settings"
                    leadingIcon={<ShieldCheck size={18} strokeWidth={2.25} />}
                  >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div className="grid gap-3 md:pr-4">
                        <Field label="Current password">
                          <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            autoComplete="current-password"
                            placeholder="Current password"
                            className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[#f39b03]/80 focus:ring-2 focus:ring-[#f39b03]/20"
                          />
                        </Field>
                        <Field label="New password">
                          <input
                            type="password"
                            value={changePassword}
                            onChange={(e) => setChangePassword(e.target.value)}
                            autoComplete="new-password"
                            placeholder="At least 8 characters"
                            className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[#f39b03]/80 focus:ring-2 focus:ring-[#f39b03]/20"
                          />
                        </Field>
                        <Field label="Confirm new password">
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            autoComplete="new-password"
                            placeholder="Confirm new password"
                            className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[#f39b03]/80 focus:ring-2 focus:ring-[#f39b03]/20"
                          />
                        </Field>
                      </div>

                      <div className="flex flex-col justify-between gap-3 md:items-end">
                        <div className="w-full">
                          <button
                            type="button"
                            onClick={() => void handleUpdatePassword()}
                            disabled={passwordLock.locked}
                            className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-6 text-sm font-extrabold text-neutral-900 shadow-sm ring-1 ring-black/5 transition hover:border-[#f39b03]/40 hover:text-[#f39b03] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {passwordLock.locked ? 'Updating…' : 'Update password'}
                          </button>
                        </div>

                        <div className="w-full text-left text-xs font-semibold text-neutral-500">
                          Enter your current password, then choose a new password (minimum 8 characters).
                        </div>
                      </div>
                    </div>
                  </CardShell>
                </div>

                {/* Personal bank details (invoice PDF footer) */}
                <div className="xl:col-span-2">
                  <CardShell
                    title="Your bank details (invoice PDF)"
                    leadingIcon={<Landmark size={18} strokeWidth={2.25} />}
                  >
                    <p className="text-xs font-semibold leading-relaxed text-neutral-600">
                      Add or update your bank account here if it is not already on file. On invoices, your details are
                      shown with your instrument coworker&apos;s (left column: you when you are on that instrument; right
                      column: the other admin).
                    </p>
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Field label="Account name">
                        <input
                          value={bdAccountName}
                          onChange={(e) => setBdAccountName(e.target.value)}
                          className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-900 outline-none transition focus:border-[#f39b03]/80 focus:ring-2 focus:ring-[#f39b03]/20"
                        />
                      </Field>
                      <Field label="Account number">
                        <input
                          value={bdAccountNumber}
                          onChange={(e) => setBdAccountNumber(e.target.value)}
                          className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-900 outline-none transition focus:border-[#f39b03]/80 focus:ring-2 focus:ring-[#f39b03]/20"
                        />
                      </Field>
                      <Field label="IFSC code">
                        <input
                          value={bdIfsc}
                          onChange={(e) => setBdIfsc(e.target.value)}
                          className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-900 outline-none transition focus:border-[#f39b03]/80 focus:ring-2 focus:ring-[#f39b03]/20"
                        />
                      </Field>
                      <Field label="Bank name (optional)">
                        <input
                          value={bdBankName}
                          onChange={(e) => setBdBankName(e.target.value)}
                          placeholder="Shown in parentheses after IFSC"
                          className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[#f39b03]/80 focus:ring-2 focus:ring-[#f39b03]/20"
                        />
                      </Field>
                      <Field label="Branch">
                        <input
                          value={bdBranch}
                          onChange={(e) => setBdBranch(e.target.value)}
                          className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-900 outline-none transition focus:border-[#f39b03]/80 focus:ring-2 focus:ring-[#f39b03]/20"
                        />
                      </Field>
                      <Field label="Google Pay / PhonePe number">
                        <input
                          value={bdUpiPhone}
                          onChange={(e) => setBdUpiPhone(e.target.value)}
                          className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-900 outline-none transition focus:border-[#f39b03]/80 focus:ring-2 focus:ring-[#f39b03]/20"
                        />
                      </Field>
                    </div>
                  </CardShell>
                </div>
              </div>

              <div className="mt-4 flex flex-col-reverse gap-2.5 max-md:mb-4 max-md:px-1 max-md:pb-4 sm:flex-row sm:items-center sm:justify-between md:mb-0 md:px-0 md:pb-0">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-[#f39b03]/50 bg-white px-6 text-sm font-extrabold text-[#f39b03] shadow-sm ring-1 ring-black/5 transition hover:bg-[#f39b03]/[0.04]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={saveLock.locked}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-[#f39b03] px-8 text-sm font-extrabold text-white transition hover:bg-[#e18e03] disabled:opacity-60"
                >
                  {saveLock.locked ? 'Saving…' : 'Save Settings'}
                </button>
              </div>
                </>
              )}
            </section>
          </div>
        </main>
      </div>

      {/* Fixed Bottom Footer (tablet/desktop) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 flex w-full flex-col border-t border-white/10 bg-black [transform:translate3d(0,0,0)] md:hidden"
        aria-label="Mobile primary navigation"
      >
        <div className="mx-auto flex w-full max-w-lg items-stretch justify-between gap-0 px-1 pt-1.5 pb-1">
          {mobileBottomNav.map((item) => {
            const active = item.path === '/settings'
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
    </div>
  )
}

