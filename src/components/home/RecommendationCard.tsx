import Card from '@/components/ui/Card'
import { Timer, Heart, Zap } from 'lucide-react'
import type { Recommendation } from '@/lib/metrics/recommendation'

interface Props {
  recommendation: Recommendation
}

const TYPE_COLOR: Record<Recommendation['workoutType'], string> = {
  Rest:     'text-text-secondary',
  Easy:     'text-success',
  Moderate: 'text-accent',
  Hard:     'text-warning',
}

export default function RecommendationCard({ recommendation: rec }: Props) {
  const { workoutType, label, durationMin, hrCeiling, zones, rationale } = rec
  const labelColor = TYPE_COLOR[workoutType]

  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary mb-2">
        Today's Workout
      </p>

      <p className={`text-xl font-bold ${labelColor}`}>{label}</p>

      {workoutType !== 'Rest' && (
        <div className="flex items-center gap-4 mt-3">
          {durationMin > 0 && (
            <span className="flex items-center gap-1.5 text-sm text-text-primary tabular-nums">
              <Timer size={14} className="text-text-secondary" />
              {durationMin} min
            </span>
          )}
          {hrCeiling && (
            <span className="flex items-center gap-1.5 text-sm text-text-primary tabular-nums">
              <Heart size={14} className="text-text-secondary" />
              ≤ {hrCeiling} bpm
            </span>
          )}
          {zones !== '—' && (
            <span className="flex items-center gap-1.5 text-sm text-text-primary">
              <Zap size={14} className="text-text-secondary" />
              {zones}
            </span>
          )}
        </div>
      )}

      <p className="text-sm text-text-secondary mt-3 leading-relaxed">
        {rationale}
      </p>
    </Card>
  )
}
