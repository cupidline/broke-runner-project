import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { exchangeCode } from '@/lib/strava/auth'
import { setSetting } from '@/lib/db/settings'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const didRun = useRef(false)

  useEffect(() => {
    if (didRun.current) return
    didRun.current = true

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const err = params.get('error')

    if (err || !code) {
      setError(err ?? 'Missing authorization code')
      return
    }

    exchangeCode(code)
      .then(async tokens => {
        await setSetting('stravaAccessToken', tokens.access_token)
        await setSetting('stravaRefreshToken', tokens.refresh_token)
        await setSetting('stravaTokenExpiresAt', tokens.expires_at)
        navigate('/', { replace: true })
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Unknown error'))
  }, [navigate])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 p-4">
        <p className="text-danger text-center">Connection failed: {error}</p>
        <button
          className="text-accent underline"
          onClick={() => navigate('/settings', { replace: true })}
        >
          Back to Settings
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-text-secondary">Connecting to Strava…</p>
    </div>
  )
}
