import { useEffect, useRef } from 'react'
import { setSetting } from '@/lib/db/settings'
import type { RecommendationMode } from '@/types'
import { useMetricsHistory } from '@/hooks/useMetrics'
import { useLiveMetrics } from '@/hooks/useLiveMetrics'
import { useActivities, useLatestActivity, useActivityCount } from '@/hooks/useActivities'
import { useSettings } from '@/hooks/useSettings'
import { useSync } from '@/hooks/useSync'
import { buildRecommendation, buildTomorrowRecommendation } from '@/lib/metrics/recommendation'
import { projectPeak } from '@/lib/metrics/readiness'
import ReadinessCard from '@/components/home/ReadinessCard'
import FitnessFormCards from '@/components/home/FitnessFormCards'
import RecommendationCard from '@/components/home/recommendation/RecommendationCard'
import LastRunCard from '@/components/home/LastRunCard'
import { useNavigate } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'

const MODES: { value: RecommendationMode; label: string }[] = [
  { value: 'conservative', label: 'Conservative' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'progressive', label: 'Progressive' },
]

function ModeToggle({ mode }: { mode: RecommendationMode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
        Training approach
      </p>
      <div role="group" aria-label="Recommendation mode" className="flex rounded-lg overflow-hidden border border-muted/30">
        {MODES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setSetting('recommendationMode', value)}
            aria-pressed={mode === value}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              mode === value
                ? 'bg-accent text-bg'
                : 'bg-surface text-text-secondary hover:text-text-primary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-surface rounded-xl animate-pulse ${className}`} />
}

function NoDataState() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 p-6 text-center">
      <div className="text-5xl">🏃</div>
      <h2 className="text-xl font-bold text-text-primary">No runs yet</h2>
      <p className="text-text-secondary text-sm max-w-xs">
        Connect Strava and sync your activities to see your training readiness and recommendations.
      </p>
      <button
        onClick={() => navigate('/settings')}
        className="mt-2 px-5 py-2.5 bg-accent text-bg rounded-lg font-medium text-sm"
      >
        Go to Settings
      </button>
    </div>
  )
}


const AUTO_SYNC_INTERVAL_MS = 60 * 60 * 1000 // 1 hour

export default function Home() {
  const metrics = useLiveMetrics()
  const history = useMetricsHistory(30)
  const activities = useActivities()
  const latestActivity = useLatestActivity()
  const activityCount = useActivityCount()
  const settings = useSettings()
  const { sync, state: syncState, lastSyncedAt } = useSync()
  const autoSyncAttempted = useRef(false)

  // Auto-sync on open if last sync was > 1 hour ago
  useEffect(() => {
    if (autoSyncAttempted.current) return
    if (lastSyncedAt === undefined) return
    autoSyncAttempted.current = true
    const lastSync = lastSyncedAt ? new Date(lastSyncedAt).getTime() : 0
    if (Date.now() - lastSync > AUTO_SYNC_INTERVAL_MS) sync()
  }, [lastSyncedAt])

  if (activityCount === 0) return <NoDataState />

  if (!metrics || !settings) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-60" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-28" />
      </div>
    )
  }

  const peak = projectPeak(metrics.ctl, metrics.atl, metrics.acwr, metrics.monotony)

  const today = buildRecommendation(
    metrics.readiness,
    settings.recommendationMode,
    settings.maxHR,
    settings.restHR,
    activities,
  )

  const tomorrow = buildTomorrowRecommendation(
    metrics,
    settings.recommendationMode,
    settings.maxHR,
    settings.restHR,
    activities,
  )

  return (
    <div className="p-4 space-y-3 pb-6">
      <div className="flex items-center justify-end">
        <button
          onClick={sync}
          disabled={syncState === 'syncing'}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary transition-colors disabled:opacity-40"
          aria-label="Refresh"
        >
          <RefreshCw size={16} className={syncState === 'syncing' ? 'animate-spin' : ''} />
        </button>
      </div>
      <ReadinessCard readiness={metrics.readiness} tsb={metrics.tsb} peak={peak} asOf={metrics.asOf} />
      <FitnessFormCards current={metrics} history={history} activities={activities} />
      <ModeToggle mode={settings.recommendationMode} />
      <RecommendationCard workout={today} when="Today" />
      <RecommendationCard workout={tomorrow} when="Tomorrow" />
      {latestActivity && <LastRunCard activity={latestActivity} />}
    </div>
  )
}
