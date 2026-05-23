import { describe, it, expect } from 'vitest'
import { predictPaceForWorkout } from '../predict'
import type { Activity } from '@/types'

const SETTINGS = { maxHR: 192, restHR: 53 }
const TODAY = new Date('2024-06-15')

function run(id: string, avgHR: number, paceSecPerKm: number, daysAgo: number): Activity {
  const d = new Date(TODAY)
  d.setDate(d.getDate() - daysAgo)
  return {
    id, source: 'strava', type: 'Run', name: 'Run',
    startDate: d.toISOString(),
    durationSeconds: 3600, distanceMeters: 10000, elevationGainMeters: 0,
    avgHeartRate: avgHR,
    avgPaceSecPerKm: paceSecPerKm,
    trimpSource: 'hr',
  }
}

const EASY_PROFILE = { type: 'easy' as const, hrCeiling: 145 }

describe('predictPaceForWorkout — no data', () => {
  it('returns no_data when no activities', () => {
    const result = predictPaceForWorkout(EASY_PROFILE, [], SETTINGS, TODAY)
    expect(result.source).toBe('no_data')
    expect(result.sampleSize).toBe(0)
  })

  it('returns no_data when all activities are too old', () => {
    const acts = [run('a', 140, 550, 95)]
    const result = predictPaceForWorkout(EASY_PROFILE, acts, SETTINGS, TODAY)
    expect(result.source).toBe('no_data')
  })
})

describe('predictPaceForWorkout — single run', () => {
  it('returns single_run source with 1 matching sample', () => {
    const acts = [run('a', 142, 550, 10)]
    const result = predictPaceForWorkout(EASY_PROFILE, acts, SETTINGS, TODAY)
    expect(result.source).toBe('single_run')
    expect(result.sampleSize).toBe(1)
  })
})

describe('predictPaceForWorkout — limited data', () => {
  it('returns limited_data with 2-4 matching samples', () => {
    const acts = [
      run('a', 141, 540, 5),
      run('b', 143, 560, 15),
      run('c', 140, 545, 25),
    ]
    const result = predictPaceForWorkout(EASY_PROFILE, acts, SETTINGS, TODAY)
    expect(result.source).toBe('limited_data')
    expect(result.sampleSize).toBe(3)
  })
})

describe('predictPaceForWorkout — full confidence', () => {
  it('returns recent_data with 5+ matching samples', () => {
    const acts = [
      run('a', 141, 540, 5),
      run('b', 143, 560, 10),
      run('c', 140, 545, 15),
      run('d', 142, 555, 20),
      run('e', 144, 535, 25),
    ]
    const result = predictPaceForWorkout(EASY_PROFILE, acts, SETTINGS, TODAY)
    expect(result.source).toBe('recent_data')
    expect(result.sampleSize).toBe(5)
    expect(result.minSecPerKm).toBeDefined()
    expect(result.maxSecPerKm).toBeDefined()
    expect(result.minSecPerKm!).toBeLessThanOrEqual(result.maxSecPerKm!)
  })
})

describe('predictPaceForWorkout — recency weighting', () => {
  it('recent runs at different pace shift prediction compared to old-only data', () => {
    // Old runs (60+ days ago) at slow 600 sec/km
    const oldRuns = Array.from({ length: 5 }, (_, i) =>
      run(`old${i}`, 142, 600, 65 + i),
    )
    // Recent runs (< 30 days) at fast 500 sec/km
    const newRuns = Array.from({ length: 5 }, (_, i) =>
      run(`new${i}`, 142, 500, 5 + i),
    )

    const oldOnly = predictPaceForWorkout(EASY_PROFILE, oldRuns, SETTINGS, TODAY)
    const combined = predictPaceForWorkout(EASY_PROFILE, [...oldRuns, ...newRuns], SETTINGS, TODAY)

    // Recent data should pull median down (faster pace = lower sec/km number)
    expect(combined.medianSecPerKm!).toBeLessThan(oldOnly.medianSecPerKm!)
  })
})
