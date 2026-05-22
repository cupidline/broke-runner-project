import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { format } from 'date-fns'
import type { DailyMetrics } from '@/types'

interface Props {
  data: DailyMetrics[]
}

interface ChartTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}

function CustomTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface border border-muted/30 rounded-lg p-3 shadow-lg">
      <p className="text-text-secondary text-xs mb-2">{label}</p>
      {payload.map(entry => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <span style={{ color: entry.color }}>●</span>
          <span className="text-text-secondary w-14">{entry.name}</span>
          <span className="text-text-primary tabular-nums font-medium">
            {(entry.value as number).toFixed(1)}
          </span>
        </div>
      ))}
    </div>
  )
}

function tickFormatter(date: string): string {
  try {
    return format(new Date(date), 'MMM d')
  } catch {
    return date
  }
}

export default function PMCChart({ data }: Props) {
  if (data.length === 0) return null

  // Recharts needs plain objects — spread to avoid Dexie proxies
  const chartData = data.map(d => ({
    date: d.date,
    Fitness: Math.round(d.ctl * 10) / 10,
    Fatigue: Math.round(d.atl * 10) / 10,
    Form: Math.round(d.tsb * 10) / 10,
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: -18 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(82,82,91,0.25)" />
        <XAxis
          dataKey="date"
          tickFormatter={tickFormatter}
          tick={{ fill: '#A1A1AA', fontSize: 10 }}
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fill: '#A1A1AA', fontSize: 10 }} />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={0} stroke="rgba(82,82,91,0.6)" strokeWidth={1} />
        <Line type="monotone" dataKey="Fitness" stroke="#7DD3FC" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="Fatigue" stroke="#FBBF24" strokeWidth={2} dot={false} />
        <Line
          type="monotone" dataKey="Form" stroke="#34D399" strokeWidth={1.5}
          dot={false} strokeDasharray="5 3"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
