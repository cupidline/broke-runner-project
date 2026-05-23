import type { Workout } from '@/types/workout'
import DurationDisplay from '../shared/DurationDisplay'
import HRTarget from '../shared/HRTarget'
import PaceDisplay from '../shared/PaceDisplay'
import DistanceDisplay from '../shared/DistanceDisplay'
import PaceConfidence from '../shared/PaceConfidence'
import FeelDescription from '../shared/FeelDescription'

export default function RecoveryCard({ workout }: { workout: Workout }) {
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
        {workout.pace && (
          <PaceDisplay pace={workout.pace} label="Target Pace" />
        )}
        {workout.distance && (
          <DistanceDisplay distance={workout.distance} label="Distance Est." />
        )}
      </div>

      {workout.pace && <PaceConfidence pace={workout.pace} />}
      <p className="text-xs text-text-muted italic">or walk if needed</p>

      {workout.feelDescription && <FeelDescription text={workout.feelDescription} />}
    </div>
  )
}
