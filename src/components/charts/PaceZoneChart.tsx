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

    const paceSorted = [...allRuns.map(a => a.avgPaceSecPerKm!)].sort((a, b) => a - b)
    const [p20, p40, p60, p80] = [20, 40, 60, 80].map(p => pctOf(paceSorted, p))
    const boundaries = [paceSorted[0], p20, p40, p60, p80, Infinity]

    const periodRuns = allRuns.filter(a => new Date(a.startDate) >= fromDate)
    const zoneCounts = [0, 0, 0, 0, 0]
    for (const a of periodRuns) {
      const pace = a.avgPaceSecPerKm!
      const idx = boundaries.findIndex((_, i) => pace >= boundaries[i] && pace < boundaries[i + 1])
      if (idx >= 0 && idx < 5) zoneCounts[idx]++
    }
    const total = zoneCounts.reduce((s, n) => s + n, 0)

    return PACE_ZONES.map((z, i) => ({
      ...z,
      from: boundaries[i],
      to: boundaries[i + 1] === Infinity ? paceSorted[paceSorted.length - 1] : boundaries[i + 1],
      count: zoneCounts[i],
      pct: total > 0 ? (zoneCounts[i] / total) * 100 : 0,
    }))
  }, [activities, fromDate])

  if (!zones) return null

  return (
    <div className="space-y-2">
      {zones.map(z => (
        <div key={z.zone} className="flex items-center gap-2">
          <span className="text-xs font-medium text-text-secondary w-6 shrink-0">Z{z.zone}</span>
          <div className="flex-1 relative h-4">
            <div className="absolute inset-0 bg-muted/20 rounded-sm" />
            {z.count > 0 && (
              <div
                className="absolute inset-y-0 left-0 rounded-sm"
                style={{ width: `${z.pct}%`, background: z.color }}
              />
            )}
            <span
              className="absolute inset-y-0 flex items-center text-[10px] tabular-nums font-medium pl-1 whitespace-nowrap"
              style={{ left: `${z.pct}%`, color: z.count > 0 ? z.color : '#71717A' }}
            >
              {z.count} {z.count === 1 ? 'run' : 'runs'}
            </span>
          </div>
          <span className="text-xs tabular-nums text-text-muted w-28 shrink-0 text-right">
            {formatPace(z.from)}–{formatPace(z.to)} /km
          </span>
        </div>
      ))}
    </div>
  )
}
