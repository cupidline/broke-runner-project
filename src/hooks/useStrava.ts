import { useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { buildAuthUrl, refreshAccessToken } from '@/lib/strava/auth'
import { db } from '@/lib/db/schema'

const SEED_REFRESH_TOKEN = import.meta.env.VITE_STRAVA_REFRESH_TOKEN as string | undefined

export function useStrava() {
  // null = loaded but no token, undefined = still loading, string = has token
  const accessToken = useLiveQuery(
    () => db.settings.get('stravaAccessToken').then(r => r?.value as string ?? null),
    [],
  )

  const isAuthed = typeof accessToken === 'string'

  // Auto-bootstrap: if no token stored but env refresh token exists, silently authenticate
  useEffect(() => {
    if (accessToken !== null) return         // still loading or already authed
    if (!SEED_REFRESH_TOKEN) return
    refreshAccessToken(SEED_REFRESH_TOKEN).then(t => {
      db.settings.bulkPut([
        { key: 'stravaAccessToken',    value: t.access_token },
        { key: 'stravaRefreshToken',   value: t.refresh_token },
        { key: 'stravaTokenExpiresAt', value: t.expires_at },
      ])
    }).catch(() => {/* silent fail — user can still log in manually */})
  }, [accessToken])

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
