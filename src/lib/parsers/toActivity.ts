import type { Activity } from '@/types'
import type { ParsedActivity } from './types'

export function parsedToActivity(parsed: ParsedActivity, rpe?: number): Activity {
  const hasHR = parsed.avgHeartRate != null && parsed.avgHeartRate > 0
  const hasRPE = rpe != null && rpe > 0

  return {
    id: crypto.randomUUID(),
    source: parsed.source,
    type: parsed.activityType,
    name: parsed.name,
    startDate: parsed.startDate,
    durationSeconds: parsed.durationSeconds,
    distanceMeters: parsed.distanceMeters,
    elevationGainMeters: parsed.elevationGainMeters,
    avgHeartRate: parsed.avgHeartRate,
    maxHeartRate: parsed.maxHeartRate,
    avgPaceSecPerKm: parsed.avgPaceSecPerKm,
    rpe: hasRPE ? rpe : undefined,
    trimpSource: hasHR ? 'hr' : hasRPE ? 'rpe' : 'none',
  }
}

export function manualToActivity(fields: {
  name: string
  startDate: string
  durationSeconds: number
  distanceMeters: number
  elevationGainMeters: number
  type: Activity['type']
  rpe?: number
}): Activity {
  const hasRPE = fields.rpe != null && fields.rpe > 0
  return {
    id: crypto.randomUUID(),
    source: 'manual',
    type: fields.type,
    name: fields.name || 'Manual run',
    startDate: fields.startDate,
    durationSeconds: fields.durationSeconds,
    distanceMeters: fields.distanceMeters,
    elevationGainMeters: fields.elevationGainMeters,
    rpe: hasRPE ? fields.rpe : undefined,
    trimpSource: hasRPE ? 'rpe' : 'none',
  }
}
