// D-037: Step-function recency weights
// 0-30 days: 1.0, 30-60 days: 0.5, 60-90 days: 0.25, >90 days: 0 (excluded)
export function recencyWeight(daysAgo: number): number {
  if (daysAgo < 0) return 0
  if (daysAgo <= 30) return 1.0
  if (daysAgo <= 60) return 0.5
  if (daysAgo <= 90) return 0.25
  return 0
}

export function daysAgo(dateStr: string, today: Date = new Date()): number {
  const actDate = new Date(dateStr)
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.floor((today.getTime() - actDate.getTime()) / msPerDay)
}
