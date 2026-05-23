import type { Workout } from '@/types/workout'
import DurationDisplay from '../shared/DurationDisplay'
import HRTarget from '../shared/HRTarget'
import DistanceDisplay from '../shared/DistanceDisplay'
import FeelDescription from '../shared/FeelDescription'

// D-040: Easy runs show distance only — no pace number
export default function EasyWorkoutCard({ workout }: { workout: Workout }) {
  return (
    <div className="space-y-2.5">
      <p className="text-xs text-text-secondary">{workout.rationale}</p>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-text-muted mb-0.5">Duration</p>
          <DurationDisplay minutes={workout.durationMin ?? workout.totalDurationMin} />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-text-muted mb-0.5">Heart Rate</p>
          <HRTarget ceiling={workout.hrCeiling} />
        </div>
        {workout.distance && (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-text-muted mb-0.5">Distance Est.</p>
            <DistanceDisplay distance={workout.distance} label="" />
          </div>
        )}
      </div>

      {workout.feelDescription && <FeelDescription text={workout.feelDescription} />}
    </div>
  )
}
