import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db/schema'
import {
  calcPersonalCalibration,
  DEFAULT_CALIBRATION,
  type ReadinessCalibration,
} from '@/lib/metrics/personalCalibration'

export function usePersonalCalibration(): ReadinessCalibration {
  const metrics90 = useLiveQuery(
    () => db.dailyMetrics.orderBy('date').reverse().limit(90).toArray(),
    [],
  )

  return useMemo(() => {
    if (!metrics90) return DEFAULT_CALIBRATION
    return calcPersonalCalibration(
      metrics90.map(m => ({ tsb: m.tsb, acwr: m.acwr, ctl: m.ctl })),
    ) ?? DEFAULT_CALIBRATION
  }, [metrics90])
}
