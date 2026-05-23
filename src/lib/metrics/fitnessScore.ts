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
  const ctlComponent = normalizeCtl(ctl) * 0.5
  const vo2Component = normalizeVO2max(vo2max) * 0.3
  const effComponent = efficiencyScore(decouplingPct) * 0.2
  return Math.round(Math.max(0, Math.min(100, ctlComponent + vo2Component + effComponent)))
}

export type FitnessBand = 'detrained' | 'building' | 'base' | 'trained' | 'peak'

export interface FitnessBandConfig {
  label: string
  description: string
  color: string
}

export const FITNESS_BAND_CONFIG: Record<FitnessBand, FitnessBandConfig> = {
  detrained: { label: 'Detrained',  description: 'Fitness depleted — restart base training', color: '#71717A' },
  building:  { label: 'Building',   description: 'Load accumulating, aerobic base forming',   color: '#7DD3FC' },
  base:      { label: 'Base',       description: 'Solid foundation for regular running',       color: '#34D399' },
  trained:   { label: 'Trained',    description: 'Strong base, ready for hard efforts',        color: '#F59E0B' },
  peak:      { label: 'Peak',       description: 'Race-capable fitness, high load + efficiency', color: '#A78BFA' },
}

export function fitnessBand(score: number): FitnessBand {
  if (score >= 80) return 'peak'
  if (score >= 65) return 'trained'
  if (score >= 50) return 'base'
  if (score >= 30) return 'building'
  return 'detrained'
}
