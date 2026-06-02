import { stravaFetch } from '@/lib/strava/client'
import type { StravaActivity } from '@/lib/strava/types'
import { upsertActivities } from '@/lib/db/activities'
import { getSetting, setSetting } from '@/lib/db/settings'
import { backfillMetrics } from '@/lib/metrics/backfill'
import type { Activity, ActivityType } from '@/types'

const PER_PAGE = 200

const RIDE_TYPES   = new Set(['Ride', 'VirtualRide', 'EBikeRide', 'MountainBikeRide', 'GravelRide', 'Handcycle'])
const SWIM_TYPES   = new Set(['Swim', 'OpenWaterSwim'])
const RACQUET_TYPES = new Set(['Badminton', 'Tennis', 'Squash', 'Racquetball', 'TableTennis', 'Pickleball'])
const STRENGTH_TYPES = new Set(['WeightTraining', 'Workout', 'CrossFit', 'RockClimbing'])
const CARDIO_TYPES  = new Set(['Elliptical', 'StairStepper', 'Rowing', 'Kayaking', 'Canoeing', 'Hike'])
const TEAM_TYPES    = new Set(['Soccer', 'Football', 'Basketball', 'Rugby', 'Hockey', 'Baseball', 'Volleyball', 'Handball'])

function toActivityType(sportType: string): ActivityType {
  if (sportType === 'TrailRun') return 'TrailRun'
  if (sportType === 'VirtualRun') return 'VirtualRun'
  if (sportType === 'Run') return 'Run'
  if (RIDE_TYPES.has(sportType)) return 'Ride'
  if (SWIM_TYPES.has(sportType)) return 'Swim'
  if (RACQUET_TYPES.has(sportType)) return 'Racquet'
  if (STRENGTH_TYPES.has(sportType)) return 'Strength'
  if (CARDIO_TYPES.has(sportType)) return 'Cardio'
  if (TEAM_TYPES.has(sportType)) return 'TeamSport'
  return 'Other'
}

function mapStravaActivity(a: StravaActivity): Activity {
  const sportType = a.sport_type ?? a.type
  return {
    id: String(a.id),
    source: 'strava',
    type: toActivityType(sportType),
    name: a.name,
    startDate: a.start_date,
    durationSeconds: a.moving_time,
    distanceMeters: a.distance,
    elevationGainMeters: a.total_elevation_gain,
    avgHeartRate: a.average_heartrate,
    maxHeartRate: a.max_heartrate,
    avgPaceSecPerKm: a.average_speed > 0 ? 1000 / a.average_speed : undefined,
    trimpSource: a.has_heartrate ? 'hr' : 'none',
    stravaId: a.id,
  }
}

export interface SyncResult {
  fetched: number
}

export async function syncActivities(
  onProgress?: (fetched: number) => void,
): Promise<SyncResult> {
  const lastSyncedAt = await getSetting('lastSyncedAt')
  // Subtract 24 h so activities that started before the last sync but were
  // uploaded to Strava afterward (e.g. watch sync delay) are not missed.
  const LOOKBACK_MS = 24 * 60 * 60 * 1000
  const after = lastSyncedAt
    ? Math.floor((new Date(lastSyncedAt).getTime() - LOOKBACK_MS) / 1000)
    : 0

  let page = 1
  let totalFetched = 0
  const syncStart = new Date().toISOString()

  while (true) {
    const params = new URLSearchParams({ per_page: String(PER_PAGE), page: String(page) })
    if (after > 0) params.set('after', String(after))

    const raw = await stravaFetch<StravaActivity[]>(`/athlete/activities?${params}`)

    const runs = raw.map(mapStravaActivity)

    if (runs.length > 0) await upsertActivities(runs)

    totalFetched += raw.length
    onProgress?.(totalFetched)

    if (raw.length < PER_PAGE) break
    page++
  }

  await setSetting('lastSyncedAt', syncStart)
  await backfillMetrics()
  return { fetched: totalFetched }
}
