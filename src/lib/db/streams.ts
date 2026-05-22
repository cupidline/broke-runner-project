import { db } from './schema'

export interface ActivityStreams {
  heartrate?: number[]
  time?: number[]
  velocity_smooth?: number[]
  altitude?: number[]
}

export async function saveStreams(activityId: string, streams: ActivityStreams): Promise<void> {
  const rows = (Object.entries(streams) as [string, number[] | undefined][])
    .filter(([, data]) => data !== undefined)
    .map(([type, data]) => ({
      activityId,
      type,
      data: data as number[],
      time: streams.time ?? [],
    }))
  await db.streams.bulkPut(rows)
}

export async function getStream(activityId: string, type: string): Promise<number[] | undefined> {
  const row = await db.streams.get([activityId, type])
  return row?.data
}

export async function getActivityStreams(activityId: string): Promise<ActivityStreams> {
  const rows = await db.streams.where('activityId').equals(activityId).toArray()
  return Object.fromEntries(rows.map(r => [r.type, r.data])) as ActivityStreams
}

export async function hasStreams(activityId: string): Promise<boolean> {
  const count = await db.streams.where('activityId').equals(activityId).count()
  return count > 0
}
