import { describe, it, expect } from 'vitest'
import { calcReadiness, readinessBand } from './readiness'

describe('calcReadiness', () => {
  it('returns 0-100', () => {
    const score = calcReadiness({ tsb: 5, acwr: 1.0, monotony: 1.2 })
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('fresh athlete with safe ACWR scores high', () => {
    const score = calcReadiness({ tsb: 8, acwr: 0.95, monotony: 1.2 })
    expect(score).toBeGreaterThan(75)
  })

  it('very fatigued athlete scores low', () => {
    const score = calcReadiness({ tsb: -30, acwr: 1.6, monotony: 2.5 })
    expect(score).toBeLessThan(40)
  })

  it('high monotony lowers score', () => {
    const base = calcReadiness({ tsb: 5, acwr: 1.0, monotony: 1.0 })
    const risky = calcReadiness({ tsb: 5, acwr: 1.0, monotony: 2.5 })
    expect(risky).toBeLessThan(base)
  })
})

describe('readinessBand', () => {
  it('>=80 → peaked', () => expect(readinessBand(85)).toBe('peaked'))
  it('65-79 → fresh', () => expect(readinessBand(70)).toBe('fresh'))
  it('45-64 → trainable', () => expect(readinessBand(55)).toBe('trainable'))
  it('30-44 → fatigued', () => expect(readinessBand(35)).toBe('fatigued'))
  it('<30 → cooked', () => expect(readinessBand(20)).toBe('cooked'))
})
