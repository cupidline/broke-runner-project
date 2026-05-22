// Uth-Sørensen-Overgaard-Pedersen formula (requires only MaxHR and RestHR)
export function calcVO2max(maxHR: number, restHR: number): number {
  return 15.3 * (maxHR / restHR)
}

// Normalized to 0-100 (30 ml/kg/min → 0, 70 ml/kg/min → 100)
export function normalizeVO2max(vo2max: number): number {
  return Math.max(0, Math.min(100, ((vo2max - 30) / (70 - 30)) * 100))
}
