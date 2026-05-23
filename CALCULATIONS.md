# Broke Runner — Calculations Reference

All metrics computed client-side in the browser. No server-side processing.

---

## TRIMP (Training Impulse)

**File:** `src/lib/metrics/trimp.ts`

Quantifies training load for a single activity using the Banister formula.

```
TRIMP = duration_min × HRR × e^(1.92 × HRR)
```

Where **HRR** (Heart Rate Reserve ratio) = `(avgHR − restHR) / (maxHR − restHR)`

The exponential term weights harder efforts disproportionately — a tempo run at 85% HRR scores significantly more than the same duration at 65% HRR.

**When HR is unavailable**, RPE maps linearly to HRR:

| RPE | HRR |
|-----|-----|
| 1   | 0.50 |
| 5   | 0.70 |
| 10  | 0.90 |

### Session Load Scale

Thresholds calibrated to MaxHR 192 / RestHR 53. TRIMP is nonlinear — duration doubles the score linearly, but intensity multiplies it exponentially.

```
  0      30      60            150            260                420              620+
  ├───────┼────────┼─────────────┼──────────────┼─────────────────┼────────────────▶
  Minimal  Recovery     Easy          Moderate          Hard          Very Hard   Extreme
```

| Category  | TRIMP     | Typical session example                         |
|-----------|-----------|--------------------------------------------------|
| Minimal   | 0 – 30    | Rest day, 20 min walk                            |
| Recovery  | 30 – 60   | 30 min easy Z1 (≤ 129 bpm)                       |
| Easy      | 60 – 150  | 60 min easy Z2 (~136) or 45 min tempo (~157)     |
| Moderate  | 150 – 260 | 90 min easy Z2 (~204) or 60 min threshold (~277) |
| Hard      | 260 – 420 | 120 min long Z2 (~272) or 2 h threshold          |
| Very Hard | 420 – 620 | 180 min long run (~408) or race-effort session   |
| Extreme   | 620+      | 4 h+ ultra-long effort (~543–679+)               |

> The same TRIMP can be reached via different combinations of time and intensity.  
> A 45 min tempo at Z3 (~157) scores the same as a 70 min easy Z2 run — the formula reflects that both create similar physiological stress.

---

## CTL — Chronic Training Load

**File:** `src/lib/metrics/ctlAtlTsb.ts`

Long-term fitness baseline. Exponentially weighted moving average of daily TRIMP over a **42-day** window.

```
CTL_today = CTL_yesterday + (TRIMP_today − CTL_yesterday) × (1 / 42)
```

Represents aerobic base built over the past ~6 weeks. Slow to build, slow to decay.

---

## ATL — Acute Training Load

**File:** `src/lib/metrics/ctlAtlTsb.ts`

Short-term fatigue. Same EWMA formula over a **7-day** window.

```
ATL_today = ATL_yesterday + (TRIMP_today − ATL_yesterday) × (1 / 7)
```

Reacts quickly to recent training — spikes after a hard week, drops fast during rest.

---

## TSB — Training Stress Balance

**File:** `src/lib/metrics/ctlAtlTsb.ts`

Current form. The difference between long-term fitness and short-term fatigue.

```
TSB = CTL − ATL
```

| Range | Meaning |
|-------|---------|
| > +10 | Fresh / possibly detrained |
| −10 to +10 | Balanced / race-ready zone |
| < −10 | Accumulated fatigue |
| < −30 | Overreaching risk |

---

## ACWR — Acute:Chronic Workload Ratio

**File:** `src/lib/metrics/acwr.ts`

Injury-risk proxy. Ratio of this week's load to the rolling baseline.

```
ACWR = ATL / CTL
```

| Range | Classification |
|-------|---------------|
| < 0.5 | Undertraining |
| 0.8 – 1.3 | Safe zone |
| 1.3 – 1.5 | Caution |
| > 1.5 | Danger (spike risk) |

---

## Monotony

**File:** `src/lib/metrics/monotony.ts`

How varied your daily training loads are across the week. High monotony = grinding the same workload every day.

```
Monotony = mean(daily TRIMP) / SD(daily TRIMP)
```

| Value | Interpretation |
|-------|---------------|
| < 1.5 | Good variation |
| 1.5 – 2.0 | Moderate monotony |
| > 2.0 | Dangerous monotony |

Returns 0 if fewer than 2 data points; returns 99 if all daily loads are identical and nonzero.

---

## Strain

**File:** `src/lib/metrics/strain.ts`

Combined measure of total stress accounting for how monotonously it was applied.

```
Strain = weekly load × Monotony
```

High strain with high monotony is worse than the same total load distributed unevenly across the week.

---

## Readiness Score

**File:** `src/lib/metrics/readiness.ts`

Single 0–100 score summarising how ready you are to train today. Weighted composite:

