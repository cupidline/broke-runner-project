import type { DistanceEstimate } from '@/types/workout'

interface Props {
  distance: DistanceEstimate | undefined
  label?: string
}

function fmt(km: number) {
  return km.toFixed(1)
}

export default function DistanceDisplay({ distance, label = 'DISTANCE' }: Props) {
  if (!distance) return null

  const text = distance.range
    ? `${fmt(distance.range[0])} – ${fmt(distance.range[1])} km`
    : distance.single != null
      ? `~${fmt(distance.single)} km`
      : null

  if (!text) return null

  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-text-muted">{label}</p>
      <p className="text-sm tabular-nums text-text-primary font-medium">{text}</p>
    </div>
  )
}
