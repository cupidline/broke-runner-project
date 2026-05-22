import { describe, it, expect } from 'vitest'
import { calcMonotony } from './monotony'

describe('calcMonotony', () => {
  it('returns 0 for all-zero loads', () => {
    expect(calcMonotony([0, 0, 0, 0, 0, 0, 0])).toBe(0)
  })

  it('returns 0 for a single value', () => {
    expect(calcMonotony([50])).toBe(0)
  })

  it('high monotony for identical daily loads', () => {
    // identical loads → SD = 0 → monotony should be very high
    expect(calcMonotony([60, 60, 60, 60, 60, 60, 60])).toBe(99)
  })

  it('lower monotony with varied loads', () => {
    const varied = calcMonotony([0, 80, 0, 60, 0, 90, 0])
    const flat = calcMonotony([40, 40, 40, 40, 40, 40, 40])
    expect(varied).toBeLessThan(flat)
  })
})
