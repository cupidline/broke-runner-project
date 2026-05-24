import { hrToZone, calcZoneBounds } from '@/lib/metrics/zones'
import type { Activity } from '@/types'

interface Props {
  activities: Activity[]
  fromDate: Date
  maxHR: number
  restHR: number
}

const ZONE_COLORS = {
  Z1: '#34D399',
  Z2: '#7DD3FC',
  Z3: '#F59E0B',
  Z4: '#F97316',
  Z5: '#EF4444',
}

const ZONE_LABELS = {
  Z1: 'Recovery',
  Z2: 'Aerobic',
  Z3: 'Tempo',
  Z4: 'Threshold',
  Z5: 'VO₂max',
}

function fmt(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.round((seconds % 3600) / 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export default function ZoneTimeChart({ activities, fromDate, maxHR, restHR }: Props) {
  const zones = ['Z5', 'Z4', 'Z3', 'Z2', 'Z1'] as const
  const bounds = calcZoneBounds(maxHR, restHR)

  // Accumulate duration per zone using avgHR as proxy
  const totals: Record<string, number> = { Z1: 0, Z2: 0, Z3: 0, Z4: 0, Z5: 0 }
  for (const a of activities) {
    if (new Date(a.startDate) < fromDate) continue
    if (!a.avgHeartRate) continue
    const zone = hrToZone(a.avgHeartRate, maxHR, restHR)
    totals[zone] += a.durationSeconds
  }

  const maxSeconds = Math.max(...Object.values(totals), 1)
  const hasData = Object.values(totals).some(v => v > 0)

  if (!hasData) return (
    <p className="text-text-muted text-sm text-center py-4">
      No HR data in this period
    </p>
  )

  return (
    <div className="space-y-2">
      {zones.map(z => {
        const secs = totals[z]
        const pct = (secs / maxSeconds) * 100
        const [lo, hi] = bounds[z]
        return (
          <div key={z} className="flex items-center gap-2">
            <span className="text-xs font-medium text-text-secondary w-6 shrink-0">{z}</span>
            <div className="flex-1 h-4 bg-muted/20 rounded-sm overflow-hidden">
              <div
                className="h-full rounded-sm transition-all"
                style={{ width: `${pct}%`, background: ZONE_COLORS[z] }}
              />
            </div>
            <span className="text-xs tabular-nums text-text-muted w-14 text-right shrink-0">
              {secs > 0 ? fmt(secs) : '—'}
            </span>
            <span className="text-xs tabular-nums text-text-muted w-24 shrink-0 text-right hidden sm:block">
              {lo}–{hi} bpm
            </span>
          </div>
        )
      })}
      <p className="text-[10px] text-text-muted pt-1">Based on avg HR per run · {ZONE_LABELS.Z1}–{ZONE_LABELS.Z5}</p>
    </div>
  )
}
