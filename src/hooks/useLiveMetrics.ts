import { useState, useEffect, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db/schema'
import { calcLiveMetrics, type LiveMetrics } from '@/lib/metrics/liveMetrics'
import { calcVO2max } from '@/lib/metrics/vo2max'
import { useSettings } from './useSettings'

export function useLiveMetrics(): LiveMetrics | undefined {
  const [nowMs, setNowMs] = useState(() => Date.now())
  const settings = useSettings()

  // Tick every 60 s so readiness updates as time passes even without a new run
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  // Last 2 stored DailyMetrics — we use the older as the base and replay from there
  const last2 = useLiveQuery(
    () => db.dailyMetrics.orderBy('date').reverse().limit(2).toArray(),
    [],
  )

  // Activities from last 8 days: covers the replay window + 7-day monotony window
  const cutoff = useMemo(() => {
    const d = new Date(nowMs)
    d.setUTCDate(d.getUTCDate() - 8)
    return d.toISOString().slice(0, 10)
  }, [nowMs])

  const recentActivities = useLiveQuery(
    () => db.activities.where('startDate').aboveOrEqual(cutoff).toArray(),
    [cutoff],
    [],
  )

  return useMemo(() => {
    if (!last2 || last2.length === 0 || !settings) return undefined

    const lastStored = last2[0]   // most recent stored day
    const prevStored = last2[1]   // day before that

    // Only one stored day — not enough for continuous replay, return as-is
    if (!prevStored) return { ...lastStored, asOf: nowMs }

    const vo2max = calcVO2max(settings.maxHR, settings.restHR)

    // End of prevStored.date in UTC = the replay window starts here
    const prevDateEndMs = new Date(prevStored.date + 'T00:00:00Z').getTime() + 86_400_000

    return calcLiveMetrics(
      prevStored.ctl,
      prevStored.atl,
      prevDateEndMs,
      recentActivities ?? [],
      nowMs,
      settings.maxHR,
      settings.restHR,
      vo2max,
      lastStored.enduranceCapacity,
    )
  }, [last2, recentActivities, nowMs, settings])
}
