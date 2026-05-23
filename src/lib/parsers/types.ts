import type { ActivityType, ActivitySource } from '@/types'

export interface ParsedActivity {
  source: ActivitySource
  name: string
  startDate: string            // ISO 8601
  durationSeconds: number
  distanceMeters: number
  elevationGainMeters: number
  avgHeartRate?: number
  maxHeartRate?: number
  avgPaceSecPerKm?: number
  activityType: ActivityType
  // Raw streams (optional — kept for stream storage later)
  hrStream?: number[]
  timeStream?: number[]
  altitudeStream?: number[]
}

export type ParseError = { ok: false; error: string }
export type ParseOk    = { ok: true;  activity: ParsedActivity }
export type ParseResult = ParseOk | ParseError
