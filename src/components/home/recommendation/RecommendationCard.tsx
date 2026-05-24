import type { Workout } from '@/types/workout'
import type { Activity } from '@/types'
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

const MATCHED_CONGRATS: Partial<Record<Workout['type'], string>> = {
  recovery:    'Easy run done — your legs will thank you.',
  easy:        'Good aerobic work — exactly what today called for.',
  long:        'Long run in the bank. Endurance is building.',
  strides:     'Strides done — fast legs without the cost.',
  tempo:       'Tempo nailed. Speed is coming.',
  threshold:   'Quality session done. Well executed.',
  vo2max:      'Hard session complete. Recovery time now.',
  hills:       'Hill work done. Strength is building.',
  progression: 'Progression run done — great pacing discipline.',
}

type MatchResult =
  | { matched: true }
  | { matched: false; reason: 'rest_day' | 'hr_over' | 'hr_under' | 'too_short' }

function matchRun(workout: Workout, run: Activity): MatchResult {
  if (workout.type === 'rest') return { matched: false, reason: 'rest_day' }

  const actualMin = run.durationSeconds / 60
  const tooShort  = workout.totalDurationMin > 0 && actualMin < workout.totalDurationMin * 0.5

  // Structured workouts (tempo / threshold / progression / strides)
  if (workout.segments && workout.segments.length > 0) {
    const qualitySeg = workout.segments.find(s => s.hrRange != null)
    if (qualitySeg?.hrRange && run.avgHeartRate) {
      const floor = qualitySeg.hrRange[0]
      // Allow 5 bpm below floor: avg HR across whole run is naturally pulled down by wu/cd
      if (run.avgHeartRate < floor - 5) {
        return { matched: false, reason: 'hr_under' }
      }
    }
    return tooShort ? { matched: false, reason: 'too_short' } : { matched: true }
  }

  // Simple workouts (easy / long / recovery)
  if (workout.hrCeiling && run.avgHeartRate && run.avgHeartRate > workout.hrCeiling + 5) {
    return { matched: false, reason: 'hr_over' }
  }
  return tooShort ? { matched: false, reason: 'too_short' } : { matched: true }
}

function TodayRunStatus({ workout, run }: { workout: Workout; run: Activity }) {
  const result = matchRun(workout, run)
  const km      = (run.distanceMeters / 1000).toFixed(1)
  const min     = Math.round(run.durationSeconds / 60)
  const hrStr   = run.avgHeartRate ? ` · ${Math.round(run.avgHeartRate)} bpm avg` : ''
  const summary = `${km} km · ${min} min${hrStr}`

  let message: string
  let statusColor: string
  if (result.matched) {
    message     = MATCHED_CONGRATS[workout.type] ?? 'Great work — run matched today\'s plan.'
    statusColor = 'text-success'
  } else if (result.reason === 'rest_day') {
    message     = 'Today was a rest day — if it felt fine, no worries. Watch how you recover tomorrow.'
    statusColor = 'text-warning'
  } else if (result.reason === 'hr_over') {
    message     = `You averaged ${Math.round(run.avgHeartRate!)} bpm — above the ${workout.hrCeiling} bpm ceiling. You worked harder than planned.`
    statusColor = 'text-warning'
  } else if (result.reason === 'hr_under') {
    const qualitySeg = workout.segments?.find(s => s.hrRange != null)
    const floor = qualitySeg?.hrRange?.[0]
    message = floor && run.avgHeartRate
      ? `You averaged ${Math.round(run.avgHeartRate)} bpm — didn't reach the ${floor} bpm quality zone. Counts as an easy aerobic run.`
      : "You stayed aerobic — the quality portion wasn't reached. Counts as an easy run today."
    statusColor = 'text-warning'
  } else {
    const planned = workout.totalDurationMin
    message     = `You ran ${min} min — less than the ${planned} min plan. Counts as active recovery.`
    statusColor = 'text-text-secondary'
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className={`text-sm font-semibold ${statusColor}`}>
        {result.matched ? 'Run matched' : 'You ran today'}
      </p>
      <p className="text-xs text-text-muted">{summary}</p>
      <p className="text-xs text-text-secondary leading-snug">{message}</p>
    </div>
  )
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
  todayActivity?: Activity
}

export default function RecommendationCard({ workout, when = 'Today', todayActivity }: Props) {
  const showTodayRun = when === 'Today' && todayActivity != null
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
      {showTodayRun
        ? <TodayRunStatus workout={workout} run={todayActivity} />
        : <WorkoutBody workout={workout} />
      }
    </Card>
  )
}
