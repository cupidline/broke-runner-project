import type { ReadinessBand } from '@/types'

export interface ReadinessInputs {
  tsb: number
  acwr: number
  monotony: number
}

// TSB score: linear map −40…+20 → 0…100
function tsbScore(tsb: number): number {
  return Math.max(0, Math.min(100, (tsb + 40) / 60 * 100))
}

// ACWR score: peaks at 1.0 (100), linear decay toward 0.5 and 1.5, clamps to 0 outside
function acwrScore(acwr: number): number {
  if (acwr <= 0) return 0
  if (acwr < 1.0) return Math.max(0, (acwr - 0.5) / 0.5 * 100)
  return Math.max(0, (1.5 - acwr) / 0.5 * 100)
}

// Monotony score: 100 at ≤ 1.0, linear decay to 0 at ≥ 2.5
function monotonyScore(monotony: number): number {
  if (monotony <= 1.0) return 100
  if (monotony >= 2.5) return 0
  return (2.5 - monotony) / 1.5 * 100
}

export function calcReadiness({ tsb, acwr, monotony }: ReadinessInputs): number {
  const score = tsbScore(tsb) * 0.5 + acwrScore(acwr) * 0.3 + monotonyScore(monotony) * 0.2
  return Math.round(Math.max(0, Math.min(100, score)))
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
): PeakProjection {
  const startScore = calcReadiness({ tsb: ctl - atl, acwr, monotony })
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
    const score = calcReadiness({ tsb: c - a, acwr, monotony })
    const band  = readinessBand(score)

    if (score > maxScore) { maxScore = score; hoursToMax = h }

    if (band !== currentBand) {
      segments.push({ band: currentBand, hours: h - bandStart, openEnded: false })
      currentBand = band
      bandStart   = h
      if (segments.length === 3) break  // 3 transitions is enough context
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
