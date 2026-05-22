import Card from '@/components/ui/Card'
import ProgressRing from '@/components/ui/ProgressRing'
import Badge from '@/components/ui/Badge'
import { readinessBand } from '@/lib/metrics/readiness'
import type { ReadinessBand } from '@/types'

interface Props {
  readiness: number
  tsb: number
}

const BAND_CONFIG: Record<ReadinessBand, { color: string; badgeColor: 'accent' | 'success' | 'warning' | 'danger'; label: string }> = {
  peaked:    { color: '#7DD3FC', badgeColor: 'accent',   label: 'Peaked'    },
  fresh:     { color: '#34D399', badgeColor: 'success',  label: 'Fresh'     },
  trainable: { color: '#7DD3FC', badgeColor: 'accent',   label: 'Trainable' },
  fatigued:  { color: '#FBBF24', badgeColor: 'warning',  label: 'Fatigued'  },
  cooked:    { color: '#F87171', badgeColor: 'danger',   label: 'Cooked'    },
}

export default function ReadinessCard({ readiness, tsb }: Props) {
  const band = readinessBand(readiness)
  const { color, badgeColor, label } = BAND_CONFIG[band]

  return (
    <Card className="flex flex-col items-center gap-3 py-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
        Training Readiness
      </p>
      <ProgressRing score={readiness} size={148} strokeWidth={10} color={color}>
        <span className="text-5xl font-bold tabular-nums leading-none" style={{ color }}>
          {readiness}
        </span>
        <span className="text-xs text-text-secondary mt-1">/ 100</span>
      </ProgressRing>
      <div className="flex items-center gap-3">
        <Badge label={label} color={badgeColor} />
        <span className="text-text-secondary text-sm tabular-nums">
          Form {tsb >= 0 ? '+' : ''}{Math.round(tsb)}
        </span>
      </div>
    </Card>
  )
}
