import { Building2, Database, LogOut, ShieldCheck, Users, Wrench, X } from 'lucide-react'
import { CollaborationBrandMark } from '../CollaborationBrandMark'
import { signOut } from '../signOut'

type SuperAdminSidebarProps = {
  currentPath: string
  onNavigate: (path: string) => void
  isSidebarOpen: boolean
  setIsSidebarOpen: (open: boolean) => void
}

export function SuperAdminSidebar({
  currentPath,
  onNavigate,
  isSidebarOpen,
  setIsSidebarOpen,
}: SuperAdminSidebarProps) {
  const navItems = [
    { label: 'Admin Management', path: '/super-admin/admins', icon: Users },
    { label: 'Instrument Management', path: '/super-admin/instruments', icon: Wrench },
    { label: 'Company Settings', path: '/super-admin/company', icon: Building2 },
    { label: 'Backup Export', path: '/super-admin/backup', icon: Database },
    { label: 'Super Admin Setting', path: '/settings', icon: ShieldCheck },
  ]

  const renderNavContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-7">
        <CollaborationBrandMark variant="desktopSidebar" />
      </div>

      <nav className="mt-5 flex-1 px-3">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = currentPath === item.path
            return (
              <button
                type="button"
                key={item.path}
                onClick={() => {
                  onNavigate(item.path)
                  setIsSidebarOpen(false)
                }}
                className={[
                  'group flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13px] font-semibold transition',
                  active
                    ? 'bg-[#f39b03]/18 text-[#f39b03] ring-1 ring-[#f39b03]/30'
                    : 'text-white/85 hover:bg-white/5 hover:text-white',
                ].join(' ')}
              >
                <span
                  className={[
                    'grid h-8 w-8 place-items-center rounded-lg',
                    active ? 'bg-[#f39b03]/14 text-[#f39b03]' : 'bg-white/5 text-white/70',
                  ].join(' ')}
                >
                  <Icon size={16} />
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      <div className="mt-auto px-3 pb-6">
        <button
          type="button"
          onClick={signOut}
          className="group flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13px] font-semibold bg-red-500/15 text-red-300 ring-1 ring-red-400/35 hover:bg-red-500/20 hover:text-red-200 transition"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-red-500/18 text-red-300">
            <LogOut size={16} />
          </span>
          <span className="truncate">Log Out</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[280px] flex-col bg-gradient-to-b from-[#050505] via-[#0b0b0b] to-[#040404] pb-6 text-white lg:flex">
        {renderNavContent()}
      </aside>

      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
          aria-label="Close menu overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Drawer Sidebar */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col overflow-y-auto bg-gradient-to-b from-[#050505] via-[#0b0b0b] to-[#040404] text-white transition-transform duration-300 lg:hidden',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="flex items-center justify-between px-5 pt-6">
          <span className="text-sm font-extrabold tracking-tight text-white">Super Admin Suite</span>
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-white hover:bg-white/20"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>
        {renderNavContent()}
      </aside>
    </>
  )
}
