import Card from '@/components/ui/Card'
import Sparkline from '@/components/ui/Sparkline'
import type { DailyMetrics } from '@/types'

interface Props {
  current: DailyMetrics
  history: DailyMetrics[]
}

function tsbColor(tsb: number): string {
  if (tsb > 10) return '#34D399'   // fresh / peaked
  if (tsb > -5) return '#7DD3FC'   // trainable
  if (tsb > -20) return '#FBBF24'  // fatigued
  return '#F87171'                  // cooked
}

export default function FitnessFormCards({ current, history }: Props) {
  const fitnessValues = history.map(d => d.fitnessScore)
  const ctlValues = history.map(d => d.ctl)
  const tsbValues = history.map(d => d.tsb)
  const tsbCol = tsbColor(current.tsb)

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Fitness Score */}
      <Card className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Fitness
        </p>
        <p className="text-4xl font-bold tabular-nums text-accent leading-none">
          {current.fitnessScore}
        </p>
        <p className="text-xs text-text-muted tabular-nums">
          CTL {current.ctl.toFixed(1)}
        </p>
        <div className="mt-1">
          <Sparkline values={fitnessValues.length > 1 ? fitnessValues : ctlValues} />
        </div>
      </Card>

      {/* Form (TSB) */}
      <Card className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Form
        </p>
        <p
          className="text-4xl font-bold tabular-nums leading-none"
          style={{ color: tsbCol }}
        >
          {current.tsb >= 0 ? '+' : ''}{Math.round(current.tsb)}
        </p>
        <p className="text-xs text-text-muted tabular-nums">
          ATL {current.atl.toFixed(1)}
        </p>
        <div className="mt-1">
          <Sparkline values={tsbValues} color={tsbCol} />
        </div>
      </Card>
    </div>
  )
}
