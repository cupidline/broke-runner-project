import { describe, it, expect } from 'vitest'
import { isPlausibleSample } from '../plausibility'
import type { Activity } from '@/types'

const SETTINGS = { maxHR: 192, restHR: 53 }

function act(overrides: Partial<Activity>): Activity {
  return {
    id: '1',
    source: 'strava',
    type: 'Run',
    name: 'Test',
    startDate: '2024-01-15T08:00:00Z',
    durationSeconds: 3600,
    distanceMeters: 10000,
    elevationGainMeters: 0,
    avgHeartRate: 140,
    avgPaceSecPerKm: 540,
    trimpSource: 'hr',
    ...overrides,
  }
}

describe('isPlausibleSample', () => {
  it('accepts a normal run', () => {
    expect(isPlausibleSample(act({}), SETTINGS)).toBe(true)
  })

  it('rejects runs shorter than 15 minutes', () => {
    expect(isPlausibleSample(act({ durationSeconds: 800 }), SETTINGS)).toBe(false)
  })

  it('rejects missing avgHeartRate', () => {
    expect(isPlausibleSample(act({ avgHeartRate: undefined }), SETTINGS)).toBe(false)
  })

  it('rejects missing avgPaceSecPerKm', () => {
    expect(isPlausibleSample(act({ avgPaceSecPerKm: undefined }), SETTINGS)).toBe(false)
  })

  it('rejects avg HR < 90 (sensor error)', () => {
    expect(isPlausibleSample(act({ avgHeartRate: 85 }), SETTINGS)).toBe(false)
  })

  it('rejects fast pace with very low HRR (impossible combo)', () => {
    // pace < 480 (sub-8:00/km) AND HRR < 0.40
    // HRR = (100 - 53) / (192 - 53) = 47/139 ≈ 0.338 < 0.40
    expect(isPlausibleSample(act({ avgPaceSecPerKm: 400, avgHeartRate: 100 }), SETTINGS)).toBe(false)
  })

  it('accepts fast pace with plausible HRR', () => {
    // HRR = (165 - 53) / (192 - 53) = 112/139 ≈ 0.81 > 0.40
    expect(isPlausibleSample(act({ avgPaceSecPerKm: 400, avgHeartRate: 165 }), SETTINGS)).toBe(true)
  })
})
