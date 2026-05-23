import { db } from './schema'
import type { Activity } from '@/types'

export async function upsertActivities(activities: Activity[]): Promise<void> {
  await db.activities.bulkPut(activities)
}

export async function getActivity(id: string): Promise<Activity | undefined> {
  return db.activities.get(id)
}

export async function getAllActivities(): Promise<Activity[]> {
  return db.activities.orderBy('startDate').toArray()
}

export async function getLatestActivity(): Promise<Activity | undefined> {
  return db.activities.orderBy('startDate').last()
}

export async function updateActivity(activity: Activity): Promise<void> {
  await db.activities.put(activity)
}

export async function clearActivities(): Promise<void> {
  await db.activities.clear()
}
