import { useStrava } from '@/hooks/useStrava'

export default function Settings() {
  const { isAuthed, isLoading, login, logout } = useStrava()

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Settings</h1>

      {/* Strava */}
      <section aria-labelledby="strava-heading" className="mb-8">
        <h2 id="strava-heading" className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">
          Strava
        </h2>
        <div className="bg-surface rounded-lg p-4 flex items-center justify-between">
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
      </section>

      {/* More sections will be added in Phase 7 */}
      <p className="text-text-muted text-sm">More settings coming soon.</p>
    </div>
  )
}
