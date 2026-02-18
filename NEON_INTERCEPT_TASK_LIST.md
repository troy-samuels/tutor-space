# Neon Intercept Task List (v0.1)

## Objective
Build a retro 2D arcade language game that a 6-year-old can play in under 10 seconds of onboarding, while fitting TutorLingua's existing games architecture and avoiding new technical debt.

## World-Class Build Flow (Design -> Build -> Test as You Go)
Use this exact sequence. Do not start the next phase until the current phase gate passes.

### Phase 0: Product Truth & Success Criteria
- [ ] `P0` Write the one-sentence game promise:
  "Fast arcade fun that teaches real language decisions under pressure."
- [ ] `P0` Define target player states:
  `new child learner`, `casual daily player`, `competitive streak player`.
- [ ] `P0` Define success metrics before coding:
  time-to-fun, completion rate, replay rate, false-friend recognition uplift.
- [ ] `P0` Freeze v1 scope:
  one mode, one control scheme, one share format, one main learning outcome.

**Phase gate**
- [ ] `P0` Team can explain in 30 seconds:
  core loop, learning outcome, emotional arc, and why this is TutorLingua.

### Phase 1: Language-Learning Core Design (Paper First)
- [ ] `P0` Design the language decision model before visuals:
  prompt -> choices -> player action -> feedback -> reinforcement.
- [ ] `P0` Define linguistic correctness rules:
  one best answer, two plausible distractors, no ambiguous "technically maybe" options.
- [ ] `P0` Build prompt taxonomy:
  high-frequency vocabulary, reaction phrases, false friends, CEFR tags.
- [ ] `P0` Create difficulty ladder:
  A1/A2 for onboarding, controlled B1 spikes for mastery moments.
- [ ] `P0` Define mistake taxonomy for coaching:
  false friend, register mismatch, collocation mismatch, grammar trap.

**Build-now artifacts**
- [ ] `P0` Add typed schema and validation for prompts in `app/lib/games/data/neon-intercept/types.ts`.
- [ ] `P0` Add content quality checklist for every prompt row.

**Test-now checks**
- [ ] `P0` Run manual linguistic QA on first 30 prompts per language.
- [ ] `P0` Reject any prompt where two fluent speakers disagree on "best" answer.

**Phase gate**
- [ ] `P0` Prompt set passes ambiguity review and CEFR tagging sanity check.

### Phase 2: Core Gameplay Vertical Slice (No Polish Yet)
- [ ] `P0` Implement minimal playable loop:
  spawn wave, choose lane, resolve hit, score/life update, end state.
- [ ] `P0` Implement deterministic daily seed integration for content order.
- [ ] `P0` Implement pause/resume and safe session state.
- [ ] `P0` Keep visuals intentionally simple until loop quality is proven.

**Build-now artifacts**
- [ ] `P0` Route + shell + single game component + pure logic module.
- [ ] `P0` Unit tests for wave generation, resolution, scoring, lives, timer.

**Test-now checks**
- [ ] `P0` 10 consecutive local runs without state corruption.
- [ ] `P0` Repeat same seed/date gets identical run sequence.
- [ ] `P0` Language switch/reset cannot leak old state into new run.

**Phase gate**
- [ ] `P0` Vertical slice is stable, deterministic, and fun without art polish.

### Phase 3: UX for a 6-Year-Old (Comprehension Before Beauty)
- [ ] `P0` Replace instruction text with interactive 3-step tutorial.
- [ ] `P0` Ensure first meaningful success happens in <= 8 seconds.
- [ ] `P0` Use icon + motion + haptic feedback for understanding, not paragraphs.
- [ ] `P0` Increase affordance clarity:
  active lane glow, danger telegraphing, clear "you got it" signals.
- [ ] `P0` Add forgiving onboarding tuning:
  slower first waves, wider input timing, softer penalties.

**Test-now checks**
- [ ] `P0` Child usability test script:
  can start, play, and finish a run with no adult explanation.
- [ ] `P0` Measure confusion moments:
  missed taps, idle pauses, wrong-lane bursts, quit-before-15s.

**Phase gate**
- [ ] `P0` At least 80% of first-time testers understand controls in first run.

