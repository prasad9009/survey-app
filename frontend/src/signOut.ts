import { tokenStorage } from './services/http'
import { clearSurveyQueryCache } from './components/QueryProvider'

/** Clears auth, API cache, and notifies the app; same async shape for existing callers. */
export async function signOut(): Promise<void> {
  tokenStorage.clear()
  clearSurveyQueryCache()
  window.dispatchEvent(new CustomEvent('survey:logout'))
}
