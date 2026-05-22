import { describe, it, expect } from 'vitest'
import { calcACWR, acwrRisk } from './acwr'

describe('calcACWR', () => {
  it('returns 0 when CTL is 0', () => expect(calcACWR(10, 0)).toBe(0))
  it('returns 1.0 when ATL equals CTL', () => expect(calcACWR(50, 50)).toBe(1.0))
  it('returns correct ratio', () => expect(calcACWR(65, 50)).toBeCloseTo(1.3, 2))
})

describe('acwrRisk', () => {
  it('safe for 0.8–1.3', () => {
    expect(acwrRisk(0.8)).toBe('safe')
    expect(acwrRisk(1.0)).toBe('safe')
    expect(acwrRisk(1.3)).toBe('safe')
  })
  it('danger above 1.5', () => expect(acwrRisk(1.6)).toBe('danger'))
  it('undertraining below 0.5', () => expect(acwrRisk(0.3)).toBe('undertraining'))
  it('caution between 1.3 and 1.5', () => expect(acwrRisk(1.4)).toBe('caution'))
})
