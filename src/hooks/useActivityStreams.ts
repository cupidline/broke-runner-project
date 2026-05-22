import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getActivityStreams } from '@/lib/db/streams'
import { fetchAndSaveStreams } from '@/lib/strava/streams'

export type StreamsState = 'idle' | 'loading' | 'ready' | 'error' | 'unavailable'

export function useActivityStreams(activityId: string, stravaId?: number) {
  const [state, setState] = useState<StreamsState>('idle')

  const streams = useLiveQuery(
    () => getActivityStreams(activityId),
    [activityId],
  )

  const hasStreams = streams && Object.values(streams).some(v => v && v.length > 0)

  useEffect(() => {
    if (hasStreams) { setState('ready'); return }
    if (!stravaId)  { setState('unavailable'); return }
    if (state === 'loading' || state === 'ready') return

    setState('loading')
    fetchAndSaveStreams(stravaId, activityId)
      .then(() => setState('ready'))
      .catch(() => setState('error'))
  }, [activityId, stravaId, hasStreams, state])

  return { streams: streams ?? {}, state }
}
