// Strava redirects to the bare origin with ?code= — forward to the hash route before React mounts
if (window.location.search.includes('code=') && !window.location.hash.includes('auth/callback')) {
  window.location.replace(`${window.location.origin}/#/auth/callback${window.location.search}`)
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import '@/styles/globals.css'

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
    <HashRouter>
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
    </HashRouter>
  </StrictMode>,
)
