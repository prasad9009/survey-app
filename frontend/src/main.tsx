import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { initPwaInstallCapture } from './utils/pwaInstall'
import { hidePwaSplash } from './utils/pwaSplash'
import { initIosKeyboardViewport } from './utils/iosKeyboardViewport'
import { initPwaZoomLock } from './utils/pwaZoomLock'
import { usePwaUpdater } from './hooks/usePwaUpdater'
import './index.css'

initPwaInstallCapture()
initPwaZoomLock()
initIosKeyboardViewport()
import App from './App.tsx'
import { NetworkStatusShell } from './components/NetworkStatusShell'
import { QueryProvider } from './components/QueryProvider'
import { AuthProvider } from './context/AuthContext'
import { RefreshProvider } from './context/RefreshContext'
import { SelectedYearProvider } from './context/SelectedYearContext'

function AppBootstrap() {
  usePwaUpdater()
  return <App />
}

const rootEl = document.getElementById('root')!
createRoot(rootEl).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <QueryProvider>
          <SelectedYearProvider>
            <RefreshProvider>
              <NetworkStatusShell>
                <AppBootstrap />
              </NetworkStatusShell>
              <Toaster richColors position="top-center" />
            </RefreshProvider>
          </SelectedYearProvider>
        </QueryProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    hidePwaSplash()
  })
})
