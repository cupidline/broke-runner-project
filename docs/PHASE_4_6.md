# Phase 4.6 — Typed Workout Cards with Pace & Distance Prediction

> Continues from Phase 4 (Home Dashboard). Sits before Phase 4.7 (Manual Import + RPE).
> Depends on: Phase 3 (Metric computation library), Phase 4 (Home shell + basic recommendation card).

---

## Goal

Transform the recommendation card from generic "Easy Aerobic Run · 50 min · Z2 · HR<145" into rich, typed workout cards that show duration, HR target, pace prediction, and distance estimate — calibrated to the workout type and sourced from the user's actual recent data.

---

## Why this phase exists

Phase 4 ships a working but generic recommendation card. Phase 4.6 makes it useful:

- **Pace predictions sourced from user data**, not VDOT tables (per D-035)
- **Different card layouts per workout type** — easy runs show distance; tempo/threshold/intervals show pace + distance + time per segment
- **Honest "no data" fallback** when prediction confidence is low (per D-039)
- **Source attribution** always visible ("based on your last 6 runs at this HR")

This is the difference between an app that talks at you generically and one that learns from you.

---

## Display logic per workout type

### Easy runs — distance estimate only, no pace

For daily easy aerobic runs, the user runs by HR + feel. Pace varies day-to-day with heat, fatigue, terrain. Showing a pace range here adds noise without value.

What matters for easy runs:
- How long (duration)
- How hard (HR ceiling)
- Roughly how far (distance estimate, for route planning)
- How it should feel (RPE proxy)

**Easy card example (your real data):**
```
┌─────────────────────────────────────┐
│ TODAY · Easy Aerobic                │
│ Build the engine                    │
│                                     │
│ DURATION       50 min               │
│ HEART RATE     < 145 bpm            │
│ DISTANCE EST.  ~5.5 km              │
│                                     │
│ How it should feel:                 │
│ Conversational. If you couldn't     │
│ chat in full sentences, slow down.  │
└─────────────────────────────────────┘
```

