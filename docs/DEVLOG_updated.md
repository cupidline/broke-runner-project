# DEVLOG.md — Broke Runner Development Log

> Living document. Update after each phase. Track decisions, blockers, and learnings.

---

## How to use this file

- Each phase has: **Goal**, **Tasks**, **Acceptance Criteria**, **Status**, **Notes**
- Update **Status** as you go: `📋 Planned` → `🚧 In Progress` → `✅ Done` → `🚫 Blocked`
- Log learnings, surprises, and decisions in **Notes**
- After each phase, write a retrospective at the bottom

---

## Phase 0: Repo + Scaffolding
**Status:** 📋 Planned
See original tasks. Unchanged from previous version.

---

## Phase 1: Strava OAuth + Token Management
**Status:** 📋 Planned
See original tasks. Unchanged.

---

## Phase 2: Activity Fetcher + IndexedDB Cache
**Status:** 📋 Planned
See original tasks. Unchanged.

---

## Phase 3: Core Metric Computation Library
**Status:** 📋 Planned
See original tasks, plus add:
- [ ] `src/lib/metrics/enduranceCapacity.ts` — composite endurance score
- [ ] `src/lib/metrics/fitnessScore.ts` — composite engine score (CTL + VO2max + efficiency)
- [ ] Both metrics co-exist, measure different things (see DECISIONS D-034 revised)

---

## Phase 4: Home Dashboard
**Status:** 📋 Planned

Updated home screen layout (post-decision):

```
- Greeting
- Readiness (large card, ring visualization)
- Fitness Score + Endurance Capacity (two cards, side-by-side)
- Form/TSB + Weekly Time on Feet (two cards, side-by-side)
- Today recommendation (basic card — enriched in Phase 4.6)
- Tomorrow recommendation (basic card — enriched in Phase 4.6)
- Last run summary
```

Note: Phase 4 ships **basic** recommendation cards. Rich typed cards with pace/distance prediction come in Phase 4.6.

---

## Phase 4.6: Typed Workout Cards + Pace/Distance Prediction
**Status:** 📋 Planned
**Detailed spec:** `docs/PHASE_4_6.md`

### Goal
Replace the generic Phase 4 recommendation card with workout-type-specific cards that show duration, HR target, pace prediction (from user's recent data), and distance estimate.

### Display rules (locked)

| Workout type | Pace shown? | Distance shown? |
|---|---|---|
| Easy | ❌ no pace | ✅ single estimate (~5.5 km) |
| Long | ✅ range (9:00–9:20 /km) | ✅ range (11.8–12.2 km) |
| Recovery | ✅ range | ✅ range |
| Tempo/Threshold/VO2max/Progression | ✅ per-segment pace | ✅ per-segment + total distance |
| Hills / Strides | ❌ effort-based | ✅ main run total only |
| Rest | — | — |

### High-level tasks

- [ ] Pace prediction algorithm (`src/lib/metrics/pacePrediction/`)
  - [ ] Plausibility filter (HR sensor errors, very short runs)
  - [ ] Workout profile matching
  - [ ] Recency weighting (30d=1.0, 60d=0.5, 90d=0.25)
  - [ ] Main predictor with 4 confidence paths
  - [ ] Distance estimation
- [ ] Recommendation engine integration
- [ ] Shared UI primitives (`PaceDisplay`, `DistanceDisplay`, `PaceConfidence`, `SegmentBlock`)
- [ ] 8 workout card components (one per type)
- [ ] `RecommendationCard` type switcher

### Acceptance criteria
See `docs/PHASE_4_6.md` for full criteria. Key items:
- Easy cards show distance NOT pace
- Other cards show pace + distance
- "Your last N runs at this HR" attribution always visible
- "No data" fallback to effort-based when insufficient samples
- All edge cases unit-tested

**Estimated effort:** 9-10 hours

---

## Phase 4.7: Manual Import + RPE
**Status:** 📋 Planned

(Renumbered from Phase 4.5 to make room for typed workout cards.)
See original tasks. Unchanged.

---

## Phase 5: PMC Chart + Trends Page
**Status:** 📋 Planned
See original tasks. Unchanged.

---

## Phase 5.5: Load Tab
**Status:** 📋 Planned
See original tasks. Unchanged.

---

## Phase 6: Activity List + Detail
**Status:** 📋 Planned
See original tasks. Unchanged.

---

## Phase 7: Settings Page
**Status:** 📋 Planned
See original tasks. Unchanged.

---

## Phase 8: PWA Shell
**Status:** 📋 Planned
See original tasks. Unchanged.

---

## Phase 9: Deploy to Vercel
**Status:** 📋 Planned
See original tasks. Unchanged.

---

## Phase 10: APK via PWABuilder
**Status:** 📋 Planned
See original tasks. Unchanged.

---

## Backlog (post v1)

(Unchanged from previous version)

- Wellness self-logging integration
- HRV input
- Cross-training cross-load (e.g., soccer days affect weekly TRIMP)
- Race calendar
- Custom workout builder
- Stryd integration
- Bulk CSV import
- Light theme
- Multi-language (Indonesian)
- Health Connect integration
- Notification reminders
- **Temperature/humidity adjustment for pace prediction** (Indonesian climate makes flat predictions less accurate)
- **Route/terrain awareness for pace prediction**
- **Data quality indicator** in settings (shows % of activities passing plausibility filter)

---

## Phase ordering rationale

```
0 → 1 → 2 → 3 → 4 → 4.6 → 4.7 → 5 → 5.5 → 6 → 7 → 8 → 9 → 10
```

- Phases 0-3 are foundational (no UI changes mean nothing visible)
- Phase 4 ships a working Home screen with basic recommendation cards
- Phase 4.6 enriches recommendations with pace/distance — depends on Phase 3 + Phase 4
- Phase 4.7 adds historical data import — depends on Phase 4 UI patterns
- Phases 5+ continue as originally planned

Each phase ships something usable. You can stop at any point and still have a working tool.

---

## Retrospectives

### Phase 0 retrospective
_To be written_

### Phase 1 retrospective
_To be written_

(continue per phase)
