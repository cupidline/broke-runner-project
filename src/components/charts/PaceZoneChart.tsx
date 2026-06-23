import { useMemo } from 'react'
import type { Activity } from '@/types'
import { RUNNING_TYPES } from '@/types'
import { formatPace } from '@/lib/utils/format'

const PACE_ZONES = [
  { zone: 5, label: 'Race',      color: '#EF4444' },
  { zone: 4, label: 'Threshold', color: '#F97316' },
  { zone: 3, label: 'Tempo',     color: '#F59E0B' },
  { zone: 2, label: 'Easy',      color: '#7DD3FC' },
  { zone: 1, label: 'Recovery',  color: '#34D399' },
]

function pctOf(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const i = (p / 100) * (sorted.length - 1)
  const lo = Math.floor(i), hi = Math.ceil(i)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo)
}

function fmt(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.round((seconds % 3600) / 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

interface Props {
  activities: Activity[]
  fromDate: Date
}

export default function PaceZoneChart({ activities, fromDate }: Props) {
  const zones = useMemo(() => {
    const allRuns = activities.filter(
      a => RUNNING_TYPES.has(a.type) && a.avgPaceSecPerKm && a.durationSeconds >= 900,
    )
    if (allRuns.length < 5) return null

    // Calibrate zone boundaries from all-time runs (stable across period changes)
    const paceSorted = [...allRuns.map(a => a.avgPaceSecPerKm!)].sort((a, b) => a - b)
    const [p20, p40, p60, p80] = [20, 40, 60, 80].map(p => pctOf(paceSorted, p))
    const boundaries = [paceSorted[0], p20, p40, p60, p80, Infinity]

    // Accumulate duration per zone for the selected period (same proxy as ZoneTimeChart for HR)
    const periodRuns = allRuns.filter(a => new Date(a.startDate) >= fromDate)
    const zoneSecs = [0, 0, 0, 0, 0]
    for (const a of periodRuns) {
      const pace = a.avgPaceSecPerKm!
      const idx = boundaries.findIndex((_, i) => pace >= boundaries[i] && pace < boundaries[i + 1])
      if (idx >= 0 && idx < 5) zoneSecs[idx] += a.durationSeconds
    }
    const totalSecs = zoneSecs.reduce((s, n) => s + n, 0)

    return PACE_ZONES.map((z, i) => ({
      ...z,
      from: boundaries[i],
      to: boundaries[i + 1] === Infinity ? paceSorted[paceSorted.length - 1] : boundaries[i + 1],
      secs: zoneSecs[i],
      pct: totalSecs > 0 ? (zoneSecs[i] / totalSecs) * 100 : 0,
    }))
  }, [activities, fromDate])

  if (!zones) return null

  const hasData = zones.some(z => z.secs > 0)

  if (!hasData) return (
    <p className="text-text-muted text-sm text-center py-4">No run data in this period</p>
  )

  return (
    <div className="space-y-2">
      {zones.map(z => (
        <div key={z.zone} className="flex items-center gap-2">
          <span className="text-xs font-medium text-text-secondary w-6 shrink-0">Z{z.zone}</span>
          <div className="flex-1 relative h-4">
            <div className="absolute inset-0 bg-muted/20 rounded-sm" />
            {z.secs > 0 && (
              <div
                className="absolute inset-y-0 left-0 rounded-sm"
                style={{ width: `${z.pct}%`, background: z.color }}
              />
            )}
            <span
              className="absolute inset-y-0 flex items-center text-[10px] tabular-nums font-medium pl-1 whitespace-nowrap"
              style={{ left: `${z.pct}%`, color: z.secs > 0 ? z.color : '#71717A' }}
            >
              {fmt(z.secs)}
            </span>
          </div>
          <span className="text-xs tabular-nums text-text-muted w-28 shrink-0 text-right">
            {formatPace(z.from)}–{formatPace(z.to)} /km
          </span>
        </div>
      ))}
      <p className="text-[10px] text-text-muted pt-1">Based on avg pace per run · proxy (no lap data)</p>
    </div>
  )
}
