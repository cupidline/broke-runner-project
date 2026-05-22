import { Link } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { ArrowRight } from 'lucide-react'
import { formatPace, formatDuration, formatRelativeDate, formatTRIMP } from '@/lib/utils/format'
import type { Activity } from '@/types'

interface Props {
  activity: Activity
}

export default function LastRunCard({ activity }: Props) {
  return (
    <Link to={`/runs/${activity.id}`} className="block focus-visible:outline-accent rounded-xl">
      <Card className="hover:border hover:border-accent/30 transition-colors">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
              Last Run
            </p>
            <p className="text-text-primary font-medium truncate mt-0.5">
              {activity.name}
            </p>
            <p className="text-text-secondary text-xs mt-0.5">
              {formatRelativeDate(activity.startDate)}
            </p>
          </div>
          <ArrowRight size={16} className="text-text-muted shrink-0 mt-1" />
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xl font-bold tabular-nums text-text-primary">
              {(activity.distanceMeters / 1000).toFixed(1)}
            </p>
            <p className="text-xs text-text-secondary">km</p>
          </div>
          {activity.avgPaceSecPerKm ? (
            <div>
              <p className="text-xl font-bold tabular-nums text-text-primary">
                {formatPace(activity.avgPaceSecPerKm).replace('/km', '')}
              </p>
              <p className="text-xs text-text-secondary">/km</p>
            </div>
          ) : (
            <div>
              <p className="text-xl font-bold tabular-nums text-text-primary">
                {formatDuration(activity.durationSeconds)}
              </p>
              <p className="text-xs text-text-secondary">time</p>
            </div>
          )}
          <div>
            <p className="text-xl font-bold tabular-nums text-text-primary">
              {activity.avgHeartRate ? `${Math.round(activity.avgHeartRate)}` : '—'}
            </p>
            <p className="text-xs text-text-secondary">avg bpm</p>
          </div>
        </div>

        {activity.trimp !== undefined && (
          <div className="mt-3 flex items-center gap-2">
            <Badge label={`TRIMP ${formatTRIMP(activity.trimp)}`} color="muted" />
            {activity.type !== 'Run' && (
              <Badge label={activity.type} color="accent" />
            )}
          </div>
        )}
      </Card>
    </Link>
  )
}
