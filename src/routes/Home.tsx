import { useLatestMetrics, useMetricsHistory } from '@/hooks/useMetrics'
import { useLatestActivity, useActivityCount } from '@/hooks/useActivities'
import { useSettings } from '@/hooks/useSettings'
import { buildRecommendation } from '@/lib/metrics/recommendation'
import ReadinessCard from '@/components/home/ReadinessCard'
import FitnessFormCards from '@/components/home/FitnessFormCards'
import RecommendationCard from '@/components/home/RecommendationCard'
import LastRunCard from '@/components/home/LastRunCard'
import { useNavigate } from 'react-router-dom'

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

export default function Home() {
  const metrics = useLatestMetrics()
  const history = useMetricsHistory(30)
  const latestActivity = useLatestActivity()
  const activityCount = useActivityCount()
  const settings = useSettings()

  // Show empty state once we know there are no activities
  if (activityCount === 0) return <NoDataState />

  // Show skeletons while Dexie queries settle
  if (!metrics || !settings) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-60" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-32" />
        <Skeleton className="h-28" />
      </div>
    )
  }

  const recommendation = buildRecommendation(
    metrics.readiness,
    settings.recommendationMode,
    settings.maxHR,
    settings.restHR,
  )

  return (
    <div className="p-4 space-y-3 pb-6">
      <ReadinessCard readiness={metrics.readiness} tsb={metrics.tsb} />
      <FitnessFormCards current={metrics} history={history} />
      <RecommendationCard recommendation={recommendation} />
      {latestActivity && <LastRunCard activity={latestActivity} />}
    </div>
  )
}
