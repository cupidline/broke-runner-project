import { useLiveQuery } from 'dexie-react-hooks'
import { buildAuthUrl } from '@/lib/strava/auth'
import { db } from '@/lib/db/schema'

export function useStrava() {
  // null = loaded but no token, undefined = still loading, string = has token
  const accessToken = useLiveQuery(
    () => db.settings.get('stravaAccessToken').then(r => r?.value as string ?? null),
    [],
  )

  const isAuthed = typeof accessToken === 'string'

  function login() {
    window.location.href = buildAuthUrl()
  }

  async function logout() {
    await db.settings.bulkDelete([
      'stravaAccessToken',
      'stravaRefreshToken',
      'stravaTokenExpiresAt',
    ])
  }

  return { isAuthed, login, logout, isLoading: accessToken === undefined }
}
