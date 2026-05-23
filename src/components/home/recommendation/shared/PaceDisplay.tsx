import type { PacePrediction } from '@/types/workout'
import { formatPace } from '@/lib/utils/format'

interface Props {
  pace: PacePrediction | undefined
  label?: string
}

export default function PaceDisplay({ pace, label = 'PACE' }: Props) {
  if (!pace || pace.source === 'no_data') {
    return (
      <div>
        <p className="text-[10px] uppercase tracking-wider text-text-muted">{label}</p>
        <p className="text-sm text-text-secondary">by effort</p>
      </div>
    )
  }

  const min = pace.minSecPerKm != null ? formatPace(pace.minSecPerKm) : null
  const max = pace.maxSecPerKm != null ? formatPace(pace.maxSecPerKm) : null
  const display = min && max ? `${min} – ${max}` : min ?? max ?? '—'

  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-text-muted">{label}</p>
      <p className="text-sm tabular-nums text-text-primary font-medium">
        {display}
        <span className="text-text-muted font-normal"> /km</span>
      </p>
      {pace.source === 'limited_data' && (
        <p className="text-[10px] text-warning mt-0.5">limited data</p>
      )}
    </div>
  )
}
