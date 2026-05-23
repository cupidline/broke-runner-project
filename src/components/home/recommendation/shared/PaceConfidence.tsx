import type { PacePrediction } from '@/types/workout'

export default function PaceConfidence({ pace }: { pace: PacePrediction | undefined }) {
  if (!pace || pace.source === 'no_data') {
    return (
      <p className="text-[11px] text-text-muted italic mt-1">
        by effort — no recent data at this intensity
      </p>
    )
  }

  return (
    <p className="text-[11px] text-text-muted mt-1">
      ↑ {pace.confidenceLabel}
    </p>
  )
}
