import { normalizeVO2max } from './vo2max'

export interface FitnessInputs {
  ctl: number
  vo2max: number
  decouplingPct?: number  // undefined = no stream data, use neutral default
}

// CTL normalized: 100 CTL → full score (recreational ultra target)
function normalizeCtl(ctl: number): number {
  return Math.max(0, Math.min(100, ctl))
}

// Efficiency from aerobic decoupling: 0% → 100, 10%+ → 0
function efficiencyScore(decouplingPct?: number): number {
  if (decouplingPct === undefined) return 70  // neutral default before streams load
  return Math.max(0, Math.min(100, 100 - decouplingPct * 10))
}

export function calcFitnessScore({ ctl, vo2max, decouplingPct }: FitnessInputs): number {
  const ctlComponent = normalizeCtl(ctl) * 0.6
  const vo2Component = normalizeVO2max(vo2max) * 0.2
  const effComponent = efficiencyScore(decouplingPct) * 0.2
  return Math.round(Math.max(0, Math.min(100, ctlComponent + vo2Component + effComponent)))
}
