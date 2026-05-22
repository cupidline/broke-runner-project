import { db } from './schema'
import type { UserSettings } from '@/types'

const DEFAULTS: UserSettings = {
  maxHR: 192,
  restHR: 53,
  recommendationMode: 'balanced',
  rpeEnabled: true,
}

export async function getSetting<K extends keyof UserSettings>(
  key: K,
): Promise<UserSettings[K]> {
  const row = await db.settings.get(key as string)
  return row !== undefined
    ? (row.value as UserSettings[K])
    : DEFAULTS[key]
}

export async function setSetting<K extends keyof UserSettings>(
  key: K,
  value: UserSettings[K],
): Promise<void> {
  await db.settings.put({ key: key as string, value })
}

export async function deleteSetting(key: keyof UserSettings): Promise<void> {
  await db.settings.delete(key as string)
}

export async function getAllSettings(): Promise<UserSettings> {
  const rows = await db.settings.toArray()
  const stored = Object.fromEntries(rows.map(r => [r.key, r.value]))
  return { ...DEFAULTS, ...stored } as UserSettings
}
