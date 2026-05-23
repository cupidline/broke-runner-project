import type { Workout } from '@/types/workout'

export default function RestCard({ workout }: { workout: Workout }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-text-secondary leading-relaxed">{workout.rationale}</p>

      {workout.activeRecoveryOptions && workout.activeRecoveryOptions.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-text-muted mb-1.5">
            Active recovery options
          </p>
          <ul className="space-y-0.5">
            {workout.activeRecoveryOptions.map(opt => (
              <li key={opt} className="text-sm text-text-secondary flex items-start gap-1.5">
                <span className="text-text-muted mt-0.5">•</span>
                {opt}
              </li>
            ))}
          </ul>
        </div>
      )}

      {workout.avoid && workout.avoid.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-text-muted mb-1.5">Avoid</p>
          <ul className="space-y-0.5">
            {workout.avoid.map(item => (
              <li key={item} className="text-sm text-danger/80 flex items-start gap-1.5">
                <span className="mt-0.5">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
