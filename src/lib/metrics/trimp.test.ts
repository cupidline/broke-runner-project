import { describe, it, expect } from 'vitest'
import { calcTRIMP, calcTRIMPfromRPE, rpeToHRR } from './trimp'

describe('calcTRIMP', () => {
  it('returns 0 for zero duration', () => {
    expect(calcTRIMP({ durationSeconds: 0, avgHR: 150, maxHR: 192, restHR: 53 })).toBe(0)
  })

  it('returns 0 when avgHR is at or below restHR', () => {
    expect(calcTRIMP({ durationSeconds: 3600, avgHR: 53, maxHR: 192, restHR: 53 })).toBe(0)
  })

  it('is positive for a valid run', () => {
    const t = calcTRIMP({ durationSeconds: 3600, avgHR: 140, maxHR: 192, restHR: 53 })
    expect(t).toBeGreaterThan(0)
  })

  it('increases with longer duration', () => {
    const params = { avgHR: 140, maxHR: 192, restHR: 53 }
    const t60 = calcTRIMP({ ...params, durationSeconds: 3600 })
    const t90 = calcTRIMP({ ...params, durationSeconds: 5400 })
    expect(t90).toBeGreaterThan(t60)
  })

  it('increases with higher avgHR', () => {
    const params = { durationSeconds: 3600, maxHR: 192, restHR: 53 }
    const low = calcTRIMP({ ...params, avgHR: 130 })
    const high = calcTRIMP({ ...params, avgHR: 160 })
    expect(high).toBeGreaterThan(low)
  })

  it('is approximately 125 for a 60min run at 140bpm (MaxHR=192, RestHR=53)', () => {
    // HRR = (140-53)/(192-53) = 87/139 ≈ 0.626
    // TRIMP = 60 × 0.626 × e^(1.92 × 0.626) ≈ 124.9
    const t = calcTRIMP({ durationSeconds: 3600, avgHR: 140, maxHR: 192, restHR: 53 })
    expect(t).toBeCloseTo(125, 0)
  })
})

describe('rpeToHRR', () => {
  it('RPE 1 maps to ~0.495', () => expect(rpeToHRR(1)).toBeCloseTo(0.495, 2))
  it('RPE 10 maps to 0.90', () => expect(rpeToHRR(10)).toBeCloseTo(0.90, 2))
  it('RPE 5 is between RPE 1 and RPE 10', () => {
    expect(rpeToHRR(5)).toBeGreaterThan(rpeToHRR(1))
    expect(rpeToHRR(5)).toBeLessThan(rpeToHRR(10))
  })
})

describe('calcTRIMPfromRPE', () => {
  it('returns 0 for zero duration', () => {
    expect(calcTRIMPfromRPE(0, 5)).toBe(0)
  })

  it('RPE 7 for 60min is higher TRIMP than RPE 3 for 60min', () => {
    expect(calcTRIMPfromRPE(3600, 7)).toBeGreaterThan(calcTRIMPfromRPE(3600, 3))
  })
})
