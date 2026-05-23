import { Timer } from 'lucide-react'

export default function DurationDisplay({ minutes }: { minutes: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <Timer size={13} className="text-text-secondary shrink-0" />
      <span className="text-sm text-text-primary tabular-nums font-medium">{minutes} min</span>
    </div>
  )
}
