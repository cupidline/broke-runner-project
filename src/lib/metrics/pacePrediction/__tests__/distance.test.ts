import { describe, it, expect } from 'vitest'
import { estimateDistanceSimple, estimateDistanceRange } from '../distance'
import type { PacePrediction } from '@/types/workout'

const NO_DATA: PacePrediction = { source: 'no_data', sampleSize: 0, confidenceLabel: '' }

const WITH_PACE: PacePrediction = {
  source: 'recent_data',
  sampleSize: 5,
  minSecPerKm: 520,     // p25 = faster
  medianSecPerKm: 550,
  maxSecPerKm: 580,     // p75 = slower
  confidenceLabel: '',
}

describe('estimateDistanceSimple', () => {
  it('returns null for no_data', () => {
    expect(estimateDistanceSimple(60, NO_DATA)).toBeNull()
  })

  it('calculates correctly: 60 min at 550 sec/km = ~6.55 km', () => {
    const dist = estimateDistanceSimple(60, WITH_PACE)
    expect(dist).toBeCloseTo(60 * 60 / 550, 2)
  })
})

describe('estimateDistanceRange', () => {
  it('returns null for no_data', () => {
    expect(estimateDistanceRange(60, NO_DATA)).toBeNull()
  })

  it('min distance uses slower pace, max distance uses faster pace', () => {
    const range = estimateDistanceRange(60, WITH_PACE)!
    expect(range).not.toBeNull()
    const [minKm, maxKm] = range
    // slower pace (580 s/km) → less distance
    expect(minKm).toBeCloseTo(60 * 60 / 580, 2)
    // faster pace (520 s/km) → more distance
    expect(maxKm).toBeCloseTo(60 * 60 / 520, 2)
    expect(maxKm).toBeGreaterThan(minKm)
  })
})
