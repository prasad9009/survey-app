import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import axios from 'axios'
import http, { tokenStorage } from '../services/http'
import { clearSurveyQueryCache } from '../components/QueryProvider'
import { queryClient } from '../lib/queryClient'
import { prefetchAfterLogin } from '../lib/prefetch'
import { clampRecordYearString } from '../recordYearConfig'
import {
  clearSessionSnapshot,
  loadSessionSnapshot,
  saveSessionSnapshot,
} from '../utils/authSessionCache'
import { isBrowserOffline, isLikelyOfflineRequestError } from '../utils/networkStatus'

export type AuthUser = {
  id: string
  email: string
  role: 'super_admin' | 'admin'
  fullName: string
  phone: string
}

export type InstrumentSummary = { id: string; name: string; category?: string; status?: string }

export type AccountManagerSummary = {
  id: string
  _id: string
  adminId?: string
  name: string
  shortName: string
  phone: string
}

export type CompanyAdminContact = { id: string; fullName: string; phone: string; instrumentIds?: string[] }

type AuthContextValue = {
  token: string | null
  user: AuthUser | null
  company: { id: string; name: string; email?: string; settings?: Record<string, unknown> } | null
  companyAdmins: CompanyAdminContact[]
  instruments: InstrumentSummary[]
  managers: AccountManagerSummary[]
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshSession: () => Promise<void>
  setActiveInstrumentId: (id: string | null) => void
  activeInstrumentId: string | null
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** Prefer server default, then stored selection when still in the user's instrument list. */
function resolveActiveInstrumentId(
  server: string | null,
  stored: string | null,
  instruments: InstrumentSummary[],
): string | null {
  const allowed = new Set(instruments.map((i) => i.id))
  if (server && allowed.has(server)) return server
  if (stored && allowed.has(stored)) return stored
  return instruments[0]?.id ?? null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => tokenStorage.getToken())
  const [user, setUser] = useState<AuthUser | null>(null)
  const [company, setCompany] = useState<AuthContextValue['company']>(null)
  const [companyAdmins, setCompanyAdmins] = useState<CompanyAdminContact[]>([])
  const [instruments, setInstruments] = useState<InstrumentSummary[]>([])
  const [managers, setManagers] = useState<AccountManagerSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeInstrumentId, setActiveInstrumentIdState] = useState<string | null>(() =>
    tokenStorage.getInstrumentId(),
  )

  const applySession = useCallback((payload: {
    user: AuthUser
    company: AuthContextValue['company']
    companyAdmins?: CompanyAdminContact[]
    instruments: InstrumentSummary[]
    managers: AccountManagerSummary[]
    activeInstrumentId: string | null
  }) => {
    setUser(payload.user)
    setCompany(payload.company)
    setCompanyAdmins(payload.companyAdmins ?? [])
    setInstruments(payload.instruments)
    setManagers(payload.managers)
    const inst = payload.activeInstrumentId
    setActiveInstrumentIdState(inst)
    if (inst) tokenStorage.setInstrumentId(inst)
    else tokenStorage.setInstrumentId(null)
    saveSessionSnapshot({
      user: payload.user,
      company: payload.company,
      companyAdmins: payload.companyAdmins ?? [],
      instruments: payload.instruments,
      managers: payload.managers,
      activeInstrumentId: inst,
    })
  }, [])

  const loadManagers = useCallback(async () => {
    const res = await http.get<{ ok: boolean; managers: AccountManagerSummary[] }>('/api/account-managers')
    if (res.status === 200 && res.data?.ok) return res.data.managers ?? []
    return []
  }, [])

  const refreshSession = useCallback(async () => {
    const t = tokenStorage.getToken()
    if (!t) {
      setUser(null)
      setCompany(null)
      setCompanyAdmins([])
      setInstruments([])
      setManagers([])
      setIsLoading(false)
      return
    }
    if (isBrowserOffline()) {
      const cached = loadSessionSnapshot()
      if (cached) {
        applySession(cached)
        setToken(t)
        setIsLoading(false)
        return
      }
    }
    setIsLoading(true)
    try {
      const res = await http.get<{
        ok: boolean
        user: AuthUser
        company: AuthContextValue['company']
        companyAdmins?: CompanyAdminContact[]
        instruments: InstrumentSummary[]
        activeInstrumentId: string | null
      }>('/api/auth/me')
      if (res.status !== 200 || !res.data?.ok) {
        tokenStorage.clear()
        setToken(null)
        setUser(null)
        setCompanyAdmins([])
        return
      }
      let mgrs: AccountManagerSummary[] = []
      try {
        mgrs = await loadManagers()
      } catch {
        mgrs = []
      }
      const instruments = res.data.instruments ?? []
      applySession({
        user: res.data.user,
        company: res.data.company,
        companyAdmins: res.data.companyAdmins,
        instruments,
        managers: mgrs,
        activeInstrumentId: resolveActiveInstrumentId(
          res.data.activeInstrumentId ?? null,
          tokenStorage.getInstrumentId(),
          instruments,
        ),
      })
      setToken(t)
      const year = clampRecordYearString(String(new Date().getFullYear()))
      const inst = resolveActiveInstrumentId(
        res.data.activeInstrumentId ?? null,
        tokenStorage.getInstrumentId(),
        instruments,
      )
      void prefetchAfterLogin(queryClient, year, inst)
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined
      if (status === 401) {
        clearSessionSnapshot()
        tokenStorage.clear()
        setToken(null)
        setUser(null)
        setCompanyAdmins([])
        return
      }
      const cached = loadSessionSnapshot()
      if (cached && tokenStorage.getToken() && isLikelyOfflineRequestError(err)) {
        applySession(cached)
        setToken(tokenStorage.getToken())
        return
      }
      if (!isLikelyOfflineRequestError(err)) {
        clearSessionSnapshot()
        tokenStorage.clear()
        setToken(null)
        setUser(null)
        setCompanyAdmins([])
      }
    } finally {
      setIsLoading(false)
    }
  }, [applySession, loadManagers])

  useEffect(() => {
    void refreshSession()
  }, [refreshSession])

  useEffect(() => {
    const onUnauth = () => {
      clearSessionSnapshot()
      tokenStorage.clear()
      setToken(null)
      setUser(null)
      setCompany(null)
      setCompanyAdmins([])
    }
    window.addEventListener('survey:unauthorized', onUnauth)
    return () => window.removeEventListener('survey:unauthorized', onUnauth)
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const res = await http.post<{
          ok: boolean
          token: string
          user: AuthUser
          company: AuthContextValue['company']
          companyAdmins?: CompanyAdminContact[]
          instruments: InstrumentSummary[]
          activeInstrumentId: string | null
          error?: string
        }>('/api/auth/login', { email: email.trim(), password })
        if (res.status !== 200 || !res.data?.ok || !res.data.token) {
          throw new Error(res.data?.error ?? 'Login failed')
        }
        tokenStorage.setToken(res.data.token)
        setToken(res.data.token)
        if (res.data.activeInstrumentId) tokenStorage.setInstrumentId(res.data.activeInstrumentId)
        let mgrs: AccountManagerSummary[] = []
        try {
          mgrs = await loadManagers()
        } catch {
          mgrs = []
        }
        const instruments = res.data.instruments ?? []
        const activeId = resolveActiveInstrumentId(
          res.data.activeInstrumentId ?? null,
          tokenStorage.getInstrumentId(),
          instruments,
        )
        applySession({
          user: res.data.user,
          company: res.data.company,
          companyAdmins: res.data.companyAdmins,
          instruments,
          managers: mgrs,
          activeInstrumentId: activeId,
        })
        const year = clampRecordYearString(String(new Date().getFullYear()))
        void prefetchAfterLogin(queryClient, year, activeId)
      } catch (err) {
        if (axios.isAxiosError(err)) {
          const msg = (err.response?.data as { error?: string } | undefined)?.error ?? 'Login failed'
          throw new Error(msg)
        }
        throw err
      }
    },
    [applySession, loadManagers],
  )

  const logout = useCallback(() => {
    clearSessionSnapshot()
    clearSurveyQueryCache()
    tokenStorage.clear()
    setToken(null)
    setUser(null)
    setCompany(null)
    setCompanyAdmins([])
    setInstruments([])
    setManagers([])
    setActiveInstrumentIdState(null)
  }, [])

  useEffect(() => {
    const onLogout = () => logout()
    window.addEventListener('survey:logout', onLogout)
    return () => window.removeEventListener('survey:logout', onLogout)
  }, [logout])

  const setActiveInstrumentId = useCallback((id: string | null) => {
    setActiveInstrumentIdState(id)
    tokenStorage.setInstrumentId(id)
  }, [])

  const value = useMemo(
    () => ({
      token,
      user,
      company,
      companyAdmins,
      instruments,
      managers,
      isLoading,
      login,
      logout,
      refreshSession,
      setActiveInstrumentId,
      activeInstrumentId,
    }),
    [
      token,
      user,
      company,
      companyAdmins,
      instruments,
      managers,
      isLoading,
      login,
      logout,
      refreshSession,
      setActiveInstrumentId,
      activeInstrumentId,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
