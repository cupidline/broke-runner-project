import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db/schema'
import {
  calcTRIMPCalibration,
  DEFAULT_TRIMP_CALIBRATION,
  type TRIMPCalibration,
} from '@/lib/metrics/personalCalibration'

export function usePersonalTRIMPBands(): TRIMPCalibration {
  const trimpValues = useLiveQuery(
    () => db.activities.toArray().then(acts => acts.map(a => a.trimp ?? 0)),
    [],
  )

  return useMemo(() => {
    if (!trimpValues) return DEFAULT_TRIMP_CALIBRATION
    return calcTRIMPCalibration(trimpValues) ?? DEFAULT_TRIMP_CALIBRATION
  }, [trimpValues])
}
