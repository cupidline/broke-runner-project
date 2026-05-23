import { describe, it, expect } from 'vitest'
import { matchesProfile } from '../matching'
import type { Activity } from '@/types'

function act(avgHeartRate: number): Activity {
  return {
    id: '1', source: 'strava', type: 'Run', name: 'Test',
    startDate: '2024-01-15T08:00:00Z',
    durationSeconds: 3600, distanceMeters: 10000, elevationGainMeters: 0,
    avgHeartRate, avgPaceSecPerKm: 540, trimpSource: 'hr',
  }
}

describe('matchesProfile — easy', () => {
  const profile = { type: 'easy' as const, hrCeiling: 145 }

  it('matches HR just at ceiling', () => expect(matchesProfile(act(145), profile)).toBe(true))
  it('matches HR 2 above ceiling', () => expect(matchesProfile(act(147), profile)).toBe(true))
  it('matches HR 8 below ceiling', () => expect(matchesProfile(act(137), profile)).toBe(true))
  it('rejects HR 3 above ceiling', () => expect(matchesProfile(act(148), profile)).toBe(false))
  it('rejects HR 9 below ceiling', () => expect(matchesProfile(act(136), profile)).toBe(false))
})

describe('matchesProfile — tempo', () => {
  const profile = { type: 'tempo' as const, hrRange: [155, 165] as [number, number] }

  it('matches within range', () => expect(matchesProfile(act(160), profile)).toBe(true))
  it('matches at lower bound with tolerance', () => expect(matchesProfile(act(152), profile)).toBe(true))
  it('matches at upper bound with tolerance', () => expect(matchesProfile(act(168), profile)).toBe(true))
  it('rejects well below range', () => expect(matchesProfile(act(140), profile)).toBe(false))
})

describe('matchesProfile — rest/hills/strides', () => {
  it('always returns false for rest', () =>
    expect(matchesProfile(act(0), { type: 'rest' })).toBe(false))
  it('always returns false for hills', () =>
    expect(matchesProfile(act(160), { type: 'hills' })).toBe(false))
})
