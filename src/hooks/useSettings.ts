import { useLiveQuery } from 'dexie-react-hooks'
import { getAllSettings } from '@/lib/db/settings'
import type { UserSettings } from '@/types'

export function useSettings(): UserSettings | undefined {
  return useLiveQuery(() => getAllSettings(), [])
}
