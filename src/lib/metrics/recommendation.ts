import type { ReadinessBand, RecommendationMode } from '@/types'
import { calcZoneBounds } from './zones'
import { readinessBand } from './readiness'

export interface Recommendation {
  workoutType: 'Rest' | 'Easy' | 'Moderate' | 'Hard'
  label: string
  durationMin: number
  hrCeiling: number | null
  zones: string
  rationale: string
}

interface RecipeEntry {
  workoutType: Recommendation['workoutType']
  label: string
  durationMin: number
  zones: string
  rationale: string
  hrZoneKey: 'Z1' | 'Z2' | 'Z3' | null
}

const RECIPES: Record<ReadinessBand, Record<RecommendationMode, RecipeEntry>> = {
  cooked: {
    conservative: { workoutType: 'Rest', label: 'Full rest', durationMin: 0, zones: '—', hrZoneKey: null, rationale: 'Your body needs recovery. Rest today.' },
    balanced:     { workoutType: 'Rest', label: 'Full rest', durationMin: 0, zones: '—', hrZoneKey: null, rationale: 'Too fatigued to train productively. Rest today.' },
    progressive:  { workoutType: 'Easy', label: 'Z1 recovery walk/jog', durationMin: 30, zones: 'Z1', hrZoneKey: 'Z1', rationale: 'Very light movement only — do not accumulate more stress.' },
  },
  fatigued: {
    conservative: { workoutType: 'Easy', label: 'Z1 recovery run', durationMin: 30, zones: 'Z1', hrZoneKey: 'Z1', rationale: 'High fatigue. Keep it very easy or rest.' },
    balanced:     { workoutType: 'Easy', label: 'Z1–Z2 easy run', durationMin: 45, zones: 'Z1–Z2', hrZoneKey: 'Z2', rationale: 'Moderate fatigue. Stay aerobic and keep it short.' },
    progressive:  { workoutType: 'Easy', label: 'Z2 aerobic run', durationMin: 60, zones: 'Z2', hrZoneKey: 'Z2', rationale: 'You can train today — stay strictly aerobic.' },
  },
  trainable: {
    conservative: { workoutType: 'Easy', label: 'Z2 aerobic run', durationMin: 60, zones: 'Z2', hrZoneKey: 'Z2', rationale: 'Good shape for base building. Keep HR in Z2.' },
    balanced:     { workoutType: 'Easy', label: 'Z2 aerobic run', durationMin: 60, zones: 'Z2', hrZoneKey: 'Z2', rationale: 'Solid training window. Build aerobic base.' },
    progressive:  { workoutType: 'Moderate', label: 'Z2–Z3 aerobic run', durationMin: 75, zones: 'Z2–Z3', hrZoneKey: 'Z3', rationale: 'Ready for a longer quality session.' },
  },
  fresh: {
    conservative: { workoutType: 'Easy', label: 'Z2 aerobic run', durationMin: 45, zones: 'Z2', hrZoneKey: 'Z2', rationale: 'Well rested. Good time for a quality Z2 session.' },
    balanced:     { workoutType: 'Easy', label: 'Z2 long run', durationMin: 75, zones: 'Z2', hrZoneKey: 'Z2', rationale: 'Fresh legs — capitalize with a longer aerobic effort.' },
    progressive:  { workoutType: 'Easy', label: 'Z2 long run', durationMin: 90, zones: 'Z2', hrZoneKey: 'Z2', rationale: 'Peak readiness for a long aerobic run.' },
  },
  peaked: {
    conservative: { workoutType: 'Easy', label: 'Z1–Z2 easy run', durationMin: 30, zones: 'Z1–Z2', hrZoneKey: 'Z2', rationale: 'Very high form — taper or keep it easy to preserve fitness.' },
    balanced:     { workoutType: 'Easy', label: 'Z2 aerobic run', durationMin: 60, zones: 'Z2', hrZoneKey: 'Z2', rationale: 'Peak form. Maintain with a steady aerobic session.' },
    progressive:  { workoutType: 'Moderate', label: 'Z2–Z3 quality run', durationMin: 90, zones: 'Z2–Z3', hrZoneKey: 'Z3', rationale: 'Excellent form — use it for your longest quality session.' },
  },
}

export function buildRecommendation(
  readiness: number,
  mode: RecommendationMode,
  maxHR: number,
  restHR: number,
): Recommendation {
  const band = readinessBand(readiness)
  const recipe = RECIPES[band][mode]
  const bounds = calcZoneBounds(maxHR, restHR)
  const hrCeiling = recipe.hrZoneKey ? bounds[recipe.hrZoneKey][1] : null

  return {
    workoutType: recipe.workoutType,
    label: recipe.label,
    durationMin: recipe.durationMin,
    hrCeiling,
    zones: recipe.zones,
    rationale: recipe.rationale,
  }
}
