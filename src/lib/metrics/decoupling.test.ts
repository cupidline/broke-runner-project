import { describe, it, expect } from 'vitest'
import { calcDecoupling } from './decoupling'

describe('calcDecoupling', () => {
  it('returns 0 for empty streams', () => {
    expect(calcDecoupling([], [])).toBe(0)
  })

  it('returns 0 for very short streams', () => {
    expect(calcDecoupling([150, 152], [360, 362])).toBe(0)
  })

  it('returns ~0 when HR and pace are stable (well-coupled)', () => {
    const hr = Array.from({ length: 60 }, () => 145)
    const pace = Array.from({ length: 60 }, () => 360)
    expect(Math.abs(calcDecoupling(hr, pace))).toBeCloseTo(0, 1)
  })

  it('returns positive when HR drifts up while pace holds', () => {
    const n = 60
    // first half: HR=145, second half: HR=155 (drift), pace constant
    const hr = [...Array(n / 2).fill(145), ...Array(n / 2).fill(155)]
    const pace = Array(n).fill(360)
    expect(calcDecoupling(hr, pace)).toBeGreaterThan(0)
  })
})
