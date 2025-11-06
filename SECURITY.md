# Security Playbook - TutorLingua

This document defines the baseline security practices for building and operating TutorLingua. It complements each feature guide (`00-...md`) and should be reviewed whenever new functionality or integrations are introduced.

---

## 1. Principles

1. **Least privilege everywhere** – Users (tutors, students, admins) and systems only access what they need.
2. **Defense in depth** – Combine Supabase RLS, Next.js server actions, Stripe/Zoom security, and infrastructure hardening.
3. **Secure by default** – Make the safe path the default path (e.g., private bucket access, HTTPS-only endpoints).
4. **Visibility and accountability** – Log significant events, audit access, and monitor for anomalies.
5. **Continuous improvement** – Revisit policies after every major feature/milestone.

---

## 2. Data Classification

| Category                         | Examples                                          | Controls                                                                                      |
|----------------------------------|---------------------------------------------------|-----------------------------------------------------------------------------------------------|
| **Public**                       | Tutor public profiles, marketing pages            | CDN cache, minimal personal info, sanitized content                                           |
| **Internal (Tutor)**             | Booking details, lesson plans, CRM notes          | Supabase RLS scoped to tutor, TLS in transit, optional encryption at rest                     |
| **Sensitive (Payment/PII)**      | Student emails/phones, Stripe invoices, recordings| Access via server actions only, Stripe-hosted payment pages, do not store card data           |
| **Highly Sensitive**             | AI transcripts, parent feedback, credentials      | Restricted storage buckets/tables, optional field-level encryption, audit log on access       |

---

## 3. Supabase & Database

- **Row Level Security (RLS)**: Enabled on every table (see `01-database-schema.md`). Verify new tables include: tutors manage own data, public read only where necessary, service role limited.
- **Policies Review Checklist** (run per schema change):
  - Tutors can only read/update rows where `tutor_id = auth.uid()` (or equivalent).
  - Students access only their records via `students.user_id`.
  - Service role credentials (Edge Functions/webhooks) have dedicated policies and never exposed client-side.
- **Migrations**: Execute via CI/CD with review; avoid direct production console edits.
- **Logs**: Enable Supabase audit logs if plan allows; otherwise track via PostgREST or application logging.

---

## 4. Authentication & Sessions

- Enforce strong passwords (length + complexity) and encourage OAuth (Google) for tutors.
- Enable refresh token rotation, short session lifetimes, and IP/device change checks.
- Plan MFA / WebAuthn for tutors in post-MVP (documented in `02-authentication.md`).
- Sanitize user metadata (e.g., `plan`, `role`) to prevent tampering—never trust client-supplied role values.
- Use HTTP-only, Secure, SameSite cookies. For App Router server actions, rely on `createClient()` wrappers from `00-project-setup.md`.

---

## 5. Secrets & Environment

- `.env.local` only for development. Production secrets stored in Vercel/Supabase secret stores.
- Rotate secrets periodically and whenever someone leaves the project.
- Use distinct keys per environment (dev, staging, prod); never reuse Stripe/Zoom keys.
- Restrict environment variable exposure (`NEXT_PUBLIC_` only when safe).

---

## 6. Payments & Financial Data

- Stripe:
  - Verify webhook signatures (`STRIPE_WEBHOOK_SECRET`).
  - Use Checkout/Customer Portal; never collect card data directly.
  - Store minimal metadata (service IDs, package IDs). Do not cache PII beyond what is required.
  - Handle idempotency: guard against duplicate events.
- PayPal (optional fallback):
  - Same rules as Stripe—use hosted checkout/orders API, capture events server-side.
- Invoices stored with minimal personal info (name, email). Mask if parent demands deletion.

---

## 7. Video & AI Integrations

- Zoom:
  - Use Server-to-Server OAuth, secure credentials.
  - Restrict `start_url` to tutors; store meeting IDs/passwords carefully.
  - If recording -> download/transcribe, ensure bucket access restricted; include retention policy (default 30 days).
- AI (OpenAI, Azure):
  - Do not send raw PII unless necessary. Redact personal details before processing.
  - Log prompt/response usage for support but anonymize where possible.

---

## 8. Messaging (Email/SMS/WhatsApp)

- Resend / provider:
  - DKIM/SPF setup for domain to avoid spoofing.
  - Include unsubscribe links for marketing emails; transactional emails clearly labelled.
  - Maintain `notification_logs` for compliance and debugging.
- SMS/WhatsApp:
  - Only send to contacts with explicit consent.
  - Honor STOP/UNSUBSCRIBE requests; record opt-out status.
  - Limit automation to Growth plan and provide manual override.

---

## 9. Frontend / App Security

- Escape and sanitize all user-generated content (bios, testimonials, notes) before rendering.
- Implement Content Security Policy (CSP) and other headers (via Next.js middleware or Vercel config):
  - `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`.
- Use component libraries (shadcn/ui) responsibly—avoid dangerouslySetInnerHTML unless sanitized.
- Rate-limit public APIs (booking, lead forms) and add CAPTCHA if abuse detected.
- Ensure file uploads are validated: allowlist MIME types, size limits, virus scanning if storing larger resources later.

---

## 10. Monitoring & Alerts

- Centralize logs (Supabase, Stripe, Zoom, Resend) and set up alerting for:
  - Auth errors/spikes
  - Payment failures/webhook retries
  - Unusual booking spikes (possible abuse)
  - Security events (new Zoom recording, AI transcript read)
- Consider tools: Logflare, Sentry, PostHog for anomaly detection.

---

## 11. Development Workflow

- Pull Requests: require code review, linting, tests, and security checklist confirmation.
- Dependency updates: Dependabot or Renovate to keep packages patched.
- Static analysis: run ESLint, TypeScript, and optionally security linters (e.g., `npm audit`, `snyk test`) in CI.
- Threat modeling: before major feature (payments, AI, CRM), update threat model with attack vectors + mitigations.
- Penetration testing: plan before public launch; at minimum run automated scans (OWASP ZAP) on staging.

---

## 12. Release & Incident Response

- Maintain environment-specific config; restrict prod deploys to approved maintainers.
- Backup strategy: Supabase automated backups + manual export of critical tables (students, bookings, invoices) monthly.
- Incident runbook:
  1. Identify scope (logs, alerts).
  2. Contain (revoke keys, disable affected features).
  3. Notify stakeholders (tutors, parents) as required.
  4. Patch, test, and deploy fix.
  5. Post-mortem with remediation steps.
- Legal/compliance: evaluate GDPR/FERPA obligations depending on student geography; include data subject request process.

---

## 13. Per-Feature Security Checkpoints

Each feature guide should include a “Security Considerations” subsection covering:

- Data access (RLS, server actions)
- Input validation/sanitization
- Third-party integration risks
- Secrets/credentials touched
- Logging/monitoring requirements
- Compliance/privacy notes

Use this doc as the master checklist during implementation and QA.

---

## 14. Milestone Security Tasks

| Milestone                               | Security Activities                                                                 |
|-----------------------------------------|--------------------------------------------------------------------------------------|
| **MVP (Goal 1)**                        | RLS audit, environment hardening, payment webhook validation, email opt-in tracking |
| **Stickiness/AI (Goal 2)**              | AI data sanitization, role-based access for CRM, parent data consent                 |
| **Studio / Team Features**              | Multi-user access controls, logging, SOC2 readiness (if targeting enterprises)       |
| **Pre-launch**                          | Pen test, runbook rehearsal, backup verification, incident communications plan       |

---

Keep this playbook version-controlled. Update it alongside new integrations or regulatory requirements.

