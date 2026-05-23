import { Heart } from 'lucide-react'

interface Props {
  ceiling?: number
  range?: [number, number]
}

export default function HRTarget({ ceiling, range }: Props) {
  const label = range
    ? `${range[0]}–${range[1]} bpm`
    : ceiling
      ? `< ${ceiling} bpm`
      : null

  if (!label) return null

  return (
    <div className="flex items-center gap-1.5">
      <Heart size={13} className="text-text-secondary shrink-0" />
      <span className="text-sm text-text-primary tabular-nums">{label}</span>
    </div>
  )
}
