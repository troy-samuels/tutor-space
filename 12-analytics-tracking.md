# 12 - Analytics & Tracking

## Objective

Instrument TutorLingua to measure conversion (Goal 1) and stickiness (Goal 2) while preserving privacy and security. Provide dashboards and events that help tutors and the product team understand performance.

## Prerequisites

- ✅ **05-link-in-bio.md**, **08-booking-system.md**, **07-stripe-integration.md**, **09-student-crm.md**, **11-email-system.md** – Emit events to analytics pipeline
- Analytics provider accounts (e.g., PostHog or Mixpanel) and API keys configured
- Optional: Segment/analytics proxy if consolidating multiple tools

## Deliverables

- Analytics provider integration (PostHog recommended for event + session recording)
- Client/server event helpers (typescript-safe)
- Event taxonomy covering landing → booking → payment → retention loops
- Tutor dashboards (conversion funnel, revenue, active students, NPS)
- Alerts/thresholds for milestones (100 tutor signups, 50 bookings, 40% WAU, NPS > 30)
- Security considerations for data minimization and opt-out

## Implementation Steps

### Step 1: Choose Analytics Stack

- **PostHog** (self-hosted or cloud) provides event tracking, product analytics, funnels, feature flags.
- Alternative: Mixpanel + Hotjar; if using Segment, treat PostHog as downstream destination.
- Obtain API keys (`POSTHOG_API_KEY`, `POSTHOG_HOST`) and store as environment variables.

### Step 2: Event Taxonomy

Define stable event names and properties:

| Event | Description | Key Properties |
|-------|-------------|----------------|
| `landing_page_view` | Tutor profile/landing visit | `tutor_id`, `source`, `plan` |
| `booking_funnel_started` | Student opens booking page | `service_id`, `tutor_id`, `source`, `device` |
| `booking_completed` | Payment/booking confirmed | `service_id`, `price_cents`, `package_used`, `payment_method` |
| `lead_created` | Lead form submitted | `source`, `device`, `utm_campaign` |
| `lead_converted` | Lead → student | `lead_id`, `timeline_days` |
| `email_sent` | Messaging event | `template`, `channel`, `tutor_id` |
| `email_clicked` | Email click | `template`, `link_type` |
| `lesson_note_created` | Post-lesson note saved | `student_id`, `service_id` |
| `ai_summary_generated` | AI feature used | `feature`, `tokens`, `plan` |
| `nps_response` | Parent feedback | `score`, `comment_length` |
| `daily_active` | App activity per tutor (derived) | `tutor_id`, `plan` |

Group events by funnel stage: Awareness → Conversion → Teaching → Retention.

### Step 3: Implement Client Helper

```ts
// lib/analytics/client.ts
'use client'

import posthog from 'posthog-js'

export function initAnalytics() {
  if (typeof window === 'undefined') return
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
    capture_pageview: false,
  })
}

export function trackEvent(name: string, properties?: Record<string, any>) {
  if (typeof window === 'undefined') return
  posthog.capture(name, sanitize(properties))
}
```

`sanitize` should remove PII (emails, phone numbers) unless hashed.

Call `initAnalytics()` in `_app` or `layout.tsx` client wrapper.

### Step 4: Server-Side Tracking

For critical events (payments, bookings), log via server actions:

```ts
// lib/analytics/server.ts
'use server'

import ky from 'ky'

export async function captureServerEvent(name: string, properties: Record<string, any>) {
  await ky.post(`${process.env.POSTHOG_HOST}/capture/`, {
    json: {
      api_key: process.env.POSTHOG_API_KEY,
      event: name,
      properties: sanitize(properties),
    },
  })
}
```

Invoke `captureServerEvent('booking_completed', {...})` inside booking confirmation flow to avoid client manipulation.

### Step 5: Tutor Dashboard Widgets

- Create `/app/(dashboard)/analytics/page.tsx` or embed modules on overview page:
  - Booking conversion funnel (profile view → booking started → payment)
  - Revenue over time (Stripe data + PostHog events)
  - Active students (weekly/daily)
  - Lead status counts and conversion times
  - NPS/parent feedback charts
  - AI usage (how many summaries generated per tutor)

