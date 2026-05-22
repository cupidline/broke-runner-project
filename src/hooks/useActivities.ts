import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db/schema'
import type { Activity } from '@/types'

export function useActivities(): Activity[] {
  return useLiveQuery(
    () => db.activities.orderBy('startDate').reverse().toArray(),
    [],
    [],
  )
}

export function useActivity(id: string): Activity | undefined {
  return useLiveQuery(() => db.activities.get(id), [id])
}

export function useActivityCount(): number {
  return useLiveQuery(() => db.activities.count(), [], 0)
}
