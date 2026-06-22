// Banister TRIMP: duration_min × HRR × e^(b × HRR), b = 1.67 (men)
const B = 1.67

// Zone-based intensity multiplier (Karvonen HRR boundaries matching zones.ts).
// Banister's exponential alone only makes Z5 ~1.7× more expensive per minute
// than Z2. This multiplier reflects the actual recovery cost difference:
// Z5 demands 48–72 h recovery, Z2 demands ~12 h — that ratio should show in TRIMP.
function intensityMultiplier(hrr: number): number {
  if (hrr >= 0.90) return 2.5  // Z5 — anaerobic, high metabolic / neuromuscular cost
  if (hrr >= 0.80) return 1.7  // Z4 — threshold, significant lactate accumulation
  if (hrr >= 0.70) return 1.3  // Z3 — tempo, meaningful aerobic stress
  return 1.0                    // Z1–Z2 — base aerobic, standard Banister weight
}

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
  return durationMin * hrr * Math.exp(B * hrr) * intensityMultiplier(hrr)
}

// Maps Borg CR10 RPE (1-10) to approximate HRR: RPE 1→0.50, RPE 10→0.90
export function rpeToHRR(rpe: number): number {
  return 0.45 + (Math.max(1, Math.min(10, rpe)) / 10) * 0.45
}

export function calcTRIMPfromRPE(durationSeconds: number, rpe: number): number {
  if (durationSeconds <= 0) return 0
  const durationMin = durationSeconds / 60
  const hrr = rpeToHRR(rpe)
  return durationMin * hrr * Math.exp(B * hrr) * intensityMultiplier(hrr)
}
