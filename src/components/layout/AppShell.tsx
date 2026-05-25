import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import { backfillMetrics } from '@/lib/metrics/backfill'

const RECALC_INTERVAL_MS = 3 * 60 * 60 * 1000 // 3 hours
const LAST_RECALC_KEY = 'lastDecayRecalc'

export default function AppShell() {
  useEffect(() => {
    async function maybeRecalc() {
      const last = Number(localStorage.getItem(LAST_RECALC_KEY) ?? 0)
      if (Date.now() - last >= RECALC_INTERVAL_MS) {
        await backfillMetrics()
        localStorage.setItem(LAST_RECALC_KEY, String(Date.now()))
      }
    }

    maybeRecalc()
    const timer = setInterval(maybeRecalc, RECALC_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-bg text-text-primary">
      <main className="pb-14 min-h-screen">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
