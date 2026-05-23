import type { AccountManagerSummary, AuthUser, CompanyAdminContact, InstrumentSummary } from '../context/AuthContext'

const SESSION_CACHE_KEY = 'survey-session-snapshot'

export type SessionSnapshot = {
  user: AuthUser
  company: { id: string; name: string; email?: string; settings?: Record<string, unknown> } | null
  companyAdmins: CompanyAdminContact[]
  instruments: InstrumentSummary[]
  managers: AccountManagerSummary[]
  activeInstrumentId: string | null
}

export function saveSessionSnapshot(snapshot: SessionSnapshot) {
  try {
    localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(snapshot))
  } catch {
    /* ignore quota / private mode */
  }
}

export function loadSessionSnapshot(): SessionSnapshot | null {
  try {
    const raw = localStorage.getItem(SESSION_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SessionSnapshot
    if (!parsed?.user?.id) return null
    return parsed
  } catch {
    return null
  }
}

export function clearSessionSnapshot() {
  try {
    localStorage.removeItem(SESSION_CACHE_KEY)
  } catch {
    /* ignore */
  }
}
