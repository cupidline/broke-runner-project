import type { Activity, ReadinessBand, RecommendationMode } from '@/types'
import type { Workout, WorkoutType, WorkoutSegment } from '@/types/workout'

export type { Workout as Recommendation }
import { calcZoneBounds } from './zones'
import type { ZoneBounds } from './zones'
import { calcReadiness, readinessBand } from './readiness'
import { predictPaceForWorkout } from './pacePrediction'
import { estimateDistance } from './pacePrediction/distance'
import type { WorkoutProfile } from './pacePrediction/matching'

// ── Segment spec ─────────────────────────────────────────────────────────────

interface SegmentSpec {
  label: string
  durationMin: number
  hrZoneKey: keyof ZoneBounds | null
  workoutType?: WorkoutType   // if set, pace prediction is attempted
  effort?: number
  feelDescription?: string
  notes?: string
}

// ── Recipe ────────────────────────────────────────────────────────────────────

interface RecipeBase {
  type: WorkoutType
  label: string
  totalDurationMin: number
  rationale: string
  hrZoneKey: keyof ZoneBounds | null
  feelDescription?: string
  pacingTip?: string
  fuelingReminder?: boolean
  decouplingTarget?: number
  activeRecoveryOptions?: string[]
  avoid?: string[]
  segmentSpecs?: SegmentSpec[]
}

// ── Recipes ───────────────────────────────────────────────────────────────────

