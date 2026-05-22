import type { HRZone } from '@/types'

// %HRR thresholds (Karvonen method)
const THRESHOLDS = [0, 0.55, 0.70, 0.80, 0.90, 1.0] as const

export interface ZoneBounds {
  Z1: [number, number]
  Z2: [number, number]
  Z3: [number, number]
  Z4: [number, number]
  Z5: [number, number]
}

export function calcZoneBounds(maxHR: number, restHR: number): ZoneBounds {
  const hrr = maxHR - restHR
  const bpms = THRESHOLDS.map(t => Math.round(restHR + t * hrr))
  return {
    Z1: [bpms[0], bpms[1] - 1],
    Z2: [bpms[1], bpms[2] - 1],
    Z3: [bpms[2], bpms[3] - 1],
    Z4: [bpms[3], bpms[4] - 1],
    Z5: [bpms[4], maxHR],
  }
}

export function hrToZone(hr: number, maxHR: number, restHR: number): HRZone {
  const pct = (hr - restHR) / (maxHR - restHR)
  if (pct < 0.55) return 'Z1'
  if (pct < 0.70) return 'Z2'
  if (pct < 0.80) return 'Z3'
  if (pct < 0.90) return 'Z4'
  return 'Z5'
}

export function calcZoneDistribution(
  hrStream: number[],
  maxHR: number,
  restHR: number,
): Record<HRZone, number> {
  if (hrStream.length === 0) return { Z1: 0, Z2: 0, Z3: 0, Z4: 0, Z5: 0 }
  const counts = { Z1: 0, Z2: 0, Z3: 0, Z4: 0, Z5: 0 }
  for (const hr of hrStream) counts[hrToZone(hr, maxHR, restHR)]++
  const n = hrStream.length
  return {
    Z1: counts.Z1 / n,
    Z2: counts.Z2 / n,
    Z3: counts.Z3 / n,
    Z4: counts.Z4 / n,
    Z5: counts.Z5 / n,
  }
}
