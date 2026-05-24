import { db } from './schema'

export interface ActivityStreams {
  heartrate?: number[]
  time?: number[]
  velocity_smooth?: number[]
  altitude?: number[]
  latlng?: [number, number][]
}

function unflattenLatlng(flat: number[]): [number, number][] {
  const pairs: [number, number][] = []
  for (let i = 0; i + 1 < flat.length; i += 2) pairs.push([flat[i], flat[i + 1]])
  return pairs
}

export async function saveStreams(activityId: string, streams: ActivityStreams): Promise<void> {
  const rows = []
  const { latlng, ...rest } = streams
  for (const [type, data] of Object.entries(rest) as [string, number[] | undefined][]) {
    if (data !== undefined) rows.push({ activityId, type, data, time: streams.time ?? [] })
  }
  if (latlng) {
    rows.push({ activityId, type: 'latlng', data: latlng.flat() as number[], time: streams.time ?? [] })
  }
  await db.streams.bulkPut(rows)
}

export async function getStream(activityId: string, type: string): Promise<number[] | undefined> {
  const row = await db.streams.get([activityId, type])
  return row?.data
}

export async function getActivityStreams(activityId: string): Promise<ActivityStreams> {
  const rows = await db.streams.where('activityId').equals(activityId).toArray()
  const result: ActivityStreams = {}
  for (const row of rows) {
    if (row.type === 'latlng') result.latlng = unflattenLatlng(row.data)
    else (result as Record<string, unknown>)[row.type] = row.data
  }
  return result
}

export async function hasStreams(activityId: string): Promise<boolean> {
  const count = await db.streams.where('activityId').equals(activityId).count()
  return count > 0
}
