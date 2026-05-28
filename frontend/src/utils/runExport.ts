import { toast } from 'sonner'
import { getApiErrorMessage } from '../services/request'

let exportInFlight = false

/** Run an export with loading + success/error toasts. Only one export at a time. */
export async function runExport(label: string, fn: () => Promise<void>): Promise<boolean> {
  if (exportInFlight) {
    toast.info('Please wait — an export is already in progress.')
    return false
  }
  exportInFlight = true
  const id = toast.loading(`Exporting ${label}…`)
  try {
    await fn()
    toast.success(`${label} ready`, { id })
    return true
  } catch (err) {
    toast.error(getApiErrorMessage(err, `Could not export ${label}.`), { id })
    return false
  } finally {
    exportInFlight = false
  }
}
