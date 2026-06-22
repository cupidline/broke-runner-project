import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db/schema'
import {
  calcTRIMPCalibration,
  DEFAULT_TRIMP_CALIBRATION,
  type TRIMPCalibration,
} from '@/lib/metrics/personalCalibration'
import { RUNNING_TYPES } from '@/types'

export function usePersonalTRIMPBands(): TRIMPCalibration {
  // Calibrate against runs only — cross-training TRIMPs use different multipliers
  // and would pull thresholds down, inflating Extreme labels on normal runs.
  const trimpValues = useLiveQuery(
    () => db.activities
      .toArray()
      .then(acts => acts
        .filter(a => RUNNING_TYPES.has(a.type))
        .map(a => a.trimp ?? 0),
      ),
    [],
  )

  return useMemo(() => {
    if (!trimpValues) return DEFAULT_TRIMP_CALIBRATION
    return calcTRIMPCalibration(trimpValues) ?? DEFAULT_TRIMP_CALIBRATION
  }, [trimpValues])
}
