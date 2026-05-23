import type { Activity, ReadinessBand, RecommendationMode } from '@/types'
import type { Workout, WorkoutType } from '@/types/workout'
import { calcZoneBounds } from './zones'
import { calcReadiness, readinessBand } from './readiness'
import { predictPaceForWorkout } from './pacePrediction'
import { estimateDistance } from './pacePrediction/distance'

interface RecipeBase {
  type: WorkoutType
  label: string
  totalDurationMin: number
  rationale: string
  hrZoneKey: 'Z1' | 'Z2' | 'Z3' | null
  feelDescription?: string
  pacingTip?: string
  fuelingReminder?: boolean
  decouplingTarget?: number
  activeRecoveryOptions?: string[]
  avoid?: string[]
}

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
      type: 'recovery', label: 'Z1 recovery walk/jog', totalDurationMin: 30, hrZoneKey: 'Z1',
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
      feelDescription: 'Conversational. Slow down if you can\'t chat.',
    },
    progressive: {
      type: 'easy', label: 'Z2 aerobic run', totalDurationMin: 60, hrZoneKey: 'Z2',
      rationale: 'You can train today — stay strictly aerobic.',
      feelDescription: 'Comfortable. Full sentences all the way.',
    },
  },
  trainable: {
    conservative: {
      type: 'easy', label: 'Z2 aerobic run', totalDurationMin: 60, hrZoneKey: 'Z2',
      rationale: 'Good shape for base building. Keep HR in Z2.',
      feelDescription: 'Comfortable effort. Focus on duration, not pace.',
    },
    balanced: {
      type: 'easy', label: 'Z2 aerobic run', totalDurationMin: 60, hrZoneKey: 'Z2',
      rationale: 'Solid training window. Build aerobic base.',
      feelDescription: 'Comfortable effort.',
    },
    progressive: {
      type: 'long', label: 'Z2 aerobic run', totalDurationMin: 75, hrZoneKey: 'Z2',
      rationale: 'Ready for a longer aerobic effort. Extend the session.',
      pacingTip: 'Start at the slow end. HR drift should stay flat.',
    },
  },
  fresh: {
    conservative: {
      type: 'easy', label: 'Z2 aerobic run', totalDurationMin: 45, hrZoneKey: 'Z2',
      rationale: 'Well rested. Good time for a quality Z2 session.',
      feelDescription: 'Easy and controlled.',
    },
    balanced: {
      type: 'long', label: 'Z2 long run', totalDurationMin: 75, hrZoneKey: 'Z2',
      rationale: 'Fresh legs — capitalize with a longer aerobic effort.',
      fuelingReminder: true,
      decouplingTarget: 5,
      pacingTip: 'Start at the slow end. HR drift should stay flat. Fuel from min 60.',
    },
    progressive: {
      type: 'long', label: 'Z2 long run', totalDurationMin: 90, hrZoneKey: 'Z2',
      rationale: 'Peak readiness for a long aerobic run.',
      fuelingReminder: true,
      decouplingTarget: 5,
      pacingTip: 'Start easy. Fuel early. Target <5% decoupling.',
    },
  },
  peaked: {
    conservative: {
      type: 'recovery', label: 'Z1–Z2 easy run', totalDurationMin: 30, hrZoneKey: 'Z1',
      rationale: 'Very high form — taper or keep it easy to preserve fitness.',
      feelDescription: 'Easy legs. Save the form for a race or big effort.',
    },
    balanced: {
      type: 'easy', label: 'Z2 aerobic run', totalDurationMin: 60, hrZoneKey: 'Z2',
      rationale: 'Peak form. Maintain with a steady aerobic session.',
      feelDescription: 'Comfortable. Enjoy the legs.',
    },
    progressive: {
      type: 'long', label: 'Z2 long run', totalDurationMin: 90, hrZoneKey: 'Z2',
      rationale: 'Excellent form — use it for your longest quality session.',
      fuelingReminder: true,
      decouplingTarget: 5,
    },
  },
}

// Below this readiness score, rest is mandatory regardless of training mode.
// Cooked band top is 30; 35 adds a small buffer into the fatigued zone.
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

function buildFromRecipe(
  recipe: RecipeBase,
  options: BuildOptions,
): Workout {
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

  const profile = { type: recipe.type, hrCeiling }
  const pace = predictPaceForWorkout(profile, activities, { maxHR, restHR }, today)
  // D-040: easy runs show distance only, no pace number in the card
  const isEasyType = recipe.type === 'easy' || recipe.type === 'recovery'
  const distance = estimateDistance(recipe.totalDurationMin, pace, isEasyType)

  return {
    type: recipe.type,
    rationale: recipe.rationale,
    totalDurationMin: recipe.totalDurationMin,
    durationMin: recipe.totalDurationMin,
    hrCeiling,
    pace: isEasyType ? undefined : pace,         // D-040: hide pace for easy/recovery
    distance: distance ?? undefined,
    feelDescription: recipe.feelDescription,
    pacingTip: recipe.pacingTip,
    fuelingReminder: recipe.fuelingReminder,
    decouplingTarget: recipe.decouplingTarget,
  }
}

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

// Project tomorrow's readiness assuming zero load today (pure rest).
export function buildTomorrowRecommendation(
  currentMetrics: { ctl: number; atl: number; tsb: number; monotony: number; acwr: number },
  mode: RecommendationMode,
  maxHR: number,
  restHR: number,
  activities?: Activity[],
  today?: Date,
): Workout {
  // EWMA decay with 0 load
  const ctl = currentMetrics.ctl * (1 - 1 / 42)
  const atl = currentMetrics.atl * (1 - 1 / 7)
  const tsb = ctl - atl
  const acwr = ctl > 0 ? atl / ctl : 1.0
  const tomorrowReadiness = calcReadiness({ tsb, acwr, monotony: currentMetrics.monotony })
  if (tomorrowReadiness < REST_FLOOR) return FORCED_REST
  const band = readinessBand(tomorrowReadiness)
  const recipe = RECIPES[band][mode]
  return buildFromRecipe(recipe, { activities, maxHR, restHR, today })
}
