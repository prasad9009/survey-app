import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { initPwaInstallCapture } from './utils/pwaInstall'
import { initIosKeyboardViewport } from './utils/iosKeyboardViewport'
import { initPwaZoomLock } from './utils/pwaZoomLock'
import { usePwaUpdater } from './hooks/usePwaUpdater'
import './index.css'

initPwaInstallCapture()
initPwaZoomLock()
initIosKeyboardViewport()
import App from './App.tsx'
import { QueryProvider } from './components/QueryProvider'
import { AuthProvider } from './context/AuthContext'
import { RefreshProvider } from './context/RefreshContext'
import { SelectedYearProvider } from './context/SelectedYearContext'

function AppBootstrap() {
  usePwaUpdater()
  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <QueryProvider>
          <SelectedYearProvider>
            <RefreshProvider>
              <AppBootstrap />
              <Toaster richColors position="top-center" />
            </RefreshProvider>
          </SelectedYearProvider>
        </QueryProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
