import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db/schema'
import type { DailyMetrics } from '@/types'

export function useLatestMetrics(): DailyMetrics | undefined {
  return useLiveQuery(() => db.dailyMetrics.orderBy('date').last(), [])
}

export function useMetricsHistory(days = 90): DailyMetrics[] {
  return useLiveQuery(
    () => {
      const from = new Date()
      from.setUTCDate(from.getUTCDate() - days)
      const fromStr = from.toISOString().slice(0, 10)
      return db.dailyMetrics.where('date').aboveOrEqual(fromStr).sortBy('date')
    },
    [days],
    [],
  )
}
