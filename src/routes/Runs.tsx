import { Link } from 'react-router-dom'
import { useActivities } from '@/hooks/useActivities'
import { formatDistanceToNow } from 'date-fns'

function formatPace(secPerKm: number): string {
  const min = Math.floor(secPerKm / 60)
  const sec = Math.round(secPerKm % 60)
  return `${min}:${String(sec).padStart(2, '0')}/km`
}

function formatDistance(meters: number): string {
  return `${(meters / 1000).toFixed(2)} km`
}

export default function Runs() {
  const activities = useActivities()

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 p-4">
        <p className="text-text-secondary text-center">No runs yet.</p>
        <p className="text-text-muted text-sm text-center">
          Connect Strava and sync in Settings to import your activities.
        </p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-text-primary mb-4">Runs</h1>
      <ul role="list" className="space-y-2">
        {activities.map(activity => (
          <li key={activity.id}>
            <Link
              to={`/runs/${activity.id}`}
              className="block bg-surface rounded-lg p-4 hover:border-accent/40 border border-transparent transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-text-primary font-medium truncate">{activity.name}</p>
                  <p className="text-text-secondary text-sm mt-0.5">
                    {formatDistanceToNow(new Date(activity.startDate), { addSuffix: true })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-text-primary font-medium tabular-nums">
                    {formatDistance(activity.distanceMeters)}
                  </p>
                  {activity.avgPaceSecPerKm && (
                    <p className="text-text-secondary text-sm tabular-nums">
                      {formatPace(activity.avgPaceSecPerKm)}
                    </p>
                  )}
                </div>
              </div>
              {activity.avgHeartRate && (
                <p className="text-text-muted text-xs mt-2 tabular-nums">
                  avg {Math.round(activity.avgHeartRate)} bpm
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
