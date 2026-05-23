import { useState, useMemo } from 'react'
import Card from '@/components/ui/Card'
import Sparkline from '@/components/ui/Sparkline'
import { fitnessBand, FITNESS_BAND_CONFIG } from '@/lib/metrics/fitnessScore'
import { enduranceBand, ENDURANCE_BAND_CONFIG } from '@/lib/metrics/enduranceCapacity'
import { acwrBand, ACWR_BAND_CONFIG } from '@/lib/metrics/acwr'
import { ACWRBar } from '@/components/ui/ACWRBar'
import type { Activity, DailyMetrics } from '@/types'

interface Props {
  current: DailyMetrics
  history: DailyMetrics[]
  activities: Activity[]
}

function fmt(label: string, value: string) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-base font-bold tabular-nums text-text-primary leading-none">{value}</span>
      <span className="text-[10px] text-text-muted">{label}</span>
    </div>
  )
}

function PeriodSummary({ activities }: { activities: Activity[] }) {
  const [days, setDays] = useState<7 | 14>(7)

  const stats = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    const recent = activities.filter(a => new Date(a.startDate) >= cutoff)

    const totalKm       = recent.reduce((s, a) => s + a.distanceMeters / 1000, 0)
    const totalTRIMP    = recent.reduce((s, a) => s + (a.trimp ?? 0), 0)
    const totalElev     = recent.reduce((s, a) => s + (a.elevationGainMeters ?? 0), 0)
    const totalSec      = recent.reduce((s, a) => s + a.durationSeconds, 0)
    const hrRuns        = recent.filter(a => a.avgHeartRate)
    const avgHR         = hrRuns.length
      ? hrRuns.reduce((s, a) => s + a.avgHeartRate!, 0) / hrRuns.length
      : null

    const h = Math.floor(totalSec / 3600)
    const m = Math.round((totalSec % 3600) / 60)
    const timeStr = h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`
    const elevStr = totalElev >= 1000
      ? `${(totalElev / 1000).toFixed(1)}km`
      : `${Math.round(totalElev)}m`

    return {
      km:    totalKm.toFixed(1),
      trimp: Math.round(totalTRIMP).toString(),
      elev:  elevStr,
      hr:    avgHR ? `${Math.round(avgHR)} bpm` : '—',
      time:  timeStr,
      runs:  recent.length.toString(),
    }
  }, [activities, days])

  return (
    <Card>
      {/* Header + toggle */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Last {days} days
        </p>
        <div className="flex rounded-md overflow-hidden border border-muted/30">
          {([7, 14] as const).map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-2.5 py-0.5 text-xs font-medium transition-colors ${
                days === d
                  ? 'bg-accent text-bg'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {fmt('Distance',  `${stats.km} km`)}
        {fmt('Load',      `${stats.trimp} TRIMP`)}
        {fmt('Elevation', stats.elev)}
      </div>

      {/* Divider */}
      <div className="border-t border-muted/20 mb-3" />

      {/* Row 2 */}
      <div className="grid grid-cols-3 gap-2">
        {fmt('Avg HR', stats.hr)}
        {fmt('Time',   stats.time)}
        {fmt(Number(stats.runs) === 1 ? 'Run' : 'Runs', stats.runs)}
      </div>
    </Card>
  )
}

export default function FitnessFormCards({ current, history, activities }: Props) {
  const ctlValues      = history.map(d => d.ctl)
  const enduranceValues = history.map(d => d.enduranceCapacity ?? 0)
  const endurance      = current.enduranceCapacity ?? 0
  const band           = fitnessBand(current.fitnessScore)
  const bandCfg        = FITNESS_BAND_CONFIG[band]
  const eBand          = enduranceBand(endurance)
  const eBandCfg       = ENDURANCE_BAND_CONFIG[eBand]
  const aBand          = acwrBand(current.acwr)
  const aBandCfg       = ACWR_BAND_CONFIG[aBand]

  return (
    <div className="space-y-3">
      {/* Row 1: Fitness + Endurance */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="flex flex-col items-center text-center gap-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Fitness
          </p>
          <p className="text-4xl font-bold tabular-nums leading-none" style={{ color: bandCfg.color }}>
            {current.fitnessScore}
          </p>
          <p className="text-xs font-medium" style={{ color: bandCfg.color }}>
            {bandCfg.label}
          </p>
          <p className="text-[10px] text-text-muted leading-tight">
            {bandCfg.description}
          </p>
          <div className="mt-1">
            <Sparkline values={ctlValues.length > 1 ? ctlValues : [current.ctl]} />
          </div>
        </Card>

        <Card className="flex flex-col items-center text-center gap-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Endurance
          </p>
          <p className="text-4xl font-bold tabular-nums leading-none" style={{ color: eBandCfg.color }}>
            {endurance}
          </p>
          <p className="text-xs font-medium" style={{ color: eBandCfg.color }}>
            {eBandCfg.label}
          </p>
          <p className="text-[10px] text-text-muted leading-tight">
            {eBandCfg.description}
          </p>
          <div className="mt-1">
            <Sparkline values={enduranceValues.length > 1 ? enduranceValues : [endurance]} />
          </div>
        </Card>
      </div>

      {/* Row 2: Workload — full width */}
      <Card className="flex flex-col items-center text-center gap-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Workload
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tabular-nums leading-none" style={{ color: aBandCfg.color }}>
            {current.acwr.toFixed(2)}
          </span>
          <span className="text-xs font-medium" style={{ color: aBandCfg.color }}>
            {aBandCfg.label}
          </span>
        </div>
        <p className="text-[10px] text-text-muted">{aBandCfg.description}</p>
        <div className="w-full mt-1">
          <ACWRBar acwr={current.acwr} />
        </div>
      </Card>

      {/* Row 3: Period summary */}
      <PeriodSummary activities={activities} />
    </div>
  )
}
