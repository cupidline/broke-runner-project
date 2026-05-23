import type { WorkoutSegment } from '@/types/workout'
import PaceDisplay from './PaceDisplay'
import DistanceDisplay from './DistanceDisplay'
import HRTarget from './HRTarget'

export default function SegmentBlock({ segment }: { segment: WorkoutSegment }) {
  const { label, durationMin, hrCeiling, hrRange, pace, distance, effort, feelDescription, notes } = segment

  return (
    <div className="space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
        {label}
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span className="text-sm text-text-primary tabular-nums">{durationMin} min</span>
        <HRTarget ceiling={hrCeiling} range={hrRange} />
      </div>
      {pace && <PaceDisplay pace={pace} label="PACE" />}
      {distance && <DistanceDisplay distance={distance} label="DIST" />}
      {effort != null && (
        <p className="text-xs text-text-secondary">Effort: RPE {effort}</p>
      )}
      {feelDescription && (
        <p className="text-xs text-text-muted italic">{feelDescription}</p>
      )}
      {notes && (
        <p className="text-xs text-text-secondary">{notes}</p>
      )}
    </div>
  )
}
