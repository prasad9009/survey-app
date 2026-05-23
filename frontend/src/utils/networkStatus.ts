/** True when the browser reports no network (offline event / navigator.onLine). */
export function isBrowserOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false
}

/** Network failure with no HTTP response (typical when offline or blocked). */
export function isLikelyOfflineRequestError(err: unknown): boolean {
  if (isBrowserOffline()) return true
  if (err && typeof err === 'object' && 'code' in err) {
    const code = String((err as { code?: string }).code)
    if (code === 'ERR_NETWORK' || code === 'ECONNABORTED') return true
  }
  if (err && typeof err === 'object' && 'response' in err) {
    return !(err as { response?: unknown }).response
  }
  return false
}
