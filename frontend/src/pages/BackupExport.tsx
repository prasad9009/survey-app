import {
  Activity,
  Briefcase,
  Building2,
  CheckCircle2,
  CircleUserRound,
  ClipboardList,
  Clock,
  Database,
  Download,
  FileJson,
  HardDrive,
  LayoutGrid,
  LogOut,
  Menu,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  UsersRound,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { AccountManagerSidebarBlock } from '../AccountManagerSidebarBlock'
import { CollaborationBrandMark } from '../CollaborationBrandMark'
import { LayoutFooter } from '../LayoutFooter'
import { BackgroundRefreshIndicator } from '../components/BackgroundRefreshIndicator'
import { HeaderAdminBadge } from '../components/HeaderAdminBadge'
import { HeaderYearSelect } from '../components/HeaderYearSelect'
import { PageRefreshButton } from '../components/PageRefreshButton'
import { SuperAdminNav } from '../components/SuperAdminNav'
import { SuperAdminSidebar } from '../components/SuperAdminSidebar'
import { CardPanel, CardShell, StatCard } from '../dashboardCards'
import http from '../services/http'
import { getApiErrorMessage } from '../services/request'
import { signOut } from '../signOut'
import { notify } from '../utils/notify'

type BackupExportProps = {
  onNavigate: (path: string) => void
}

export default function BackupExport({ onNavigate }: BackupExportProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isTriggeringBackup, setIsTriggeringBackup] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null)

  const handleTriggerBackup = async () => {
    setIsTriggeringBackup(true)
    try {
      await http.post('/api/settings/company/backup')
      const now = new Date().toLocaleString()
      setLastBackupTime(now)
      notify('Immediate database snapshot triggered successfully.', 'success')
    } catch (err) {
      notify(getApiErrorMessage(err, 'Failed to trigger database snapshot'), 'error')
    } finally {
      setIsTriggeringBackup(false)
    }
  }

  const handleExportJSON = async () => {
    setIsDownloading(true)
    try {
      const response = await http.get('/api/settings/company/backup-export', {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const dateStr = new Date().toISOString().split('T')[0]
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `backup_export_${dateStr}.json`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      notify('Structured JSON backup downloaded successfully.', 'success')
    } catch (err) {
      notify(getApiErrorMessage(err, 'Failed to export backup data'), 'error')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="app-layout-root flex min-h-dvh flex-col bg-neutral-100 text-neutral-900 font-sans antialiased">
      <SuperAdminSidebar
        currentPath="/super-admin/backup"
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
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">Database Backup & Export</h1>
          </div>
          <div className="flex items-center gap-3">
            <HeaderAdminBadge onNavigate={onNavigate} />
            <HeaderYearSelect />
            <BackgroundRefreshIndicator />
            <PageRefreshButton />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <StatCard
              title="Disaster Recovery Mode"
              value="Active & Ready"
              icon={<HardDrive className="h-5 w-5 text-emerald-600" />}
              toneClass="bg-emerald-100"
              mobileCardTint="bg-emerald-50/90"
            />
            <StatCard
              title="Last Snapshot Triggered"
              value={lastBackupTime || 'Ready on Demand'}
              icon={<Clock className="h-5 w-5 text-blue-600" />}
              toneClass="bg-blue-100"
              mobileCardTint="bg-blue-50/90"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Snapshot Trigger Card */}
            <CardShell>
              <CardPanel>
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-lg bg-emerald-100 p-2.5 text-emerald-800">
                    <Database className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-neutral-900">Server Snapshot Trigger</h2>
                    <p className="text-xs text-neutral-500">
                      Record an immediate point-in-time database snapshot on the server.
                    </p>
                  </div>
                </div>
                <p className="text-sm text-neutral-600 mb-6">
                  Executing a snapshot ensures all client records, site locations, site visit logs, and ledger transactions are captured in the system audit log.
                </p>
                <button
                  type="button"
                  onClick={handleTriggerBackup}
                  disabled={isTriggeringBackup}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${isTriggeringBackup ? 'animate-spin' : ''}`} />
                  {isTriggeringBackup ? 'Creating Snapshot...' : 'Trigger Server Snapshot Now'}
                </button>
              </CardPanel>
            </CardShell>

            {/* Data Export JSON Card */}
            <CardShell>
              <CardPanel>
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-lg bg-neutral-900 p-2.5 text-white">
                    <FileJson className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-neutral-900">Structured Data Export</h2>
                    <p className="text-xs text-neutral-500">
                      Download full JSON archive for offline compliance & storage.
                    </p>
                  </div>
                </div>
                <p className="text-sm text-neutral-600 mb-6">
                  Downloads <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs font-mono">backup_export_YYYY-MM-DD.json</code> containing structured clients, sites, visits, and ledger entries.
                </p>
                <button
                  type="button"
                  onClick={handleExportJSON}
                  disabled={isDownloading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800 disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  {isDownloading ? 'Exporting Archive...' : 'Download Structured JSON Backup'}
                </button>
              </CardPanel>
            </CardShell>
          </div>
        </main>

        <LayoutFooter />
      </div>
    </div>
  )
}
