import type { ReadinessBand } from '@/types'
import { DEFAULT_CALIBRATION, type ReadinessCalibration } from './personalCalibration'

export type { ReadinessCalibration }

export interface ReadinessInputs {
  tsb: number
  acwr: number
  monotony: number
  ctl: number
}

// TSB score: maps personal P10…P90 range → 0…100
function tsbScore(tsb: number, cal: ReadinessCalibration): number {
  const range = cal.tsbHigh - cal.tsbLow
  return Math.max(0, Math.min(100, (tsb - cal.tsbLow) / range * 100))
}

// ACWR score: peaks at personal median, linear decay toward personal P10 and P90
function acwrScore(acwr: number, cal: ReadinessCalibration): number {
  if (acwr <= 0) return 0
  if (acwr < cal.acwrOptimal)
    return Math.max(0, (acwr - (cal.acwrOptimal - cal.acwrSpread)) / cal.acwrSpread * 100)
  return Math.max(0, ((cal.acwrOptimal + cal.acwrSpread) - acwr) / cal.acwrSpread * 100)
}

// CTL score: fitness floor. At or above personal P90 CTL = 100; proportional below.
function ctlScore(ctl: number, cal: ReadinessCalibration): number {
  if (cal.ctlPeak <= 0) return 100
  return Math.min(100, (ctl / cal.ctlPeak) * 100)
}

// Monotony penalty: multiplicative. No penalty ≤ 1.0; up to 45% reduction at ≥ 2.5.
// Multiplicative keeps the penalty significant at any fitness/freshness level.
function monotonyFactor(monotony: number): number {
  return 1 - 0.45 * Math.max(0, Math.min(1, (monotony - 1.0) / 1.5))
}

export function calcReadiness(
  { tsb, acwr, monotony, ctl }: ReadinessInputs,
  cal: ReadinessCalibration = DEFAULT_CALIBRATION,
): number {
  const base = tsbScore(tsb, cal) * 0.50 + acwrScore(acwr, cal) * 0.30 + ctlScore(ctl, cal) * 0.20
  return Math.round(Math.max(0, Math.min(100, base * monotonyFactor(monotony))))
}

export function readinessBand(score: number): ReadinessBand {
  if (score >= 85) return 'peaked'
  if (score >= 70) return 'fresh'
  if (score >= 50) return 'trainable'
  if (score >= 30) return 'fatigued'
  return 'cooked'
}

// Per-hour EWMA decay factors
const CTL_K_HR = Math.pow(1 - 1 / 42, 1 / 24)
const ATL_K_HR = Math.pow(1 - 1 / 7, 1 / 24)
const MAX_HOURS = 14 * 24  // 2-week horizon

export interface BandSegment {
  band: ReadinessBand
  hours: number
  openEnded: boolean  // true = persists beyond the 14-day window
}

export interface PeakProjection {
  hoursToMax: number        // 0 = already at peak score
  hoursAtBand: number       // hours current band persists (= segments[0].hours)
  segments: BandSegment[]   // ordered band transitions for the next 14 days (up to 4)
}

// Simulates forward hour by hour with zero load.
// ACWR and monotony are held fixed (conservative — both improve with rest).
export function projectPeak(
  ctl: number,
  atl: number,
  acwr: number,
  monotony: number,
  cal: ReadinessCalibration = DEFAULT_CALIBRATION,
): PeakProjection {
  const startScore = calcReadiness({ tsb: ctl - atl, acwr, monotony, ctl }, cal)
  const startBand  = readinessBand(startScore)

  let c = ctl
  let a = atl
  let maxScore  = startScore
  let hoursToMax = 0

  let currentBand = startBand
  let bandStart   = 0
  const segments: BandSegment[] = []

  for (let h = 1; h <= MAX_HOURS; h++) {
    c *= CTL_K_HR
    a *= ATL_K_HR
    const score = calcReadiness({ tsb: c - a, acwr, monotony, ctl: c }, cal)
    const band  = readinessBand(score)

    if (score > maxScore) { maxScore = score; hoursToMax = h }

    if (band !== currentBand) {
      segments.push({ band: currentBand, hours: h - bandStart, openEnded: false })
      currentBand = band
      bandStart   = h
      if (segments.length === 4) break  // 4 transitions covers cooked → peaked
    }
  }

  // Final segment — open-ended if it reaches the window boundary
  segments.push({
    band: currentBand,
    hours: MAX_HOURS - bandStart,
    openEnded: currentBand === segments[segments.length - 1]?.band
      ? false
      : bandStart + (MAX_HOURS - bandStart) >= MAX_HOURS,
  })

  // Ensure at least one segment always present
  if (segments.length === 0) {
    segments.push({ band: startBand, hours: MAX_HOURS, openEnded: true })
  }

  const hoursAtBand = segments[0].openEnded ? MAX_HOURS : segments[0].hours

  return { hoursToMax, hoursAtBand, segments }
}

export function formatHoursDuration(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}
