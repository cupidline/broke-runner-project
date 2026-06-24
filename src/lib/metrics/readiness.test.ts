import { describe, it, expect } from 'vitest'
import { calcReadiness, readinessBand } from './readiness'

// Default calibration: tsbLow=-40, tsbHigh=20, acwrOptimal=1.0, acwrSpread=0.5, ctlPeak=60
describe('calcReadiness', () => {
  it('returns 0-100', () => {
    const score = calcReadiness({ tsb: 5, acwr: 1.0, monotony: 1.2, ctl: 45 })
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('fresh athlete with good CTL and safe ACWR scores high (≥85)', () => {
    // TSB=15 → near P90 → high TSB score; CTL=60 → at peak; ACWR=1.0 → optimal
    const score = calcReadiness({ tsb: 15, acwr: 1.0, monotony: 0.8, ctl: 60 })
    expect(score).toBeGreaterThanOrEqual(85)
  })

  it('fresh but detrained athlete is capped by CTL floor', () => {
    // Same TSB/ACWR but CTL only 15 (half of peak)
    const fit   = calcReadiness({ tsb: 15, acwr: 1.0, monotony: 0.8, ctl: 60 })
    const detrained = calcReadiness({ tsb: 15, acwr: 1.0, monotony: 0.8, ctl: 15 })
    expect(detrained).toBeLessThan(fit)
  })

  it('very fatigued athlete scores low', () => {
    const score = calcReadiness({ tsb: -30, acwr: 1.6, monotony: 2.5, ctl: 40 })
    expect(score).toBeLessThan(40)
  })

  it('high monotony significantly lowers score (multiplicative penalty)', () => {
    const base  = calcReadiness({ tsb: 5, acwr: 1.0, monotony: 1.0, ctl: 45 })
    const risky = calcReadiness({ tsb: 5, acwr: 1.0, monotony: 2.5, ctl: 45 })
    // 45% max penalty — risky should be meaningfully lower
    expect(risky).toBeLessThan(base * 0.65)
  })

  it('100% is achievable with optimal inputs', () => {
    // TSB at P90, CTL at peak, ACWR optimal, monotony zero
    const score = calcReadiness({ tsb: 20, acwr: 1.0, monotony: 0.5, ctl: 60 })
    expect(score).toBe(100)
  })
})

describe('readinessBand', () => {
  it('>=85 → peaked', () => expect(readinessBand(85)).toBe('peaked'))
  it('70-84 → fresh',  () => expect(readinessBand(70)).toBe('fresh'))
  it('50-69 → trainable', () => expect(readinessBand(55)).toBe('trainable'))
  it('30-49 → fatigued', () => expect(readinessBand(35)).toBe('fatigued'))
  it('<30 → cooked',   () => expect(readinessBand(20)).toBe('cooked'))
})
