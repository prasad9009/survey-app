import {
  Activity,
  Briefcase,
  Building2,
  CheckCircle2,
  CircleUserRound,
  ClipboardList,
  Compass,
  Key,
  LayoutGrid,
  LogOut,
  Mail,
  Menu,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  UserPlus,
  UsersRound,
  UserX,
  Wrench,
  X,
} from 'lucide-react'
import { Fragment, useCallback, useEffect, useState } from 'react'
import { AccountManagerSidebarBlock } from '../AccountManagerSidebarBlock'
import { CollaborationBrandMark } from '../CollaborationBrandMark'
import { LayoutFooter } from '../LayoutFooter'
import { BackgroundRefreshIndicator } from '../components/BackgroundRefreshIndicator'
import { HeaderAdminBadge } from '../components/HeaderAdminBadge'
import { HeaderYearSelect } from '../components/HeaderYearSelect'
import { PageRefreshButton } from '../components/PageRefreshButton'
import { SuperAdminNav } from '../components/SuperAdminNav'
import { SuperAdminSidebar } from '../components/SuperAdminSidebar'
import { useAuth } from '../context/AuthContext'
import { CardPanel, CardShell, StatCard, toolbarSearchInputClass, toolbarSecondaryButtonClass } from '../dashboardCards'
import http from '../services/http'
import { getApiErrorMessage } from '../services/request'
import { signOut } from '../signOut'
import { notify } from '../utils/notify'

type AdminManagementProps = {
  onNavigate: (path: string) => void
}

type AdminUser = {
  id: string
  email: string
  fullName: string
  phone: string
  role: 'super_admin' | 'admin'
  isActive: boolean
  instrumentIds: string[]
  createdAt?: string
}

type InstrumentItem = {
  id: string
  name: string
  category?: string
  serialNumber?: string
  status?: string
}

