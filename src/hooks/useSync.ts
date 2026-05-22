import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { syncActivities } from '@/lib/sync/orchestrator'
import { db } from '@/lib/db/schema'

type SyncState = 'idle' | 'syncing' | 'error'

export function useSync() {
  const [state, setState] = useState<SyncState>('idle')
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const lastSyncedAt = useLiveQuery(
    () => db.settings.get('lastSyncedAt').then(r => r?.value as string | undefined),
    [],
  )

  async function sync() {
    if (state === 'syncing') return
    setState('syncing')
    setProgress(0)
    setErrorMsg(null)
    try {
      await syncActivities(fetched => setProgress(fetched))
      setState('idle')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Sync failed')
      setState('error')
    }
  }

  return { sync, state, progress, errorMsg, lastSyncedAt }
}
