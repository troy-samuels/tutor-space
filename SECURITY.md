# Security Playbook - TutorLingua

This document defines baseline security practices for the TutorLingua platform. Review when introducing new features or integrations.

---

## 1. Principles

1. **Least privilege** - Users and systems only access what they need
2. **Defense in depth** - Combine Supabase RLS, Next.js server actions, Stripe security, and infrastructure hardening
3. **Secure by default** - Private bucket access, HTTPS-only endpoints
4. **Visibility** - Log significant events, audit access, monitor anomalies
5. **Continuous improvement** - Revisit policies after major features

---

## 2. Data Classification

| Category | Examples | Controls |
|----------|----------|----------|
| **Public** | Tutor public profiles, marketing pages | CDN cache, minimal personal info |
| **Internal** | Booking details, lesson plans, CRM notes | Supabase RLS scoped to tutor, TLS |
| **Sensitive** | Student emails/phones, Stripe data | Server actions only, Stripe-hosted payments |
| **Highly Sensitive** | Credentials, OAuth tokens | Encrypted storage, audit logs |

---

## 3. Supabase & Database

### Row Level Security (RLS)
- Enabled on every table
- Tutors can only read/update rows where `tutor_id = auth.uid()`
- Students access only their records via `students.user_id`
- Service role credentials never exposed client-side

### Policies Checklist
- [ ] New tables have RLS enabled
- [ ] Tutor data scoped to `auth.uid()`
- [ ] Public read only where necessary
- [ ] Migrations reviewed before production

---

## 4. Authentication & Sessions

- Email/password authentication via Supabase Auth
- JWT tokens in httpOnly cookies (`@supabase/ssr`)
- Session validation in middleware for protected routes
- Refresh token rotation enabled
- Never trust client-supplied role values

### Protected Routes (middleware.ts)
```
/dashboard, /availability, /bookings, /students, /services,
/pages, /settings, /analytics, /marketing, /onboarding,
/calendar, /digital-products, /messages
```

---

## 5. Secrets & Environment

- `.env.local` for development only
- Production secrets in Vercel/Supabase secret stores
- Rotate secrets periodically
- Distinct keys per environment (dev, staging, prod)
- Only `NEXT_PUBLIC_*` variables exposed to client
- AI provider keys (`OPENAI_API_KEY`) must stay server-side only; avoid logging payloads with the key and rotate if any exposure is suspected.

### Required Secrets
```
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
OPENAI_API_KEY
GOOGLE_CLIENT_SECRET
MICROSOFT_CLIENT_SECRET
```

---

## 6. Payments (Stripe Connect)

- Verify webhook signatures (`STRIPE_WEBHOOK_SECRET`)
- Use Checkout/Customer Portal - never collect card data directly
- Handle idempotency - guard against duplicate webhook events
- Store minimal metadata (service IDs, booking IDs)
- Stripe Connect destination charges for tutor payouts
- Refunds processed through Stripe API with audit trail

### Webhook Events
- `checkout.session.completed` - Mark booking paid
- `account.updated` - Sync Connect account status

---

## 7. Calendar Integrations

### Google Calendar OAuth
- Scopes: `https://www.googleapis.com/auth/calendar.events` (read/write events only)
- Only used to read busy times for conflict checks and create/update booking events
- Access/refresh tokens stored encrypted in `calendar_connections`
- Auto-refresh tokens before expiration

### Microsoft Outlook OAuth
- Scopes: `Calendars.ReadWrite`, `offline_access`
- Same token storage pattern as Google

### Security Controls
- OAuth popup flow with postMessage callback
- Tokens never exposed to client
- Calendar data fetched server-side only

---

## 8. Email (Resend)

- DKIM/SPF configured for domain
- Unsubscribe links in marketing emails
- Transactional emails clearly labeled
- `email_preferences` table for opt-out tracking
- `email_queue` for reliable delivery

---

## 9. Frontend Security

### Content Security
- Escape/sanitize all user-generated content
- shadcn/ui components - avoid `dangerouslySetInnerHTML`
- Rate-limit public APIs (booking, lead forms)

### Headers (via Next.js/Vercel)
- `Strict-Transport-Security`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- Content Security Policy (CSP)

### File Uploads
- Allowlist MIME types
- Size limits enforced
- Supabase Storage with bucket-level RLS

---

## 10. Monitoring & Alerts

Monitor for:
- Auth errors/spikes
- Payment failures/webhook retries
- Unusual booking patterns
- Security events

Tools: Sentry (errors), PostHog (analytics), Supabase logs

---

## 11. Development Workflow

- Pull requests require code review
- Linting and type checking in CI
- `npm audit` for dependency vulnerabilities
- Playwright E2E tests for critical flows
- Security review before major features

---

## 12. Incident Response

1. **Identify** - Check logs, alerts
2. **Contain** - Revoke keys, disable features
3. **Notify** - Inform affected users as required
4. **Patch** - Fix, test, deploy
5. **Post-mortem** - Document and remediate

### Backup Strategy
- Supabase automated backups
- Manual export of critical tables monthly

---

## 13. Compliance

- GDPR considerations for EU students
- Data subject request process
- Right to deletion supported
- Email unsubscribe compliance

---

## Security Checklist for New Features

- [ ] RLS policies for new tables
- [ ] Input validation/sanitization
- [ ] Server actions for sensitive operations
- [ ] Secrets stored securely
- [ ] Logging for audit trail
- [ ] Error handling without data leakage
