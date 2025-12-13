# TutorLingua

TutorLingua is the operating system for independent language tutors: direct booking stack, payments, CRM, AI practice, marketing, and a Studio video classroom.

## Highlights
- **Direct booking + payments:** Services, timezone-aware availability, two-way Google/Outlook sync, packages, lesson subscriptions, recurring reservations, reschedules and refunds, checkout rate limiting + amount validation, Stripe webhook idempotency, atomic booking function, double-booking DB constraint, payments audit trail.
- **Student CRM & portal:** Labels, notes, lesson history, access requests, learning goals, proficiency assessments, homework assignments and submissions (text/audio/files), student portal for bookings/messages/practice/subscriptions/progress.
- **Messaging & notifications:** Realtime tutor-student messaging with attachments and voice notes, notification center with 14+ event types and read states.
- **Marketing & sales:** Tutor sites with cultural archetypes and page builder, link-in-bio, digital products marketplace with tiered commissions, email campaigns, SEO blog content.
- **AI & Studio:** AI Practice companion with scenario builder, grammar/pronunciation tracking, usage-based billing; AI drills (match, gap-fill, scramble); LiveKit classroom with recording and Deepgram transcription for Studio tier.
- **Analytics & admin:** Revenue/booking/student analytics, demand heatmap, calendar smart management, onboarding wizard and upgrade gates, admin health dashboard, moderation queue, support tickets.

## Tech Stack
- Next.js 16.0.10 (App Router), React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui, Lucide, Framer Motion.
- Supabase (PostgreSQL, Auth, Storage, Realtime, RLS) with encrypted OAuth tokens.
- Stripe + Stripe Connect; Resend for email.
- OpenAI (AI practice), LiveKit (video), Deepgram (transcription).
- i18n with next-intl for EN, ES, FR, PT, DE, IT, JA, KO, NL, ZH.
- Charts: Recharts. Testing: Node test runner + Playwright. Linting: ESLint 9.

## Application Map
- **Dashboard:** `/dashboard`, `/bookings`, `/availability`, `/students`, `/students/[studentId]`, `/services`, `/practice-scenarios`, `/messages`, `/digital-products`, `/marketplace`, `/calendar`, `/analytics`, `/notifications`, `/settings/*`, `/onboarding`, `/upgrade`, `/admin/*`, `/classroom/[bookingId]`, `/student/review/[bookingId]`.
- **Public:** `/[username]`, `/bio/[username]`, `/profile/[username]`, `/book/[username]`, `/products/[username]`, `/page/[username]`, `/for/[slug]` (niche landing pages), `/help`, `/help/[slug]`, `/signup`, `/login`, `/blog/[slug]`, `/{lang}/blog/[slug]` (en, es, fr, pt, de, it, ja, ko, nl, zh).
- **Student portal:** `/student/progress`, `/student/practice/[assignmentId]`, `/student/messages`, `/student/subscriptions`, `/student/drills`, `/student/library`.

## Key Flows
- **Onboarding:** 6-step wizard (profile, professional info, services, availability, calendar sync, Stripe/alternate payments) gates dashboard access.
- **Booking & payments:** Public and tutor-initiated bookings with conflict detection; package/subscription redemption; manual payment tracking; reschedule history; refunds; payments audit via idempotent Stripe webhooks.
- **Calendar sync:** OAuth popups for Google and Outlook, encrypted tokens, busy event import into week/day/month views, manual blocked times.
- **Student CRM:** Access requests and approvals, CSV import, labels, connection requests, notes, lesson history, goals, proficiency assessments, homework planner and submissions.
- **AI practice & drills:** Practice scenario builder, grammar issue tracking, audio pronunciation scoring, metered billing periods with add-on blocks, student/tutor analytics, interactive drills.
- **Studio tier:** LiveKit classroom with consented recording to S3, Deepgram transcription, AI-generated drills from recordings, post-lesson review with video replay and AI insights.
- **Marketplace & marketing:** Tutor sites with cultural archetypes, link-in-bio, digital products with download tokens and tiered commissions, email campaigns, SEO blog, niche landing pages (`/for/spanish-conversation`, etc.).
- **Help center:** Categorized help articles with search and i18n support (`/help`, `/es/help`).
- **Analytics:** Revenue, bookings, student metrics, service mix, payments summary; PostHog optional.

