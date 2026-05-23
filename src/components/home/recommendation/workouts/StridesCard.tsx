import type { Workout } from '@/types/workout'
import DurationDisplay from '../shared/DurationDisplay'
import HRTarget from '../shared/HRTarget'
import DistanceDisplay from '../shared/DistanceDisplay'

// Easy run + strides add-on. Strides are effort-based (no pace)
export default function StridesCard({ workout }: { workout: Workout }) {
  const main = workout.segments?.[0]
  const strides = workout.segments?.[1]

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-secondary">{workout.rationale}</p>

      {main ? (
        <>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-text-secondary mb-1.5">Main</p>
            <div className="flex flex-wrap gap-3">
              <DurationDisplay minutes={main.durationMin} />
              <HRTarget ceiling={main.hrCeiling} />
            </div>
            {main.distance && <DistanceDisplay distance={main.distance} label="Dist. est." />}
          </div>

          {strides && (
            <div className="pt-2 border-t border-muted/20">
              <p className="text-[10px] uppercase tracking-wider text-text-secondary mb-1.5">
                Strides (last {strides.durationMin} min)
              </p>
              <p className="text-sm text-text-secondary">6 × 20 sec — Effort: 90% (not sprint)</p>
              <p className="text-xs text-text-muted">Pace: by effort · Recovery: 90 sec walk</p>
              {strides.notes && <p className="text-xs text-text-muted mt-0.5">{strides.notes}</p>}
            </div>
          )}
        </>
      ) : (
        <div>
          <DurationDisplay minutes={workout.totalDurationMin} />
          <HRTarget ceiling={workout.hrCeiling} />
        </div>
      )}
    </div>
  )
}
