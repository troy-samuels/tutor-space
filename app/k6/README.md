# K6 Load Testing

Performance and load testing infrastructure for TutorLingua.

## Prerequisites

Install K6: https://k6.io/docs/get-started/installation/

```bash
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows
choco install k6
```

## Running Tests

### Booking Endpoints

Tests the public booking flow performance:

```bash
# Local environment
npm run test:load

# Staging environment
k6 run -e BASE_URL=https://staging.tutorlingua.co k6/scripts/booking-endpoints.js

# Custom tutor username
k6 run -e TEST_USERNAME=your-tutor k6/scripts/booking-endpoints.js
```

### Calendar Rendering

Tests calendar view performance (requires authentication):

```bash
# Local environment
npm run test:load:calendar

# With authentication token
k6 run -e AUTH_TOKEN=your_jwt_token k6/scripts/calendar-rendering.js

# Staging with auth
k6 run -e BASE_URL=https://staging.tutorlingua.co -e AUTH_TOKEN=your_token k6/scripts/calendar-rendering.js
```

## Thresholds

### Booking Endpoints
| Metric | Target | Description |
|--------|--------|-------------|
| Booking Page p95 | < 500ms | Public booking page load time |
| Checkout Creation p95 | < 1000ms | Stripe checkout session creation |
| Error Rate | < 1% | HTTP request failure rate |

### Calendar Rendering
| Metric | Target | Description |
|--------|--------|-------------|
| Month View p95 | < 600ms | Monthly calendar data load |
| Week View p95 | < 500ms | Weekly calendar data load |
| Day View p95 | < 400ms | Daily calendar data load |
| Error Rate | < 1% | HTTP request failure rate |

### Baseline
| Metric | Value | Description |
|--------|-------|-------------|
| Concurrent Users | 50 | Baseline concurrent user load |

## Test Scenarios

### Ramping VUs (Default)
Tests gradually increase load to simulate realistic traffic patterns:
1. Ramp up: 10s to reach target VUs
2. Sustain: 30s at peak load
3. Steady: 20s continued load
4. Ramp down: 10s to 0 VUs

### Constant VUs
For baseline testing with steady load:
- 50 concurrent virtual users
- 30 second duration

## Output

Test results are saved to:
- `k6/results/booking-endpoints-summary.json`
- `k6/results/calendar-rendering-summary.json`

Console output includes:
- Response time percentiles (p95, p99)
- Error rates
- Pass/fail status for each threshold

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BASE_URL` | Target environment URL | `http://localhost:3000` |
| `AUTH_TOKEN` | JWT token for authenticated endpoints | _(empty)_ |
| `TEST_USERNAME` | Tutor username for booking tests | `demo-tutor` |

## CI Integration

Add to your CI pipeline:

```yaml
- name: Run Load Tests
  run: |
    npm run test:load
    npm run test:load:calendar
  env:
    BASE_URL: ${{ secrets.STAGING_URL }}
    AUTH_TOKEN: ${{ secrets.LOAD_TEST_TOKEN }}
```

## Adding New Tests

1. Create new script in `k6/scripts/`
2. Import common config and helpers:
   ```javascript
   import { DEFAULT_OPTIONS, ENV } from "./common/config.js";
   import { authGet, checkApiResponse } from "./common/helpers.js";
   ```
3. Define custom metrics if needed
4. Add npm script to package.json
