# Neon Intercept V2 Tuning Spec

## Session Configuration
- Daily: 90s, start speed 3200ms, end speed 2050ms, 3 lives.
- Practice: 120s, start speed 3600ms, end speed 2400ms, 4 lives.
- Challenge: 75s, start speed 2850ms, end speed 1700ms, 3 lives.
- Ranked: 70s, start speed 2700ms, end speed 1500ms, 3 lives.

## Adaptive Bounds
- Speed adaptation bound: max +-15% per evaluation window.
- Evaluation window: continuous with 100ms HUD update cadence.
- Inputs: elapsed progress, hit accuracy, combo quality.

## Onboarding Guarantee
- Onboarding lock active until first correct intercept.
- Wrong/timeout before first success does not consume life.
- Correct lane receives amplified visual cue while onboarding lock is active.

## Scoring
- Base hit: 10.
- Combo bonus: up to +12.
- Boss bonus: +10.
- False-friend bonus: mode-scaled.

## Progression Signals
- Tier derivation: onboarding, foundation, pressure, mastery.
- First-success milliseconds captured and persisted when available.
- Ranked mode writes leaderboard entry on run completion.
