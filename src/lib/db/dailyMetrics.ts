import { db } from './schema'
import type { DailyMetrics } from '@/types'

export async function upsertDailyMetrics(metrics: DailyMetrics[]): Promise<void> {
  await db.dailyMetrics.bulkPut(metrics)
}

export async function getDailyMetrics(from?: string, to?: string): Promise<DailyMetrics[]> {
  if (from && to) {
    return db.dailyMetrics.where('date').between(from, to, true, true).sortBy('date')
  }
  return db.dailyMetrics.orderBy('date').toArray()
}

export async function getLatestDailyMetrics(): Promise<DailyMetrics | undefined> {
  return db.dailyMetrics.orderBy('date').last()
}

export async function clearDailyMetrics(): Promise<void> {
  await db.dailyMetrics.clear()
}
