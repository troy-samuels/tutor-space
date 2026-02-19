# Games V2 Motion System

## Purpose
Define deterministic, accessible motion language for all engine-backed games.

## Motion Classes
- Micro feedback: 90ms, `ease-out`.
- Standard transition: 180ms, `cubic-bezier(0.22,1,0.36,1)`.
- Emphasis pulse: 280ms, `cubic-bezier(0.34,1.56,0.64,1)`.
- Scene transition: 420ms, `cubic-bezier(0.16,1,0.3,1)`.

## Motion Intent
- Correct action: compress + release + color reinforcement.
- Wrong action: single directional nudge + color cue.
- Timeout: fade + warning pulse, no aggressive shake.
- Boss event: short bloom + lane focus.

## Reduced Motion
- Replace movement-heavy transitions with opacity and color changes.
- Remove oscillating loops in reduced-motion mode.
- Maintain all functional cues when animation is reduced.

## Safety Rules
- No flashing above 3Hz.
- No full-screen strobe events.
- Shake effects max duration: 250ms.

## Validation
- Motion review checklist required before merge:
  - Is the next action clearer after the animation?
  - Does motion create ambiguity?
  - Does reduced-motion path preserve meaning?
