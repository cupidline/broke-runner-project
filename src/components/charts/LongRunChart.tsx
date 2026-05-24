import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
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
  return (
    <div className="bg-surface border border-muted/30 rounded-lg p-3">
      <p className="text-text-secondary text-xs mb-1">Week of {label}</p>
      <p className="text-accent text-sm font-medium tabular-nums">
        {(payload[0]?.value as number ?? 0).toFixed(1)} km
      </p>
    </div>
  )
}

export default function LongRunChart({ activities, fromDate }: Props) {
  const weekMap = new Map<string, number>()
  for (const a of activities) {
    if (new Date(a.startDate) < fromDate) continue
    const week = getWeekStart(a.startDate)
    const km = a.distanceMeters / 1000
    weekMap.set(week, Math.max(weekMap.get(week) ?? 0, km))
  }

  if (weekMap.size === 0) return null

  const data = Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, km]) => ({
      week: format(new Date(week), 'MMM d'),
      km: Math.round(km * 10) / 10,
    }))

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(82,82,91,0.25)" vertical={false} />
        <XAxis dataKey="week" tick={{ fill: '#A1A1AA', fontSize: 10 }} />
        <YAxis tick={{ fill: '#A1A1AA', fontSize: 10 }} />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(82,82,91,0.3)' }} />
        <Line
          type="monotone"
          dataKey="km"
          stroke="#7DD3FC"
          strokeWidth={2}
          dot={{ r: 3, fill: '#7DD3FC', strokeWidth: 0 }}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
