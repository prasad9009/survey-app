/** Removes the inline HTML splash once the app has painted (see index.html). */
export function hidePwaSplash(): void {
  if (typeof window === 'undefined') return
  const hide = (window as Window & { __hidePwaSplash?: () => void }).__hidePwaSplash
  hide?.()
}
