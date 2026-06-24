import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import '@/styles/globals.css'

// When a new service worker is waiting, reload as soon as the app regains
// visibility — on Android PWA, closing "all tabs" never happens, so autoUpdate
// alone would keep old code running indefinitely.
registerSW({
  onNeedRefresh() {
    const reload = () => {
      if (document.visibilityState === 'visible') window.location.reload()
    }
    document.addEventListener('visibilitychange', reload, { once: true })
    // Also reload immediately if the tab is already visible
    if (document.visibilityState === 'visible') window.location.reload()
  },
})

import { SettingsProvider } from '@/context/SettingsContext'
import AppShell from '@/components/layout/AppShell'
import Home from '@/routes/Home'
import Trends from '@/routes/Trends'
import Load from '@/routes/Load'
import Runs from '@/routes/Runs'
import RunDetail from '@/routes/RunDetail'
import Settings from '@/routes/Settings'
import AuthCallback from '@/routes/AuthCallback'

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <BrowserRouter>
      <SettingsProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Home />} />
            <Route path="trends" element={<Trends />} />
            <Route path="load" element={<Load />} />
            <Route path="runs" element={<Runs />} />
            <Route path="runs/:id" element={<RunDetail />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="auth/callback" element={<AuthCallback />} />
        </Routes>
      </SettingsProvider>
    </BrowserRouter>
  </StrictMode>,
)
