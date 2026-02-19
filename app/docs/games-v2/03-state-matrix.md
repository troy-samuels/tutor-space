# Games V2 State Matrix

## Global Interaction States
- `idle`: visible, neutral contrast, no urgency.
- `hover`/`focus`: increased border + subtle elevation.
- `pressed`: scale down 2-4%, immediate tactile response.
- `active`: strongest contrast and clarity.
- `success`: semantic green + short confirmation motion.
- `error`: semantic rust + corrective hint.
- `timeout`: warning text + progressive urgency tone.
- `disabled`: reduced opacity, no interaction ambiguity.

## Neon Intercept Core States
- Run lifecycle: `ready -> running -> paused -> complete`.
- Wave lifecycle: `spawn -> falling -> resolved -> next-wave`.
- Feedback lifecycle: `idle -> correct/wrong/timeout -> idle`.

## UI Ownership Rules
- HUD owns score/time/lives and never blocks input.
- Arena owns primary action and cannot have competing CTA.
- Result sheet owns post-run decisions.

## Error Handling States
- Network unavailable: keep run local; defer sync.
- Auth unavailable: allow full gameplay, mark local-only profile.
- Resume after backgrounding: explicit continue/restart choice.
