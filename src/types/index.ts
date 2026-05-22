export type ActivityType = 'Run' | 'TrailRun' | 'VirtualRun'
export type ActivitySource = 'strava' | 'manual' | 'gpx' | 'fit'
export type TRIMPSource = 'hr' | 'rpe' | 'none'
export type HRZone = 'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5'
export type ReadinessBand = 'peaked' | 'fresh' | 'trainable' | 'fatigued' | 'cooked'
export type RecommendationMode = 'conservative' | 'balanced' | 'progressive'

export interface Activity {
  id: string
  source: ActivitySource
  type: ActivityType
  name: string
  startDate: string
  durationSeconds: number
  distanceMeters: number
  elevationGainMeters: number
  avgHeartRate?: number
  maxHeartRate?: number
  avgPaceSecPerKm?: number
  rpe?: number
  trimpSource: TRIMPSource
  trimp?: number
  stravaId?: number
}

export interface DailyMetrics {
  date: string
  ctl: number
  atl: number
  tsb: number
  acwr: number
  monotony: number
  strain: number
  readiness: number
  fitnessScore: number
}

export interface UserSettings {
  maxHR: number
  restHR: number
  weightKg?: number
  recommendationMode: RecommendationMode
  rpeEnabled: boolean
  lastSyncedAt?: string
  stravaAccessToken?: string
  stravaRefreshToken?: string
  stravaTokenExpiresAt?: number
}

export interface ZoneCeilings {
  Z1: number
  Z2: number
  Z3: number
  Z4: number
  Z5: number
}
