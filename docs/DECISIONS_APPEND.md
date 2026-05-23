# DECISIONS_APPEND.md — New entries to add to DECISIONS.md

> These entries are new since the last DECISIONS.md snapshot.
> Append these to the bottom of your existing DECISIONS.md file in `docs/`.
> Do NOT replace the existing file — these are additions only.

---

## D-028 (revised): App optimization target

**Date:** 2026-05-22
**Status:** Decided (revised from earlier draft)

**Context:** Originally framed as "weight loss app." User clarified: weight is goal but not tracked. Focus on inputs (training volume, endurance) not outputs (weight, body comp).

**Decision:** App optimization target is **endurance capacity development**. Weight is not tracked. Calorie estimation is not built. The app is process-focused, not outcome-focused.

**Reasoning:**
- "Playing the RPG by focusing on item finding, not the level number" — user analogy
- Process goals (run longer this week) are controllable; outcome goals (weigh X kg) are downstream
- Tracking outcomes promotes stat-checking; tracking process promotes consistency
- Weight loss is a *side effect* of the right training, not a metric to optimize

**Tradeoffs accepted:**
- No weight correlation charts (loses some motivational visualization)
- No calorie burn estimation per run (could have been a nice feature)
- Some users might prefer outcome tracking (not us)

**Alternatives rejected:**
- Full weight tracking + correlation with training
- Calorie estimation via METS
- Body composition projections

---

## D-029 (revoked): Calorie estimation removed from scope

Originally proposed METS-based per-activity calorie estimation. Revoked per D-028. Calorie burn estimation creates outcome focus that distracts from process. Not built.

---

## D-030 (revoked): Weight logging removed from scope

Originally proposed weight tracking as first-class feature. Revoked per D-028. Not built.

---

## D-033: Process-goal-first design philosophy

**Date:** 2026-05-22
**Status:** Decided

**Context:** Need a guiding principle for what the app tracks and surfaces.

**Decision:** App tracks **input/process metrics** (volume, duration, HR zones, consistency) not **output/outcome metrics** (weight, body comp, race times). RPG analogy as design principle: focus on the grind, not the loot drop.

**Reasoning:**
- Process metrics are immediately actionable
- Outcome metrics encourage unhealthy daily checking
- Focusing on inputs produces outputs naturally
- Differentiates from Strava/Garmin which lean outcome-heavy

---

## D-034 (revised): Both Fitness Score AND Endurance Capacity coexist

**Date:** 2026-05-22
**Status:** Decided (revised from earlier draft proposing replacement)

**Context:** Originally proposed renaming "Fitness Score" to "Endurance Capacity." User pushed back: why not both?

**Decision:** Both metrics exist as distinct, first-class home-screen elements. They measure different things and provide diagnostic value when compared.

- **Fitness Score** = aerobic engine size (potential)
  - Formula: `0.50 × CTL_normalized + 0.30 × VO2max_normalized + 0.20 × aerobicEfficiencyTrend_normalized`
- **Endurance Capacity** = realized sustainable duration (fuel tank)
  - Formula: `0.50 × longRunCapacity_normalized + 0.30 × weeklyVolume_normalized + 0.20 × longRunConsistency`

**Reasoning:**
- Different inputs, no metric overlap
- The *difference* between them is itself diagnostic ("engine bigger than tank → do more long runs")
- One number can't capture both physiological adaptation AND realized capability
- Metaphor (engine vs fuel tank) maps well to the RPG mental model

**Tradeoffs accepted:**
- More numbers on home screen (mitigated by side-by-side compact cards)
- Slightly more complex computation

---

## D-035: Pace prediction sourced exclusively from user's recent runs

**Date:** 2026-05-22
**Status:** Decided

**Context:** How to predict pace targets for workout recommendations.

**Decision:** Pace predictions come exclusively from user's own recent activity data. **No VDOT tables. No Daniels-derived pace tables. No generic training-state assumptions.**

**Reasoning:**
- VDOT assumes recent all-out efforts at multiple distances — most users don't have this
- For rebuilding/early-stage runners, VDOT predictions are wildly wrong
- User's own data implicitly accounts for climate, terrain, current fitness, even chronotype
- App accuracy improves the more user logs — built-in personalization
- Honesty about what we know vs assume

**Tradeoffs accepted:**
- First-run experience may show "by effort" frequently (no recent samples)
- Won't predict paces for workouts user has never done
- Predictions can drift slow during fitness rebuilds (correct, but might feel discouraging)

**Alternatives rejected:**
- VDOT/Daniels tables as primary source
- Hybrid (recent data with VDOT fallback) — too easy to fall back to bad predictions
- Pace zones based on threshold testing (requires user to do a test)

---

## D-036: Pace shown as range (p25–p75), not point estimate

**Date:** 2026-05-22
**Status:** Decided (with D-040 amendment)

**Context:** How to display pace predictions.

**Decision:** Pace shown as p25–p75 range from matching recent runs. Example: "8:45–9:17 /km" rather than "9:01 /km".

**Reasoning:**
- Honest about day-to-day variability
- Implies range of acceptable execution (not a single target to chase)
- Visual matches Coros/Garmin training conventions

