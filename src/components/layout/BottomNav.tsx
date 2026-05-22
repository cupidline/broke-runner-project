import { NavLink } from 'react-router-dom'
import { Home, TrendingUp, Zap, Activity, Settings } from 'lucide-react'

const tabs = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/trends', icon: TrendingUp, label: 'Trends' },
  { to: '/load', icon: Zap, label: 'Load' },
  { to: '/runs', icon: Activity, label: 'Runs' },
  { to: '/settings', icon: Settings, label: 'Settings' },
] as const

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 h-14 bg-surface border-t border-muted/30 flex"
      aria-label="Main navigation"
    >
      {tabs.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 text-xs transition-colors ${
              isActive ? 'text-accent' : 'text-text-secondary hover:text-text-primary'
            }`
          }
          aria-label={label}
        >
          <Icon size={20} strokeWidth={1.75} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