### Phase 4: Brand-First Visual System Integration
- [ ] `P0` Apply TutorLingua token mapping only after loop/UX are validated.
- [ ] `P0` Implement "colour is earned" progression in moment-to-moment play.
- [ ] `P0` Add TutorLingua signature emotional moments:
  false-friend catch, streak pulse, coaching-oriented end card.
- [ ] `P0` Keep typography and copy consistent with existing game surfaces.
- [ ] `P0` Build share card that reads as TutorLingua at a glance.

**Test-now checks**
- [ ] `P0` Brand QA pass against existing `/games` experience.
- [ ] `P0` Contrast/accessibility pass across all gameplay states.

**Phase gate**
- [ ] `P0` Visual review confirms "same family as TutorLingua games, not a separate product."

### Phase 5: Game Psychology Tuning (Retention Without Manipulation)
- [ ] `P0` Tune emotional arc:
  quick win -> productive tension -> breakthrough -> proud finish.
- [ ] `P0` Tune reward cadence:
  micro-feedback every few seconds, larger reward on milestones.
- [ ] `P0` Balance challenge:
  no boredom in first 30s, no unfair spikes after 45s.
- [ ] `P0` Keep language learning central in reward logic:
  points favor correct understanding, not raw speed spam.
- [ ] `P1` Add adaptive hinting only when repeated frustration is detected.

**Test-now checks**
- [ ] `P0` Session replay review for rage-quit patterns.
- [ ] `P0` Telemetry validation for early-drop causes and pacing issues.
- [ ] `P0` False-friend moment recall test:
  players can explain what fooled them after the run.

**Phase gate**
- [ ] `P0` D1 replay intent and frustration metrics meet thresholds.

### Phase 6: Platform Hardening (Telegram + Web)
- [ ] `P0` Validate Telegram safe areas, back button, close confirmation.
- [ ] `P0` Validate offline-tolerant behavior and recovery paths.
- [ ] `P0` Validate orientation changes and app background lifecycle.
- [ ] `P0` Validate share path priority:
  Telegram inline -> Web Share -> clipboard fallback.

**Test-now checks**
- [ ] `P0` Smoke test matrix:
  iOS Safari, Android Chrome, Telegram iOS, Telegram Android.
- [ ] `P0` Low-end device perf test with reduced effects mode.

**Phase gate**
- [ ] `P0` No critical platform defects; crash-free sessions within rollout target.

### Phase 7: Launch, Learn, Iterate
- [ ] `P0` Launch behind feature flag and monitor real-time health metrics.
- [ ] `P0` Run 48-hour error and friction audit before wider exposure.
- [ ] `P1` Prioritize fixes by user pain:
  comprehension bugs > state bugs > cosmetic polish.
- [ ] `P1` Plan v1.1 from observed behavior, not opinion.

## Build-While-Testing Rhythm (Daily Operating Model)
- [ ] `P0` Every feature task includes:
  implementation step, immediate test step, and rollback/fix note.
- [ ] `P0` Commit in small slices:
  one mechanic or one risk area per commit.
- [ ] `P0` Run logic tests before visual polish changes.
- [ ] `P0` Run manual playtest after each merged gameplay change.
- [ ] `P0` Block merges if deterministic behavior, language correctness, or child-UX checks fail.

## Brand Non-Negotiables (TutorLingua DNA)
- [ ] `P0` Use `app/app/globals.css` as source of truth for colours (brand + game tokens); no hardcoded hex values inside game components.
- [ ] `P0` Preserve TutorLingua signature mechanics in this game:
  False Friend trap moments, CEFR-linked progression, and post-run "explain mistakes" style coaching CTA.
- [ ] `P0` Keep TutorLingua voice in microcopy:
  simple, encouraging, specific ("You mixed X with Y"), never generic AI phrasing.
- [ ] `P0` Ensure this feels like TutorLingua, not a random arcade skin:
  language-learning-first interactions, not cosmetic gamification only.
- [ ] `P1` Add a brand QA checklist before release:
  colour compliance, copy tone, CTA consistency, and share-card identity.

## Non-Negotiables
- No runtime AI calls in core gameplay loop.
- No new npm dependencies for v1.
- Reuse existing game engine shell/components before creating new abstractions.
- 60 FPS target on mid-tier mobile; graceful degradation on low-end devices.
- One-thumb play, no required keyboard input, no reading-heavy UI during action.

