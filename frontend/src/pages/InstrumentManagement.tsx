import {
  Activity,
  AlertCircle,
  Briefcase,
  Building2,
  CheckCircle2,
  CircleUserRound,
  ClipboardList,
  Compass,
  Edit2,
  LayoutGrid,
  LogOut,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UsersRound,
  Wrench,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { AccountManagerSidebarBlock } from '../AccountManagerSidebarBlock'
import { CollaborationBrandMark } from '../CollaborationBrandMark'
import { LayoutFooter } from '../LayoutFooter'
import { BackgroundRefreshIndicator } from '../components/BackgroundRefreshIndicator'
import { HeaderAdminBadge } from '../components/HeaderAdminBadge'
import { HeaderYearSelect } from '../components/HeaderYearSelect'
import { PageRefreshButton } from '../components/PageRefreshButton'
import { SuperAdminNav } from '../components/SuperAdminNav'
import { SuperAdminSidebar } from '../components/SuperAdminSidebar'
import { CardPanel, CardShell, StatCard, toolbarSearchInputClass, toolbarSecondaryButtonClass } from '../dashboardCards'
import http from '../services/http'
import { getApiErrorMessage } from '../services/request'
import { signOut } from '../signOut'
import { notify } from '../utils/notify'

type InstrumentManagementProps = {
  onNavigate: (path: string) => void
}

type InstrumentItem = {
  id: string
  name: string
  category?: string
  serialNumber?: string
  status?: 'operational' | 'maintenance' | 'retired' | string
  notes?: string
}

export default function InstrumentManagement({ onNavigate }: InstrumentManagementProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [instruments, setInstruments] = useState<InstrumentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingInstrument, setEditingInstrument] = useState<InstrumentItem | null>(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Total Station')
  const [serialNumber, setSerialNumber] = useState('')
  const [status, setStatus] = useState<'operational' | 'maintenance' | 'retired'>('operational')
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const fetchInstruments = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await http.get<{ ok: boolean; instruments: InstrumentItem[] }>('/api/instruments')
      if (res.data?.instruments) setInstruments(res.data.instruments)
    } catch (err) {
      notify(getApiErrorMessage(err, 'Failed to fetch instruments'), 'error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInstruments()
  }, [fetchInstruments])

  const openCreateModal = () => {
    setEditingInstrument(null)
    setName('')
    setCategory('Total Station')
    setSerialNumber('')
    setStatus('operational')
    setNotes('')
    setShowModal(true)
  }

  const openEditModal = (inst: InstrumentItem) => {
    setEditingInstrument(inst)
    setName(inst.name)
    setCategory(inst.category || 'Total Station')
    setSerialNumber(inst.serialNumber || '')
    setStatus((inst.status as any) || 'operational')
    setNotes(inst.notes || '')
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      notify('Instrument name is required', 'error')
      return
    }
    setIsSaving(true)
    try {
      const payload = {
        name: name.trim(),
        category: category.trim(),
        serialNumber: serialNumber.trim(),
        status,
        notes: notes.trim(),
      }
      if (editingInstrument) {
        await http.put(`/api/instruments/${editingInstrument.id}`, payload)
        notify('Instrument asset updated successfully.', 'success')
      } else {
        await http.post('/api/instruments', payload)
        notify('New hardware asset registered successfully.', 'success')
      }
      setShowModal(false)
      fetchInstruments()
    } catch (err) {
      notify(getApiErrorMessage(err, 'Failed to save instrument'), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string, instName: string) => {
    if (!window.confirm(`Are you sure you want to decommission/remove "${instName}"?`)) return
    try {
      await http.delete(`/api/instruments/${id}`)
      notify('Instrument removed successfully.', 'success')
      fetchInstruments()
    } catch (err) {
      notify(getApiErrorMessage(err, 'Failed to delete instrument'), 'error')
    }
  }

  const filteredInstruments = instruments.filter((inst) => {
    const q = searchQuery.toLowerCase()
    return (
      inst.name.toLowerCase().includes(q) ||
      inst.category?.toLowerCase().includes(q) ||
      inst.serialNumber?.toLowerCase().includes(q)
    )
  })

  const operationalCount = instruments.filter((i) => i.status === 'operational' || !i.status).length
  const maintenanceCount = instruments.filter((i) => i.status === 'maintenance').length
  const retiredCount = instruments.filter((i) => i.status === 'retired').length

  return (
    <div className="app-layout-root flex min-h-dvh flex-col bg-neutral-100 text-neutral-900 font-sans antialiased">
      <SuperAdminSidebar
        currentPath="/super-admin/instruments"
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
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">Instrument Management</h1>
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
              title="Operational Field Assets"
              value={String(operationalCount)}
              icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
              toneClass="bg-emerald-100"
              mobileCardTint="bg-emerald-50/90"
            />
            <StatCard
              title="Under Maintenance"
              value={String(maintenanceCount)}
              icon={<Wrench className="h-5 w-5 text-amber-600" />}
              toneClass="bg-amber-100"
              mobileCardTint="bg-amber-50/90"
            />
            <StatCard
              title="Decommissioned / Retired"
              value={String(retiredCount)}
              icon={<AlertCircle className="h-5 w-5 text-neutral-600" />}
              toneClass="bg-neutral-200"
              mobileCardTint="bg-neutral-100"
            />
          </div>

          <CardShell>
            <CardPanel>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search instruments by name, serial no, category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={toolbarSearchInputClass}
                  />
                </div>
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-neutral-800"
                >
                  <Plus className="h-4 w-4" />
                  Register Hardware Asset
                </button>
              </div>

              {isLoading ? (
                <div className="py-12 text-center text-sm font-medium text-neutral-500">
                  Loading physical instruments...
                </div>
              ) : filteredInstruments.length === 0 ? (
                <div className="py-12 text-center text-sm text-neutral-500">
                  No hardware assets match your query.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-neutral-700">
                    <thead className="border-b border-neutral-200 bg-neutral-50/50 text-xs font-bold uppercase tracking-wider text-neutral-500">
                      <tr>
                        <th className="px-4 py-3">Instrument Details</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Serial Number</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {filteredInstruments.map((inst) => (
                        <tr key={inst.id} className="hover:bg-neutral-50/80">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-neutral-900">{inst.name}</div>
                            {inst.notes && <div className="text-xs text-neutral-500">{inst.notes}</div>}
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700 border border-neutral-200">
                              {inst.category || 'Total Station'}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-neutral-600">
                            {inst.serialNumber || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                inst.status === 'operational' || !inst.status
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : inst.status === 'maintenance'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-neutral-200 text-neutral-800'
                              }`}
                            >
                              {inst.status === 'maintenance'
                                ? 'Maintenance'
                                : inst.status === 'retired'
                                ? 'Retired'
                                : 'Operational'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openEditModal(inst)}
                                className={toolbarSecondaryButtonClass}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(inst.id, inst.name)}
                                className="rounded-lg p-1.5 text-neutral-400 hover:bg-rose-50 hover:text-rose-600"
                                title="Decommission Instrument"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardPanel>
          </CardShell>
        </main>

        <LayoutFooter />
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-neutral-900">
                {editingInstrument ? 'Edit Instrument Asset' : 'Register Hardware Asset'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Instrument Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Leica TS07 Total Station"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                >
                  <option value="Total Station">Total Station</option>
                  <option value="DGPS">DGPS (GNSS Receiver)</option>
                  <option value="Auto Level">Auto Level</option>
                  <option value="Drone / UAV">Drone / UAV</option>
                  <option value="Laser Scanner">Laser Scanner</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Serial Number</label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="SN-98765432"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-mono focus:border-neutral-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Lifecycle Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                >
                  <option value="operational">Operational — Active in field</option>
                  <option value="maintenance">Maintenance — Under repair / calibration</option>
                  <option value="retired">Retired — Decommissioned</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Calibration dates, storage location, etc."
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingInstrument ? 'Update Asset' : 'Register Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
