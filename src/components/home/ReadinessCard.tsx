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

const BAND_ORDER: ReadinessBand[] = ['cooked', 'fatigued', 'trainable', 'fresh', 'peaked']

// Shows upcoming band milestones above the current band (e.g. if fatigued: trainable → fresh → peaked).
function BandMilestones({ segments, currentBand }: {
  segments: PeakProjection['segments']
  currentBand: ReadinessBand
}) {
  const targets = BAND_ORDER.slice(BAND_ORDER.indexOf(currentBand) + 1)
  if (targets.length === 0) return null

  const milestones: { band: ReadinessBand; hoursUntil: number; hours: number; openEnded: boolean }[] = []
  let cumHours = 0
  for (const seg of segments) {
    if ((targets as string[]).includes(seg.band)) {
      milestones.push({ band: seg.band as ReadinessBand, hoursUntil: cumHours, hours: seg.hours, openEnded: seg.openEnded })
    }
    cumHours += seg.hours
  }

  if (milestones.length === 0) return null

  return (
    <div className="flex flex-col items-center gap-1">
      {milestones.map(({ band, hoursUntil, hours, openEnded }) => {
        const { color, label } = BAND_CONFIG[band]
        const dur = openEnded ? '14d+' : formatHoursDuration(hours)
        return (
          <p key={band} className="text-xs text-text-muted">
            {hoursUntil === 0
              ? <><span style={{ color }} className="font-medium">{label}</span>{' '}for {dur}</>
              : <><span style={{ color }} className="font-medium">{label}</span>{' '}in {formatHoursDuration(hoursUntil)} · lasts {dur}</>
            }
          </p>
        )
      })}
    </div>
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

      {peak && <BandMilestones segments={peak.segments} currentBand={band} />}

      {updatedAt && (
        <p className="text-[10px] text-text-muted">updated {updatedAt}</p>
      )}
    </Card>
  )
}
