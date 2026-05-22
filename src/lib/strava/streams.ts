import { stravaFetch } from './client'
import { saveStreams } from '@/lib/db/streams'
import type { StravaStream } from './types'
import type { ActivityStreams } from '@/lib/db/streams'

const STREAM_KEYS = 'heartrate,time,velocity_smooth,altitude'

export async function fetchAndSaveStreams(
  stravaId: number,
  activityId: string,
): Promise<void> {
  const raw = await stravaFetch<Record<string, StravaStream>>(
    `/activities/${stravaId}/streams?keys=${STREAM_KEYS}&key_by_type=true`,
  )

  const streams: ActivityStreams = {}
  if (raw.heartrate?.data)       streams.heartrate       = raw.heartrate.data
  if (raw.time?.data)            streams.time            = raw.time.data
  if (raw.velocity_smooth?.data) streams.velocity_smooth = raw.velocity_smooth.data
  if (raw.altitude?.data)        streams.altitude        = raw.altitude.data

  await saveStreams(activityId, streams)
}
