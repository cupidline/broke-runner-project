import type { Activity } from '@/types'

interface Settings {
  maxHR: number
  restHR: number
}

// D-038: Exclude from prediction samples:
// - Runs < 15 min (HR not stabilised)
// - Avg HR < 90 (HR sensor error)
// - Pace < 8:00/km AND HRR < 40% (impossible combo = sensor error)
// - Missing HR or speed data
export function isPlausibleSample(activity: Activity, settings: Settings): boolean {
  if (activity.durationSeconds < 15 * 60) return false
  if (!activity.avgHeartRate || !activity.avgPaceSecPerKm) return false
  if (activity.avgHeartRate < 90) return false
  const hrr = (activity.avgHeartRate - settings.restHR) / (settings.maxHR - settings.restHR)
  if (activity.avgPaceSecPerKm < 480 && hrr < 0.40) return false  // <8:00/km at <40% HRR
  return true
}
