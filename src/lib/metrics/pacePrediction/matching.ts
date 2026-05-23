import type { Activity } from '@/types'
import type { WorkoutType } from '@/types/workout'

export interface WorkoutProfile {
  type: WorkoutType
  hrCeiling?: number
  hrRange?: [number, number]
}

// Returns true if the activity falls within the HR window appropriate for this workout type.
// D-038 plausibility filtering is applied upstream — only plausible samples reach here.
export function matchesProfile(activity: Activity, profile: WorkoutProfile): boolean {
  const hr = activity.avgHeartRate
  if (!hr) return false

  switch (profile.type) {
    case 'easy':
    case 'long': {
      // Within ±8 bpm below ceiling (leaning sub-ceiling is correct for aerobic work)
      const ceiling = profile.hrCeiling ?? 0
      return hr <= ceiling + 2 && hr >= ceiling - 8
    }
    case 'recovery': {
      // At or below recovery ceiling (these should be very easy)
      return hr <= (profile.hrCeiling ?? 0) + 2
    }
    case 'tempo':
    case 'threshold': {
      const [lo, hi] = profile.hrRange ?? [0, 300]
      return hr >= lo - 3 && hr <= hi + 3
    }
    case 'vo2max': {
      const [lo] = profile.hrRange ?? [0, 300]
      return hr >= lo - 2
    }
    // Effort-based — no pace prediction
    case 'hills':
    case 'strides':
    case 'progression':
    case 'rest':
      return false
    default:
      return false
  }
}
