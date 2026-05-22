import { stravaFetch } from '@/lib/strava/client'
import type { StravaActivity } from '@/lib/strava/types'
import { upsertActivities } from '@/lib/db/activities'
import { getSetting, setSetting } from '@/lib/db/settings'
import type { Activity, ActivityType } from '@/types'

const RUNNING_TYPES = new Set(['Run', 'TrailRun', 'VirtualRun'])
const PER_PAGE = 200

function toActivityType(sportType: string): ActivityType {
  if (sportType === 'TrailRun') return 'TrailRun'
  if (sportType === 'VirtualRun') return 'VirtualRun'
  return 'Run'
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
  const after = lastSyncedAt
    ? Math.floor(new Date(lastSyncedAt).getTime() / 1000)
    : 0

  let page = 1
  let totalFetched = 0
  const syncStart = new Date().toISOString()

  while (true) {
    const params = new URLSearchParams({ per_page: String(PER_PAGE), page: String(page) })
    if (after > 0) params.set('after', String(after))

    const raw = await stravaFetch<StravaActivity[]>(`/athlete/activities?${params}`)

    const runs = raw
      .filter(a => RUNNING_TYPES.has(a.sport_type ?? a.type))
      .map(mapStravaActivity)

    if (runs.length > 0) await upsertActivities(runs)

    totalFetched += raw.length
    onProgress?.(totalFetched)

    if (raw.length < PER_PAGE) break
    page++
  }

  await setSetting('lastSyncedAt', syncStart)
  return { fetched: totalFetched }
}
