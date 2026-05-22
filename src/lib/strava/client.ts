import { refreshAccessToken } from './auth'
import { getSetting, setSetting } from '@/lib/db/settings'

const BASE = 'https://www.strava.com/api/v3'

async function getValidToken(): Promise<string> {
  const token = await getSetting('stravaAccessToken')
  const expiresAt = await getSetting('stravaTokenExpiresAt')
  const refresh = await getSetting('stravaRefreshToken')

  if (!token || !refresh) throw new Error('Not authenticated')

  // Refresh if token expires within the next 60 seconds
  if (expiresAt && Date.now() / 1000 > expiresAt - 60) {
    const fresh = await refreshAccessToken(refresh)
    await setSetting('stravaAccessToken', fresh.access_token)
    await setSetting('stravaRefreshToken', fresh.refresh_token)
    await setSetting('stravaTokenExpiresAt', fresh.expires_at)
    return fresh.access_token
  }

  return token
}

export async function stravaFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getValidToken()
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  })

  if (res.status === 429) {
    const retryAfter = Number(res.headers.get('X-RateLimit-Limit') ?? 60)
    throw new Error(`Rate limited. Retry after ${retryAfter}s.`)
  }

  if (!res.ok) throw new Error(`Strava API ${res.status}: ${path}`)
  return res.json() as Promise<T>
}
