import { describe, it, expect } from 'vitest'
import { recencyWeight, daysAgo } from '../recency'

describe('recencyWeight', () => {
  it('returns 1.0 for 0 days ago', () => expect(recencyWeight(0)).toBe(1.0))
  it('returns 1.0 for 30 days ago', () => expect(recencyWeight(30)).toBe(1.0))
  it('returns 0.5 for 31 days ago', () => expect(recencyWeight(31)).toBe(0.5))
  it('returns 0.5 for 60 days ago', () => expect(recencyWeight(60)).toBe(0.5))
  it('returns 0.25 for 61 days ago', () => expect(recencyWeight(61)).toBe(0.25))
  it('returns 0.25 for 90 days ago', () => expect(recencyWeight(90)).toBe(0.25))
  it('returns 0 for 91 days ago', () => expect(recencyWeight(91)).toBe(0))
  it('returns 0 for negative days', () => expect(recencyWeight(-1)).toBe(0))
})

describe('daysAgo', () => {
  it('returns 0 for today', () => {
    const today = new Date('2024-06-01')
    expect(daysAgo('2024-06-01', today)).toBe(0)
  })

  it('returns 7 for 7 days ago', () => {
    const today = new Date('2024-06-08')
    expect(daysAgo('2024-06-01', today)).toBe(7)
  })
})
