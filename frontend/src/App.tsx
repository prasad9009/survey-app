import { lazy, Suspense, useEffect, useState } from 'react'
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  type NavigateFunction,
} from 'react-router-dom'
import InstallPrompt from './components/InstallPrompt.jsx'
import { useAuth } from './context/AuthContext'

const Login = lazy(() => import('./pages/Login.jsx'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'))
const VerifyOtp = lazy(() => import('./pages/VerifyOtp.jsx'))
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'))

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Invoice = lazy(() => import('./pages/Invoice'))
const AccountManager = lazy(() => import('./pages/AccountManager'))
const AccountManagerSelect = lazy(() => import('./pages/AccountManagerSelect'))
const ClientsSites = lazy(() => import('./pages/ClientsSites'))
const AddSite = lazy(() => import('./pages/AddSite'))
const AddSiteVisit = lazy(() => import('./pages/AddSiteVisit'))
const SiteDetails = lazy(() => import('./pages/SiteDetails').then((m) => ({ default: m.SiteDetails })))
const Reports = lazy(() => import('./pages/Reports'))
const Settings = lazy(() => import('./pages/Settings'))
const ActivityLogs = lazy(() => import('./pages/ActivityLogs'))


const PUBLIC_PATHS = new Set(['/login', '/forgot-password', '/verify-reset-otp', '/reset-password'])

/** Require a session for app routes; allow login + full password-reset flow without a session. */
function AuthBoundary() {
  const { token } = useAuth()
  const location = useLocation()
  if (!token && !PUBLIC_PATHS.has(location.pathname)) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (token && PUBLIC_PATHS.has(location.pathname) && location.pathname !== '/login') {
    return <Navigate to="/dashboard" replace />
  }
  return <Outlet />
}

function HomeRedirect() {
  const { token } = useAuth()
  return <Navigate to={token ? '/dashboard' : '/login'} replace />
}

function CatchAllRedirect() {
  const { token } = useAuth()
  return <Navigate to={token ? '/dashboard' : '/login'} replace />
}

/** Mobile: pick a manager. Desktop (md+): same URL redirects to default manager ledger. */
function AccountManagerIndex({ onNavigate }: { onNavigate: NavigateFunction }) {
  const location = useLocation()
  const { managers, user, isLoading } = useAuth()
  const ownSlug = managers.find((m) => m.adminId && user?.id && m.adminId === user.id)?.id
  const defaultSlug = ownSlug ?? managers[0]?.id
  const [mdUp, setMdUp] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const apply = () => setMdUp(mq.matches)
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
  if (mdUp) {
    if (isLoading) {
      return (
        <div className="app-layout-root flex min-h-dvh items-center justify-center bg-neutral-100">
          <p className="text-sm font-semibold text-neutral-600">Loading account manager…</p>
        </div>
      )
    }
    if (defaultSlug) {
      return (
        <Navigate
          to={{ pathname: `/account-manager/${defaultSlug}`, search: location.search }}
          replace
        />
      )
    }
  }
  return <AccountManagerSelect onNavigate={onNavigate} />
}

function AppRoutes() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <Suspense fallback={null}>
      <Routes location={location}>
        <Route element={<AuthBoundary />}>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-reset-otp" element={<VerifyOtp />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<Dashboard onNavigate={navigate} />} />
          <Route path="/invoice" element={<Invoice onNavigate={navigate} />} />
          <Route path="/account-manager" element={<AccountManagerIndex onNavigate={navigate} />} />
          <Route path="/account-manager/:managerId" element={<AccountManager onNavigate={navigate} />} />
          <Route path="/clients-sites" element={<ClientsSites onNavigate={navigate} />} />
          <Route path="/add-site" element={<AddSite onNavigate={navigate} />} />
          <Route path="/site-visits" element={<AddSiteVisit onNavigate={navigate} />} />
          <Route path="/add-site-visit" element={<AddSiteVisit onNavigate={navigate} />} />
          <Route path="/site-details" element={<SiteDetails onNavigate={navigate} />} />
          <Route path="/reports" element={<Reports onNavigate={navigate} />} />
          <Route path="/activity-logs" element={<ActivityLogs onNavigate={navigate} />} />
          <Route path="/transitions" element={<ActivityLogs onNavigate={navigate} />} />
          <Route path="/settings" element={<Settings onNavigate={navigate} />} />
          <Route path="*" element={<CatchAllRedirect />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <>
      <AppRoutes />
      <InstallPrompt />
    </>
  )
}