```
Readiness = (TSB_norm × 0.50) + (ACWR_score × 0.30) + (Monotony_score × 0.20)
```

**TSB score:** linear map −40…+20 → 0…100 (continuous — no step jumps)  
**ACWR score:** linear ramp 0→100 from ACWR 0.5→1.0, then 100→0 from 1.0→1.5; clamps to 0 outside  
**Monotony score:** 100 at monotony ≤ 1.0, linear decay to 0 at monotony ≥ 2.5

**Readiness bands:**

| Score | Band | Colour |
|-------|------|--------|
| ≥ 85 | Peaked | Green |
| ≥ 70 | Fresh | Teal |
| ≥ 50 | Trainable | Yellow |
| ≥ 30 | Fatigued | Orange |
| < 30 | Cooked | Red |

**Peak projection:** simulates 14 days of zero load forward using hourly EWMA decay to predict when readiness will peak.

---

## VO2max Estimate

**File:** `src/lib/metrics/vo2max.ts`

Estimated aerobic capacity using the Uth-Sørensen-Overgaard-Pedersen formula. Requires only resting and max heart rate — no lab test needed.

```
VO2max = 15.3 × (MaxHR / RestHR)
```

Normalised to 0–100 scale for use in Fitness Score:

```
VO2max_norm = (VO2max − 30) / (70 − 30) × 100
```

(30 ml/kg/min → 0, 70 ml/kg/min → 100)

---

## Aerobic Decoupling

**File:** `src/lib/metrics/decoupling.ts`

Measures how much HR drifted relative to pace across a run. Low decoupling = aerobic efficiency. High decoupling = cardiac drift / fatigue.

```
EF = speed / HR   (efficiency factor, each half)

Decoupling% = (EF_first_half − EF_second_half) / EF_first_half × 100
```

Positive % means HR rose (or pace dropped) in the second half — a sign of fatigue or heat stress. Values under 5% are generally considered aerobically efficient.

---

## Heart Rate Zones

**File:** `src/lib/metrics/zones.ts`

Five zones computed using the **Karvonen (HRR)** method:

```
HR_ceiling = RestHR + (HRR_threshold × (MaxHR − RestHR))
```

| Zone | HRR ceiling | Character |
|------|-------------|-----------|
| Z1   | 55%         | Recovery |
| Z2   | 70%         | Aerobic base |
| Z3   | 80%         | Tempo |
| Z4   | 90%         | Threshold |
| Z5   | 100%        | VO2max / max effort |

Zone distribution for a run counts the fraction of HR stream samples in each zone.

---

## Fitness Score

**File:** `src/lib/metrics/fitnessScore.ts`

Composite engine score (0–100) representing aerobic fitness. Think of it as how powerful the engine is.

```
FitnessScore = (CTL_norm × 0.50) + (VO2max_norm × 0.30) + (Efficiency_norm × 0.20)
```

**CTL normalisation:** 0 TRIMP/day → 0, 100 TRIMP/day → 100  
**Efficiency normalisation:** `100 − (decouplingPct × 10)`, neutral default 70 when no decoupling data

### Score Bands

| Score | Band | Description |
|-------|------|-------------|
| 0 – 29 | Detrained | Fitness depleted — restart base training |
| 30 – 49 | Building | Load accumulating, aerobic base forming |
| 50 – 64 | Base | Solid foundation for regular running |
| 65 – 79 | Trained | Strong base, ready for hard efforts |
| 80 – 100 | Peak | Race-capable fitness, high load + efficiency |

> For a runner with VO2max ~55 and neutral efficiency, CTL drives most of the movement day-to-day:
> CTL 40 → ~53 (Base) · CTL 60 → ~63 (Base/Trained) · CTL 80 → ~73 (Trained) · CTL 100 → ~83 (Peak)

### Theoretical Maximum

Absolute ceiling (all inputs at maximum):

| Component | Max input | Max contribution |
|-----------|-----------|-----------------|
| CTL norm (CTL = 100 TRIMP/day) | 100 | 50.0 (50%) |
| VO2max norm (VO2max = 70 ml/kg/min) | 100 | 30.0 (30%) |
| Efficiency norm (0% decoupling) | 100 | 20.0 (20%) |
| **Total** | | **100** |

**Personal ceiling is set by your VO2max**, which is fixed at your current MaxHR/RestHR settings. Example with MaxHR 192 / RestHR 53 (VO2max 55.4 ml/kg/min):

| Component | Value | Contribution |
|-----------|-------|-------------|
| CTL norm (CTL = 100, best achievable) | 100 | 50.0 |
| VO2max norm = (55.4 − 30) / 40 × 100 = 63.5 | 63.5 | 19.1 |
| Efficiency norm (0% decoupling) | 100 | 20.0 |
| **Personal ceiling** | | **89.1 ≈ 89** |

