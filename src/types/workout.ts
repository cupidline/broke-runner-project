export interface PacePrediction {
  source: 'recent_data' | 'limited_data' | 'single_run' | 'no_data'
  sampleSize: number
  minSecPerKm?: number       // p25 (faster end)
  medianSecPerKm?: number    // p50
  maxSecPerKm?: number       // p75 (slower end)
  confidenceLabel: string
  matchingRunIds?: string[]
}

export interface DistanceEstimate {
  single?: number
  range?: [number, number]
}

export interface WorkoutSegment {
  label: string
  durationMin: number
  hrRange?: [number, number]
  hrCeiling?: number
  pace?: PacePrediction
  distance?: DistanceEstimate
  effort?: number
  feelDescription?: string
  notes?: string
}

export type WorkoutType =
  | 'easy' | 'long' | 'recovery' | 'strides'
  | 'tempo' | 'threshold' | 'vo2max' | 'hills'
  | 'progression' | 'rest'

export interface Workout {
  type: WorkoutType
  rationale: string
  totalDurationMin: number
  totalDistanceEstKm?: DistanceEstimate
  segments?: WorkoutSegment[]
  // For simple steady workouts (easy / long / recovery)
  durationMin?: number
  hrCeiling?: number
  pace?: PacePrediction
  distance?: DistanceEstimate
  feelDescription?: string
  pacingTip?: string
  fuelingReminder?: boolean
  decouplingTarget?: number
  // For rest days
  activeRecoveryOptions?: string[]
  avoid?: string[]
}
