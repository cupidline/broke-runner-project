import { describe, it, expect } from 'vitest'
import { calcPMC } from './ctlAtlTsb'

describe('calcPMC', () => {
  it('returns empty array for no inputs', () => {
    expect(calcPMC([])).toEqual([])
  })

  it('returns one point for a single day', () => {
    const result = calcPMC([{ date: '2024-01-01', trimp: 60 }])
    expect(result).toHaveLength(1)
    expect(result[0].date).toBe('2024-01-01')
  })

  it('CTL starts near 0 and grows slowly over 42 days of steady load', () => {
    const loads = Array.from({ length: 42 }, (_, i) => {
      const d = new Date('2024-01-01')
      d.setUTCDate(d.getUTCDate() + i)
      return { date: d.toISOString().slice(0, 10), trimp: 60 }
    })
    const result = calcPMC(loads)
    expect(result[result.length - 1].ctl).toBeGreaterThan(0)
    expect(result[result.length - 1].ctl).toBeLessThan(60)
  })

  it('ATL reacts faster than CTL', () => {
    const loads = [
      { date: '2024-01-01', trimp: 0 },
      { date: '2024-01-02', trimp: 0 },
      { date: '2024-01-03', trimp: 100 },
      { date: '2024-01-04', trimp: 0 },
      { date: '2024-01-05', trimp: 0 },
    ]
    const result = calcPMC(loads)
    const peakIdx = result.findIndex(p => p.date === '2024-01-03')
    // after the big day, ATL should be higher than CTL (ATL reacts faster)
    expect(result[peakIdx].atl).toBeGreaterThan(result[peakIdx].ctl)
  })

  it('TSB = CTL - ATL', () => {
    const loads = [{ date: '2024-01-01', trimp: 80 }]
    const [pt] = calcPMC(loads)
    expect(pt.tsb).toBeCloseTo(pt.ctl - pt.atl, 6)
  })

  it('fills in rest days between load days', () => {
    const loads = [
      { date: '2024-01-01', trimp: 60 },
      { date: '2024-01-05', trimp: 60 },
    ]
    const result = calcPMC(loads)
    expect(result).toHaveLength(5)
    expect(result[1].date).toBe('2024-01-02')
  })
})