Use PostHog’s dashboard embed or custom charts (e.g., `recharts`) by querying Supabase and analytics API.

### Step 6: Milestone & Alerting

- Configure PostHog insights or scripts to detect milestones:
  - 100 tutor signups → send Slack/email alert
  - 10 paid tutors, 50 bookings → highlight in admin dashboard
  - Retention (40% WAU) → track weekly active tutors (count of `daily_active` event)
  - NPS > 30 → average of `nps_response` events
- For each milestone achieved, log entry in admin analytics page and optionally send celebratory email (marketing).

### Step 7: Security & Privacy Considerations

- **Data minimization**: Do not send raw emails, phone numbers, or notes. Anonymize or hash identifiers (use tutor/student IDs).
- **Consent**: Provide analytics opt-out for tutors if necessary (especially for session recording); mention in onboarding.
- **PII in AI**: When logging AI events, exclude raw transcript text; only capture usage metrics.
- **Compliance**: For EU/UK tutors, adhere to GDPR cookie/consent requirements—show cookie banner when necessary.
- **Storage**: Ensure analytics keys stored in env; client uses `NEXT_PUBLIC_POSTHOG_KEY` only after verifying domain.
- **Access control**: Restrict PostHog dashboard to internal team. If tutors get analytics, surface via app UI not PostHog link.

### Step 8: Testing & Validation

- Verify events fire from key journeys (landing → booking → payment) using PostHog inspector.
- Ensure server events deduplicate to avoid double counting (`booking_completed` triggered only once).
- Run privacy audit: inspect captured payloads for PII leakage.
- Validate dashboards show correct counts compared to Supabase raw data.

## Testing Checklist

- [ ] Analytics client initializes only in browser with correct keys.  
- [ ] Booking/payment events captured server-side with sanitized payloads.  
- [ ] Lead capture and conversion events track sources (UTMs, referrers).  
- [ ] Tutor analytics dashboard shows conversion funnel, revenue, WAU, and NPS metrics.  
- [ ] Milestone alerts trigger when thresholds reached.  
- [ ] Opt-out/consent flows respected (no tracking when disabled).  
- [ ] Event payloads audited for PII leakage.  
- [ ] Security logging ensures only internal team can access raw analytics data.

## AI Tool Prompts

### Analytics Helper
```
Generate a TypeScript module that initializes PostHog on the client and provides a trackEvent function with property sanitization.
```

### Server Event Capture
```
Write a Next.js server action that logs booking completion events to PostHog after successful payment.
Include service, tutor, price, and payment method metadata (no PII).
```

### Analytics Dashboard Widgets
```
Create a dashboard component displaying:
- Conversion funnel (landing → booking started → booking completed)
- Revenue chart (last 30 days)
- Active students count
Fetch data from Supabase and PostHog via API routes.
```

## Security Considerations

- Reference [SECURITY.md](SECURITY.md) sections on data classification and privacy.  
- Maintain allowlist of properties sent to analytics; hash or omit user identifiers.  
- Use HTTPS for analytics API calls; validate certificates.  
- Document analytics retention policy and deletion workflow (e.g., remove tutor data on account deletion).

## Next Steps

1. Feed analytics into `28-ceo-dashboard.md` for executive reporting.  
2. Integrate analytics insights into CRM (identify at-risk students).  
3. Add experiment/feature flag support (PostHog flags) for controlled rollouts.  
4. Review compliance with privacy regulations before launching internationally.

## Success Criteria

✅ Product team can track conversion, bookings, revenue, and retention without manual spreadsheets  
✅ Tutors see meaningful insights (conversion, active students, NPS) to improve their business  
✅ Analytics respects privacy/security—no sensitive data leaked to third parties  
✅ Milestone alerts support Goal 1 and Goal 2 metrics (signups, bookings, WAU, NPS)

**Estimated Time**: 3-4 hours

