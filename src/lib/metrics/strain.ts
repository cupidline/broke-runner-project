// Foster strain: weekly load × monotony
export function calcStrain(dailyLoads: number[], monotony: number): number {
  const weeklyLoad = dailyLoads.reduce((s, v) => s + v, 0)
  return weeklyLoad * monotony
}