To raise the ceiling above 89, RestHR would need to drop (e.g. RestHR 42 → VO2max ~70 → ceiling 100). In practice, **75–80 is excellent** for a trained ultra runner — it requires CTL ~90+ sustained alongside near-zero aerobic decoupling simultaneously.

---

## Endurance Capacity

**File:** `src/lib/metrics/enduranceCapacity.ts`

Fuel-tank metric (0–100). How long you can sustain effort — independent of engine power.

```
EnduranceCapacity = (LongRunScore × 0.50) + (VolumeScore × 0.30) + (ConsistencyScore × 0.20)
```

- **LongRunScore:** longest run ≥ 60 min in the last 14 days, normalised to **240 min (4 h)** target
- **VolumeScore:** total TRIMP in the last 7 days, normalised to **150 TRIMP/week** target
- **ConsistencyScore:** how many of the last **4 weeks** had a run ≥ 60 min (0–4 weeks → 0–100)

> **Note:** the 150 TRIMP/week target is easily exceeded by a single easy hour run (~136 TRIMP), so VolumeScore is effectively always 100 for any active runner. Long run duration and consistency are the real differentiators.

### Score Bands

| Score | Band | Description |
|-------|------|-------------|
| 0 – 29 | Minimal | No recent long runs, tank nearly empty |
| 30 – 49 | Building | Short long runs forming the base |
| 50 – 64 | Trail-ready | Capable of 90–120 min sustained efforts |
| 65 – 79 | Ultra-ready | 2h+ long runs, consistent weekly presence |
| 80 – 100 | Peak tank | 3–4h long runs, showing up every week |

### Theoretical Maximum

| Component | Max input | Max contribution |
|-----------|-----------|-----------------|
| LongRunScore (run ≥ 240 min in last 14 days) | 100 | 50.0 (50%) |
| VolumeScore (weekly TRIMP ≥ 150) | 100 | 30.0 (30%) |
| ConsistencyScore (4/4 weeks with ≥ 60 min run) | 100 | 20.0 (20%) |
| **Total** | | **100** |

Unlike Fitness Score, there is **no biological ceiling** — the max is 100 and is achievable purely through training behavior. Typical scores by training pattern (assuming VolumeScore always = 100):

| Long run | Consistency | Score |
|----------|-------------|-------|
| None | 0/4 weeks | 30 |
| 90 min | 2/4 weeks | 58 |
| 120 min | 3/4 weeks | 70 |
| 180 min | 4/4 weeks | 87 |
| 240 min | 4/4 weeks | **100** |

---

## Pace Prediction

**Files:** `src/lib/metrics/pacePrediction/`

Predicts expected pace for a given workout type using **only your own recent run data** — no VDOT tables or generic population norms.

### Pipeline

1. **Plausibility filter** — excludes runs < 15 min, avg HR < 90 bpm, missing HR/speed, or impossible combos (fast pace + very low HRR)
2. **Profile matching** — matches activities to the target workout type by HR zone ceiling:
   - Easy / Long: avg HR within 8 bpm below zone ceiling
   - Recovery: at or below ceiling
   - Tempo / Threshold: explicit HR band
   - VO2max: above threshold HR
3. **Recency weighting** — step function:
   - 0–30 days: weight 1.0
   - 30–60 days: weight 0.5
   - 60–90 days: weight 0.25
   - > 90 days: excluded
4. **Weighted percentiles** — computes p25, p50, p75 pace using recency-weighted distribution

### Output

| Confidence label | Matching runs |
|-----------------|---------------|
| `recent_data`   | ≥ 5 runs |
| `limited_data`  | 2–4 runs |
| `single_run`    | 1 run |
| `no_data`       | 0 runs — no prediction shown |

Pace shown as min/km median (p50); range uses p25–p75.

---

## Workout Recommendation

**File:** `src/lib/metrics/recommendation.ts`

Generates today's and tomorrow's suggested workouts based on readiness band and user's training mode.

| Mode | Philosophy |
|------|-----------|
| Conservative | Prioritise recovery; harder sessions only when fully fresh |
| Balanced | Default mix of stress and recovery |
| Progressive | Push training load; rest only when cooked |

Forced rest is applied regardless of mode when readiness < 35.

Each recommendation includes: workout type, target duration, HR zone, rationale, and pace prediction (when data exists). Easy runs show distance only — no pace target, by design.

---

## Backfill Orchestration

**File:** `src/lib/metrics/backfill.ts`

Recomputes all daily metrics from scratch after a sync. Execution order:

1. Compute TRIMP for each activity (HR path or RPE fallback)
2. Build date → TRIMP lookup map
3. Run CTL/ATL/TSB EWMA across full date range
4. For each date: compute ACWR, monotony, strain, readiness, fitness score, endurance capacity
5. Persist all `DailyMetrics` records to IndexedDB via Dexie

All metrics are derived deterministically — re-running backfill always produces the same result for the same activity data.
