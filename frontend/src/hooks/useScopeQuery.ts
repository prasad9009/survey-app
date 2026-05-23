import { useAuth } from '../context/AuthContext'
import { useSelectedYear } from '../context/SelectedYearContext'

/** Shared year + instrument scope for scoped list queries. */
export function useQueryScope() {
  const { token, activeInstrumentId } = useAuth()
  const { selectedYear } = useSelectedYear()
  return {
    token,
    year: selectedYear,
    instrumentId: activeInstrumentId,
    enabled: Boolean(token),
  }
}
