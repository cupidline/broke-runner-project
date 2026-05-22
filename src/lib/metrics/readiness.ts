import type { ReadinessBand } from '@/types'

export interface ReadinessInputs {
  tsb: number
  acwr: number
  monotony: number
}

// TSB score: centered around +5 (optimal form)
function tsbScore(tsb: number): number {
  if (tsb > 20) return 55       // peaked/detraining
  if (tsb > 5) return 90        // fresh
  if (tsb > -10) return 80      // trainable
  if (tsb > -25) return 45      // fatigued
  return 15                      // cooked
}

// ACWR score: safe zone is 0.8–1.3
function acwrScore(acwr: number): number {
  if (acwr === 0) return 70
  if (acwr < 0.5) return 40
  if (acwr <= 1.0) return 95
  if (acwr <= 1.3) return 80
  if (acwr <= 1.5) return 50
  return 20
}

// Monotony score: low variation is bad
function monotonyScore(monotony: number): number {
  if (monotony < 1.5) return 95
  if (monotony < 2.0) return 65
  return 30
}

export function calcReadiness({ tsb, acwr, monotony }: ReadinessInputs): number {
  const score = tsbScore(tsb) * 0.5 + acwrScore(acwr) * 0.3 + monotonyScore(monotony) * 0.2
  return Math.round(Math.max(0, Math.min(100, score)))
}

export function readinessBand(score: number): ReadinessBand {
  if (score >= 80) return 'peaked'
  if (score >= 65) return 'fresh'
  if (score >= 45) return 'trainable'
  if (score >= 30) return 'fatigued'
  return 'cooked'
}
