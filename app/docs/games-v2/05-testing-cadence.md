# Games V2 Testing Cadence

## Mandatory Intervals

### Per Commit
- Run: `npm run lint`, `npm run type-check`, game unit tests, deterministic seed tests.
- Gate: no merge on failure.

### Every 2 Hours During Active Build
- Run: 10-minute blind playthrough by non-author.
- Gate: first meaningful action completed with no verbal instruction.

### Twice Daily
- Run: smoke matrix on mobile web, desktop web, Telegram container.
- Gate: no layout break, no state corruption, no dead-end interactions.

### End of Day
- Run: RITE synthesis.
- Deliverable: top 5 friction points, ranked fixes, next-day patch plan.

### Every 3 Build Days
- Run: structured external usability session with new and returning users.
- Gate: comprehension and completion trendline must improve.

### Pre-Cutover 48-Hour Soak
- Run: scripted continuous sessions + exploratory QA.
- Gate: crash-free and metric thresholds achieved.

## Required Metrics
- First-run comprehension >= 85%.
- First success p50 <= 8s, p90 <= 12s.
- Completion >= 70%.
- Immediate replay >= 40%.
- Crash-free sessions >= 99.5%.
- Open P0/P1 defects = 0.
