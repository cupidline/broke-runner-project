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
