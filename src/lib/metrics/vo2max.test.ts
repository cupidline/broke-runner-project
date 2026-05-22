import { describe, it, expect } from 'vitest'
import { calcVO2max, normalizeVO2max } from './vo2max'

describe('calcVO2max', () => {
  it('Andromeda profile: MaxHR=192 RestHR=53 → ~55.4 ml/kg/min', () => {
    expect(calcVO2max(192, 53)).toBeCloseTo(55.4, 0)
  })

  it('increases with higher MaxHR', () => {
    expect(calcVO2max(200, 53)).toBeGreaterThan(calcVO2max(180, 53))
  })

  it('increases with lower RestHR', () => {
    expect(calcVO2max(192, 45)).toBeGreaterThan(calcVO2max(192, 60))
  })
})

describe('normalizeVO2max', () => {
  it('30 ml/kg/min → 0', () => expect(normalizeVO2max(30)).toBe(0))
  it('70 ml/kg/min → 100', () => expect(normalizeVO2max(70)).toBe(100))
  it('clamps below 30', () => expect(normalizeVO2max(20)).toBe(0))
  it('clamps above 70', () => expect(normalizeVO2max(80)).toBe(100))
  it('50 ml/kg/min → 50', () => expect(normalizeVO2max(50)).toBeCloseTo(50, 0))
})
