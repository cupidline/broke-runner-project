import { useLiveQuery } from 'dexie-react-hooks'
import { buildAuthUrl } from '@/lib/strava/auth'
import { db } from '@/lib/db/schema'

export function useStrava() {
  const accessToken = useLiveQuery(
    () => db.settings.get('stravaAccessToken').then(r => r?.value as string | undefined),
    [],
  )

  const isAuthed = Boolean(accessToken)

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
