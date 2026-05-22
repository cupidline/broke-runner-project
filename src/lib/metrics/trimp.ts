// Banister TRIMP: duration_min × HRR × e^(b × HRR), b = 1.92
const B = 1.92

export interface TRIMPParams {
  durationSeconds: number
  avgHR: number
  maxHR: number
  restHR: number
}

export function calcTRIMP({ durationSeconds, avgHR, maxHR, restHR }: TRIMPParams): number {
  if (durationSeconds <= 0) return 0
  const durationMin = durationSeconds / 60
  const hrr = Math.max(0, Math.min(1, (avgHR - restHR) / (maxHR - restHR)))
  if (hrr === 0) return 0
  return durationMin * hrr * Math.exp(B * hrr)
}

// Maps Borg CR10 RPE (1-10) to approximate HRR: RPE 1→0.50, RPE 10→0.90
export function rpeToHRR(rpe: number): number {
  return 0.45 + (Math.max(1, Math.min(10, rpe)) / 10) * 0.45
}

export function calcTRIMPfromRPE(durationSeconds: number, rpe: number): number {
  if (durationSeconds <= 0) return 0
  const durationMin = durationSeconds / 60
  const hrr = rpeToHRR(rpe)
  return durationMin * hrr * Math.exp(B * hrr)
}
