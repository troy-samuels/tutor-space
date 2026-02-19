# Games V3 Testing Cadence

## Mandatory Intervals

### Per Commit
- `npm run type-check`
- lint on touched files
- relevant unit tests
- Gate: no merge if any check fails

### Every 2 Hours (Active Build Windows)
- Blind first-run session (10 minutes) by non-author
- Gate: first meaningful action succeeds without verbal instruction

### Twice Daily
- Smoke matrix:
  - mobile web
  - desktop web
  - Telegram container
- Gate: no dead-end interactions, no layout collapse, no state corruption

### End of Day
- RITE synthesis:
  - top 5 friction points
  - severity ranking
  - owner + next patch target
- Gate: all top frictions scheduled

### Every 3 Build Days
- Structured external usability session (new + returning mix)
- Gate: comprehension/completion trendline improving

### Pre-Release 48-Hour Soak
- Continuous scripted runs + exploratory QA
- Gate:
  - crash-free target met
  - no open P0/P1
  - telemetry pipeline healthy
