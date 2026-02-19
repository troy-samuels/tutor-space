# Games V2 User Flows

## First-Time Player Flow (No Instruction)
1. User lands on game route.
2. Clear mode and language controls shown.
3. User starts run in one tap.
4. First wave uses onboarding lock to guarantee early success signal.
5. Run transitions into normal pace.
6. End sheet provides score, weakness focus, and replay path.

## Returning Player Flow
1. Last mode/language preselected.
2. Start action available immediately.
3. No onboarding lock if first-success history exists for this session.
4. End sheet emphasizes progression and replay.

## Failure and Recovery Flow
1. Wrong/timeout event occurs.
2. Immediate semantic feedback appears.
3. Next actionable state appears within 400ms.
4. No dead-end screens; run continues unless terminal condition hit.

## Mode Flow
- Daily: deterministic seeded run.
- Practice: adaptive pacing tuned for retention and comprehension.
- Challenge: compressed high-pressure run.
- Ranked: normalized scoring + leaderboard write.

## Persistence Flow
- Signed-in user: start and complete events persist server-side.
- Anonymous user: run remains local; server calls return local-only mode.
