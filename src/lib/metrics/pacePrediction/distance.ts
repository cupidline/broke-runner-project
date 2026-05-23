import type { PacePrediction, DistanceEstimate } from '@/types/workout'

// For easy runs: median pace → single distance estimate
export function estimateDistanceSimple(durationMin: number, pace: PacePrediction): number | null {
  if (pace.source === 'no_data' || pace.medianSecPerKm == null) return null
  return (durationMin * 60) / pace.medianSecPerKm
}

// For all other workouts: p25/p75 range → [min, max] km
export function estimateDistanceRange(
  durationMin: number,
  pace: PacePrediction,
): [number, number] | null {
  if (pace.source === 'no_data') return null
  const minPace = pace.minSecPerKm    // p25 = faster pace
  const maxPace = pace.maxSecPerKm    // p75 = slower pace
  if (minPace == null || maxPace == null) return null
  // Slower pace → less distance covered; faster pace → more distance
  const minKm = (durationMin * 60) / maxPace
  const maxKm = (durationMin * 60) / minPace
  return [minKm, maxKm]
}

export function estimateDistance(
  durationMin: number,
  pace: PacePrediction,
  singleValue = false,
): DistanceEstimate | null {
  if (singleValue) {
    const single = estimateDistanceSimple(durationMin, pace)
    return single != null ? { single } : null
  }
  const range = estimateDistanceRange(durationMin, pace)
  return range != null ? { range } : null
}
