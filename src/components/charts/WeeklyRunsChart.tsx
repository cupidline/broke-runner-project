import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, startOfISOWeek } from 'date-fns'
import type { Activity } from '@/types'

interface Props {
  activities: Activity[]
  fromDate: Date
}

interface ChartTooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

function getWeekStart(dateStr: string): string {
  return startOfISOWeek(new Date(dateStr)).toISOString().slice(0, 10)
}

function CustomTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  const count = payload[0]?.value as number ?? 0
  return (
    <div className="bg-surface border border-muted/30 rounded-lg p-3">
      <p className="text-text-secondary text-xs mb-1">Week of {label}</p>
      <p className="text-warning text-sm font-medium tabular-nums">
        {count} {count === 1 ? 'run' : 'runs'}
      </p>
    </div>
  )
}

export default function WeeklyRunsChart({ activities, fromDate }: Props) {
  const weekMap = new Map<string, number>()
  for (const a of activities) {
    if (new Date(a.startDate) < fromDate) continue
    const week = getWeekStart(a.startDate)
    weekMap.set(week, (weekMap.get(week) ?? 0) + 1)
  }

  if (weekMap.size === 0) return null

  const data = Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, count]) => ({
      week: format(new Date(week), 'MMM d'),
      runs: count,
    }))

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(82,82,91,0.25)" vertical={false} />
        <XAxis dataKey="week" tick={{ fill: '#A1A1AA', fontSize: 10 }} />
        <YAxis tick={{ fill: '#A1A1AA', fontSize: 10 }} allowDecimals={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(82,82,91,0.15)' }} />
        <Bar dataKey="runs" fill="#FBBF24" radius={[3, 3, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  )
}
