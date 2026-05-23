import type { Workout } from '@/types/workout'
import SegmentBlock from '../shared/SegmentBlock'

export default function ProgressionCard({ workout }: { workout: Workout }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-text-secondary">{workout.rationale}</p>

      {workout.segments && workout.segments.length > 0 ? (
        <div className="space-y-3 divide-y divide-muted/20">
          {workout.segments.map((seg, i) => (
            <div key={i} className={i > 0 ? 'pt-3' : ''}>
              <SegmentBlock segment={seg} />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-secondary">{workout.totalDurationMin} min progression run</p>
      )}

      {workout.totalDistanceEstKm && (
        <p className="text-xs text-text-muted pt-1 border-t border-muted/10">
          Total:{' '}
          {workout.totalDistanceEstKm.range
            ? `~${workout.totalDistanceEstKm.range[0].toFixed(1)} km`
            : `~${workout.totalDistanceEstKm.single?.toFixed(1)} km`}
        </p>
      )}

      <p className="text-xs text-text-muted italic">Don't race the start.</p>
    </div>
  )
}