const RECIPES: Record<ReadinessBand, Record<RecommendationMode, RecipeBase>> = {
  cooked: {
    conservative: {
      type: 'rest', label: 'Full rest', totalDurationMin: 0, hrZoneKey: null,
      rationale: 'Your body needs recovery. Rest today.',
      activeRecoveryOptions: ['20-30 min easy walk', 'Mobility / stretching', 'Light strength (optional)'],
      avoid: ['Running', 'Hard cardio'],
    },
    balanced: {
      type: 'rest', label: 'Full rest', totalDurationMin: 0, hrZoneKey: null,
      rationale: 'Too fatigued to train productively. Rest today.',
      activeRecoveryOptions: ['20-30 min easy walk', 'Mobility / stretching'],
      avoid: ['Running', 'Hard cardio'],
    },
    progressive: {
      type: 'recovery', label: 'Z1 recovery walk/jog', totalDurationMin: 20, hrZoneKey: 'Z1',
      rationale: 'Very light movement only — do not accumulate more stress.',
      feelDescription: 'You should be able to carry a full conversation.',
    },
  },
  fatigued: {
    conservative: {
      type: 'recovery', label: 'Z1 recovery run', totalDurationMin: 30, hrZoneKey: 'Z1',
      rationale: 'High fatigue. Keep it very easy or rest.',
      feelDescription: 'Barely above a walk. The point is blood flow.',
    },
    balanced: {
      type: 'easy', label: 'Z1–Z2 easy run', totalDurationMin: 45, hrZoneKey: 'Z2',
      rationale: 'Moderate fatigue. Stay aerobic and keep it short.',
      feelDescription: "Conversational. Slow down if you can't chat.",
    },
    progressive: {
      type: 'easy', label: 'Z2 aerobic run', totalDurationMin: 60, hrZoneKey: 'Z2',
      rationale: 'You can train today — stay strictly aerobic.',
      feelDescription: 'Comfortable. Full sentences all the way.',
    },
  },
  trainable: {
    conservative: {
      type: 'easy', label: 'Z2 aerobic run', totalDurationMin: 45, hrZoneKey: 'Z2',
      rationale: 'Good shape for base building. Keep HR in Z2.',
      feelDescription: 'Comfortable effort. Focus on duration, not pace.',
    },
    balanced: {
      type: 'easy', label: 'Z2 aerobic run', totalDurationMin: 60, hrZoneKey: 'Z2',
      rationale: 'Solid training window. Build aerobic base.',
      feelDescription: 'Comfortable effort.',
    },
    progressive: {
      type: 'progression',
      label: 'Progression run',
      totalDurationMin: 55,
      hrZoneKey: 'Z3',
      rationale: 'Solid base. Add a gentle build to start stimulating faster running.',
      segmentSpecs: [
        {
          label: 'Easy', durationMin: 25, hrZoneKey: 'Z2', workoutType: 'easy',
        },
        {
          label: 'Build', durationMin: 20, hrZoneKey: 'Z3', workoutType: 'tempo',
          feelDescription: 'Comfortably hard — not race pace.',
        },
        {
          label: 'Cool-down', durationMin: 10, hrZoneKey: 'Z2', workoutType: 'easy',
        },
      ],
    },
  },
  fresh: {
    conservative: {
      type: 'easy', label: 'Z2 aerobic run', totalDurationMin: 45, hrZoneKey: 'Z2',
      rationale: 'Well rested. Good time for a quality Z2 session.',
      feelDescription: 'Easy and controlled.',
    },
    balanced: {
      type: 'strides',
      label: 'Easy + Strides',
      totalDurationMin: 50,
      hrZoneKey: 'Z2',
      rationale: 'Fresh legs — easy aerobic base with strides to sharpen the neuromuscular system.',
      segmentSpecs: [
        {
          label: 'Easy run', durationMin: 40, hrZoneKey: 'Z2', workoutType: 'easy',
        },
        {
          label: 'Strides', durationMin: 10, hrZoneKey: null, effort: 9,
          notes: '6 × 20 sec at 90% effort · 90 sec walk recovery between each',
        },
      ],
    },
    progressive: {
      type: 'tempo',
      label: 'Tempo run',
      totalDurationMin: 45,
      hrZoneKey: 'Z3',
      rationale: 'Fresh and ready. A tempo session will push your lactate threshold higher.',
      segmentSpecs: [
        {
          label: 'Warm-up', durationMin: 10, hrZoneKey: 'Z2', workoutType: 'easy',
        },
        {
          label: 'Tempo', durationMin: 25, hrZoneKey: 'Z3', workoutType: 'tempo',
          feelDescription: "Comfortably hard — a few words but not a full conversation.",
        },
        {
          label: 'Cool-down', durationMin: 10, hrZoneKey: 'Z2', workoutType: 'easy',
          notes: 'Optional: add 4–6 strides in the last 5 min.',
        },
      ],
    },
  },
  peaked: {
    conservative: {
      type: 'recovery', label: 'Z1 easy run', totalDurationMin: 30, hrZoneKey: 'Z1',
      rationale: "Peak form — preserve it. Easy movement only. Save the legs for when it counts.",
      feelDescription: "Easy legs. Enjoy the form, don't spend it.",
    },
    balanced: {
      type: 'progression',
      label: 'Progression run',
      totalDurationMin: 65,
      hrZoneKey: 'Z3',
      rationale: 'Peak form. A progression run maintains fitness without deep fatigue.',
      segmentSpecs: [
        {
          label: 'Easy', durationMin: 30, hrZoneKey: 'Z2', workoutType: 'easy',
        },
        {
          label: 'Build', durationMin: 25, hrZoneKey: 'Z3', workoutType: 'tempo',
          feelDescription: 'Each km a touch faster. Stay in control.',
        },
        {
          label: 'Cool-down', durationMin: 10, hrZoneKey: 'Z2', workoutType: 'easy',
        },
      ],
    },
    progressive: {
      type: 'threshold',
      label: 'Threshold intervals',
      totalDurationMin: 60,
      hrZoneKey: 'Z4',
      rationale: 'Peak form and fresh — ideal conditions for threshold work. Push the ceiling.',
      segmentSpecs: [
        {
          label: 'Warm-up', durationMin: 10, hrZoneKey: 'Z2', workoutType: 'easy',
        },
        {
          label: '4 × 8 min', durationMin: 38, hrZoneKey: 'Z4', workoutType: 'threshold',
          notes: '4 × 8 min hard · 90 sec easy jog recovery between sets',
          feelDescription: "Hard but controlled — can't speak in full sentences.",
        },
        {
          label: 'Cool-down', durationMin: 12, hrZoneKey: 'Z2', workoutType: 'easy',
        },
      ],
    },
  },
}

// ── Build helpers ─────────────────────────────────────────────────────────────

const REST_FLOOR = 35

const FORCED_REST: Workout = {
  type: 'rest',
  totalDurationMin: 0,
  rationale: 'Readiness is too low to train safely. Rest is the workout today.',
  activeRecoveryOptions: ['20–30 min easy walk', 'Mobility / stretching', 'Sleep / nap'],
  avoid: ['Running', 'Hard cardio', 'Heavy lifting'],
}

interface BuildOptions {
  activities?: Activity[]
  maxHR: number
  restHR: number
  today?: Date
}

function segmentProfile(
  workoutType: WorkoutType,
  hrZoneKey: keyof ZoneBounds,
  bounds: ZoneBounds,
): WorkoutProfile {
  switch (workoutType) {
    case 'tempo':
    case 'threshold':
      return { type: workoutType, hrRange: bounds[hrZoneKey] }
    default:
      return { type: workoutType, hrCeiling: bounds[hrZoneKey][1] }
  }
}

