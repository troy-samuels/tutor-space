# Games V3 Review Checklist

## 1) Design Gate
- Affordance clarity:
  - First meaningful action is discoverable with no tutorial paragraph.
- Visual hierarchy:
  - One primary task surface per state.
  - Non-critical panels are hidden during active play.
- Density:
  - Mobile first viewport shows actionable game area quickly.
- Legibility:
  - Word content remains clear at runtime speeds.
  - WCAG AA contrast for critical text.
- Motion meaning:
  - Motion communicates state changes, not decoration.
  - Reduced-motion parity exists.

## 2) Gameplay Gate
- Fairness:
  - Difficulty shifts are bounded and recoverable.
- Learning fit:
  - Content mix follows target/review/stretch ratio.
- Comprehension:
  - First meaningful action p50 <= 8s, p90 <= 12s.
- Completion:
  - Internal completion trend >= 70%.
- Replay:
  - Immediate replay trend >= 40%.
- Telemetry:
  - `game_comprehension_spike` and v3 run fields are emitted where applicable.

## 3) Code Gate
- Boundaries:
  - UI/gameplay/adaptation/persistence responsibilities are separated.
- Contract integrity:
  - New payload fields are optional and backward-compatible.
- Performance:
  - No blocking network calls in `active` loop.
- Security:
  - RLS policies enforce user-owned rows.
- Maintainability:
  - No gameplay module exceeds 300 LOC without ADR note.

## 4) Shareability + Virality Gate
- Result card copy is concise and valid in EN + ES.
- Challenge create + resolve endpoints work.
- Challenge rematch is deterministic by payload seed.
- Stumble-share template is available in share panel.

## 5) Launch Blockers
- Any P0/P1 open defect.
- Crash-free estimate below 99.5%.
- Missing design/gameplay/code gate sign-off.