Distance estimate = duration × median pace at that HR from recent data, shown as a single ~rough number (not a range — easy runs aren't precision tools).

### All other workout types — full pace, distance, and time per segment

For long runs, recovery, tempo, threshold, VO2max, hills, progression: show the full picture because the user needs to plan route and pacing strategy.

**Long run card (your real data):**
```
┌─────────────────────────────────────┐
│ TOMORROW · Long Run                 │
│ Long run due. Fuel properly.        │
│                                     │
│ DURATION       110 min              │
│ HEART RATE     < 145 bpm            │
│ TARGET PACE    9:00 – 9:20 /km      │
│ DISTANCE EST.  11.8 – 12.2 km       │
│                ↑ your last 5 long   │
│                  runs at this HR    │
│                                     │
│ Goal: <5% decoupling                │
│                                     │
│ Pacing tip:                         │
│ Start at the slow end. HR drift     │
│ should stay flat. Fuel from min 60. │
└─────────────────────────────────────┘
```

**Recovery card (your real data):**
```
┌─────────────────────────────────────┐
│ TODAY · Recovery                    │
│ Easy only. Recovery matters.        │
│                                     │
│ DURATION       30 min               │
│ HEART RATE     < 135 bpm            │
│ TARGET PACE    9:20 – 9:50 /km      │
│ DISTANCE EST.  3.0 – 3.2 km         │
│                or walk if needed    │
│                                     │
│ How it should feel:                 │
│ Almost a walk. The point is blood   │
│ flow, not training.                 │
└─────────────────────────────────────┘
```

**Tempo card (interval workout):**
```
┌─────────────────────────────────────┐
│ TODAY · Tempo Run                   │
│ Quality session                     │
│                                     │
│ WARM-UP                             │
│   15 min easy · HR<145              │
│   Dist. est: ~1.7 km                │
│                                     │
│ MAIN SET                            │
│   20 min continuous                 │
│   HR:    155 – 165 bpm              │
│   Pace:  7:30 – 7:50 /km            │
│   Dist:  2.5 – 2.7 km               │
│   Feel:  Comfortably hard,          │
│          3-4 word answers           │
│                                     │
│ COOL-DOWN                           │
│   10 min easy · HR<145              │
│   Dist. est: ~1.1 km                │
│                                     │
│ Total: ~45 min · ~5.5 km            │
└─────────────────────────────────────┘
```

Each segment shows pace + distance because the user is executing distinct phases.

**Intervals card (threshold/VO2max/hills):**
```
┌─────────────────────────────────────┐
│ TODAY · Threshold Intervals         │
│ Quality session                     │
│                                     │
│ WARM-UP                             │
│   15 min easy · HR<145              │
│                                     │
│ MAIN SET                            │
│   4 × 6 min @ threshold             │
│   Per rep:                          │
│     HR:    158 – 168 bpm            │
│     Pace:  7:15 – 7:35 /km          │
│     Dist:  ~800 m                   │
│   Rest:   90 sec easy jog           │
│                                     │
│ COOL-DOWN                           │
│   10 min easy · HR<145              │
│                                     │
│ Total: ~55 min · ~7 km              │
│                                     │
│ Tip: don't chase pace on rep 1.     │
│ Let HR climb naturally.             │
└─────────────────────────────────────┘
```

**Progression card:**
```
┌─────────────────────────────────────┐
│ TODAY · Progression Run             │
│ Build through the run               │
│                                     │
│ SEGMENT 1 (first third)             │
│   20 min · HR<145                   │
│   Pace: 9:00 – 9:20 /km             │
│   Dist: ~2.2 km                     │
│                                     │
│ SEGMENT 2 (middle third)            │
│   20 min · HR 145-155               │
│   Pace: 8:20 – 8:45 /km             │
│   Dist: ~2.4 km                     │
│                                     │
│ SEGMENT 3 (final third)             │
│   20 min · HR 155-165               │
│   Pace: 7:30 – 7:50 /km             │
│   Dist: ~2.7 km                     │
│                                     │
│ Total: 60 min · ~7.3 km             │
│                                     │
│ Don't race the start.               │
└─────────────────────────────────────┘
```

**Strides card (add-on):**
```
┌─────────────────────────────────────┐
│ TODAY · Easy + Strides              │
│ Build leg speed                     │
│                                     │
│ MAIN                                │
│   45 min easy · HR<145              │
│   Dist. est: ~5.0 km                │
│                                     │
│ STRIDES (last 10 min):              │
│   6 × 20 seconds                    │
│   Effort: 90% (not sprint)          │
│   Pace: by effort                   │
│   Recovery: 90 sec walk             │
│                                     │
│ Total: ~55 min · ~5.5 km            │
└─────────────────────────────────────┘
```

Strides don't get pace targets (effort-based, too short for stable pace).

**Rest day card:**
```
┌─────────────────────────────────────┐
│ TODAY · Rest                        │
│ You've earned it                    │
│                                     │
│ Active recovery options:            │
│  • 20-30 min easy walk              │
│  • Mobility/stretching              │
│  • Strength (light, optional)       │
│                                     │
│ Avoid: running, hard cardio         │
└─────────────────────────────────────┘
```

No pace, no distance, no HR. Just guidance.

---

## Display rules summary table

| Workout type | Pace shown? | Distance shown? | Format |
|---|---|---|---|
| Easy | ❌ no pace | ✅ single estimate | "~5.5 km" |
| Long | ✅ range | ✅ range | "9:00–9:20 /km", "11.8–12.2 km" |
| Recovery | ✅ range | ✅ range | "9:20–9:50 /km", "3.0–3.2 km" |
| Tempo | ✅ per-segment | ✅ per-segment + total | Segmented |
| Threshold | ✅ per-rep | ✅ per-rep + total | Segmented |
| VO2max | ✅ per-rep | ✅ per-rep + total | Segmented |
| Hills | ❌ effort only | ✅ total only | "Effort-based" |
| Progression | ✅ per-segment | ✅ per-segment + total | Segmented |
| Strides | ❌ effort only | ✅ main run only | "by effort" |
| Rest | — | — | No targets |

---

## Pace prediction algorithm

### High-level flow

```
function predictPace(workout, recentActivities, settings):
    1. Filter recent activities (last 60 days)
    2. Apply plausibility filter (remove sensor errors, very short runs)
    3. Find activities matching workout profile (HR ± 5, duration similar)
    4. Apply recency weighting (last 30 days 1.0, 30-60d 0.5, 60-90d 0.25)
    5. If sample size ≥ 5: return high-confidence range (p25-p75)
       Else if 2-4: return medium-confidence range with "limited data" flag
       Else if 1: return single value with "based on one recent run"
       Else: return no_data — display "by effort"
```

### Plausibility filtering

Exclude from prediction samples:

```ts
function isPlausibleSample(activity: Activity): boolean {
  // Too short — HR hasn't stabilized
  if (activity.durationMin < 15) return false;
  
  // HR sensor failure: very fast pace with very low HR
  const hrr = (activity.avgHR - settings.restHR) / (settings.maxHR - settings.restHR);
  if (activity.avgPaceSecPerKm < 480 && hrr < 0.40) return false;  // <8:00/km at <40% HRR
  
  // HR sensor failure: extremely low HR for any sustained run
  if (activity.avgHR < 90 && activity.durationMin > 15) return false;
  
  // Missing data
  if (!activity.avgHR || !activity.avgSpeed) return false;
  
  return true;
}
```

### Matching by workout profile

```ts
function matchesProfile(activity: Activity, workout: Workout): boolean {
  switch (workout.type) {
    case 'easy':
    case 'long':
      // Within ±8 bpm of target HR ceiling, leaning below
      return activity.avgHR <= workout.hrCeiling + 2 
          && activity.avgHR >= workout.hrCeiling - 8;
    
    case 'recovery':
      // At or below recovery HR ceiling
      return activity.avgHR <= workout.hrCeiling;
    
    case 'tempo':
    case 'threshold':
      // Within HR range, both bounds
      return activity.avgHR >= workout.hrRange[0] - 3 
          && activity.avgHR <= workout.hrRange[1] + 3;
    
    case 'vo2max':
      // High HR efforts only
      return activity.avgHR >= workout.hrRange[0] - 2;
    
    case 'hills':
    case 'strides':
      // No pace prediction for effort-based workouts
      return false;
    
    default:
      return false;
  }
}
```

### Recency weighting

```ts
function recencyWeight(daysAgo: number): number {
  if (daysAgo < 0) return 0;
  if (daysAgo <= 30) return 1.0;
  if (daysAgo <= 60) return 0.5;
  if (daysAgo <= 90) return 0.25;
  return 0;
}
```

When computing percentiles, weight each sample by its recency. A run from 3 days ago counts 4x more than a run from 75 days ago. Prevents stale "fast pace" predictions when fitness has shifted.

### Distance estimation

For workouts with pace prediction:
```ts
function estimateDistance(durationMin: number, pace: PacePrediction): [number, number] | number {
  if (pace.source === 'no_data') return null;
  
  const minPaceSec = pace.minSecPerKm;
  const maxPaceSec = pace.maxSecPerKm;
  
  const minDistanceKm = (durationMin * 60) / maxPaceSec;  // slower pace = less distance
  const maxDistanceKm = (durationMin * 60) / minPaceSec;  // faster pace = more distance
  
  return [minDistanceKm, maxDistanceKm];
}

// For easy runs (single estimate, no range)
function estimateDistanceSimple(durationMin: number, pace: PacePrediction): number {
  if (pace.source === 'no_data') return null;
  const medianPaceSec = pace.medianSecPerKm;
  return (durationMin * 60) / medianPaceSec;
}
```

For easy runs we still compute pace internally to derive distance — we just don't display the pace number.

---

## Data model

```ts
// src/types/workout.ts

export interface PacePrediction {
  source: 'recent_data' | 'limited_data' | 'single_run' | 'no_data';
  sampleSize: number;
  minSecPerKm?: number;       // p25 (faster end)
  medianSecPerKm?: number;    // p50
  maxSecPerKm?: number;       // p75 (slower end)
  confidenceLabel: string;    // "your last 6 runs at this HR"
  matchingRunIds?: string[];  // for debugging/transparency
}

export interface DistanceEstimate {
  single?: number;            // for easy runs
  range?: [number, number];   // for everything else
}

export interface WorkoutSegment {
  label: string;              // "Warm-up", "Main set", "Rep"
  durationMin: number;
  hrRange?: [number, number];
  hrCeiling?: number;
  pace?: PacePrediction;
  distance?: DistanceEstimate;
  effort?: number;            // RPE 1-10 for effort-based segments
  feelDescription?: string;
  notes?: string;
}

export type WorkoutType =
  | 'easy' | 'long' | 'recovery' | 'strides'
  | 'tempo' | 'threshold' | 'vo2max' | 'hills'
  | 'progression' | 'rest';

export interface Workout {
  type: WorkoutType;
  rationale: string;
  totalDurationMin: number;
  totalDistanceEstKm?: DistanceEstimate;
  segments?: WorkoutSegment[];  // for multi-segment workouts
  
  // For simple steady workouts (easy/long/recovery)
  durationMin?: number;
  hrCeiling?: number;
  pace?: PacePrediction;
  distance?: DistanceEstimate;
  
  feelDescription?: string;
  pacingTip?: string;
  fuelingReminder?: boolean;
  decouplingTarget?: number;
  
  // For rest days
  activeRecoveryOptions?: string[];
  avoid?: string[];
}
```

---

## File structure

```
src/
├── lib/
│   └── metrics/
│       └── pacePrediction/
│           ├── index.ts
│           ├── predict.ts            # Main entry point
│           ├── plausibility.ts       # Sample filtering
│           ├── matching.ts           # Workout-profile matching
│           ├── recency.ts            # Time-decay weighting
│           ├── distance.ts           # Distance estimation
│           └── __tests__/
│               ├── predict.test.ts
│               ├── plausibility.test.ts
│               ├── matching.test.ts
│               └── distance.test.ts
└── components/
    └── home/
        └── recommendation/
            ├── RecommendationCard.tsx     # Type switcher
            ├── workouts/
            │   ├── EasyWorkoutCard.tsx
            │   ├── LongRunCard.tsx
            │   ├── RecoveryCard.tsx
            │   ├── StridesCard.tsx
            │   ├── TempoCard.tsx
            │   ├── IntervalsCard.tsx       # threshold/vo2max/hills
            │   ├── ProgressionCard.tsx
            │   └── RestCard.tsx
            └── shared/
                ├── DurationDisplay.tsx
                ├── HRTarget.tsx
                ├── PaceDisplay.tsx          # range or single
                ├── DistanceDisplay.tsx
                ├── PaceConfidence.tsx       # "your last N runs..."
                ├── SegmentBlock.tsx         # for multi-segment workouts
                ├── FeelDescription.tsx
                └── EffortIndicator.tsx
```

---

## Tasks

### Pace prediction core

- [ ] `src/lib/metrics/pacePrediction/plausibility.ts`
  - [ ] `isPlausibleSample(activity, settings)` per algorithm above
  - [ ] Unit tests: HR sensor errors, very short runs, missing data

- [ ] `src/lib/metrics/pacePrediction/matching.ts`
  - [ ] `matchesProfile(activity, workout)` per workout type
  - [ ] Unit tests: each workout type's matching logic

- [ ] `src/lib/metrics/pacePrediction/recency.ts`
  - [ ] `recencyWeight(daysAgo)` step function
  - [ ] Unit tests: boundaries, edge cases

- [ ] `src/lib/metrics/pacePrediction/predict.ts`
  - [ ] `predictPaceForWorkout(workout, activities, settings)`
  - [ ] Returns `PacePrediction` object with source/confidence
  - [ ] Handles all confidence levels (5+ / 2-4 / 1 / 0 samples)
  - [ ] Weighted percentile calculation
  - [ ] Unit tests for all four confidence paths

- [ ] `src/lib/metrics/pacePrediction/distance.ts`
  - [ ] `estimateDistanceRange(durationMin, pace)` returns `[min, max]`
  - [ ] `estimateDistanceSimple(durationMin, pace)` returns single
  - [ ] Unit tests with known pace inputs

### Recommendation engine integration

- [ ] Update `src/lib/metrics/recommendation.ts` to attach `PacePrediction` to generated workouts
- [ ] For easy workouts: compute pace internally but only expose distance (single)
- [ ] For long/recovery: expose pace range + distance range
- [ ] For tempo/threshold/vo2max/progression: predict per-segment
- [ ] For hills/strides: skip pace prediction, mark as effort-based

### UI shared primitives

- [ ] `PaceDisplay` component
  - [ ] Renders single value, range, "by effort", or "—"
  - [ ] Adapts to confidence level (visual treatment for limited data)
  
- [ ] `DistanceDisplay` component
  - [ ] Renders single value or range
  - [ ] "~5.5 km" vs "11.8 – 12.2 km" formats
  
- [ ] `PaceConfidence` component
  - [ ] Renders attribution line ("your last N runs at this HR")
  - [ ] Different copy per confidence level

- [ ] `SegmentBlock` component
  - [ ] Reusable for multi-segment workouts (warm-up / main / cool-down)
  - [ ] Shows duration, HR target, pace, distance per segment

### Workout card components (one per type)

- [ ] `EasyWorkoutCard` — duration, HR, distance (single), feel
- [ ] `LongRunCard` — duration, HR, pace range, distance range, decoupling target, fueling reminder if >75min
- [ ] `RecoveryCard` — duration, HR, pace range, distance range, "or walk if needed"
- [ ] `StridesCard` — main block + strides block, effort-based on strides
- [ ] `TempoCard` — 3-segment layout, pace + distance per segment
- [ ] `IntervalsCard` — handles threshold/vo2max/hills, rep × duration format
- [ ] `ProgressionCard` — N-segment layout with escalating intensity
- [ ] `RestCard` — recovery options + avoid list

### Card switcher

- [ ] `RecommendationCard.tsx` — switches by `workout.type`, passes `workout` + `when` prop
- [ ] Used by Home page for both Today and Tomorrow

---

## Acceptance criteria

- ✅ Easy workout card shows distance estimate but NO pace number
- ✅ Long/recovery cards show pace range + distance range
- ✅ Interval cards show per-segment pace + distance
- ✅ Hill repeat and strides cards show "by effort" instead of pace
- ✅ Rest cards show no targets
- ✅ When sample size ≥ 5, "your last N runs at this HR" attribution visible
- ✅ When sample size 2-4, "limited data" label visible
- ✅ When sample size 0, pace replaced with "by effort" + explanation
- ✅ Plausibility filter excludes HR<90 + duration<15min + impossible pace/HR combos
- ✅ Recency weighting verified by test: same data with old runs vs recent runs produces different predictions
- ✅ All workout types pass unit tests for their card rendering
- ✅ Sample size displayed exactly (e.g., "your last 6 runs") — not approximate
- ✅ Distance estimate uses median pace for easy runs (single), p25/p75 for ranged
- ✅ Card layouts verified on 390px viewport

---

## Honest data assumptions

These notes affect prediction quality and should be documented in code comments:

1. **Pace predictions reflect recent fitness, not theoretical capacity.** A user in active fitness rebuild will see slower predictions than their historical peak. This is correct — predicting based on stale fast data would be misleading.

2. **Heat/humidity not currently factored.** Indonesian climate elevates HR by 5-15 bpm at the same effort. Future enhancement (backlog): factor temperature when available in activity data.

3. **No accommodation for terrain/elevation.** Hilly long runs will show slower paces than flat — and prediction won't know terrain. Acceptable for v1; route-aware prediction is a backlog item.

4. **First-run experience.** New users with <5 runs in any HR band will see "by effort" labels frequently. This is intentional. Don't fake predictions to hide this.

5. **Bad data degrades predictions silently.** If 3 of last 10 runs have HR sensor failures, the plausibility filter removes them — but a user might not realize why predictions changed. Future enhancement (backlog): "data quality" indicator in settings.

---

## Related decisions

- **D-035:** Pace prediction sourced exclusively from user's recent runs, never from VDOT tables
- **D-036:** Pace shown as range (p25-p75), not point estimate (except easy runs which show no pace)
- **D-037:** Recency-weighted pace prediction (30d=1.0, 60d=0.5, 90d=0.25)
- **D-038:** Plausibility filtering for prediction samples
- **D-039:** Pace prediction may return "no data" honestly — show "by effort" instead
- **D-040 (new):** Easy runs show distance estimate only, no pace number. All other workout types show pace + distance per segment.

---

## Estimated effort

- Pace prediction core (4 files): ~2 hours
- Recommendation engine integration: ~1 hour
- Shared UI primitives: ~1.5 hours
- 8 workout card components: ~3-4 hours
- Tests + edge cases: ~1.5 hours
- **Total: ~9-10 hours**

---

## What's next

After Phase 4.6, move to **Phase 4.7 (Manual Import + RPE)** as originally planned. Pace prediction infrastructure built here will also serve RPE-only activities (which won't have HR-based pace prediction, but the data model accommodates this naturally via the `source: 'no_data'` path).