function buildStructuredWorkout(recipe: RecipeBase, options: BuildOptions): Workout {
  const { activities = [], maxHR, restHR, today } = options
  const bounds = calcZoneBounds(maxHR, restHR)

  const segments: WorkoutSegment[] = recipe.segmentSpecs!.map(spec => {
    const seg: WorkoutSegment = { label: spec.label, durationMin: spec.durationMin }

    if (spec.effort != null)    seg.effort = spec.effort
    if (spec.feelDescription)   seg.feelDescription = spec.feelDescription
    if (spec.notes)             seg.notes = spec.notes

    if (spec.hrZoneKey) {
      const zone = bounds[spec.hrZoneKey]
      const isQuality = spec.hrZoneKey === 'Z3' || spec.hrZoneKey === 'Z4' || spec.hrZoneKey === 'Z5'
      if (isQuality) {
        seg.hrRange = zone
      } else {
        seg.hrCeiling = zone[1]
      }
    }

    if (spec.workoutType && spec.hrZoneKey) {
      const profile = segmentProfile(spec.workoutType, spec.hrZoneKey, bounds)
      const pace = predictPaceForWorkout(profile, activities, { maxHR, restHR }, today)
      const isEasy = spec.workoutType === 'easy' || spec.workoutType === 'recovery'
      if (!isEasy) seg.pace = pace
      const dist = estimateDistance(spec.durationMin, pace, isEasy)
      if (dist) seg.distance = dist
    }

    return seg
  })

  return {
    type: recipe.type,
    rationale: recipe.rationale,
    totalDurationMin: recipe.totalDurationMin,
    segments,
  }
}

function buildFromRecipe(recipe: RecipeBase, options: BuildOptions): Workout {
  if (recipe.segmentSpecs) return buildStructuredWorkout(recipe, options)

  const { activities = [], maxHR, restHR, today } = options
  const bounds = calcZoneBounds(maxHR, restHR)
  const hrCeiling = recipe.hrZoneKey ? bounds[recipe.hrZoneKey][1] : undefined

  if (recipe.type === 'rest') {
    return {
      type: 'rest',
      rationale: recipe.rationale,
      totalDurationMin: 0,
      activeRecoveryOptions: recipe.activeRecoveryOptions,
      avoid: recipe.avoid,
    }
  }

  const profile: WorkoutProfile = { type: recipe.type, hrCeiling }
  const pace = predictPaceForWorkout(profile, activities, { maxHR, restHR }, today)
  const isEasyType = recipe.type === 'easy' || recipe.type === 'recovery'
  const distance = estimateDistance(recipe.totalDurationMin, pace, isEasyType)

  return {
    type: recipe.type,
    rationale: recipe.rationale,
    totalDurationMin: recipe.totalDurationMin,
    durationMin: recipe.totalDurationMin,
    hrCeiling,
    pace: isEasyType ? undefined : pace,
    distance: distance ?? undefined,
    feelDescription: recipe.feelDescription,
    pacingTip: recipe.pacingTip,
    fuelingReminder: recipe.fuelingReminder,
    decouplingTarget: recipe.decouplingTarget,
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export function buildRecommendation(
  readiness: number,
  mode: RecommendationMode,
  maxHR: number,
  restHR: number,
  activities?: Activity[],
  today?: Date,
): Workout {
  if (readiness < REST_FLOOR) return FORCED_REST
  const band = readinessBand(readiness)
  const recipe = RECIPES[band][mode]
  return buildFromRecipe(recipe, { activities, maxHR, restHR, today })
}

// Projects tomorrow's readiness assuming zero load today (pure rest).
export function buildTomorrowRecommendation(
  currentMetrics: { ctl: number; atl: number; tsb: number; monotony: number; acwr: number },
  mode: RecommendationMode,
  maxHR: number,
  restHR: number,
  activities?: Activity[],
  today?: Date,
): Workout {
  const ctl = currentMetrics.ctl * (1 - 1 / 42)
  const atl = currentMetrics.atl * (1 - 1 / 7)
  const tsb = ctl - atl
  const acwr = ctl > 0 ? atl / ctl : 1.0
  const tomorrowReadiness = calcReadiness({ tsb, acwr, monotony: currentMetrics.monotony, ctl })
  if (tomorrowReadiness < REST_FLOOR) return FORCED_REST
  const band = readinessBand(tomorrowReadiness)
  const recipe = RECIPES[band][mode]
  return buildFromRecipe(recipe, { activities, maxHR, restHR, today })
}
