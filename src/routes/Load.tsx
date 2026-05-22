import { useState } from 'react'
import { useLatestMetrics } from '@/hooks/useMetrics'
import { useActivities, useActivityCount } from '@/hooks/useActivities'
import { acwrRisk } from '@/lib/metrics/acwr'
import { formatDistance, formatRelativeDate, formatTRIMP } from '@/lib/utils/format'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { ChevronUp, ChevronDown } from 'lucide-react'
import type { Activity } from '@/types'

// ── ACWR gauge ────────────────────────────────────────────────────────────────

const ACWR_BANDS = [
  { max: 0.5,  label: 'Undertrained', color: '#52525B',  width: '10%' },
  { max: 0.8,  label: 'Building',     color: '#7DD3FC',  width: '15%' },
  { max: 1.3,  label: 'Optimal',      color: '#34D399',  width: '25%' },
  { max: 1.5,  label: 'Caution',      color: '#FBBF24',  width: '10%' },
  { max: 2.0,  label: 'Danger',       color: '#F87171',  width: '40%' },
]

const RISK_BADGE: Record<ReturnType<typeof acwrRisk>, { color: 'accent' | 'success' | 'warning' | 'danger' | 'muted'; label: string }> = {
  undertraining: { color: 'muted',    label: 'Undertrained' },
  safe:          { color: 'success',  label: 'Optimal'      },
  caution:       { color: 'warning',  label: 'Caution'      },
  danger:        { color: 'danger',   label: 'High Risk'    },
}

function ACWRGauge({ acwr }: { acwr: number }) {
  const risk = acwrRisk(acwr)
  const { color: badgeColor, label } = RISK_BADGE[risk]
  // Clamp position 0–2 → 0–100%
  const pct = Math.max(0, Math.min(100, (acwr / 2) * 100))

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <span className="text-5xl font-bold tabular-nums text-text-primary">
          {acwr.toFixed(2)}
        </span>
        <Badge label={label} color={badgeColor} />
      </div>
      {/* Track */}
      <div className="relative h-3 rounded-full overflow-hidden flex">
        {ACWR_BANDS.map(b => (
          <div key={b.label} style={{ width: b.width, background: b.color }} className="h-full opacity-60" />
        ))}
        {/* Needle */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white rounded-full shadow"
          style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
        />
      </div>
      <div className="flex justify-between text-xs text-text-muted">
        <span>0.5</span><span>0.8</span><span>1.3</span><span>1.5</span><span>2.0</span>
      </div>
      <p className="text-xs text-text-secondary">
        Safe zone: 0.8–1.3 · Acute (ATL) ÷ Chronic (CTL) workload ratio
      </p>
    </div>
  )
}

// ── TRIMP table ───────────────────────────────────────────────────────────────

type SortKey = 'startDate' | 'trimp' | 'distanceMeters'
type SortDir = 'asc' | 'desc'

function TRIMPTable({ activities }: { activities: Activity[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('startDate')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const sorted = [...activities]
    .filter(a => a.trimp !== undefined)
    .sort((a, b) => {
      const av = sortKey === 'startDate' ? a.startDate : (a[sortKey] ?? 0)
      const bv = sortKey === 'startDate' ? b.startDate : (b[sortKey] ?? 0)
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv), undefined, { numeric: true })
        : String(bv).localeCompare(String(av), undefined, { numeric: true })
    })

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronUp size={12} className="text-muted" />
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-accent" />
      : <ChevronDown size={12} className="text-accent" />
  }

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full text-sm" aria-label="Activity TRIMP table">
        <thead>
          <tr className="text-left border-b border-muted/20">
            {([
              { key: 'startDate',      label: 'Date'     },
              { key: 'distanceMeters', label: 'Dist'     },
              { key: 'trimp',          label: 'TRIMP'    },
            ] as { key: SortKey; label: string }[]).map(col => (
              <th
                key={col.key}
                className="pb-2 pr-4 text-xs font-semibold text-text-secondary cursor-pointer select-none whitespace-nowrap"
                onClick={() => toggleSort(col.key)}
              >
                <span className="flex items-center gap-1">
                  {col.label} <SortIcon col={col.key} />
                </span>
              </th>
            ))}
            <th className="pb-2 text-xs font-semibold text-text-secondary text-left">Activity</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(a => (
            <tr key={a.id} className="border-b border-muted/10 hover:bg-surface/50 transition-colors">
              <td className="py-2 pr-4 tabular-nums text-text-secondary text-xs whitespace-nowrap">
                {formatRelativeDate(a.startDate)}
              </td>
              <td className="py-2 pr-4 tabular-nums text-text-primary text-xs whitespace-nowrap">
                {formatDistance(a.distanceMeters)}
              </td>
              <td className="py-2 pr-4 tabular-nums text-accent font-medium text-xs">
                {formatTRIMP(a.trimp!)}
              </td>
              <td className="py-2 text-text-secondary text-xs truncate max-w-[140px]">
                {a.name}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Route ─────────────────────────────────────────────────────────────────────

export default function Load() {
  const metrics = useLatestMetrics()
  const activities = useActivities()
  const activityCount = useActivityCount()

  if (activityCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center gap-2">
        <p className="text-text-secondary">No data yet.</p>
        <p className="text-text-muted text-sm">Sync your Strava activities in Settings.</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 pb-6">
      <h1 className="text-xl font-bold text-text-primary">Load</h1>

      {/* ACWR */}
      <Card>
        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-4">
          Acute:Chronic Workload Ratio
        </p>
        {metrics ? (
          <ACWRGauge acwr={metrics.acwr} />
        ) : (
          <div className="h-24 animate-pulse bg-muted/10 rounded-lg" />
        )}
      </Card>

      {/* Monotony + Strain */}
      {metrics && (
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
              Monotony
            </p>
            <p className={`text-3xl font-bold tabular-nums ${metrics.monotony > 2 ? 'text-danger' : metrics.monotony > 1.5 ? 'text-warning' : 'text-text-primary'}`}>
              {metrics.monotony.toFixed(2)}
            </p>
            <p className="text-xs text-text-muted mt-1">
              {metrics.monotony > 2 ? 'High — vary training' : metrics.monotony > 1.5 ? 'Moderate' : 'Good variety'}
            </p>
          </Card>
          <Card>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
              Strain
            </p>
            <p className="text-3xl font-bold tabular-nums text-text-primary">
              {Math.round(metrics.strain)}
            </p>
            <p className="text-xs text-text-muted mt-1">Weekly load × monotony</p>
          </Card>
        </div>
      )}

      {/* TRIMP table */}
      <Card>
        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-4">
          Activity Load
        </p>
        <TRIMPTable activities={activities} />
      </Card>
    </div>
  )
}
