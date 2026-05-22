// Foster monotony: mean / SD of daily loads over a window (typically 7 days)
// High monotony (>2) = dangerous lack of variation
export function calcMonotony(dailyLoads: number[]): number {
  if (dailyLoads.length < 2) return 0
  const mean = dailyLoads.reduce((s, v) => s + v, 0) / dailyLoads.length
  if (mean === 0) return 0
  const variance = dailyLoads.reduce((s, v) => s + (v - mean) ** 2, 0) / dailyLoads.length
  const sd = Math.sqrt(variance)
  if (sd === 0) return dailyLoads.every(v => v === 0) ? 0 : 99
  return mean / sd
}
