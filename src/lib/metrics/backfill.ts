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
import { calcEnduranceCapacity } from './enduranceCapacity'
import { calcVO2max } from './vo2max'
import { calcPersonalCalibration, DEFAULT_CALIBRATION } from './personalCalibration'
import type { Activity, DailyMetrics } from '@/types'
import { ACTIVITY_MULTIPLIER } from '@/types'

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
    const rawTrimp = computeActivityTRIMP(activity, maxHR, restHR)
    if (rawTrimp > 0) {
      const multiplier = ACTIVITY_MULTIPLIER[activity.type] ?? 0.5
      const trimp = rawTrimp * multiplier
      const date = activity.startDate.slice(0, 10)
      dayMap.set(date, (dayMap.get(date) ?? 0) + trimp)
      if (activity.trimp !== trimp) {
        updatedActivities.push({ ...activity, trimp })
      }
    }
  }

  if (updatedActivities.length > 0) {
    await upsertActivities(updatedActivities)
  }

  const dayLoads = Array.from(dayMap.entries()).map(([date, trimp]) => ({ date, trimp }))
  const pmcPoints = calcPMC(dayLoads)
  if (pmcPoints.length === 0) return

  const vo2max = calcVO2max(maxHR, restHR)

  // Derive personal calibration from the full TSB/ACWR history before scoring each day
  const calibration = calcPersonalCalibration(
    pmcPoints.map(p => ({ tsb: p.tsb, acwr: calcACWR(p.atl, p.ctl), ctl: p.ctl })),
  ) ?? DEFAULT_CALIBRATION

  // Pre-build date-indexed activity lookup for endurance capacity components
  // actsByDate: date string → [durationSeconds]
  const actsByDate = new Map<string, number[]>()
  for (const a of activities) {
    const d = a.startDate.slice(0, 10)
    const bucket = actsByDate.get(d) ?? []
    bucket.push(a.durationSeconds)
    actsByDate.set(d, bucket)
  }

  function getDatesInWindow(endDate: string, days: number): string[] {
    const end = new Date(endDate)
    const result: string[] = []
    for (let i = 0; i < days; i++) {
      const d = new Date(end)
      d.setUTCDate(d.getUTCDate() - i)
      result.push(d.toISOString().slice(0, 10))
    }
    return result
  }

  function getWeekStart(dateStr: string): string {
    const d = new Date(dateStr)
    const day = d.getUTCDay() // 0=Sun
    d.setUTCDate(d.getUTCDate() - day)
    return d.toISOString().slice(0, 10)
  }

  const result: DailyMetrics[] = pmcPoints.map((point, index) => {
    const windowStart = Math.max(0, index - 6)
    const windowLoads = pmcPoints
      .slice(windowStart, index + 1)
      .map(p => dayMap.get(p.date) ?? 0)

    const acwr = calcACWR(point.atl, point.ctl)
    const monotony = calcMonotony(windowLoads)
    const strain = calcStrain(windowLoads, monotony)
    const readiness = calcReadiness({ tsb: point.tsb, acwr, monotony, ctl: point.ctl }, calibration)
    const fitnessScore = calcFitnessScore({ ctl: point.ctl, vo2max })

    // ── Endurance Capacity ──────────────────────────────────────────────
    // longRunCapacity: max long run (≥60 min) in last 14 days
    const last14 = getDatesInWindow(point.date, 14)
    let maxLongRunMin = 0
    for (const d of last14) {
      for (const sec of actsByDate.get(d) ?? []) {
        const min = sec / 60
        if (min >= 60 && min > maxLongRunMin) maxLongRunMin = min
      }
    }

    // weeklyTRIMP: sum of dayMap in last 7 days
    const last7 = getDatesInWindow(point.date, 7)
    const weeklyTRIMP = last7.reduce((sum, d) => sum + (dayMap.get(d) ?? 0), 0)

    // longRunConsistency: how many of last 4 weeks had a run ≥60 min
    const weeksSet = new Set<string>()
    const last28 = getDatesInWindow(point.date, 28)
    for (const d of last28) {
      const durs = actsByDate.get(d) ?? []
      if (durs.some(s => s >= 60 * 60)) {
        weeksSet.add(getWeekStart(d))
      }
    }

    const enduranceCapacity = calcEnduranceCapacity({
      maxRecentLongRunMin: maxLongRunMin,
      weeklyTRIMP,
      longRunWeeksCount: weeksSet.size,
    })

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
      enduranceCapacity,
    }
  })

  await clearDailyMetrics()
  await upsertDailyMetrics(result)
}
