import type { Activity } from '@/types'
import type { PacePrediction } from '@/types/workout'
import type { WorkoutProfile } from './matching'
import { isPlausibleSample } from './plausibility'
import { matchesProfile } from './matching'
import { recencyWeight, daysAgo } from './recency'

interface Settings {
  maxHR: number
  restHR: number
}

function weightedPercentile(values: number[], weights: number[], pct: number): number {
  const pairs = values.map((v, i) => ({ v, w: weights[i] })).sort((a, b) => a.v - b.v)
  const totalW = pairs.reduce((s, p) => s + p.w, 0)
  const target = pct * totalW
  let cum = 0
  for (const { v, w } of pairs) {
    cum += w
    if (cum >= target) return v
  }
  return pairs[pairs.length - 1].v
}

// D-035/D-036/D-037: Predict pace from user's recent activities.
export function predictPaceForWorkout(
  profile: WorkoutProfile,
  activities: Activity[],
  settings: Settings,
  today: Date = new Date(),
): PacePrediction {
  const plausible = activities.filter(a => isPlausibleSample(a, settings))
  const matched = plausible.filter(a => matchesProfile(a, profile))

  const withWeights = matched
    .map(a => ({
      a,
      weight: recencyWeight(daysAgo(a.startDate, today)),
    }))
    .filter(x => x.weight > 0 && x.a.avgPaceSecPerKm != null)

  const samples = withWeights.map(x => ({
    pace: x.a.avgPaceSecPerKm as number,
    weight: x.weight,
    id: x.a.id,
  }))

  const n = samples.length

  if (n === 0) {
    return {
      source: 'no_data',
      sampleSize: 0,
      confidenceLabel: 'no recent data at this intensity',
    }
  }

  const paces = samples.map(s => s.pace)
  const weights = samples.map(s => s.weight)
  const ids = samples.map(s => s.id)

  const p25 = weightedPercentile(paces, weights, 0.25)
  const p50 = weightedPercentile(paces, weights, 0.50)
  const p75 = weightedPercentile(paces, weights, 0.75)

  if (n === 1) {
    return {
      source: 'single_run',
      sampleSize: 1,
      minSecPerKm: p25,
      medianSecPerKm: p50,
      maxSecPerKm: p75,
      confidenceLabel: 'based on 1 recent run',
      matchingRunIds: ids,
    }
  }

  if (n < 5) {
    return {
      source: 'limited_data',
      sampleSize: n,
      minSecPerKm: p25,
      medianSecPerKm: p50,
      maxSecPerKm: p75,
      confidenceLabel: `limited data — ${n} recent runs`,
      matchingRunIds: ids,
    }
  }

  return {
    source: 'recent_data',
    sampleSize: n,
    minSecPerKm: p25,
    medianSecPerKm: p50,
    maxSecPerKm: p75,
    confidenceLabel: `your last ${n} runs at this HR`,
    matchingRunIds: ids,
  }
}