## Design Direction (Pick One, Then Freeze)
- [ ] `P0` Choose visual style and lock it for v1: `Pixel Pop` (recommended), `Neon Cabinet`, or `Sticker Arcade`.
- [ ] `P0` Define style tokens in `app/app/globals.css` using existing `--game-*` variables (do not add a second token system).
- [ ] `P0` Map Neon Intercept surfaces and states to existing TutorLingua tokens:
  `--brand-primary`, `--brand-secondary`, `--brand-accent`, `--game-correct`, `--game-wrong`, `--game-streak`, `--game-text-*`.
- [ ] `P0` Set "colour is earned" behaviour from design bible:
  start neutral/desaturated, reveal richer colour on correct actions and milestones.
- [ ] `P0` Set a typography rule for child readability: minimum 18px gameplay text, 44px touch targets, high contrast labels.
- [ ] `P1` Define motion limits: no flashing over 3Hz, no strobing, cap shake effects to <= 250ms.

## Architecture & Imports (Debt Guardrails)
- [ ] `P0` Create route shell at `app/app/(public)/games/neon-intercept/page.tsx`.
- [ ] `P0` Reuse engine imports only:
  `GameShell`, `HowToPlay`, `LanguageSelector`, `GameResultCard`, `GameButton`,
  `haptic`, `shareResult`, `recordGamePlay`, `recordDailyProgress`, `getDailySeed`, `getPuzzleNumber`.
- [ ] `P0` Add game module folders:
  `app/components/games/neon-intercept/` and `app/lib/games/data/neon-intercept/`.
- [ ] `P0` Keep game logic in pure utilities under `app/lib/games/data/neon-intercept/logic.ts` for testability.
- [ ] `P1` Add a small `types.ts` for game state and prompt entities; avoid global shared types unless used by 2+ games.

## Core Gameplay (Kid-First)
- [ ] `P0` Implement 3-lane intercept mechanic with tap-to-lane controls only.
- [ ] `P0` Implement 90-second session with pause/resume support.
- [ ] `P0` Add "correct target" rule: one clear correct option, two plausible distractors.
- [ ] `P0` Add lives system (3 hearts) and forgiving first 15 seconds (slower waves).
- [ ] `P0` Add boss phrase every 30 seconds as 3-step combo (chunked sentence build).
- [ ] `P1` Add optional "slow mode" accessibility toggle (25% slower gameplay).
- [ ] `P1` Add combo reward and gentle streak feedback without punitive resets.

## Learning System
- [ ] `P0` Use CEFR-tagged word/prompt pools (A1/A2 default for child mode).
- [ ] `P0` Add false-friend traps from existing `app/lib/games/data/false-friends.ts`.
- [ ] `P0` Add a visible "False Friend caught" event treatment (copy + haptic + icon) as the TutorLingua signature moment.
- [ ] `P0` Keep prompt text short (max 4 words) and icon-supported.
- [ ] `P1` Add level ramp by accuracy + time survived, not by session count alone.
- [ ] `P1` Add post-run "what to practice next" summary (max 2 lines).

## Data & Content Pipeline
- [ ] `P0` Create seedable daily content loader like existing games (`getDailySeed` + `getPuzzleNumber`).
- [ ] `P0` Build deterministic wave generator (same day/language = same challenge).
- [ ] `P0` Add minimum content thresholds:
  120 prompts per language for launch languages (`en`, `es`, `fr`, `de`).
- [ ] `P1` Add content lint script to catch duplicates, ambiguous answers, and overlong strings.
- [ ] `P1` Add fallback behavior when content pool is low (reuse with shuffled distractors and capped repeats).

## Frictionless UX for Age 6
- [ ] `P0` Interactive tutorial (3 taps, no paragraph instructions).
- [ ] `P0` Replace text-heavy status with icons + numbers (`hearts`, `score`, `time`).
- [ ] `P0` Add large lane highlights and clear success/failure color + shape cues.
- [ ] `P0` Disable accidental double-input by adding 120ms tap debounce.
- [ ] `P1` Add optional voice cue toggle (off by default if no existing audio system is reused).
- [ ] `P1` Add parent-safe mode toggle: no outbound links during active play.

