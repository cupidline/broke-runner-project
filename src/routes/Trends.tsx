import { useState } from 'react'
import { useMetricsHistory } from '@/hooks/useMetrics'
import { useActivities, useActivityCount } from '@/hooks/useActivities'
import { useSettings } from '@/hooks/useSettings'
import Card from '@/components/ui/Card'
import PMCChart from '@/components/charts/PMCChart'
import WeeklyLoadChart from '@/components/charts/WeeklyLoadChart'
import WeeklyKmChart from '@/components/charts/WeeklyKmChart'
import LongRunChart from '@/components/charts/LongRunChart'
import WeeklyRunsChart from '@/components/charts/WeeklyRunsChart'
import ZoneTimeChart from '@/components/charts/ZoneTimeChart'

const RANGES = [
  { label: '4W',  days: 28 },
  { label: '8W',  days: 56 },
  { label: '6M',  days: 180 },
  { label: '1Y',  days: 365 },
] as const

type RangeLabel = typeof RANGES[number]['label']

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-surface rounded-xl animate-pulse ${className}`} />
}

export default function Trends() {
  const [range, setRange] = useState<RangeLabel>('8W')
  const selectedDays = RANGES.find(r => r.label === range)!.days

  const history = useMetricsHistory(selectedDays)
  const activities = useActivities()
  const activityCount = useActivityCount()
  const settings = useSettings()

  const fromDate = new Date()
  fromDate.setUTCDate(fromDate.getUTCDate() - selectedDays)

  if (activityCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center gap-2">
        <p className="text-text-secondary">No data yet.</p>
        <p className="text-text-muted text-sm">Sync your Strava activities in Settings.</p>
      </div>
    )
  }

  const isLoading = history.length === 0 && activityCount > 0

  return (
    <div className="p-4 space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Trends</h1>
        {/* Range picker */}
        <div className="flex bg-surface rounded-lg p-0.5 gap-0.5" role="group" aria-label="Date range">
          {RANGES.map(r => (
            <button
              key={r.label}
              onClick={() => setRange(r.label)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                range === r.label
                  ? 'bg-accent text-bg'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              aria-pressed={range === r.label}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* PMC */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Performance Management Chart
          </p>
        </div>
        <div className="flex gap-3 mb-3">
          {[
            { label: 'Fitness (CTL)', color: '#7DD3FC' },
            { label: 'Fatigue (ATL)', color: '#FBBF24' },
            { label: 'Form (TSB)',    color: '#34D399' },
          ].map(({ label, color }) => (
            <span key={label} className="flex items-center gap-1.5 text-xs text-text-secondary">
              <span className="w-3 h-0.5 rounded-full inline-block" style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>
        {isLoading ? (
          <div className="h-[220px] flex items-center justify-center">
            <span className="text-text-muted text-sm">Computing…</span>
          </div>
        ) : (
          <PMCChart data={history} />
        )}
      </Card>

      {/* Weekly Load (TRIMP) */}
      <Card>
        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">
          Weekly Load (TRIMP)
        </p>
        {isLoading ? (
          <Skeleton className="h-[160px]" />
        ) : (
          <WeeklyLoadChart activities={activities} fromDate={fromDate} />
        )}
      </Card>

      {/* Zone time */}
      <Card>
        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">
          Time in Zone
        </p>
        {isLoading || !settings ? (
          <Skeleton className="h-[140px]" />
        ) : (
          <ZoneTimeChart
            activities={activities}
            fromDate={fromDate}
            maxHR={settings.maxHR}
            restHR={settings.restHR}
          />
        )}
      </Card>

      {/* Weekly km */}
      <Card>
        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">
          Weekly Distance (km)
        </p>
        {isLoading ? (
          <Skeleton className="h-[160px]" />
        ) : (
          <WeeklyKmChart activities={activities} fromDate={fromDate} />
        )}
      </Card>

      {/* Long run progression */}
      <Card>
        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">
          Long Run Progression (km)
        </p>
        {isLoading ? (
          <Skeleton className="h-[160px]" />
        ) : (
          <LongRunChart activities={activities} fromDate={fromDate} />
        )}
      </Card>

      {/* Weekly runs count */}
      <Card>
        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">
          Runs per Week
        </p>
        {isLoading ? (
          <Skeleton className="h-[160px]" />
        ) : (
          <WeeklyRunsChart activities={activities} fromDate={fromDate} />
        )}
      </Card>
    </div>
  )
}
