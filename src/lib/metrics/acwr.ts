// Acute:Chronic Workload Ratio using EWMA values from PMC
// Safe band: 0.8 – 1.3
export function calcACWR(atl: number, ctl: number): number {
  if (ctl <= 0) return 0
  return atl / ctl
}

export type ACWRRisk = 'undertraining' | 'safe' | 'caution' | 'danger'

export function acwrRisk(acwr: number): ACWRRisk {
  if (acwr < 0.5) return 'undertraining'
  if (acwr <= 1.3) return 'safe'
  if (acwr <= 1.5) return 'caution'
  return 'danger'
}

export type ACWRBand = 'undertrained' | 'easy' | 'optimal' | 'caution' | 'danger'

export interface ACWRBandConfig {
  label: string
  description: string
  color: string
}

export const ACWR_BAND_CONFIG: Record<ACWRBand, ACWRBandConfig> = {
  undertrained: { label: 'Undertrained', description: 'Way below baseline — detraining',         color: '#71717A' },
  easy:         { label: 'Easy week',    description: 'Recovery or taper territory',              color: '#7DD3FC' },
  optimal:      { label: 'Optimal',      description: 'Training at your sweet spot',              color: '#34D399' },
  caution:      { label: 'Caution',      description: 'Pushing above baseline — monitor closely', color: '#F59E0B' },
  danger:       { label: 'Danger',       description: 'Load spike — injury risk elevated',        color: '#F87171' },
}

export function acwrBand(acwr: number): ACWRBand {
  if (acwr < 0.5)  return 'undertrained'
  if (acwr < 0.8)  return 'easy'
  if (acwr <= 1.3) return 'optimal'
  if (acwr <= 1.5) return 'caution'
  return 'danger'
}
