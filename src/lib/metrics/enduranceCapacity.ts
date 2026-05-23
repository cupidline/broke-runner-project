// Endurance Capacity — realized sustainable duration (fuel tank)
// Formula: 0.50 × longRunCapacity + 0.30 × weeklyVolume + 0.20 × longRunConsistency
// See D-034 in DECISIONS.md

const LONG_RUN_TARGET_MIN = 240  // 4-hour ultra target
const WEEKLY_TRIMP_TARGET = 150  // target weekly TRIMP for ultra training

export interface EnduranceCapacityInputs {
  maxRecentLongRunMin: number   // max duration (min) among runs >= 60 min in last 14 days
  weeklyTRIMP: number           // total TRIMP in the 7 days ending on this date
  longRunWeeksCount: number     // how many of the last 4 weeks had a run >= 60 min (0–4)
}

export function calcEnduranceCapacity({
  maxRecentLongRunMin,
  weeklyTRIMP,
  longRunWeeksCount,
}: EnduranceCapacityInputs): number {
  const longRunScore = Math.min(Math.max(maxRecentLongRunMin / LONG_RUN_TARGET_MIN, 0), 1) * 100
  const volumeScore = Math.min(Math.max(weeklyTRIMP / WEEKLY_TRIMP_TARGET, 0), 1) * 100
  const consistencyScore = (Math.max(0, Math.min(4, longRunWeeksCount)) / 4) * 100
  return Math.round(
    Math.max(0, Math.min(100, 0.5 * longRunScore + 0.3 * volumeScore + 0.2 * consistencyScore)),
  )
}

export type EnduranceBand = 'minimal' | 'building' | 'trail' | 'ultra' | 'peak'

export interface EnduranceBandConfig {
  label: string
  description: string
  color: string
}

export const ENDURANCE_BAND_CONFIG: Record<EnduranceBand, EnduranceBandConfig> = {
  minimal:  { label: 'Minimal',     description: 'No recent long runs, tank nearly empty',       color: '#71717A' },
  building: { label: 'Building',    description: 'Short long runs forming the base',             color: '#7DD3FC' },
  trail:    { label: 'Trail-ready', description: 'Capable of 90–120 min sustained efforts',      color: '#34D399' },
  ultra:    { label: 'Ultra-ready', description: '2h+ long runs, consistent weekly presence',    color: '#F59E0B' },
  peak:     { label: 'Peak tank',   description: '3–4h long runs, showing up every week',        color: '#A78BFA' },
}

export function enduranceBand(score: number): EnduranceBand {
  if (score >= 80) return 'peak'
  if (score >= 65) return 'ultra'
  if (score >= 50) return 'trail'
  if (score >= 30) return 'building'
  return 'minimal'
}
