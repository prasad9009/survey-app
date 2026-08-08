import { Building2, Database, HardDrive, ShieldCheck, Users, Wrench } from 'lucide-react'
import { useLocation } from 'react-router-dom'

type SuperAdminNavProps = {
  onNavigate: (path: string) => void
}

export function SuperAdminNav({ onNavigate }: SuperAdminNavProps) {
  const location = useLocation()
  const currentPath = location.pathname

  const tabs = [
    { label: 'Team Management', path: '/super-admin/admins', icon: Users },
    { label: 'Instrument Management', path: '/super-admin/instruments', icon: Wrench },
    { label: 'Company Settings', path: '/super-admin/company', icon: Building2 },
    { label: 'Database Backup', path: '/super-admin/backup', icon: Database },
    { label: 'Profile & Security', path: '/settings', icon: ShieldCheck },
  ]

  return (
    <nav aria-label="Super Admin Navigation" className="mb-6 flex flex-wrap items-center gap-2 border-b border-neutral-200 pb-3">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = currentPath === tab.path
        return (
          <button
            key={tab.path}
            type="button"
            onClick={() => onNavigate(tab.path)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              isActive
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'bg-white text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 border border-neutral-200'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
