import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    // OAuth code exchange will be implemented in Phase 1
    navigate('/', { replace: true })
  }, [navigate])

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-text-secondary">Connecting to Strava…</p>
    </div>
  )
}
