import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useActivity } from '@/hooks/useActivities'
import { useActivityStreams } from '@/hooks/useActivityStreams'
import { useSettings } from '@/hooks/useSettings'
import { calcDecoupling } from '@/lib/metrics/decoupling'
import { calcZoneDistribution, calcZoneBounds } from '@/lib/metrics/zones'
import { formatPace, formatDistance, formatDuration, formatRelativeDate } from '@/lib/utils/format'
import { updateActivity } from '@/lib/db/activities'
import { backfillMetrics } from '@/lib/metrics/backfill'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { TRIMPBar } from '@/components/ui/TRIMPBar'
import RouteMap from '@/components/charts/RouteMap'
import { ArrowLeft, Heart, Timer, TrendingUp, Mountain } from 'lucide-react'

// ── Zone bar ──────────────────────────────────────────────────────────────────

const ZONE_COLORS = {
  Z1: '#34D399',
  Z2: '#7DD3FC',
  Z3: '#F59E0B',
  Z4: '#F97316',
  Z5: '#EF4444',
}


function ZoneBar({ dist, maxHR, restHR }: { dist: Record<string, number>; maxHR: number; restHR: number }) {
  const zones = ['Z5', 'Z4', 'Z3', 'Z2', 'Z1'] as const
  const bounds = calcZoneBounds(maxHR, restHR)
  return (
    <div className="space-y-2">
      {zones.map(z => {
        const pct = Math.round((dist[z] ?? 0) * 100)
        const [lo, hi] = bounds[z]
        return (
          <div key={z} className="flex items-center gap-2">
            <span className="text-xs font-medium text-text-secondary w-6 shrink-0">{z}</span>
            <div className="flex-1 relative h-4">
              <div className="absolute inset-0 bg-muted/20 rounded-sm" />
              {pct > 0 && (
                <div
                  className="absolute inset-y-0 left-0 rounded-sm transition-all"
                  style={{ width: `${pct}%`, background: ZONE_COLORS[z] }}
                />
              )}
              <span
                className="absolute inset-y-0 flex items-center text-[10px] tabular-nums font-medium pl-1 whitespace-nowrap"
                style={{ left: `${pct}%`, color: pct > 0 ? ZONE_COLORS[z] : '#71717A' }}
              >
                {pct}%
              </span>
            </div>
            <span className="text-xs tabular-nums text-text-muted w-24 shrink-0 text-right">
              {lo}–{hi} bpm
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── HR chart ──────────────────────────────────────────────────────────────────

// Downsample stream to ~120 points for chart perf
function downsample<T>(arr: T[], target = 120): T[] {
  if (arr.length <= target) return arr
  const step = arr.length / target
  return Array.from({ length: target }, (_, i) => arr[Math.round(i * step)])
}

interface HRTooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: number
}

function HRTooltip({ active, payload, label }: HRTooltipProps) {
  if (!active || !payload?.length) return null
  const mins = Math.floor((label ?? 0) / 60)
  const secs = ((label ?? 0) % 60).toString().padStart(2, '0')
  return (
    <div className="bg-surface border border-muted/30 rounded-lg px-3 py-2 text-xs">
      <p className="text-text-secondary">{mins}:{secs}</p>
      <p className="text-accent font-medium tabular-nums">{Math.round(payload[0].value)} bpm</p>
    </div>
  )
}

function HRChart({ hrStream, timeStream }: { hrStream: number[]; timeStream: number[] }) {
  const data = downsample(
    hrStream.map((hr, i) => ({ t: timeStream[i] ?? i, hr })),
  )
  return (
    <ResponsiveContainer width="100%" height={140}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
        <defs>
          <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#7DD3FC" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#7DD3FC" stopOpacity={0}   />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(82,82,91,0.2)" />
        <XAxis dataKey="t" hide />
        <YAxis tick={{ fill: '#A1A1AA', fontSize: 10 }} domain={['auto', 'auto']} />
        <Tooltip content={<HRTooltip />} />
        <Area
          type="monotone" dataKey="hr"
          stroke="#7DD3FC" strokeWidth={1.5}
          fill="url(#hrGrad)" dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ── Main route ────────────────────────────────────────────────────────────────

export default function RunDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const activity = useActivity(id ?? '')
  const settings = useSettings()
  const { streams, state: streamsState } = useActivityStreams(id ?? '', activity?.stravaId)
  const [rpe, setRpe] = useState<number | null>(null)
  const [rpeSaving, setRpeSaving] = useState(false)
  const [rpeSaved, setRpeSaved] = useState(false)

  if (!activity) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-text-secondary">Run not found.</p>
      </div>
    )
  }

  const hrStream = streams.heartrate ?? []
  const timeStream = streams.time ?? []
  const paceStream = (streams.velocity_smooth ?? []).map(v =>
    v > 0.5 ? 1000 / v : 0,
  )
  const hasStreams = hrStream.length > 0

  const maxHR = settings?.maxHR ?? 192
  const restHR = settings?.restHR ?? 53
  const zoneDist = hasStreams ? calcZoneDistribution(hrStream, maxHR, restHR) : null
  const decoupling = hasStreams && paceStream.length > 0
    ? calcDecoupling(hrStream, paceStream)
    : null

  return (
    <div className="pb-8">
      {/* Back nav */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 px-4 pt-4 pb-2 text-text-secondary hover:text-text-primary transition-colors"
        aria-label="Go back"
      >
        <ArrowLeft size={18} />
        <span className="text-sm">Runs</span>
      </button>

      <div className="px-4 space-y-4">
        {/* Title */}
        <div>
          <h1 className="text-xl font-bold text-text-primary leading-tight">{activity.name}</h1>
          <p className="text-text-secondary text-sm mt-0.5">
            {formatRelativeDate(activity.startDate)} ·{' '}
            {new Date(activity.startDate).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
        </div>

        {/* Route map */}
        {streams.latlng && streams.latlng.length > 1 && (
          <Card>
            <RouteMap latlng={streams.latlng} />
          </Card>
        )}

        {/* Stats grid */}
        <Card className="grid grid-cols-3 gap-y-4 text-center">
          <Stat label="Distance" value={formatDistance(activity.distanceMeters)} icon={<TrendingUp size={14} />} />
          <Stat
            label="Pace"
            value={activity.avgPaceSecPerKm ? `${formatPace(activity.avgPaceSecPerKm)} /km` : '—'}
            icon={<Timer size={14} />}
          />
          <Stat label="Duration" value={formatDuration(activity.durationSeconds)} icon={<Timer size={14} />} />
          {activity.avgHeartRate && (
            <Stat label="Avg HR" value={`${Math.round(activity.avgHeartRate)} bpm`} icon={<Heart size={14} />} />
          )}
          {activity.maxHeartRate && (
            <Stat label="Max HR" value={`${Math.round(activity.maxHeartRate)} bpm`} icon={<Heart size={14} />} />
          )}
          {activity.elevationGainMeters > 0 && (
            <Stat label="Elevation" value={`${Math.round(activity.elevationGainMeters)} m`} icon={<Mountain size={14} />} />
          )}
        </Card>

        {/* TRIMP bar */}
        {activity.trimp !== undefined && (
          <Card>
            <TRIMPBar trimp={activity.trimp} />
          </Card>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {activity.type !== 'Run' && (
            <Badge label={activity.type} color="muted" />
          )}
          {activity.trimpSource === 'rpe' && (
            <Badge label={`RPE ${activity.rpe}`} color="muted" />
          )}
        </div>

        {/* Streams section */}
        {streamsState === 'loading' && (
          <Card className="flex items-center justify-center h-20">
            <p className="text-text-secondary text-sm">Loading HR data…</p>
          </Card>
        )}

        {streamsState === 'error' && (
          <Card>
            <p className="text-text-secondary text-sm">Could not load stream data.</p>
          </Card>
        )}

        {hasStreams && (
          <>
            {/* HR chart */}
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">
                Heart Rate
              </p>
              <HRChart hrStream={hrStream} timeStream={timeStream} />
            </Card>

            {/* Zone distribution */}
            {zoneDist && (
              <Card>
                <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">
                  HR Zone Distribution
                </p>
                <ZoneBar dist={zoneDist} maxHR={maxHR} restHR={restHR} />
              </Card>
            )}

            {/* Decoupling */}
            {decoupling !== null && (
              <Card className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Aerobic Decoupling
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    {Math.abs(decoupling) < 5
                      ? 'Well coupled — good aerobic efficiency'
                      : 'HR drifted — consider slowing down'}
                  </p>
                </div>
                <span className={`text-2xl font-bold tabular-nums ${
                  Math.abs(decoupling) < 5 ? 'text-success' : Math.abs(decoupling) < 10 ? 'text-warning' : 'text-danger'
                }`}>
                  {decoupling > 0 ? '+' : ''}{decoupling.toFixed(1)}%
                </span>
              </Card>
            )}
          </>
        )}

        {/* RPE input */}
        <RPECard
          currentRpe={activity.rpe}
          pendingRpe={rpe}
          saving={rpeSaving}
          saved={rpeSaved}
          hasHR={!!activity.avgHeartRate}
          onRpeChange={setRpe}
          onSave={async () => {
            const value = rpe ?? activity.rpe
            if (!value) return
            setRpeSaving(true)
            const updated = {
              ...activity,
              rpe: value,
              trimpSource: activity.avgHeartRate ? activity.trimpSource : 'rpe' as const,
            }
            await updateActivity(updated)
            if (!activity.avgHeartRate) await backfillMetrics()
            setRpeSaving(false)
            setRpeSaved(true)
            setTimeout(() => setRpeSaved(false), 2000)
          }}
        />
      </div>
    </div>
  )
}

const RPE_LABELS: Record<number, string> = {
  1: 'Very easy', 2: 'Easy', 3: 'Moderate', 4: 'Somewhat hard',
  5: 'Hard', 6: 'Hard+', 7: 'Very hard', 8: 'Very hard+',
  9: 'Very very hard', 10: 'Max effort',
}

function RPECard({
  currentRpe, pendingRpe, saving, saved, hasHR, onRpeChange, onSave,
}: {
  currentRpe?: number
  pendingRpe: number | null
  saving: boolean
  saved: boolean
  hasHR: boolean
  onRpeChange: (v: number) => void
  onSave: () => void
}) {
  const display = pendingRpe ?? currentRpe
  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">
        Rate this run (RPE)
      </p>
      <div className="flex gap-1.5 flex-wrap mb-3">
        {[1,2,3,4,5,6,7,8,9,10].map(n => (
          <button
            key={n}
            onClick={() => onRpeChange(n)}
            aria-pressed={display === n}
            className={`w-9 h-9 rounded-md text-sm font-bold tabular-nums transition-colors ${
              display === n
                ? 'bg-accent text-bg'
                : 'bg-bg border border-muted/40 text-text-secondary hover:border-accent/50'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      {display && (
        <p className="text-xs text-text-muted mb-3">{display} — {RPE_LABELS[display]}</p>
      )}
      {!hasHR && (
        <p className="text-xs text-warning mb-2">
          No HR data — RPE will be used to estimate TRIMP
        </p>
      )}
      <button
        onClick={onSave}
        disabled={saving || (!pendingRpe && !currentRpe)}
        className="px-4 py-1.5 rounded-md text-sm font-medium bg-surface border border-muted/40 text-text-primary hover:border-accent/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save RPE'}
      </button>
    </Card>
  )
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <p className="text-xl font-bold tabular-nums text-text-primary leading-tight">{value}</p>
      <p className="text-xs text-text-secondary flex items-center gap-1">
        {icon}
        {label}
      </p>
    </div>
  )
}
