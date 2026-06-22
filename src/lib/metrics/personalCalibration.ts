export interface TRIMPCalibration {
  recovery: number   // top of Recovery band
  easy: number       // top of Easy band
  moderate: number   // top of Moderate band
  hard: number       // top of Hard band
  veryHard: number   // top of Very Hard band
  scaleMax: number   // display scale maximum
}

export const DEFAULT_TRIMP_CALIBRATION: TRIMPCalibration = {
  recovery: 60,
  easy: 150,
  moderate: 260,
  hard: 420,
  veryHard: 620,
  scaleMax: 700,
}

/**
 * Derives personal TRIMP band thresholds from activity TRIMP history.
 * Returns null if fewer than 10 activities have a TRIMP value.
 */
export function calcTRIMPCalibration(trimpValues: number[]): TRIMPCalibration | null {
  const values = trimpValues.filter(t => t > 0)
  if (values.length < 10) return null

  const sorted = [...values].sort((a, b) => a - b)

  const recovery = percentile(sorted, 15)
  const easy     = percentile(sorted, 35)
  const moderate = percentile(sorted, 58)
  const hard     = percentile(sorted, 80)
  const veryHard = percentile(sorted, 96)
  const scaleMax = Math.ceil(percentile(sorted, 99) * 1.1)

  // Ensure strict monotonicity with minimum spacing
  const MIN_GAP = 10
  if (
    recovery < MIN_GAP ||
    easy     < recovery + MIN_GAP ||
    moderate < easy + MIN_GAP ||
    hard     < moderate + MIN_GAP ||
    veryHard < hard + MIN_GAP ||
    scaleMax < veryHard + MIN_GAP
  ) return null

  return { recovery, easy, moderate, hard, veryHard, scaleMax }
}

export interface ReadinessCalibration {
  tsbLow: number      // P10 of historical TSB — maps to readiness score 0
  tsbHigh: number     // P90 of historical TSB — maps to readiness score 100
  acwrOptimal: number // P50 of historical ACWR — peak of the ACWR scoring curve
  acwrSpread: number  // half-width of ACWR scoring curve (derived from P10/P90 spread)
}

// Population-average fallback used until 28+ days of personal history exist
export const DEFAULT_CALIBRATION: ReadinessCalibration = {
  tsbLow: -40,
  tsbHigh: 20,
  acwrOptimal: 1.0,
  acwrSpread: 0.5,
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const i = (p / 100) * (sorted.length - 1)
  const lo = Math.floor(i)
  const hi = Math.ceil(i)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo)
}

/**
 * Derives personal readiness calibration constants from historical TSB/ACWR data.
 * Returns null if there isn't enough history (< 28 data points).
 */
export function calcPersonalCalibration(
  metrics: Array<{ tsb: number; acwr: number }>,
): ReadinessCalibration | null {
  if (metrics.length < 28) return null

  const tsbSorted = [...metrics.map(m => m.tsb)].sort((a, b) => a - b)

  const acwrValues = metrics.map(m => m.acwr).filter(v => v > 0)
  if (acwrValues.length < 28) return null
  const acwrSorted = [...acwrValues].sort((a, b) => a - b)

  const tsbLow  = percentile(tsbSorted, 10)
  const tsbHigh = percentile(tsbSorted, 90)
  if (tsbHigh - tsbLow < 5) return null  // degenerate history (e.g. all rest days)

  const acwrOptimal = percentile(acwrSorted, 50)
  const acwrSpread  = Math.max(
    acwrOptimal - percentile(acwrSorted, 10),
    percentile(acwrSorted, 90) - acwrOptimal,
    0.2,  // floor to prevent division by near-zero
  )

  return { tsbLow, tsbHigh, acwrOptimal, acwrSpread }
}
