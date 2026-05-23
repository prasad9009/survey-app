import { useEffect } from 'react'
import { toast } from 'sonner'
import { registerSW } from 'virtual:pwa-register'
import { PwaUpdateToast } from '../components/PwaUpdateToast'

const VERSION_KEY = 'surveyos:build-version'
const AUTO_UPDATE_AFTER_MS = 15000
const REGISTRATION_REFRESH_MS = 60000

/** Runtime caches from before logo-bg2 splash rollout. */
const LEGACY_RUNTIME_CACHES = ['pages-cache', 'assets-cache', 'images-cache']

const BUILD_VERSION = (
  import.meta.env.VITE_APP_VERSION || __APP_BUILD_VERSION__ || 'dev-build'
).trim()

export function usePwaUpdater() {
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.info('[PWA] Service worker disabled in development mode.')
      return
    }

    console.info(`[PWA] Running build version: ${BUILD_VERSION}`)
    const previousVersion = localStorage.getItem(VERSION_KEY)
    if (previousVersion && previousVersion !== BUILD_VERSION) {
      console.info(`[PWA] Installed build changed: ${previousVersion} -> ${BUILD_VERSION}`)
      if ('caches' in window) {
        void caches.keys().then((keys) => {
          for (const key of keys) {
            if (LEGACY_RUNTIME_CACHES.includes(key)) {
              void caches.delete(key)
            }
          }
        })
      }
    }
    localStorage.setItem(VERSION_KEY, BUILD_VERSION)

    let registrationInterval: number | undefined
    let autoUpdateTimeout: number | undefined
    let updateInProgress = false
    const updateToastId = `pwa-update-${BUILD_VERSION}`

    const updateServiceWorker = registerSW({
      immediate: true,
      onOfflineReady() {
        toast.success('SurveyOS is ready to work offline.', { duration: 2800 })
      },
      onNeedRefresh() {
        if (updateInProgress) return

        const applyUpdate = () => {
          if (updateInProgress) return
          updateInProgress = true
          if (autoUpdateTimeout) window.clearTimeout(autoUpdateTimeout)
          toast.dismiss(updateToastId)
          updateServiceWorker(true)
        }

        toast.custom(
          () => (
            <PwaUpdateToast
              version={BUILD_VERSION}
              onDismiss={() => toast.dismiss(updateToastId)}
              onUpdateNow={applyUpdate}
            />
          ),
          {
            id: updateToastId,
            duration: Infinity,
            position: 'top-center',
          },
        )

        autoUpdateTimeout = window.setTimeout(applyUpdate, AUTO_UPDATE_AFTER_MS)
      },
      onRegisteredSW(swUrl, registration) {
        console.info(`[PWA] Service worker registered: ${swUrl}`)
        registration?.update().catch((error) => {
          console.error('[PWA] Initial service worker update check failed:', error)
        })
        registrationInterval = window.setInterval(() => {
          registration?.update().catch((error) => {
            console.error('[PWA] Periodic service worker update check failed:', error)
          })
        }, REGISTRATION_REFRESH_MS)
      },
      onRegisterError(error) {
        console.error('[PWA] Service worker registration failed:', error)
      },
    })

    return () => {
      if (registrationInterval) window.clearInterval(registrationInterval)
      if (autoUpdateTimeout) window.clearTimeout(autoUpdateTimeout)
      toast.dismiss(updateToastId)
    }
  }, [])
}