**Tradeoffs accepted:**
- Slightly more visual complexity vs single number
- Users may interpret range as "ok to go to fast end" (mitigated by attribution showing it's their own data)

---

## D-037: Recency-weighted pace prediction

**Date:** 2026-05-22
**Status:** Decided

**Context:** How much should old runs influence current predictions?

**Decision:** Step-function recency weighting applied to prediction samples:
- 0-30 days ago: weight 1.0
- 30-60 days: weight 0.5
- 60-90 days: weight 0.25
- > 90 days: weight 0 (excluded)

**Reasoning:**
- Fitness shifts. A run from 75 days ago may not reflect current capability.
- Step function is simpler to understand and verify than exponential decay
- 90-day cutoff aligns with typical training-block periodization
- Weighted percentile easy to compute and test

**Tradeoffs accepted:**
- Users with sparse recent training will see fewer "high confidence" predictions
- Sudden fitness changes still take ~30 days to fully reflect in predictions

---

## D-038: Plausibility filtering for prediction samples

**Date:** 2026-05-22
**Status:** Decided

**Context:** User's real data shows HR sensor errors (avg HR 103-105 on certain runs) and very short runs that don't represent stable pace/HR.

**Decision:** Filter out from prediction samples:
- Runs < 15 minutes (HR not stabilized)
- Runs with avg HR < 90 (likely sensor error)
- Runs with pace < 8:00/km AND HRR < 40% (impossible combination = sensor error)
- Runs with missing HR or speed data

**Reasoning:**
- Bad data degrades predictions silently if not filtered
- Heuristic, not perfect — known false negatives possible
- Conservative: when in doubt, exclude

**Tradeoffs accepted:**
- Loses some legitimate easy walks/jogs (acceptable)
- Won't catch all sensor errors (some plausible-looking HR values are still wrong)

**Backlog:** "data quality indicator" in settings to show user how many activities pass filtering

---

## D-039: Pace prediction may return "no data" honestly

**Date:** 2026-05-22
**Status:** Decided

**Context:** What to do when there are insufficient recent samples for a workout type.

**Decision:** Pace prediction returns `{source: 'no_data'}` when fewer than 1 matching sample exists. UI displays "by effort" + brief explanation rather than fabricating a number.

**Reasoning:**
- Honesty over comfort
- Forces users to learn effort-based pacing — useful skill
- Predictions self-bootstrap as users log workouts
- Better signal: "this is a new workout type for you, calibrate by feel today"

**Display:**
- For workouts where pace doesn't apply (rest, hills, strides): "by effort"
- For workouts that *could* have pace but lack data: "by effort — no recent data at this intensity"

---

## D-040: Easy runs show distance only, no pace number

**Date:** 2026-05-22
**Status:** Decided

**Context:** Should easy runs show pace prediction like other workouts?

**Decision:** Easy aerobic runs display:
- ✅ Duration
- ✅ HR ceiling
- ✅ **Distance estimate (single number, no range)**
- ❌ **NO pace number displayed**

All other workout types display full pace + distance (per-segment where applicable).

**Reasoning:**
- Easy runs are HR + feel exercises. Pace is downstream — varies with heat, fatigue, terrain, mood.
- Showing pace ranges for daily easy runs adds noise without action value
- Distance estimate is useful for route planning (a single number, not a range, is enough)
- Aligns with "process focus" principle (D-033) — duration matters, pace doesn't

**Display rules summary table:**

| Workout type | Pace shown? | Distance shown? |
|---|---|---|
| Easy | ❌ no | ✅ single (~5.5 km) |
| Long | ✅ range | ✅ range |
| Recovery | ✅ range | ✅ range |
| Tempo | ✅ per-segment | ✅ per-segment + total |
| Threshold | ✅ per-rep | ✅ per-rep + total |
| VO2max | ✅ per-rep | ✅ per-rep + total |
| Hills | ❌ effort | ✅ total only |
| Progression | ✅ per-segment | ✅ per-segment + total |
| Strides | ❌ effort | ✅ main run only |
| Rest | — | — |

**Tradeoffs accepted:**
- Some users may want pace for easy runs (we still compute it internally for distance estimate — could expose in detail view as backlog item)

---

## D-041: Phase 4.6 added between Phase 4 and 4.7

**Date:** 2026-05-22
**Status:** Decided

**Context:** Typed workout cards + pace prediction is enough scope to warrant its own phase.

**Decision:** Insert "Phase 4.6: Typed Workout Cards + Pace/Distance Prediction" between Phase 4 (Home Dashboard) and the renumbered Phase 4.7 (Manual Import + RPE, previously 4.5).

**Reasoning:**
- ~9-10 hours of focused work, big enough to track as a phase
- Depends on Phase 3 (metrics) + Phase 4 (home shell)
- Independent enough to ship between other phases
- Detailed spec lives in `docs/PHASE_4_6.md` — keeps DEVLOG.md scannable

**Phase ordering:** `0 → 1 → 2 → 3 → 4 → 4.6 → 4.7 → 5 → 5.5 → 6 → 7 → 8 → 9 → 10`
