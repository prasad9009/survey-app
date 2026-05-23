import { useSyncExternalStore } from 'react'

function subscribe(onStoreChange: () => void) {
  window.addEventListener('online', onStoreChange)
  window.addEventListener('offline', onStoreChange)
  return () => {
    window.removeEventListener('online', onStoreChange)
    window.removeEventListener('offline', onStoreChange)
  }
}

function getOnlineSnapshot() {
  return navigator.onLine
}

function getOnlineServerSnapshot() {
  return true
}

/** Reactive online/offline state from navigator.onLine and browser events. */
export function useOnlineStatus() {
  return useSyncExternalStore(subscribe, getOnlineSnapshot, getOnlineServerSnapshot)
}
