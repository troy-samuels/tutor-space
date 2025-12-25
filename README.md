# TutorLingua

TutorLingua is the operating system for independent language tutors: direct booking stack, payments, CRM, AI practice, marketing, and a Studio video classroom.

## Table of Contents
- [Highlights](#highlights)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Application Map](#application-map)
- [API Routes](#api-routes)
- [Database Schema](#database-schema)
- [Key Flows](#key-flows)
- [Security & Data Protection](#security--data-protection)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Testing](#testing)
- [Deployment](#deployment)
- [Pricing & Plans](#pricing--plans)
- [Documentation](#documentation)
- [Internationalization](#internationalization)

---

## Highlights

- **Direct booking + payments:** Services, timezone-aware availability, two-way Google/Outlook sync, packages, lesson subscriptions, recurring reservations, reschedules and refunds, checkout rate limiting + amount validation, Stripe webhook idempotency, atomic booking function, double-booking DB constraint, payments audit trail.
- **Student CRM & portal:** Labels, notes, lesson history, access requests, learning goals, proficiency assessments, homework assignments and submissions (text/audio/files), student portal for bookings/messages/practice/subscriptions/progress.
- **Messaging & notifications:** Realtime tutor-student messaging with attachments and voice notes, notification center with 14+ event types and read states.
- **Marketing & sales:** Tutor sites with cultural archetypes and page builder, link-in-bio, digital products marketplace with tiered commissions, email campaigns, SEO blog content.
- **AI & Studio:** AI Practice companion with scenario builder, grammar/pronunciation tracking, freemium billing model; AI drills (match, gap-fill, scramble); LiveKit classroom with recording and Deepgram transcription; Enterprise lesson analysis with L1 interference detection, code switching detection for multilingual lessons, and adaptive drills for Studio tier.
- **Tutor Copilot:** AI-powered lesson briefings with student context, engagement indicators, activity suggestions, and conversation starters generated before each lesson.
- **SEO & Discovery:** Dynamic OG images for social sharing, llms.txt for AI assistant discovery, SEO generators for optimized metadata, structured data (JSON-LD) for rich search results.
- **Analytics & admin:** Revenue/booking/student analytics, demand heatmap, calendar smart management, onboarding wizard and upgrade gates, admin health dashboard, moderation queue, support tickets.

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.0.10 | App Router with Turbopack |
| React | 19.2.3 | UI framework |
| TypeScript | 5.x | Type safety (strict mode) |
| Tailwind CSS | 4.x | Utility-first styling |
| shadcn/ui | - | Accessible component primitives |
| Framer Motion | - | Animations |
| Lottie React | - | Animated illustrations |
| Lucide React | - | Icon library |
| Recharts | - | Data visualization |
| next-intl | - | Internationalization (10 languages) |
| @tanstack/react-table | - | Data tables |
| @dnd-kit | - | Drag-and-drop |
| react-hook-form + Zod | - | Form handling & validation |
| date-fns / date-fns-tz | - | Timezone-aware date handling |

### Backend & Data
| Technology | Purpose |
|------------|---------|
| Supabase | PostgreSQL database, Auth, Storage, Realtime |
| Server Actions | Business logic via `'use server'` directives |
| Row Level Security | Data isolation per tutor/student |
| @supabase/ssr | Server-side session management |

### Payments
| Technology | Purpose |
|------------|---------|
| Stripe | Payment processing |
| Stripe Connect | Direct tutor payouts (Express accounts) |
| Destination Charges | Marketplace payment model |

### AI & Language
| Technology | Purpose |
|------------|---------|
| OpenAI GPT-4 | AI Practice conversations, lesson analysis, drill generation |
| Deepgram Nova-3 | Speech-to-text transcription, speaker diarization |
| Azure Speech | Pronunciation assessment (optional) |

### Video & Recording
| Technology | Purpose |
|------------|---------|
| LiveKit | WebRTC video conferencing (Studio tier) |
| S3-compatible Storage | Lesson recording egress (OGG format) |

### Email
| Technology | Purpose |
|------------|---------|
| Resend | Transactional emails & campaigns |
| React Email | Component-based email templates |

### Testing & Quality
| Technology | Purpose |
|------------|---------|
| Node test runner | Unit & integration tests |
| Playwright | End-to-end testing |
| Storybook | Component documentation |
| @axe-core/playwright | Accessibility testing |
| ESLint 9 | Code linting |

---

## Architecture

### Server Actions Pattern
All business logic runs server-side via Next.js Server Actions:
```
lib/actions/           # 49 server action modules
├── auth.ts           # Authentication (signup, login, password reset)
├── bookings.ts       # Booking lifecycle (create, cancel, reschedule)
├── availability.ts   # Weekly schedule management
├── students.ts       # Student CRUD and access control
├── messaging.ts      # Realtime messaging operations
├── progress.ts       # Learning goals, assessments, homework
├── lesson-subscriptions.ts  # Subscription tier management
├── digital-products.ts      # Digital product sales
├── copilot.ts        # Lesson briefing generation
├── ai-assistant.ts   # AI conversation management
├── practice.ts       # AI practice scenario operations
└── ... (38 more modules)
```

### Repository Pattern
Data access abstraction in `/lib/repositories/` encapsulates Supabase queries for reuse across actions and API routes.

### Service Layer
Business services in `/lib/services/`:
- `calendar/` - Google & Outlook calendar sync
- `payments/` - Stripe payment utilities
- `checkout-agent.ts` - Advanced checkout logic
- `connect.ts` - Stripe Connect account management

### Middleware Architecture
`middleware.ts` enforces:
- Authentication on protected routes
- Onboarding completion gates
- Tier-based access control (Pro vs. Studio)
- Redirects for unauthorized access

### Validation Layer
Zod schemas in `/lib/validators/`:
- `availabilityFormSchema`
- `profileFormSchema`
- `serviceFormSchema`
- `tutorSiteFormSchema`

### Component Architecture
```
components/
├── ui/              # shadcn/ui base components (40+)
├── dashboard/       # Dashboard widgets and metrics
├── booking/         # Public booking flow
├── bookings/        # Tutor booking management
├── students/        # Student CRM interface
├── student/         # Student portal components
├── calendar/        # Calendar views (month, week, day)
├── messaging/       # Realtime messaging interface
├── classroom/       # LiveKit video room
├── practice/        # AI practice UI
├── drills/          # Interactive game components
├── copilot/         # Lesson briefing widget
├── page-builder/    # Tutor site wizard
├── site/            # Tutor site display
└── ... (30+ more directories)
```

---

## Application Map

### Dashboard (Authenticated)
| Route | Purpose |
|-------|---------|
| `/dashboard` | Main dashboard with KPIs |
| `/bookings` | Booking management |
| `/availability` | Weekly availability scheduler |
| `/students` | Student CRM |
| `/students/[studentId]` | Student detail page |
| `/services` | Lesson type management |
| `/calendar` | Interactive calendar (month/week/day) |
| `/messages` | Direct messaging with students |
| `/digital-products` | Digital product management |
| `/marketplace` | Digital product sales dashboard |
| `/practice-scenarios` | AI practice template builder |
| `/analytics` | Revenue and booking analytics |
| `/notifications` | Notification center |
| `/settings/profile` | Profile settings |
| `/settings/payments` | Payment method configuration |
| `/settings/billing` | Subscription management |
| `/settings/calendar` | Calendar OAuth connections |
| `/onboarding` | 6-step initial setup wizard |
| `/upgrade` | Plan upgrade page |
| `/classroom/[bookingId]` | LiveKit video classroom (Studio) |
| `/student/review/[bookingId]` | Post-lesson review with AI insights |
| `/copilot/briefing/[bookingId]` | AI lesson briefing |
| `/admin/*` | Admin dashboard (health, moderation, analytics) |

### Public Pages
| Route | Purpose |
|-------|---------|
| `/signup` | Tutor registration |
| `/login` | Tutor login |
| `/book/[username]` | Tutor-specific booking page |
| `/book/success` | Booking confirmation |
| `/[username]` | Tutor site (full website) |
| `/bio/[username]` | Link-in-bio page |
| `/profile/[username]` | Public tutor profile |
| `/products/[username]` | Digital product catalog |
| `/page/[username]` | Tutor site pages |
| `/for/[slug]` | Niche landing pages (SEO) |
| `/help` | Help center index |
| `/help/[slug]` | Help articles |
| `/blog/[slug]` | Blog posts (English) |
| `/{lang}/blog/[slug]` | Localized blog (10 languages) |

### Student Portal
| Route | Purpose |
|-------|---------|
| `/student/login` | Student login |
| `/student/signup` | Student registration |
| `/student/progress` | Learning goals, assessments, stats |
| `/student/practice` | AI Practice companion |
| `/student/practice/[assignmentId]` | Practice session |
| `/student/drills` | Grammar/vocabulary drills |
| `/student/homework` | Homework assignments |
| `/student/library` | Learning resources |
| `/student/messages` | Messaging with tutor |
| `/student/calendar` | Upcoming lessons |
| `/student/subscriptions` | Lesson subscriptions |
| `/student/purchases` | Digital product purchases |
| `/student/notifications` | Notification center |
| `/student/settings` | Student profile settings |

### Discovery
| Route | Purpose |
|-------|---------|
| `/api/og/[username]` | Dynamic OG images |
| `/llms.txt` | AI assistant discovery document |

---

## API Routes

### Authentication (3 routes)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/auth/me` | Current user info |
| POST | `/api/admin/auth/login` | Admin login |
| POST | `/api/admin/auth/logout` | Admin logout |

### Stripe & Payments (15 routes)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/stripe/booking-checkout` | Create booking checkout |
| POST | `/api/stripe/subscription-checkout` | Subscribe to plan |
| POST | `/api/stripe/plan-change` | Change subscription tier |
| POST | `/api/stripe/billing-portal` | Open billing portal |
| POST | `/api/stripe/subscribe` | Subscribe to tier |
| POST | `/api/stripe/create-checkout-session` | Generic checkout |
| POST | `/api/stripe/lifetime` | Lifetime deal checkout |
| POST | `/api/stripe/sync-customer` | Sync customer data |
| POST | `/api/stripe/webhook` | Process Stripe webhooks (idempotent) |
| POST | `/api/stripe/connect/accounts` | Create Connect account |
| GET | `/api/stripe/connect/status` | Check Connect status |
| POST | `/api/stripe/connect/account-link` | Onboarding link |
| POST | `/api/stripe/connect/login-link` | Connect dashboard |
| POST | `/api/stripe/connect/fast-onboard` | Quick onboarding |

### Calendar & Scheduling (4 routes)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/calendar/oauth/[provider]` | OAuth callback (Google/Outlook) |
| POST | `/api/cron/calendar-sync` | Background calendar sync |
| POST | `/api/cron/send-reminders` | Lesson reminders |
| POST | `/api/cron/homework-reminders` | Homework reminders |

### AI Practice (10 routes)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/practice/chat` | AI conversation (text) |
| POST | `/api/practice/chat/stream` | AI streaming response |
| POST | `/api/practice/audio` | Audio transcription & pronunciation |
| POST | `/api/practice/session` | Start/manage session |
| POST | `/api/practice/end-session` | Finalize session |
| GET | `/api/practice/scenarios` | List practice templates |
| POST | `/api/practice/assign` | Assign scenario to student |
| POST | `/api/practice/subscribe` | Purchase AI Practice |
| POST | `/api/practice/enable` | Enable AI Practice |
| GET | `/api/practice/usage` | Check usage limits |

### LiveKit Video (3 routes)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/livekit/token` | Generate WebRTC token |
| POST | `/api/livekit/recording` | Start/stop recording |
| POST | `/api/classroom/tutor-notes` | Save lesson notes |

### Webhooks (3 routes)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/webhooks/deepgram` | Transcription callback |
| POST | `/api/webhooks/livekit` | LiveKit events |
| POST | `/api/webhooks/resend` | Email service events |

### Cron Jobs (7 routes)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/cron/send-reminders` | Lesson reminders |
| POST | `/api/cron/homework-reminders` | Homework notifications |
| POST | `/api/cron/lesson-analysis` | Deepgram & AI analysis |
| POST | `/api/cron/generate-briefings` | AI lesson briefings |
| POST | `/api/cron/calendar-sync` | Calendar event sync |
| POST | `/api/cron/message-digest` | Message summaries |
| POST | `/api/cron/cleanup-analytics` | Data cleanup |

### Admin (25 routes)
Health monitoring, tutor management, moderation queue, analytics dashboards, email administration, data exports (CSV), and transcription retry endpoints.

### Booking & Products (4 routes)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/booking/check-slot` | Validate booking time |
| POST | `/api/booking/inline/[username]` | Inline booking widget |
| POST | `/api/digital-products/checkout` | Product purchase |
| GET | `/api/digital-products/download/[token]` | File download |

### Support & Utilities (8 routes)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/support` | Support ticket submission |
| POST | `/api/username/check` | Username availability |
| GET | `/api/links/[id]/click` | Link tracking |
| POST | `/api/email/check` | Email validation |
| POST | `/api/refunds/request` | Refund request |
| POST | `/api/refunds/approve` | Approve refund |
| POST | `/api/site-assets/upload` | Upload files |
| POST | `/api/upload-avatar` | Avatar upload |

---

## Database Schema

### Core Business (6 tables)
| Table | Purpose |
|-------|---------|
| `profiles` | Tutor accounts with subscription tier |
| `students` | Student records with access control |
| `bookings` | Lessons with payment tracking |
| `services` | Lesson types and pricing |
| `availability` | Weekly recurring time slots |
| `blocked_times` | Manual unavailability |

### Payments & Subscriptions (7 tables)
| Table | Purpose |
|-------|---------|
| `session_package_templates` | Pre-paid package definitions |
| `session_package_purchases` | Package purchases |
| `lesson_subscription_templates` | Monthly subscription tiers |
| `lesson_subscriptions` | Active subscriptions |
| `lesson_allowance_periods` | Monthly credit tracking |
| `lesson_subscription_redemptions` | Usage tracking |
| `processed_stripe_events` | Webhook deduplication |

### Digital Products (2 tables)
| Table | Purpose |
|-------|---------|
| `digital_products` | Downloadable products |
| `digital_product_purchases` | Product purchases |

### Calendar & Sync (2 tables)
| Table | Purpose |
|-------|---------|
| `calendar_connections` | OAuth tokens (encrypted) |
| `calendar_settings` | Smart scheduling preferences |

### Communication (2 tables)
| Table | Purpose |
|-------|---------|
| `conversation_threads` | Message threads |
| `conversation_messages` | Individual messages |

### Learning & Progress (6 tables)
| Table | Purpose |
|-------|---------|
| `homework_assignments` | Tutor assignments |
| `homework_submissions` | Student submissions |
| `learning_goals` | Student objectives |
| `proficiency_assessments` | Skill assessments (8 areas) |
| `lesson_notes` | Post-lesson feedback |
| `learning_stats` | Aggregated statistics |

### AI Features (8 tables)
| Table | Purpose |
|-------|---------|
| `practice_scenarios` | Custom AI templates |
| `practice_assignments` | Assigned scenarios |
| `student_practice_sessions` | Active/completed sessions |
| `student_practice_messages` | Session messages |
| `grammar_issues` | Error tracking (11 categories) |
| `pronunciation_assessments` | Audio analysis |
| `practice_usage_periods` | Metered billing |
| `ai_usage` | Token usage tracking |

### Studio Features (3 tables)
| Table | Purpose |
|-------|---------|
| `lesson_recordings` | Video/audio with transcripts, code-switching metrics |
| `lesson_drills` | Generated exercises |
| `lesson_briefings` | Pre-lesson AI briefings |

### Marketing & Sites (7 tables)
| Table | Purpose |
|-------|---------|
| `tutor_sites` | Website builder content |
| `tutor_site_services` | Site service links |
| `tutor_site_reviews` | Student testimonials |
| `tutor_site_resources` | Resource links |
| `tutor_site_products` | Digital products on site |
| `links` | Link-in-bio items |
| `marketplace_transactions` | Digital product sales |

### Admin & Moderation (8 tables)
| Table | Purpose |
|-------|---------|
| `notifications` | User notifications (14+ types) |
| `content_reports` | Moderation reports |
| `moderation_actions` | Moderation audit trail |
| `support_tickets` | Support requests |
| `email_campaigns` | Bulk email history |
| `email_events` | Resend webhook events |
| `email_suppressions` | Bounce/complaint list |
| `page_views` | Analytics tracking |

**Total: 55+ tables** with comprehensive RLS policies.

---

## Key Flows

### Onboarding
6-step wizard (profile, professional info, services, availability, calendar sync, Stripe/alternate payments) gates dashboard access.

### Booking & Payments
1. Public or tutor-initiated booking with conflict detection
2. Package/subscription credit redemption or Stripe checkout
3. Destination charges to tutor's Connect account (0% platform fee)
4. Idempotent webhook processing
5. Booking confirmation emails via Resend
6. Reschedule history tracking

### Calendar Sync
1. OAuth popup for Google/Outlook
2. Token encryption at rest
3. Busy event import into calendar views
4. Manual blocked times overlay
5. Conflict prevention during booking

### AI Practice & Drills
1. Practice scenario builder (custom templates)
2. Real-time grammar issue tracking (11 categories)
3. Audio pronunciation scoring
4. Metered billing periods with add-on blocks
5. Interactive drills (match, gap-fill, scramble)

### Studio Tier
1. LiveKit classroom with consented audio-only recording
2. S3 egress (OGG format)
3. Deepgram transcription with speaker diarization
4. AI-generated drills from recordings
5. Post-lesson review with audio playback
6. L1 interference detection
7. Code-switching detection for multilingual lessons

### Marketplace & Marketing
1. Tutor sites with 4 cultural archetypes
2. Link-in-bio with drag-and-drop
3. Digital products with download tokens
4. Tiered commissions on marketplace sales
5. Email campaigns with audience filters
6. SEO blog with 140+ articles (10 languages)

---

## Security & Data Protection

### Authentication & Authorization
- **JWT tokens** in httpOnly cookies via `@supabase/ssr`
- **Session middleware** refreshes tokens automatically
- **Route protection** for `/dashboard`, `/student`, `/admin` routes
- **Plan gating** (Pro/Studio) enforced at middleware level

### Row Level Security (RLS)
```sql
-- Tutors own their data
CREATE POLICY "Tutors manage bookings"
  ON bookings FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Public sites visible to all
CREATE POLICY "Public view published sites"
  ON tutor_sites FOR SELECT
  USING (status = 'published');
```

### Data Protection
| Feature | Implementation |
|---------|----------------|
| OAuth tokens | AES-256 encryption at rest |
| Webhook verification | Stripe signature validation |
| Idempotency | `processed_stripe_events` deduplication table |
| Rate limiting | Checkout request throttling |
| Amount validation | Server-side payment bounds checking |
| Double-booking prevention | `UNIQUE (tutor_id, scheduled_at)` constraint |

### Email Security
- Bounce/complaint tracking via Resend webhooks
- Global suppression list (`email_suppressions`)
- Email events audit trail

### Content Security Policy
Strict CSP headers with whitelisted third-party domains for Stripe, LiveKit, Supabase, and analytics.

---

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
# supabase db push           # apply migrations to local Supabase (optional)
npm run dev
```

---

## Environment Variables

### Required (Core)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
SUPABASE_SERVICE_ROLE_KEY=eyJhb...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (Pro Tier)
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_ANNUAL_PRICE_ID=price_...
STRIPE_PRO_LIFETIME_PRICE_ID=price_...

# Stripe Price IDs (Studio Tier)
STRIPE_STUDIO_MONTHLY_PRICE_ID=price_...
STRIPE_STUDIO_ANNUAL_PRICE_ID=price_...
STRIPE_STUDIO_LIFETIME_PRICE_ID=price_...

# Email
RESEND_API_KEY=re_...

# AI
OPENAI_API_KEY=sk_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Stripe Connect (Marketplace Payouts)
```bash
STRIPE_CONNECT_RETURN_URL=https://app.example.com/settings/payments
STRIPE_CONNECT_REFRESH_URL=https://app.example.com/settings/payments
```

### Calendar OAuth
```bash
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_OAUTH_REDIRECT_URL=  # defaults to NEXT_PUBLIC_APP_URL/api/calendar/oauth/google

MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
MICROSOFT_OAUTH_REDIRECT_URL=  # defaults to NEXT_PUBLIC_APP_URL/api/calendar/oauth/outlook

CALENDAR_TOKEN_ENCRYPTION_KEY=  # 32-byte base64 key (required for production)
```

### Studio Tier (Video + Transcription)
```bash
# LiveKit
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_TOKEN_TTL_SECONDS=  # default: 21600 (6 hours)

# Deepgram
DEEPGRAM_API_KEY=your_api_key

# Azure Speech (optional - pronunciation)
AZURE_SPEECH_KEY=...
AZURE_SPEECH_REGION=...

# S3-Compatible Storage
SUPABASE_S3_ENDPOINT=https://...
SUPABASE_S3_ACCESS_KEY=...
SUPABASE_S3_SECRET_KEY=...
SUPABASE_S3_BUCKET=recordings
```

### Analytics (Optional)
```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
POSTHOG_API_KEY=...
NEXT_PUBLIC_GA_ID=...
```

### Pre-Launch Protection (Optional)
```bash
SITE_GATE_ENABLED=false
SITE_GATE_PASSWORD=...
SITE_GATE_SECRET=...
```

**Note:** Calendar redirect URLs default to `NEXT_PUBLIC_APP_URL/api/calendar/oauth/{provider}` if explicit redirect vars are unset. Keep `CALENDAR_TOKEN_ENCRYPTION_KEY` stable across deploys so stored tokens remain decryptable.

---

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
npm run storybook     # Storybook component explorer
npm run translate     # DeepL translation helper
```

---

## Testing

### Test Structure
```
tests/
├── unit/             # Unit tests (Node test runner)
├── integration/      # Integration tests
e2e/
├── studio/           # Studio tier E2E tests
├── homework/         # Homework flow tests
├── practice/         # AI practice tests
├── accessibility/    # @axe-core accessibility tests
```

### Running Tests
```bash
# Unit tests
npm test

# E2E tests (requires running dev server)
npm run test:e2e

# E2E with UI mode
npm run test:e2e:ui

# Smoke tests (lint + type-check + unit)
npm run smoke
```

### Component Documentation
```bash
npm run storybook     # View component stories at localhost:6006
```

---

## Deployment

### Vercel Configuration
1. Set **Root Directory** to `app` in Project Settings
2. Set **Framework Preset** to `Next.js` (not "Other")
3. Add required environment variables
4. Set `OPENAI_API_KEY` as server-side only (not `NEXT_PUBLIC_*`)

### Cron Jobs
Configure Vercel Cron or external scheduler for:
- `/api/cron/send-reminders` - Lesson reminders (every 15 min)
- `/api/cron/calendar-sync` - Calendar sync (every 30 min)
- `/api/cron/lesson-analysis` - Recording analysis (hourly)
- `/api/cron/generate-briefings` - Lesson briefings (every 30 min)
- `/api/cron/homework-reminders` - Homework notifications (daily)

### Health Monitoring
- `/admin/health` - System health dashboard
- Resend webhook events tracked in `email_events`
- Stripe webhook idempotency via `processed_stripe_events`

---

## Pricing & Plans

### For Tutors

| Plan | Price | Features |
|------|-------|----------|
| Pro Monthly | $39/month | Full platform access |
| Pro Annual | $351/year | 25% off ($29.25/mo) |
| Pro Lifetime | $299 one-time | Lifetime Pro access |
| Studio Monthly | $79/month | Pro + Video, Transcription, Drills |
| Studio Annual | $711/year | 25% off ($59.25/mo) |
| Studio Lifetime | $499 one-time | Lifetime Studio access |

- 14-day free trial, no credit card required
- 0% platform commission on direct bookings

### For Students (AI Practice)

| Tier | Included | Price |
|------|----------|-------|
| Free | 45 audio minutes + 600 text turns | Free (requires tutor with Studio) |
| Add-on Block | +45 audio minutes, +300 text turns | $5 per block |

---

## Documentation

| File | Purpose |
|------|---------|
| `app/claude.md` | Full platform documentation |
| `STRIPE-SETUP-GUIDE.md` | Stripe/Connect setup |
| `SECURITY.md` | Security practices |
| `MVP-LAUNCH-FIXES.md` | Security and payments hardening checklist |
| `studio.md` | Studio tier technical vision |
| `docs/google-calendar-oauth.md` | Calendar OAuth troubleshooting |
| `app/docs/` | Business plan, economics, growth docs |
| `app/docs/blog/` | 140+ SEO articles (10 languages) |

---

## Project Structure

```
app/
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # Authenticated dashboard & classroom
│   ├── (public)/           # Public pages (sites, profiles, blog)
│   ├── api/                # API routes (60+ endpoints)
│   ├── book/               # Public booking flow
│   ├── signup/, login/     # Auth pages
│   └── student/            # Student portal
├── components/             # UI & feature components (100+)
├── lib/                    # Server actions, services, utilities
│   ├── actions/            # 49 server action modules
│   ├── services/           # Business services
│   ├── repositories/       # Data access layer
│   ├── validators/         # Zod schemas
│   ├── supabase/           # Database clients
│   ├── stripe/             # Stripe utilities
│   └── utils/              # Helper functions
├── emails/                 # React Email templates
├── supabase/               # Database config & migrations
├── e2e/                    # Playwright E2E tests
├── tests/                  # Unit & integration tests
├── stories/                # Storybook stories
├── docs/                   # Product documentation
├── public/                 # Static assets
├── i18n/                   # Internationalization config
├── messages/               # Translation files (10 languages)
└── scripts/                # Build & automation scripts
```

---

## Internationalization

Supports 10 languages via `next-intl`:

| Code | Language |
|------|----------|
| en | English |
| es | Spanish |
| fr | French |
| pt | Portuguese |
| de | German |
| it | Italian |
| ja | Japanese |
| ko | Korean |
| nl | Dutch |
| zh | Chinese |

Translation files located in `/messages/{locale}.json`.

---

## License

Proprietary - All rights reserved

---

*Last updated: December 25, 2025*
