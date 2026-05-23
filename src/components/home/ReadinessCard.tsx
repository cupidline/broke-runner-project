import Card from '@/components/ui/Card'
import ProgressRing from '@/components/ui/ProgressRing'
import Badge from '@/components/ui/Badge'
import { TSBBar } from '@/components/ui/TSBBar'
import { readinessBand, formatHoursDuration } from '@/lib/metrics/readiness'
import type { PeakProjection } from '@/lib/metrics/readiness'
import type { ReadinessBand } from '@/types'

interface Props {
  readiness: number
  tsb: number
  peak?: PeakProjection
  asOf?: number
}

const BAND_CONFIG: Record<ReadinessBand, {
  color: string
  badgeColor: 'accent' | 'success' | 'warning' | 'danger'
  label: string
}> = {
  peaked:    { color: '#7DD3FC', badgeColor: 'accent',   label: 'Peaked'    },
  fresh:     { color: '#34D399', badgeColor: 'success',  label: 'Fresh'     },
  trainable: { color: '#7DD3FC', badgeColor: 'accent',   label: 'Trainable' },
  fatigued:  { color: '#FBBF24', badgeColor: 'warning',  label: 'Fatigued'  },
  cooked:    { color: '#F87171', badgeColor: 'danger',   label: 'Cooked'    },
}

// Shows only the peaked window: when it starts and how long it lasts.
// Returns null if no peaked band is projected in the 14-day window.
function PeakWindow({ segments }: { segments: PeakProjection['segments'] }) {
  let hoursUntil = 0
  const peakedSeg = segments.find((seg, i) => {
    if (seg.band === 'peaked') return true
    if (i < segments.length - 1) hoursUntil += seg.hours
    return false
  })

  if (!peakedSeg) return null

  const { color } = BAND_CONFIG['peaked']
  const dur = peakedSeg.openEnded ? '14d+' : formatHoursDuration(peakedSeg.hours)

  if (hoursUntil === 0) {
    // Currently peaked
    return (
      <p className="text-xs text-text-muted">
        <span style={{ color }} className="font-medium">Peaked</span>
        {' '}for {dur}
      </p>
    )
  }

  return (
    <p className="text-xs text-text-muted">
      <span style={{ color }} className="font-medium">Peaks</span>
      {' '}in {formatHoursDuration(hoursUntil)} · lasts {dur}
    </p>
  )
}

export default function ReadinessCard({ readiness, tsb, peak, asOf }: Props) {
  const band = readinessBand(readiness)
  const { color, badgeColor, label } = BAND_CONFIG[band]

  const updatedAt = asOf
    ? new Date(asOf).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <Card className="flex flex-col items-center gap-3 py-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
        Training Readiness
      </p>

      <ProgressRing score={readiness} size={148} strokeWidth={10} color={color}>
        <span className="text-5xl font-bold tabular-nums leading-none" style={{ color }}>
          {Math.round(readiness)}
        </span>
        <span className="text-xs text-text-secondary mt-1">/ 100</span>
      </ProgressRing>

      <Badge label={label} color={badgeColor} />

      <div className="w-full px-1">
        <TSBBar tsb={tsb} />
      </div>

      {peak && <PeakWindow segments={peak.segments} />}

      {updatedAt && (
        <p className="text-[10px] text-text-muted">updated {updatedAt}</p>
      )}
    </Card>
  )
}