export default function AdminManagement({ onNavigate }: AdminManagementProps) {
  const { user } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [instruments, setInstruments] = useState<InstrumentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newFullName, setNewFullName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // Scope Binding Modal State
  const [selectedAdminForScope, setSelectedAdminForScope] = useState<AdminUser | null>(null)
  const [selectedInstrumentIds, setSelectedInstrumentIds] = useState<string[]>([])
  const [isSavingScope, setIsSavingScope] = useState(false)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [adminsRes, instRes] = await Promise.all([
        http.get<{ ok: boolean; admins: AdminUser[] }>('/api/admins'),
        http.get<{ ok: boolean; instruments: InstrumentItem[] }>('/api/instruments'),
      ])
      if (adminsRes.data?.admins) setAdmins(adminsRes.data.admins)
      if (instRes.data?.instruments) setInstruments(instRes.data.instruments)
    } catch (err) {
      notify(getApiErrorMessage(err, 'Failed to fetch team admins'), 'error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFullName.trim() || !newEmail.trim() || !newPassword.trim()) {
      notify('Please complete all required fields.', 'error')
      return
    }
    setIsCreating(true)
    try {
      await http.post('/api/admins', {
        fullName: newFullName.trim(),
        email: newEmail.trim(),
        phone: newPhone.trim(),
        password: newPassword,
      })
      notify('Admin account provisioned successfully.', 'success')
      setShowCreateModal(false)
      setNewFullName('')
      setNewEmail('')
      setNewPhone('')
      setNewPassword('')
      fetchData()
    } catch (err) {
      notify(getApiErrorMessage(err, 'Failed to create admin account'), 'error')
    } finally {
      setIsCreating(false)
    }
  }

  const handleToggleActive = async (admin: AdminUser) => {
    const nextState = !admin.isActive
    try {
      await http.patch(`/api/admins/${admin.id}/active`, { isActive: nextState })
      notify(`Admin account ${nextState ? 'activated' : 'deactivated'} successfully.`, 'success')
      setAdmins((prev) =>
        prev.map((a) => (a.id === admin.id ? { ...a, isActive: nextState } : a)),
      )
    } catch (err) {
      notify(getApiErrorMessage(err, 'Failed to update account status'), 'error')
    }
  }

  const openScopeModal = (admin: AdminUser) => {
    setSelectedAdminForScope(admin)
    setSelectedInstrumentIds(admin.instrumentIds || [])
  }

  const handleSaveScope = async () => {
    if (!selectedAdminForScope) return
    setIsSavingScope(true)
    try {
      await http.post(`/api/admins/${selectedAdminForScope.id}/instruments`, {
        instrumentIds: selectedInstrumentIds,
      })
      notify('Instrument scope updated successfully.', 'success')
      setSelectedAdminForScope(null)
      fetchData()
    } catch (err) {
      notify(getApiErrorMessage(err, 'Failed to update instrument scope'), 'error')
    } finally {
      setIsSavingScope(false)
    }
  }

  const filteredAdmins = admins.filter((a) => {
    const q = searchQuery.toLowerCase()
    return (
      a.fullName?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q) ||
      a.phone?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="app-layout-root flex min-h-dvh flex-col bg-neutral-100 text-neutral-900 font-sans antialiased">
      <SuperAdminSidebar
        currentPath="/super-admin/admins"
        onNavigate={onNavigate}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* Main Wrapper */}
      <div className="flex flex-1 flex-col lg:ml-[280px]">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-neutral-200 bg-white/80 px-4 backdrop-blur-md md:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 md:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">Team Management</h1>
          </div>
          <div className="flex items-center gap-3">
            <HeaderAdminBadge onNavigate={onNavigate} />
            <HeaderYearSelect />
            <BackgroundRefreshIndicator />
            <PageRefreshButton />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatCard
              title="Total Team Admins"
              value={String(admins.length)}
              icon={<UsersRound className="h-5 w-5 text-purple-600" />}
              toneClass="bg-purple-100"
              mobileCardTint="bg-purple-50/90"
            />
            <StatCard
              title="Active Accounts"
              value={String(admins.filter((a) => a.isActive).length)}
              icon={<UserCheck className="h-5 w-5 text-emerald-600" />}
              toneClass="bg-emerald-100"
              mobileCardTint="bg-emerald-50/90"
            />
            <StatCard
              title="Hardware Inventory"
              value={String(instruments.length)}
              icon={<Wrench className="h-5 w-5 text-amber-600" />}
              toneClass="bg-amber-100"
              mobileCardTint="bg-amber-50/90"
            />
          </div>

          <CardShell>
            <CardPanel>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search admins by name, email, phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={toolbarSearchInputClass}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-neutral-800"
                >
                  <UserPlus className="h-4 w-4" />
                  Provision New Admin
                </button>
              </div>

              {isLoading ? (
                <div className="py-12 text-center text-sm font-medium text-neutral-500">
                  Loading team accounts...
                </div>
              ) : filteredAdmins.length === 0 ? (
                <div className="py-12 text-center text-sm text-neutral-500">
                  No admin accounts found matching your query.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-neutral-700">
                    <thead className="border-b border-neutral-200 bg-neutral-50/50 text-xs font-bold uppercase tracking-wider text-neutral-500">
                      <tr>
                        <th className="px-4 py-3">User Profile</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Assigned Instruments</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {filteredAdmins.map((admin) => {
                        const boundInstruments = instruments.filter((inst) =>
                          admin.instrumentIds?.includes(inst.id),
                        )
                        return (
                          <tr key={admin.id} className="hover:bg-neutral-50/80">
                            <td className="px-4 py-3">
                              <div className="font-semibold text-neutral-900">
                                {admin.fullName || '—'}
                              </div>
                              <div className="text-xs text-neutral-500">{admin.email}</div>
                              {admin.phone && (
                                <div className="text-xs text-neutral-400">{admin.phone}</div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                  admin.role === 'super_admin'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-neutral-100 text-neutral-800'
                                }`}
                              >
                                {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {boundInstruments.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {boundInstruments.map((inst) => (
                                    <span
                                      key={inst.id}
                                      className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700 border border-neutral-200"
                                    >
                                      {inst.name}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-neutral-400 italic">No scope bound</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                  admin.isActive
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {admin.isActive ? (
                                  <>
                                    <CheckCircle2 className="h-3 w-3" /> Active
                                  </>
                                ) : (
                                  <>
                                    <UserX className="h-3 w-3" /> Deactivated
                                  </>
                                )}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => openScopeModal(admin)}
                                  className={toolbarSecondaryButtonClass}
                                  title="Assign Hardware Instruments Scope"
                                >
                                  <Compass className="h-3.5 w-3.5" />
                                  Scope
                                </button>
                                {admin.role !== 'super_admin' && (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleActive(admin)}
                                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold shadow-xs transition-colors ${
                                      admin.isActive
                                        ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                    }`}
                                  >
                                    {admin.isActive ? 'Deactivate' : 'Activate'}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardPanel>
          </CardShell>
        </main>

        <LayoutFooter />
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-neutral-900">Provision New Admin Account</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="rahul@samarthsurvey.com"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Mobile Phone Number</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Initial Password *</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                  {isCreating ? 'Provisioning...' : 'Provision Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scope Binding Modal */}
      {selectedAdminForScope && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">Instrument Scope Assignment</h3>
                <p className="text-xs text-neutral-500">
                  Select physical hardware bound to {selectedAdminForScope.fullName || selectedAdminForScope.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAdminForScope(null)}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="my-4 max-h-60 overflow-y-auto space-y-2">
              {instruments.length === 0 ? (
                <p className="text-sm text-neutral-500">No instruments registered in company inventory.</p>
              ) : (
                instruments.map((inst) => {
                  const isChecked = selectedInstrumentIds.includes(inst.id)
                  return (
                    <label
                      key={inst.id}
                      className="flex items-center justify-between rounded-lg border border-neutral-200 p-3 hover:bg-neutral-50 cursor-pointer"
                    >
                      <div>
                        <div className="text-sm font-semibold text-neutral-900">{inst.name}</div>
                        <div className="text-xs text-neutral-500">
                          {inst.category || 'General'} {inst.serialNumber ? `• S/N: ${inst.serialNumber}` : ''}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedInstrumentIds((prev) => [...prev, inst.id])
                          } else {
                            setSelectedInstrumentIds((prev) => prev.filter((x) => x !== inst.id))
                          }
                        }}
                        className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                      />
                    </label>
                  )
                })
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedAdminForScope(null)}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveScope}
                disabled={isSavingScope}
                className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
              >
                {isSavingScope ? 'Saving...' : 'Save Scope Binding'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
