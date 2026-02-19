# Games V3 Engineering Standards

## Scope
- Applies only to `/games/byte-choice`, `/games/pixel-pairs`, `/games/relay-sprint`, and `/games/world-map`.
- V3 code roots:
  - `/Users/t.samuels/Desktop/tutor-space/app/components/games-v3/`
  - `/Users/t.samuels/Desktop/tutor-space/app/lib/games/v3/`

## Architecture Boundaries
- UI composition lives in `components/games-v3/**`.
- Gameplay state machines live in `lib/games/v3/**` or game-local components.
- Adaptation and cognitive load logic lives only in `lib/games/v3/adaptation/**`.
- Persistence/contracts live in canonical runtime APIs:
  - `/Users/t.samuels/Desktop/tutor-space/app/app/api/games/runs/start/route.ts`
  - `/Users/t.samuels/Desktop/tutor-space/app/app/api/games/runs/complete/route.ts`
  - `/Users/t.samuels/Desktop/tutor-space/app/app/api/games/challenges/**`
  - `/Users/t.samuels/Desktop/tutor-space/app/app/api/games/meta/**`

## Runtime Contracts
- Active gameplay loop is zero-await:
  - No `await fetch()` inside `active` state transitions.
  - Network writes happen at summary or async background events.
- Determinism:
  - Challenge runs must be reproducible from `seed + mode + difficultyBand`.
- Backward compatibility:
  - New run telemetry fields remain optional at API boundary.

## Token and Styling Discipline
- Use token sources first:
  - `/Users/t.samuels/Desktop/tutor-space/app/components/games-v3/tokens/colors.ts`
  - `/Users/t.samuels/Desktop/tutor-space/app/components/games-v3/tokens/motion.ts`
  - `/Users/t.samuels/Desktop/tutor-space/app/components/games-v3/tokens/physics.ts`
  - `/Users/t.samuels/Desktop/tutor-space/app/components/games-v3/tokens/spacing.ts`
- Avoid ad-hoc inline color/timing constants in gameplay components unless justified.

## Performance Contracts
- Target 60fps baseline in active play.
- If FPS drops below 55 for sustained windows, downgrade non-essential effects.
- Input feedback target <16ms on touch surfaces.

## File-Size and Complexity
- Any gameplay module >300 LOC requires ADR note in PR.
- Split state, rendering, and telemetry concerns when module exceeds this threshold.

## Testing Cadence
- Per commit:
  - `npm run type-check`
  - lint for touched files
  - relevant unit tests
- Per release candidate:
  - mobile + desktop smoke for all 3 games
  - challenge link roundtrip test
  - world map unlock flow test

## Debt Controls
- Every temporary compromise must include:
  - explicit TODO with owner
  - risk statement
  - expiry milestone
