import { getAllActivities, upsertActivities } from '@/lib/db/activities'
import { upsertDailyMetrics, clearDailyMetrics } from '@/lib/db/dailyMetrics'
import { getAllSettings } from '@/lib/db/settings'
import { calcTRIMP, calcTRIMPfromRPE } from './trimp'
import { calcPMC } from './ctlAtlTsb'
import { calcACWR } from './acwr'
import { calcMonotony } from './monotony'
import { calcStrain } from './strain'
import { calcReadiness } from './readiness'
import { calcFitnessScore } from './fitnessScore'
import { calcVO2max } from './vo2max'
import type { Activity, DailyMetrics } from '@/types'

function computeActivityTRIMP(
  activity: Activity,
  maxHR: number,
  restHR: number,
): number {
  if (activity.trimpSource === 'hr' && activity.avgHeartRate) {
    return calcTRIMP({
      durationSeconds: activity.durationSeconds,
      avgHR: activity.avgHeartRate,
      maxHR,
      restHR,
    })
  }
  if (activity.trimpSource === 'rpe' && activity.rpe) {
    return calcTRIMPfromRPE(activity.durationSeconds, activity.rpe)
  }
  return 0
}

export async function backfillMetrics(): Promise<void> {
  const [activities, settings] = await Promise.all([getAllActivities(), getAllSettings()])
  const { maxHR, restHR } = settings

  // Compute TRIMP per activity, build date → total TRIMP map
  const dayMap = new Map<string, number>()
  const updatedActivities: Activity[] = []

  for (const activity of activities) {
    const trimp = computeActivityTRIMP(activity, maxHR, restHR)
    if (trimp > 0) {
      const date = activity.startDate.slice(0, 10)
      dayMap.set(date, (dayMap.get(date) ?? 0) + trimp)
      if (activity.trimp !== trimp) {
        updatedActivities.push({ ...activity, trimp })
      }
    }
  }

  // Persist TRIMP on activities that changed
  if (updatedActivities.length > 0) {
    await upsertActivities(updatedActivities)
  }

  const dayLoads = Array.from(dayMap.entries()).map(([date, trimp]) => ({ date, trimp }))
  const pmcPoints = calcPMC(dayLoads)
  if (pmcPoints.length === 0) return

  const vo2max = calcVO2max(maxHR, restHR)

  // Build the full daily metrics array
  const result: DailyMetrics[] = pmcPoints.map((point, index) => {
    // 7-day window ending on this day (for monotony/strain)
    const windowStart = Math.max(0, index - 6)
    const windowLoads = pmcPoints
      .slice(windowStart, index + 1)
      .map(p => dayMap.get(p.date) ?? 0)

    const acwr = calcACWR(point.atl, point.ctl)
    const monotony = calcMonotony(windowLoads)
    const strain = calcStrain(windowLoads, monotony)
    const readiness = calcReadiness({ tsb: point.tsb, acwr, monotony })
    const fitnessScore = calcFitnessScore({ ctl: point.ctl, vo2max })

    return {
      date: point.date,
      ctl: point.ctl,
      atl: point.atl,
      tsb: point.tsb,
      acwr,
      monotony,
      strain,
      readiness,
      fitnessScore,
    }
  })

  await clearDailyMetrics()
  await upsertDailyMetrics(result)
}
