import { useStrava } from '@/hooks/useStrava'
import { useSync } from '@/hooks/useSync'
import { useActivityCount } from '@/hooks/useActivities'
import { formatDistanceToNow } from 'date-fns'

export default function Settings() {
  const { isAuthed, isLoading, login, logout } = useStrava()
  const { sync, state: syncState, progress, errorMsg, lastSyncedAt } = useSync()
  const activityCount = useActivityCount()

  const lastSyncLabel = lastSyncedAt
    ? `${formatDistanceToNow(new Date(lastSyncedAt))} ago`
    : 'Never'

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Settings</h1>

      {/* Strava */}
      <section aria-labelledby="strava-heading" className="mb-6">
        <h2
          id="strava-heading"
          className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3"
        >
          Strava
        </h2>
        <div className="bg-surface rounded-lg divide-y divide-muted/20">
          {/* Connection */}
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-text-primary font-medium">Strava Account</p>
              <p className="text-text-secondary text-sm mt-0.5">
                {isLoading ? 'Loading…' : isAuthed ? 'Connected' : 'Not connected'}
              </p>
            </div>
            {!isLoading && (
              <button
                onClick={isAuthed ? logout : login}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isAuthed
                    ? 'bg-danger/10 text-danger hover:bg-danger/20'
                    : 'bg-accent text-bg hover:bg-accent-dim'
                }`}
              >
                {isAuthed ? 'Disconnect' : 'Connect Strava'}
              </button>
            )}
          </div>

          {/* Sync */}
          {isAuthed && (
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-text-primary font-medium">Sync Activities</p>
                <p className="text-text-secondary text-sm mt-0.5">
                  {syncState === 'syncing'
                    ? `Fetching… ${progress} activities`
                    : syncState === 'error'
                      ? errorMsg
                      : `Last synced: ${lastSyncLabel} · ${activityCount} runs`}
                </p>
              </div>
              <button
                onClick={sync}
                disabled={syncState === 'syncing'}
                className="px-4 py-2 rounded-md text-sm font-medium bg-surface border border-muted/40 text-text-primary hover:border-accent/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {syncState === 'syncing' ? 'Syncing…' : 'Sync now'}
              </button>
            </div>
          )}
        </div>
      </section>

      <p className="text-text-muted text-sm">More settings coming in a later phase.</p>
    </div>
  )
}
