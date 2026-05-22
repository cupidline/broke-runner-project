import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useActivities } from '@/hooks/useActivities'
import { formatPace, formatRelativeDate, formatTRIMP } from '@/lib/utils/format'
import type { ActivityType } from '@/types'

// ── Filter types ──────────────────────────────────────────────────────────────

type TypeFilter = 'All' | ActivityType
type DateFilter = 'All' | '7d' | '30d' | '90d'

const TYPE_FILTERS: TypeFilter[] = ['All', 'Run', 'TrailRun', 'VirtualRun']
const DATE_FILTERS: { label: string; value: DateFilter }[] = [
  { label: 'All',  value: 'All' },
  { label: '7d',   value: '7d'  },
  { label: '30d',  value: '30d' },
  { label: '90d',  value: '90d' },
]

function cutoffDate(filter: DateFilter): Date | null {
  if (filter === 'All') return null
  const d = new Date()
  d.setDate(d.getDate() - ({ '7d': 7, '30d': 30, '90d': 90 }[filter]))
  return d
}

// ── Activity row ──────────────────────────────────────────────────────────────

function ActivityRow({ a }: { a: ReturnType<typeof useActivities>[number] }) {
  return (
    <li>
      <Link
        to={`/runs/${a.id}`}
        className="flex items-center justify-between px-4 py-3 gap-3 hover:bg-surface/60 active:bg-surface transition-colors"
      >
        <div className="min-w-0 flex-1">
          <p className="text-text-primary font-medium text-sm truncate">{a.name}</p>
          <p className="text-text-secondary text-xs mt-0.5">
            {formatRelativeDate(a.startDate)}
            {a.type !== 'Run' && (
              <span className="ml-2 text-accent">{a.type}</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <p className="text-text-primary font-semibold tabular-nums text-sm">
              {(a.distanceMeters / 1000).toFixed(2)} km
            </p>
            {a.avgPaceSecPerKm ? (
              <p className="text-text-secondary text-xs tabular-nums">
                {formatPace(a.avgPaceSecPerKm)}
              </p>
            ) : null}
          </div>
          {a.trimp !== undefined && (
            <span className="text-xs tabular-nums font-medium text-accent w-8 text-right">
              {formatTRIMP(a.trimp)}
            </span>
          )}
        </div>
      </Link>
    </li>
  )
}

// ── Route ─────────────────────────────────────────────────────────────────────

export default function Runs() {
  const activities = useActivities()
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('All')
  const [dateFilter, setDateFilter] = useState<DateFilter>('All')

  const filtered = useMemo(() => {
    const cutoff = cutoffDate(dateFilter)
    return activities.filter(a => {
      if (typeFilter !== 'All' && a.type !== typeFilter) return false
      if (cutoff && new Date(a.startDate) < cutoff) return false
      return true
    })
  }, [activities, typeFilter, dateFilter])

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 p-6 text-center">
        <p className="text-text-secondary">No runs yet.</p>
        <p className="text-text-muted text-sm">
          Connect Strava and sync in Settings to import your activities.
        </p>
      </div>
    )
  }

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-baseline justify-between">
        <h1 className="text-xl font-bold text-text-primary">Runs</h1>
        <p className="text-text-secondary text-sm tabular-nums">
          {filtered.length} {filtered.length === 1 ? 'run' : 'runs'}
        </p>
      </div>

      {/* Filters */}
      <div className="px-4 pb-3 space-y-2">
        {/* Type filter */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar" role="group" aria-label="Activity type">
          {TYPE_FILTERS.map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              aria-pressed={typeFilter === t}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                typeFilter === t
                  ? 'bg-accent text-bg'
                  : 'bg-surface text-text-secondary hover:text-text-primary'
              }`}
            >
              {t === 'TrailRun' ? 'Trail' : t === 'VirtualRun' ? 'Virtual' : t}
            </button>
          ))}
        </div>

        {/* Date filter */}
        <div className="flex gap-1.5" role="group" aria-label="Date range">
          {DATE_FILTERS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setDateFilter(value)}
              aria-pressed={dateFilter === value}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                dateFilter === value
                  ? 'bg-surface border border-accent/60 text-accent'
                  : 'bg-surface text-text-secondary hover:text-text-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Divider header row */}
      <div className="flex items-center justify-between px-4 py-1 border-b border-muted/20">
        <span className="text-xs text-text-muted">Activity</span>
        <div className="flex gap-4 text-xs text-text-muted">
          <span>Dist / Pace</span>
          <span className="w-8 text-right">TRIMP</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-text-secondary text-sm">No runs match this filter.</p>
        </div>
      ) : (
        <ul role="list" className="divide-y divide-muted/10">
          {filtered.map(a => <ActivityRow key={a.id} a={a} />)}
        </ul>
      )}
    </div>
  )
}