## Telegram + Web Platform Constraints
- [ ] `P0` Respect safe-area CSS vars from `TelegramProvider`.
- [ ] `P0` Keep brand consistency across hosts:
  web uses TutorLingua palette tokens, Telegram mode respects Telegram chrome while retaining TutorLingua gameplay colours.
- [ ] `P0` Pause on `visibilitychange`, restore cleanly without score corruption.
- [ ] `P0` Handle Telegram close gesture with existing closing confirmation.
- [ ] `P0` Keep portrait-first layout; handle orientation change without restart.
- [ ] `P1` Keep share flow through existing `shareResult` utility (Telegram inline -> Web Share -> clipboard).

## Edge Cases (Must Handle Before Launch)
- [ ] `P0` Midnight rollover during session does not change active puzzle.
- [ ] `P0` Language switch mid-session prompts confirmation and resets safely.
- [ ] `P0` Repeated prompts in same run are prevented until pool exhausted.
- [ ] `P0` LocalStorage unavailable/corrupt falls back to in-memory state.
- [ ] `P0` Reduced-motion users get animation-light mode automatically.
- [ ] `P0` Very long words auto-scale font without clipping or overlap.
- [ ] `P0` Low FPS detection reduces particles/effects, not gameplay logic.
- [ ] `P1` App backgrounded >5 minutes triggers resume modal (`continue` or `restart`).
- [ ] `P1` Offline mode keeps gameplay working; sync/share only when available.

## Performance & Technical Debt Controls
- [ ] `P0` Use one `requestAnimationFrame` loop and transform-only movement.
- [ ] `P0` Avoid per-frame React state churn; use refs for hot loop values.
- [ ] `P0` Use memoized selectors for derived UI stats.
- [ ] `P0` Keep component boundaries simple: `Game`, `HUD`, `Lane`, `Wave`, `Result`.
- [ ] `P1` Add lightweight perf logger behind dev flag (average frame time, dropped frames).

## Accessibility & Safety
- [ ] `P0` Minimum contrast ratio 4.5:1 for gameplay UI text.
- [ ] `P0` Validate contrast specifically for all brand token combinations used in gameplay states.
- [ ] `P0` Add non-color feedback (icons/pattern) for correct/wrong states.
- [ ] `P0` Haptics off switch and respect system reduced motion.
- [ ] `P1` Dyslexia-friendly letter spacing option.
- [ ] `P1` Ensure no ad-like dark patterns, no manipulative countdown copy.

## QA & Test Plan (Lean but Sufficient)
- [ ] `P0` Add unit tests for pure logic:
  seed generation, wave generation, collision/selection resolution, scoring, difficulty ramp.
- [ ] `P0` Add unit tests for edge conditions:
  empty pool fallback, duplicate prevention, timer pause/resume integrity.
- [ ] `P0` Add smoke integration test for route render and completion flow.
- [ ] `P1` Add manual device matrix checklist:
  iOS Safari, Android Chrome, Telegram iOS, Telegram Android, low-end Android.
- [ ] `P1` Add regression checklist for existing games hub and streak tracking.

## Analytics (Minimal, Actionable)
- [ ] `P0` Track only essential events:
  `game_start`, `game_end`, `life_lost`, `boss_cleared`, `share_tap`, `cta_click`.
- [ ] `P1` Add `friction_event` taxonomy:
  `tutorial_drop`, `early_quit_15s`, `mis_tap_burst`, `resume_fail`.
- [ ] `P1` Add guardrails to avoid PII in analytics payloads.

## Rollout Plan
- [ ] `P0` Hide behind a feature flag (`neonInterceptV1`).
- [ ] `P0` Internal dogfood launch with telemetry checks for 48 hours.
- [ ] `P1` Public soft launch to 10% traffic; compare retention vs current top game.
- [ ] `P1` Promote to full rollout if crash-free sessions >= 99.5% and D1 replay lift is positive.

## Definition of Done (v1)
- [ ] `P0` A new user can start gameplay in <= 2 taps from hub.
- [ ] `P0` Median session reaches >= 60 seconds without confusion events.
- [ ] `P0` No new dependencies, no duplicated engine utilities, and no failing lint/type checks.
- [ ] `P0` Brand review passes:
  uses TutorLingua tokens, signature false-friend moment exists, and copy/CTA tone matches existing games.
- [ ] `P0` Core edge cases above are tested and pass.
