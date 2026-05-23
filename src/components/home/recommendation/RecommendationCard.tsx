import type { Workout } from '@/types/workout'
import Card from '@/components/ui/Card'
import EasyWorkoutCard from './workouts/EasyWorkoutCard'
import LongRunCard from './workouts/LongRunCard'
import RecoveryCard from './workouts/RecoveryCard'
import TempoCard from './workouts/TempoCard'
import IntervalsCard from './workouts/IntervalsCard'
import ProgressionCard from './workouts/ProgressionCard'
import StridesCard from './workouts/StridesCard'
import RestCard from './workouts/RestCard'

const TYPE_LABEL: Record<Workout['type'], string> = {
  easy:        'Easy Aerobic',
  long:        'Long Run',
  recovery:    'Recovery',
  strides:     'Easy + Strides',
  tempo:       'Tempo Run',
  threshold:   'Threshold Intervals',
  vo2max:      'VO₂max Intervals',
  hills:       'Hill Repeats',
  progression: 'Progression Run',
  rest:        'Rest',
}

const TYPE_COLOR: Record<Workout['type'], string> = {
  rest:        'text-text-secondary',
  recovery:    'text-success',
  easy:        'text-success',
  long:        'text-accent',
  strides:     'text-accent',
  tempo:       'text-warning',
  threshold:   'text-warning',
  vo2max:      'text-danger',
  hills:       'text-warning',
  progression: 'text-accent',
}

function WorkoutBody({ workout }: { workout: Workout }) {
  switch (workout.type) {
    case 'rest':        return <RestCard workout={workout} />
    case 'recovery':    return <RecoveryCard workout={workout} />
    case 'easy':        return <EasyWorkoutCard workout={workout} />
    case 'long':        return <LongRunCard workout={workout} />
    case 'strides':     return <StridesCard workout={workout} />
    case 'tempo':       return <TempoCard workout={workout} />
    case 'threshold':
    case 'vo2max':
    case 'hills':       return <IntervalsCard workout={workout} />
    case 'progression': return <ProgressionCard workout={workout} />
  }
}

interface Props {
  workout: Workout
  when?: 'Today' | 'Tomorrow'
}

export default function RecommendationCard({ workout, when = 'Today' }: Props) {
  return (
    <Card>
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
          {when}'s Workout
        </p>
        <span className={`text-xs font-medium ${TYPE_COLOR[workout.type]}`}>
          {TYPE_LABEL[workout.type]}
        </span>
      </div>
      <WorkoutBody workout={workout} />
    </Card>
  )
}
