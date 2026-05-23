import { calcACWR } from './acwr'
import { calcMonotony } from './monotony'
import { calcStrain } from './strain'
import { calcReadiness } from './readiness'
import { calcFitnessScore } from './fitnessScore'
import { calcTRIMP, calcTRIMPfromRPE } from './trimp'
import type { Activity, DailyMetrics } from '@/types'

const CTL_TAU = 42
const ATL_TAU = 7

// Per-event contribution factor, consistent with daily formula at 1-day intervals
const K_CTL = 1 - Math.exp(-1 / CTL_TAU)
const K_ATL = 1 - Math.exp(-1 / ATL_TAU)

function decayPMC(ctl: number, atl: number, fromMs: number, toMs: number) {
  const days = (toMs - fromMs) / 86_400_000
  if (days <= 0) return { ctl, atl }
  return {
    ctl: ctl * Math.exp(-days / CTL_TAU),
    atl: atl * Math.exp(-days / ATL_TAU),
  }
}

function actTRIMP(a: Activity, maxHR: number, restHR: number): number {
  if (a.trimpSource === 'hr' && a.avgHeartRate)
    return calcTRIMP({ durationSeconds: a.durationSeconds, avgHR: a.avgHeartRate, maxHR, restHR })
  if (a.trimpSource === 'rpe' && a.rpe)
    return calcTRIMPfromRPE(a.durationSeconds, a.rpe)
  return 0
}

export interface LiveMetrics extends DailyMetrics {
  asOf: number  // Unix ms when this snapshot was computed
}

/**
 * Computes current CTL/ATL/TSB using continuous-time EWMA.
 *
 * Starts from prevCtl/prevAtl at prevDateEndMs, replays each activity in
 * recentActivities at its exact timestamp, then decays to nowMs.
 * This gives different readiness at 6am vs 6pm on the same day.
 *
 * @param prevCtl         CTL at end of the day before the last stored day
 * @param prevAtl         ATL at end of the day before the last stored day
 * @param prevDateEndMs   Unix ms for midnight ending that day (replay window start)
 * @param recentActivities Activities from ~last 8 days (for replay + monotony)
 * @param nowMs           Current Unix ms
 */
export function calcLiveMetrics(
  prevCtl: number,
  prevAtl: number,
  prevDateEndMs: number,
  recentActivities: Activity[],
  nowMs: number,
  maxHR: number,
  restHR: number,
  vo2max: number,
  lastEnduranceCapacity?: number,
): LiveMetrics {
  // ── Continuous EWMA ───────────────────────────────────────────────────────
  let ctl = prevCtl
  let atl = prevAtl
  let cursor = prevDateEndMs

  const replayEvents = recentActivities
    .filter(a => {
      const t = new Date(a.startDate).getTime()
      return t > prevDateEndMs && t <= nowMs
    })
    .sort((a, b) => a.startDate.localeCompare(b.startDate))

  for (const a of replayEvents) {
    const tMs = new Date(a.startDate).getTime()
    ;({ ctl, atl } = decayPMC(ctl, atl, cursor, tMs))
    cursor = tMs
    const trimp = actTRIMP(a, maxHR, restHR)
    if (trimp > 0) {
      ctl += trimp * K_CTL
      atl += trimp * K_ATL
    }
  }

  ;({ ctl, atl } = decayPMC(ctl, atl, cursor, nowMs))
  ctl = Math.max(0, ctl)
  atl = Math.max(0, atl)
  const tsb = ctl - atl

  // ── Monotony (last 7 calendar days) ──────────────────────────────────────
  const dayMap = new Map<string, number>()
  for (const a of recentActivities) {
    const t = actTRIMP(a, maxHR, restHR)
    if (t > 0) {
      const d = a.startDate.slice(0, 10)
      dayMap.set(d, (dayMap.get(d) ?? 0) + t)
    }
  }
  const last7: number[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(nowMs)
    d.setUTCDate(d.getUTCDate() - i)
    last7.push(dayMap.get(d.toISOString().slice(0, 10)) ?? 0)
  }
  const monotony = calcMonotony(last7)
  const strain = calcStrain(last7, monotony)

  // ── Derived ───────────────────────────────────────────────────────────────
  const acwr = calcACWR(atl, ctl)
  const readiness = calcReadiness({ tsb, acwr, monotony })
  const fitnessScore = calcFitnessScore({ ctl, vo2max })

  return {
    date: new Date(nowMs).toISOString().slice(0, 10),
    ctl,
    atl,
    tsb,
    acwr,
    monotony,
    strain,
    readiness,
    fitnessScore,
    enduranceCapacity: lastEnduranceCapacity,
    asOf: nowMs,
  }
}
