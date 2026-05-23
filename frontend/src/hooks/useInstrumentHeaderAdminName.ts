import { useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { instrumentScopedAdmins } from '../utils/pdfAdminContacts'

/** Primary admin name for the active instrument (header / PDF), without Er. prefix. */
export function useInstrumentHeaderAdminName() {
  const { companyAdmins, activeInstrumentId, user } = useAuth()
  return useMemo(() => {
    const primary = instrumentScopedAdmins(companyAdmins, activeInstrumentId).find((a) =>
      (a.fullName || '').trim(),
    )
    const raw = primary?.fullName?.trim() || user?.fullName?.trim() || ''
    return raw.replace(/^Er\.\s*/i, '').trim()
  }, [companyAdmins, activeInstrumentId, user?.fullName])
}
