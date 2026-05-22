import { describe, it, expect } from 'vitest'
import { calcZoneBounds, hrToZone, calcZoneDistribution } from './zones'

const MAX_HR = 192
const REST_HR = 53

describe('calcZoneBounds', () => {
  it('Z1 lower bound is restHR', () => {
    const bounds = calcZoneBounds(MAX_HR, REST_HR)
    expect(bounds.Z1[0]).toBe(REST_HR)
  })

  it('Z5 upper bound is maxHR', () => {
    const bounds = calcZoneBounds(MAX_HR, REST_HR)
    expect(bounds.Z5[1]).toBe(MAX_HR)
  })

  it('zones are contiguous (each zone lower = previous upper + 1)', () => {
    const b = calcZoneBounds(MAX_HR, REST_HR)
    expect(b.Z2[0]).toBe(b.Z1[1] + 1)
    expect(b.Z3[0]).toBe(b.Z2[1] + 1)
    expect(b.Z4[0]).toBe(b.Z3[1] + 1)
    expect(b.Z5[0]).toBe(b.Z4[1] + 1)
  })

  it('Z2 ceiling for MaxHR=192 RestHR=53 is ~150bpm (70% HRR)', () => {
    // 53 + 0.70 × (192-53) = 53 + 97.3 = 150.3 → 150
    const bounds = calcZoneBounds(MAX_HR, REST_HR)
    expect(bounds.Z2[1]).toBe(149) // Z2 ends at Z3 start - 1
    expect(bounds.Z3[0]).toBe(150)
  })
})

describe('hrToZone', () => {
  it('restHR → Z1', () => expect(hrToZone(REST_HR, MAX_HR, REST_HR)).toBe('Z1'))
  it('140bpm → Z2', () => expect(hrToZone(140, MAX_HR, REST_HR)).toBe('Z2'))
  it('155bpm → Z3', () => expect(hrToZone(155, MAX_HR, REST_HR)).toBe('Z3'))
  it('170bpm → Z4', () => expect(hrToZone(170, MAX_HR, REST_HR)).toBe('Z4'))
  it('maxHR → Z5', () => expect(hrToZone(MAX_HR, MAX_HR, REST_HR)).toBe('Z5'))
})

describe('calcZoneDistribution', () => {
  it('returns all zeros for empty stream', () => {
    const d = calcZoneDistribution([], MAX_HR, REST_HR)
    expect(Object.values(d).every(v => v === 0)).toBe(true)
  })

  it('sums to 1 for a valid stream', () => {
    const stream = [130, 140, 145, 150, 160, 170, 185]
    const d = calcZoneDistribution(stream, MAX_HR, REST_HR)
    const total = Object.values(d).reduce((s, v) => s + v, 0)
    expect(total).toBeCloseTo(1, 5)
  })
})