## Project Structure
```
app/
├── app/                    # Next.js app router
│   ├── (dashboard)/        # Authenticated dashboard and classroom
│   ├── (public)/           # Public pages (sites, profiles, blog, products)
│   ├── api/                # Stripe, calendar, analytics, practice, admin, webhooks
│   ├── book/               # Public booking flow
│   ├── signup/, login/     # Auth pages
│   └── student/            # Student portal
├── components/             # UI, dashboard, booking, marketing, messaging, drills, classroom
├── lib/                    # Server actions, supabase clients, stripe/payments, calendar, practice, validators, utils
├── emails/                 # Resend React email templates
├── supabase/               # Database config and migrations
├── e2e/, tests/            # Playwright + unit tests
├── docs/, app/docs/        # Product, growth, economics docs
└── scripts/, public/, i18n/, messages/
```

## Data & Security
- 55+ Supabase tables across bookings, payments, students, learning, AI, and marketplace domains.
- RLS enforced on tutor-owned data; published tutor sites remain public.
- Webhook idempotency for Stripe; checkout rate limiting and amount bounds; unique `(tutor_id, scheduled_at)` constraint to prevent double-booking.
- Encrypted OAuth tokens for calendar sync; storage buckets for avatars, recordings, and message attachments.

## Getting Started
### Prerequisites
- Node.js 18+
- Supabase project + CLI
- Stripe + Stripe Connect (for tutor payouts)
- Resend API key
- Optional: LiveKit + S3 storage + Deepgram, Google/Microsoft OAuth apps, PostHog keys

### Install & Run
```bash
git clone https://github.com/your-org/language-tutor-platform.git
cd language-tutor-platform/app
npm install
cp .env.example .env.local   # fill in your credentials
# supabase db push           # apply migrations to local Supabase (optional for local DB)
npm run dev
```

## Vercel Deployment
- In Vercel Project Settings, set **Root Directory** to `app` and **Framework Preset** to `Next.js` (not `Other`).
- Add required environment variables in Vercel, then redeploy.

## Environment Variables
### Required
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_ALL_ACCESS_PRICE_ID=
STRIPE_LIFETIME_PRICE_ID=

RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=
OPENAI_API_KEY=
```

### Integrations
```bash
# Stripe Connect payouts
STRIPE_CONNECT_RETURN_URL=
STRIPE_CONNECT_REFRESH_URL=

# Calendar OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URL=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_OAUTH_REDIRECT_URL=

# Studio tier (video + transcription)
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
NEXT_PUBLIC_LIVEKIT_URL=
DEEPGRAM_API_KEY=
SUPABASE_S3_ENDPOINT=
SUPABASE_S3_ACCESS_KEY=
SUPABASE_S3_SECRET_KEY=
SUPABASE_S3_BUCKET=

# Analytics (optional)
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
```

## Scripts
```bash
npm run dev           # Next.js (Turbopack) dev server
npm run build         # Production build
npm run start         # Production server
npm run lint          # ESLint
npm run type-check    # TypeScript only
npm test              # Unit tests (Node test runner)
npm run smoke         # Lint + unit tests
npm run test:e2e      # Playwright E2E
npm run test:e2e:ui   # Playwright UI mode
npm run translate     # DeepL translation helper
```

## Pricing & Plans
**For Tutors:**

| Plan | Price | Features |
|------|-------|----------|
| Pro Monthly | $39/month | Full platform access |
| Pro Annual | $351/year | 25% off ($29.25/mo) |
| Pro Lifetime | $299 one-time | Lifetime Pro access |
| Studio Monthly | $79/month | Pro + Video, Transcription, Drills |
| Studio Annual | $711/year | 25% off ($59.25/mo) |
| Studio Lifetime | $499 one-time | Lifetime Studio access |

- 14-day free trial, no CC required
- 0% platform commission on direct bookings

**For Students (AI Practice):**
- Base tier: **$8/month** (included practice minutes)
- Add-on blocks: **$5** per block for heavy usage

## Documentation
- `app/claude.md` — full platform documentation
- `STRIPE-SETUP-GUIDE.md` — Stripe/Connect setup
- `SECURITY.md` — security practices
- `MVP-LAUNCH-FIXES.md` — security and payments hardening checklist
- `studio.md` — Studio tier technical vision
- `app/docs/` — business plan, economics, growth blitz, lesson studio plan
- `app/docs/blog/` — 140+ SEO articles across 10 languages (EN + 9 translations)

## Internationalization
Supports English, Spanish, French, Portuguese, German, Italian, Japanese, Korean, Dutch, and Chinese via `next-intl`.

## License
Proprietary — All rights reserved

*Last updated: December 13, 2025*
