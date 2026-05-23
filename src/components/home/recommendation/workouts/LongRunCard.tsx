import type { Workout } from '@/types/workout'
import DurationDisplay from '../shared/DurationDisplay'
import HRTarget from '../shared/HRTarget'
import PaceDisplay from '../shared/PaceDisplay'
import DistanceDisplay from '../shared/DistanceDisplay'
import PaceConfidence from '../shared/PaceConfidence'

export default function LongRunCard({ workout }: { workout: Workout }) {
  const fuelMin = 60

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
        <PaceDisplay pace={workout.pace} label="Target Pace" />
        <DistanceDisplay distance={workout.distance} label="Distance Est." />
      </div>

      {workout.pace && <PaceConfidence pace={workout.pace} />}

      {workout.decouplingTarget != null && (
        <p className="text-xs text-text-secondary">
          Goal: &lt;{workout.decouplingTarget}% aerobic decoupling
        </p>
      )}

      {workout.fuelingReminder && (workout.durationMin ?? 0) > fuelMin && (
        <p className="text-xs text-warning">Fuel from minute {fuelMin} onwards.</p>
      )}

      {workout.pacingTip && (
        <div className="mt-2 pt-2 border-t border-muted/20">
          <p className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Pacing tip</p>
          <p className="text-sm text-text-secondary leading-relaxed">{workout.pacingTip}</p>
        </div>
      )}
    </div>
  )
}
