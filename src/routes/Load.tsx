import { useState, useMemo } from 'react'
import { useLiveMetrics } from '@/hooks/useLiveMetrics'
import { useActivities, useActivityCount } from '@/hooks/useActivities'
import { acwrRisk } from '@/lib/metrics/acwr'
import { formatDistance, formatDate, formatTRIMP } from '@/lib/utils/format'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Activity } from '@/types'


// ── ATL gauge ─────────────────────────────────────────────────────────────────

const ATL_BANDS = [
  { label: 'Fresh',       from:  0, to: 15, color: '#34D399', desc: 'Very low load — fully recovered' },
  { label: 'Light',       from: 15, to: 30, color: '#7DD3FC', desc: 'Easy training week' },
  { label: 'Moderate',    from: 30, to: 50, color: '#F59E0B', desc: 'Normal training load' },
  { label: 'High',        from: 50, to: 70, color: '#F97316', desc: 'Heavy week — monitor recovery' },
  { label: 'Overreaching',from: 70, to: 100, color: '#F87171', desc: 'Fatigue is accumulating' },
]
const ATL_MAX = 100

function ATLGauge({ atl }: { atl: number }) {
  const active = ATL_BANDS.find(b => atl < b.to) ?? ATL_BANDS[ATL_BANDS.length - 1]
  const markerPct = (Math.min(Math.max(atl, 0), ATL_MAX) / ATL_MAX) * 100

  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
        ATL · Fatigue
      </p>
      <p className="text-[10px] text-text-muted mb-3">7-day rolling load — how tired you are right now</p>
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-3xl font-bold tabular-nums" style={{ color: active.color }}>
          {Math.round(atl)}
        </span>
        <span className="text-sm font-semibold" style={{ color: active.color }}>{active.label}</span>
      </div>
      <div className="relative h-2 rounded-full overflow-hidden flex mb-1">
        {ATL_BANDS.map(b => (
          <div
            key={b.label}
            style={{
              width: `${((b.to - b.from) / ATL_MAX) * 100}%`,
              background: b.color,
              opacity: b.label === active.label ? 0.6 : 0.2,
            }}
          />
        ))}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white rounded-full shadow"
          style={{ left: `${markerPct}%`, transform: 'translateX(-50%)' }}
        />
      </div>
      <div className="flex">
        {ATL_BANDS.map(b => (
          <div
            key={b.label}
            className="flex justify-center"
            style={{ width: `${((b.to - b.from) / ATL_MAX) * 100}%` }}
          >
            <span
              className="text-[9px] font-semibold leading-none text-center"
              style={{ color: b.color, opacity: b.label === active.label ? 1 : 0.4 }}
            >
              {b.label}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-center mt-2" style={{ color: active.color }}>{active.desc}</p>
    </Card>
  )
}

// ── CTL gauge ─────────────────────────────────────────────────────────────────

const CTL_BANDS = [
  { label: 'Starting',    from:  0, to: 15, color: '#71717A', desc: 'Building the habit' },
  { label: 'Building',    from: 15, to: 30, color: '#7DD3FC', desc: 'Consistent base forming' },
  { label: 'Trained',     from: 30, to: 50, color: '#34D399', desc: 'Solid aerobic base' },
  { label: 'Well-trained',from: 50, to: 70, color: '#F59E0B', desc: 'Strong fitness level' },
  { label: 'Advanced',    from: 70, to: 100, color: '#A78BFA', desc: 'High training capacity' },
]
const CTL_MAX = 100

function CTLGauge({ ctl }: { ctl: number }) {
  const active = CTL_BANDS.find(b => ctl < b.to) ?? CTL_BANDS[CTL_BANDS.length - 1]
  const markerPct = (Math.min(Math.max(ctl, 0), CTL_MAX) / CTL_MAX) * 100

  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
        CTL · Fitness
      </p>
      <p className="text-[10px] text-text-muted mb-3">42-day rolling load — your current aerobic base</p>
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-3xl font-bold tabular-nums" style={{ color: active.color }}>
          {Math.round(ctl)}
        </span>
        <span className="text-sm font-semibold" style={{ color: active.color }}>{active.label}</span>
      </div>
      <div className="relative h-2 rounded-full overflow-hidden flex mb-1">
        {CTL_BANDS.map(b => (
          <div
            key={b.label}
            style={{
              width: `${((b.to - b.from) / CTL_MAX) * 100}%`,
              background: b.color,
              opacity: b.label === active.label ? 0.6 : 0.2,
            }}
          />
        ))}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white rounded-full shadow"
          style={{ left: `${markerPct}%`, transform: 'translateX(-50%)' }}
        />
      </div>
      <div className="flex">
        {CTL_BANDS.map(b => (
          <div
            key={b.label}
            className="flex justify-center"
            style={{ width: `${((b.to - b.from) / CTL_MAX) * 100}%` }}
          >
            <span
              className="text-[9px] font-semibold leading-none text-center"
              style={{ color: b.color, opacity: b.label === active.label ? 1 : 0.4 }}
            >
              {b.label}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-center mt-2" style={{ color: active.color }}>{active.desc}</p>
    </Card>
  )
}

// ── ACWR gauge ────────────────────────────────────────────────────────────────

const SCALE_MAX = 2.0
const ACWR_BANDS = [
  { from: 0.0, to: 0.5, label: 'Undertrained', desc: 'Way below baseline — detraining',         color: '#71717A' },
  { from: 0.5, to: 0.8, label: 'Easy week',    desc: 'Recovery or taper territory',              color: '#7DD3FC' },
  { from: 0.8, to: 1.3, label: 'Optimal',      desc: 'Training at your sweet spot',              color: '#34D399' },
  { from: 1.3, to: 1.5, label: 'Caution',      desc: 'Pushing above baseline — monitor closely', color: '#F59E0B' },
  { from: 1.5, to: 2.0, label: 'Danger',       desc: 'Load spike — injury risk elevated',        color: '#F87171' },
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
  const active = ACWR_BANDS.find(b => acwr < b.to) ?? ACWR_BANDS[ACWR_BANDS.length - 1]
  const markerPct = (Math.min(Math.max(acwr, 0), SCALE_MAX) / SCALE_MAX) * 100

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <span className="text-3xl font-bold tabular-nums text-text-primary">
          {acwr.toFixed(2)}
        </span>
        <Badge label={label} color={badgeColor} />
      </div>

      {/* Proportional track */}
      <div className="relative h-2 rounded-full overflow-hidden flex">
        {ACWR_BANDS.map(b => (
          <div
            key={b.label}
            style={{
              width: `${((b.to - b.from) / SCALE_MAX) * 100}%`,
              background: b.color,
              opacity: b.label === active.label ? 0.6 : 0.2,
            }}
            className="h-full"
          />
        ))}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white rounded-full shadow"
          style={{ left: `${markerPct}%`, transform: 'translateX(-50%)' }}
        />
      </div>

      {/* Band name labels */}
      <div className="flex mt-1">
        {ACWR_BANDS.map(b => (
          <div
            key={b.label}
            className="flex justify-center"
            style={{ width: `${((b.to - b.from) / SCALE_MAX) * 100}%` }}
          >
            <span
              className="text-[9px] font-semibold leading-none text-center"
              style={{ color: b.color, opacity: b.label === active.label ? 1 : 0.4 }}
            >
              {b.label}
            </span>
          </div>
        ))}
      </div>

      {/* Active band description */}
      <p className="text-xs text-center" style={{ color: active.color }}>
        {active.desc}
      </p>
    </div>
  )
}

// ── Run type distribution ─────────────────────────────────────────────────────

const TRIMP_BANDS = [
  { label: 'Minimal',   from: 0,   to: 30,       color: '#52525B' },
  { label: 'Recovery',  from: 30,  to: 60,       color: '#34D399' },
  { label: 'Easy',      from: 60,  to: 150,      color: '#7DD3FC' },
  { label: 'Moderate',  from: 150, to: 260,      color: '#F59E0B' },
  { label: 'Hard',      from: 260, to: 420,      color: '#F97316' },
  { label: 'Very Hard', from: 420, to: 620,      color: '#EF4444' },
  { label: 'Extreme',   from: 620, to: Infinity, color: '#7C3AED' },
]

function getTRIMPBand(trimp: number) {
  return TRIMP_BANDS.find(b => trimp < b.to) ?? TRIMP_BANDS[TRIMP_BANDS.length - 1]
}

type RunTypePeriod = '7d' | '14d' | '1m' | '3m' | '6m'

const PERIODS: { value: RunTypePeriod; label: string; days: number }[] = [
  { value: '7d',  label: '7d',  days: 7   },
  { value: '14d', label: '14d', days: 14  },
  { value: '1m',  label: '1m',  days: 30  },
  { value: '3m',  label: '3m',  days: 90  },
  { value: '6m',  label: '6m',  days: 180 },
]

function RunTypeDistribution({ activities }: { activities: Activity[] }) {
  const [period, setPeriod] = useState<RunTypePeriod>('7d')
  const days = PERIODS.find(p => p.value === period)!.days

  const counts = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    const recent = activities.filter(a => a.trimp != null && new Date(a.startDate) >= cutoff)
    const map = new Map<string, number>()
    for (const a of recent) {
      const band = getTRIMPBand(a.trimp!)
      map.set(band.label, (map.get(band.label) ?? 0) + 1)
    }
    return [...TRIMP_BANDS]
      .reverse()
      .map(b => ({ ...b, count: map.get(b.label) ?? 0 }))
      .filter(b => b.count > 0)
  }, [activities, days])

  const total = counts.reduce((s, b) => s + b.count, 0)

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Run Types
        </p>
        <div className="flex rounded-md overflow-hidden border border-muted/30">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-2 py-0.5 text-xs font-medium transition-colors ${
                period === p.value ? 'bg-accent text-bg' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {total === 0 ? (
        <p className="text-xs text-text-muted text-center py-2">No runs in the last {days} days</p>
      ) : (
        <div className="space-y-2.5">
          {counts.map(b => (
            <div key={b.label} className="flex items-center gap-2">
              <span className="text-xs font-medium w-16 shrink-0" style={{ color: b.color }}>
                {b.label}
              </span>
              <div className="flex-1 h-2 bg-muted/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${(b.count / total) * 100}%`, background: b.color, opacity: 0.7 }}
                />
              </div>
              <span className="text-xs tabular-nums text-text-secondary w-12 text-right shrink-0">
                {b.count} {b.count === 1 ? 'run' : 'runs'}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// ── TRIMP table ───────────────────────────────────────────────────────────────

type SortKey = 'startDate' | 'trimp' | 'distanceMeters'
type SortDir = 'asc' | 'desc'

function TRIMPTable({ activities }: { activities: Activity[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('startDate')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const navigate = useNavigate()

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
            <th className="pb-2 text-xs font-semibold text-text-secondary text-left">Type</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(a => (
            <tr key={a.id} onClick={() => navigate(`/runs/${a.id}`)} className="border-b border-muted/10 hover:bg-surface/50 transition-colors cursor-pointer">
              <td className="py-2 pr-4 tabular-nums text-text-secondary text-xs whitespace-nowrap">
                {formatDate(a.startDate)}
              </td>
              <td className="py-2 pr-4 tabular-nums text-text-primary text-xs whitespace-nowrap">
                {formatDistance(a.distanceMeters)}
              </td>
              <td className="py-2 pr-4 tabular-nums text-accent font-medium text-xs">
                {formatTRIMP(a.trimp!)}
              </td>
              <td className="py-2 text-xs font-medium" style={{ color: getTRIMPBand(a.trimp!).color }}>
                {getTRIMPBand(a.trimp!).label}
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
  const metrics = useLiveMetrics()
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
        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Acute:Chronic Workload Ratio
        </p>
        <p className="text-[10px] text-text-muted mb-4">ATL ÷ CTL — are you training harder than your base can handle?</p>
        {metrics ? (
          <ACWRGauge acwr={metrics.acwr} />
        ) : (
          <div className="h-24 animate-pulse bg-muted/10 rounded-lg" />
        )}
      </Card>

      {/* CTL */}
      {metrics && <CTLGauge ctl={metrics.ctl} />}

      {/* ATL */}
      {metrics && <ATLGauge atl={metrics.atl} />}

      {/* Monotony + Strain */}
      {metrics && (
        <div className="grid grid-cols-2 gap-3">
          <Card className="flex flex-col items-center text-center gap-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Monotony
            </p>
            {(() => {
              const m = metrics.monotony
              const cfg = m > 2
                ? { color: '#F87171', label: 'Dangerous', desc: 'Same load every day — vary training' }
                : m > 1.5
                ? { color: '#F59E0B', label: 'Moderate',  desc: 'Some repetition — mix in easy days' }
                : { color: '#34D399', label: 'Varied',    desc: 'Good training mix' }
              return (
                <>
                  <p className="text-3xl font-bold tabular-nums leading-none" style={{ color: cfg.color }}>
                    {m.toFixed(2)}
                  </p>
                  <p className="text-xs font-medium" style={{ color: cfg.color }}>{cfg.label}</p>
                  <p className="text-[10px] text-text-muted leading-tight">{cfg.desc}</p>
                </>
              )
            })()}
          </Card>
          <Card className="flex flex-col items-center text-center gap-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Strain
            </p>
            {(() => {
              const s = metrics.strain
              const cfg = s > 1000
                ? { color: '#F87171', label: 'Very High', desc: 'Heavy load with high repetition' }
                : s > 500
                ? { color: '#F59E0B', label: 'High',      desc: 'Significant accumulated stress' }
                : s > 200
                ? { color: '#7DD3FC', label: 'Moderate',  desc: 'Manageable weekly stress' }
                : { color: '#34D399', label: 'Low',       desc: 'Light load or high variety' }
              return (
                <>
                  <p className="text-3xl font-bold tabular-nums leading-none" style={{ color: cfg.color }}>
                    {Math.round(s)}
                  </p>
                  <p className="text-xs font-medium" style={{ color: cfg.color }}>{cfg.label}</p>
                  <p className="text-[10px] text-text-muted leading-tight">{cfg.desc}</p>
                </>
              )
            })()}
          </Card>
        </div>
      )}

      {/* Run type distribution */}
      <RunTypeDistribution activities={activities} />

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
