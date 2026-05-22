import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'

export default function AppShell() {
  return (
    <div className="min-h-screen bg-bg text-text-primary">
      <main className="pb-14 min-h-screen">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
