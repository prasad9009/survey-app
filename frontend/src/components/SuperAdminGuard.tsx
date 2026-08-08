import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function SuperAdminGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-neutral-100">
        <p className="text-sm font-semibold text-neutral-600">Verifying authorization…</p>
      </div>
    )
  }

  if (!user || user.role !== 'super_admin') {
    return <Navigate to="/dashboard" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
