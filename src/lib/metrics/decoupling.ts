// Aerobic decoupling: Pa:HR efficiency factor drift first vs second half
// Positive % = HR drifted up relative to pace (cardiac drift / fatigue)
// < 5% = well-coupled aerobic run

interface HalfStats {
  avgHR: number
  avgSpeedMps: number
}

function halfStats(
  hrStream: number[],
  paceStream: number[], // seconds per km
  start: number,
  end: number,
): HalfStats {
  const hrs = hrStream.slice(start, end)
  const paces = paceStream.slice(start, end)
  const avgHR = hrs.reduce((s, v) => s + v, 0) / hrs.length
  const avgPace = paces.reduce((s, v) => s + v, 0) / paces.length
  const avgSpeedMps = avgPace > 0 ? 1000 / avgPace : 0
  return { avgHR, avgSpeedMps }
}

// efficiency factor = speed / HR (higher = more efficient)
function ef(stats: HalfStats): number {
  if (stats.avgHR === 0) return 0
  return stats.avgSpeedMps / stats.avgHR
}

export function calcDecoupling(
  hrStream: number[],
  paceSecPerKmStream: number[],
): number {
  const n = Math.min(hrStream.length, paceSecPerKmStream.length)
  if (n < 10) return 0

  const mid = Math.floor(n / 2)
  const first = halfStats(hrStream, paceSecPerKmStream, 0, mid)
  const second = halfStats(hrStream, paceSecPerKmStream, mid, n)

  const efFirst = ef(first)
  if (efFirst === 0) return 0

  return ((efFirst - ef(second)) / efFirst) * 100
}
