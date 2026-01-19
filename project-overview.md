# TutorLingua - Complete Project Overview

> **Purpose**: This document provides a comprehensive blueprint for rebuilding the TutorLingua language tutor platform from scratch. It covers the tech stack, business model, pricing, features, architecture, and implementation details.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Business Model & Pricing](#2-business-model--pricing)
3. [Tech Stack](#3-tech-stack)
4. [Core Features](#4-core-features)
5. [User Journeys](#5-user-journeys)
6. [Database Schema](#6-database-schema)
7. [API & Integrations](#7-api--integrations)
8. [Environment Variables](#8-environment-variables)
9. [File Structure](#9-file-structure)
10. [Development Workflow](#10-development-workflow)

---

## 1. Executive Summary

### What is TutorLingua?

TutorLingua is an **all-in-one SaaS platform for independent language tutors** that enables them to own their repeat student business through direct bookings. The platform is designed to **complement** (not compete with) marketplace platforms like Preply, iTalki, and Verbling.

### Value Proposition

| Platform | Commission | Tutor Keeps on $2,000/mo Revenue |
|----------|-----------|----------------------------------|
| Preply | 18-33% | $1,340-$1,640 |
| iTalki | 15% | $1,700 |
| Verbling | 15% | $1,700 |
| **TutorLingua** | **0%** | **$2,000** |

**Strategic positioning**: Use marketplaces for student **discovery**, use TutorLingua for **repeat business** with zero commission.

### Key Metrics

- **50+ database tables**
- **40+ API routes**
- **200+ React components**
- **80+ pages/routes**
- **10 languages supported**
- **20+ major features**

---

## 2. Business Model & Pricing

### 2.1 Revenue Streams

#### Primary: Tutor SaaS Subscriptions (0% commission on lessons)

| Plan | Price | Billing | Features |
|------|-------|---------|----------|
| **Professional** | Free | - | Limited access (default after trial) |
| **Pro Monthly** | $29/month | Monthly | Full platform access |
| **Pro Annual** | $199/year | Annual | 43% savings (~$17/month) |
| **Pro Lifetime** | $99 one-time | One-time | Lifetime Pro access |
| **Studio Monthly** | $79/month | Monthly | Pro + video, transcription, AI |
| **Studio Annual** | $499/year | Annual | 47% savings (~$42/month) |
| **Studio Lifetime** | $99 one-time | One-time | Lifetime Studio access |

#### Secondary: Digital Products Marketplace (Tiered Commission)

| Lifetime Sales | Commission Rate |
|----------------|-----------------|
| $0 - $499 | 15% |
| $500+ | 10% |

#### Tertiary: AI Practice Add-on Blocks

- **Free tier**: 45 audio minutes + 600 text turns/month (for Studio tutor students)
- **Add-on blocks**: $5 each = +45 audio minutes + +300 text turns

### 2.2 Free Trial System

- **Duration**: 14 days automatic on signup
- **Credit card**: Not required
- **Access level**: Pro tier features
- **Post-trial**: Reverts to Professional (free, limited)

### 2.3 Feature Access by Tier

#### Pro Tier Includes:
- Dashboard, Calendar, Bookings, Students, Services
- Availability management, Messages, Pages builder
- Analytics, Marketing tools, Session packages
- Lesson subscriptions, Stripe Connect payouts

#### Studio Tier Adds:
- LiveKit native video conferencing
- Lesson recording & Deepgram transcription
- AI drill generation (match, gap-fill, scramble)
- L1 interference detection
- AI Copilot (lesson briefings)
- Marketing clips, Learning roadmaps
- Advanced analytics (code-switching, diarization)

### 2.4 Lesson Payment Models

#### Direct Payment
- Student pays per lesson via Stripe checkout
- Funds transfer to tutor's Stripe Connect account
- Platform fee: 0%

#### Session Packages (Pre-paid Bundles)
```
Example: "10 Lessons for $400"
- session_count: 10
- total_minutes: 550 (10 × 55 min)
- price_cents: 40000
- expiration: 3 months
```

#### Lesson Subscriptions (Recurring Monthly)
```
Example: "4 Lessons/Month for $99"
- lessons_per_period: 4
- price_cents: 9900
- billing: Monthly via Stripe
- rollover: 1 month max (unused lessons)
```

#### Manual Payment
- Tutor provides Venmo, PayPal, Zelle, bank details
- Student pays offline
- Tutor marks booking as paid manually

---

## 3. Tech Stack

### 3.1 Core Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.0.10 | Full-stack React framework (App Router) |
| **React** | 19.2.3 | UI component library |
| **TypeScript** | 5.x | Static typing |
| **Node.js** | 22.x | Runtime environment |
| **Turbopack** | - | High-performance bundler |

### 3.2 Frontend

#### Styling & Design System
| Package | Version | Purpose |
|---------|---------|---------|
| Tailwind CSS | 4.x | Utility-first CSS |
| shadcn/ui | - | Component library (Radix + Tailwind) |
| Lucide React | 0.545.0 | Icon library |
| Framer Motion | 12.23.24 | Animation library |
| Lottie React | 2.4.1 | JSON animations |

#### Form & Validation
| Package | Version | Purpose |
|---------|---------|---------|
| React Hook Form | 7.65.0 | Form state management |
| Zod | 4.1.12 | Schema validation |
| @hookform/resolvers | 5.2.2 | Zod integration |

#### Data & Tables
| Package | Version | Purpose |
|---------|---------|---------|
| @tanstack/react-table | 8.20.5 | Headless tables |
| Recharts | 3.5.0 | Charting library |
| @dnd-kit/core | 6.3.1 | Drag and drop |
| @dnd-kit/sortable | 10.0.0 | Sortable lists |

#### Utilities
| Package | Version | Purpose |
|---------|---------|---------|
| date-fns | 4.1.0 | Date manipulation |
| date-fns-tz | 3.2.0 | Timezone support |
| next-intl | 4.6.0 | Internationalization (10 languages) |
| uuid | 13.0.0 | Unique identifiers |

### 3.3 Backend & Database

| Technology | Purpose |
|------------|---------|
| **Supabase** | PostgreSQL database, Auth, Storage, Realtime |
| **@supabase/supabase-js** | Client SDK (v2.75.0) |
| **@supabase/ssr** | Server-side rendering support (v0.7.0) |
| **Row Level Security (RLS)** | Database-level access control |

### 3.4 Payments

| Technology | Purpose |
|------------|---------|
| **Stripe** | Payment processing (v19.1.0) |
| **@stripe/stripe-js** | Browser SDK (v8.0.0) |
| **Stripe Connect** | Marketplace payouts to tutors |
| **Stripe Billing** | Subscription management |

### 3.5 Video & Real-time

| Technology | Purpose |
|------------|---------|
| **LiveKit** | Native WebRTC video conferencing |
| **@livekit/components-react** | React components (v2.9.17) |
| **livekit-server-sdk** | Server-side management (v2.14.2) |
| **Supabase Realtime** | WebSocket live updates |

### 3.6 AI & Speech

| Technology | Purpose |
|------------|---------|
| **OpenAI** | LLM for AI Practice, grammar, analysis (v6.9.1) |
| **Deepgram** | Speech-to-text transcription (v4.11.2) |
| Nova-3 model | Speaker diarization, code-switching |

### 3.7 Email & Notifications

| Technology | Purpose |
|------------|---------|
| **Resend** | Transactional email service |
| Webhook handling | Bounce, complaint, delivery tracking |

### 3.8 Testing

| Technology | Version | Purpose |
|------------|---------|---------|
| **Playwright** | 1.57.0 | E2E testing |
| **Vitest** | 4.0.16 | Unit testing |
| **Storybook** | 10.1.10 | Component documentation |

### 3.9 Infrastructure

| Technology | Purpose |
|------------|---------|
| **Vercel** | Hosting, serverless functions, edge runtime |
| **Upstash Redis** | Rate limiting, caching |
| **S3-compatible** | Recording storage (DigitalOcean Spaces) |

---

## 4. Core Features

### 4.1 Authentication & User Management

**Technology**: Supabase Auth with email/password

**User Roles**:
- **Tutors**: Primary account holders, manage business
- **Students**: Book lessons, track progress
- **Admins**: Platform management

**Features**:
- Email/password authentication
- Session management (httpOnly cookies)
- JWT token verification
- RLS-enforced data isolation

### 4.2 Booking & Scheduling

**Public Booking Page** (`/book/[username]`):
1. Student selects service (lesson type)
2. Views available time slots
3. Fills booking form (name, email, timezone, notes)
4. Chooses payment method
5. Completes checkout

**Payment Options**:
- Session package redemption
- Subscription credit redemption
- Direct Stripe payment
- Manual payment (offline)

**Key Tables**: `bookings`, `services`, `availability`

### 4.3 Calendar & Availability

**Availability System**:
- Weekly recurring slots (day_of_week, start_time, end_time)
- Timezone-aware scheduling
- Conflict detection

**Calendar Integrations**:
- Google Calendar (OAuth 2.0, 2-way sync)
- Microsoft Outlook (Graph API)
- Automatic busy window detection

**Views**: Month, Week, Day with drag-drop support

### 4.4 Video Classroom (Studio Tier)

**Technology**: LiveKit WebRTC

**Features**:
- Browser-based video conferencing
- Screen sharing
- Audio-only recording (cost-optimized OGG)
- Real-time lesson notes (shared editor)
- In-room chat
- Recording consent workflow

**API Routes**:
- `POST /api/livekit/token` - Generate access token
- `POST /api/livekit/recording` - Start/stop recording

### 4.5 CRM & Student Management

**Student Record**:
- Contact info (name, email, phone, timezone)
- Proficiency level, native language
- Learning goals and progress
- Custom labels (tags)
- Lesson history
- AI practice status

**Features**:
- Manual add or CSV import
- Access request workflow (approve/deny)
- Student detail view (5 tabs)
- Notes and feedback tracking

### 4.6 Dashboard & Analytics

**KPI Cards**:
- Revenue (monthly, YTD)
- Bookings (upcoming, completed)
- Students (active, new)

**Widgets**:
- Upcoming sessions
- Recent activity feed
- AI Copilot briefing (Studio)
- Services overview

**Analytics**:
- Revenue by service
- Booking trends
- Student acquisition sources
- Package sales analysis

### 4.7 Messaging

**Technology**: Supabase Realtime

**Features**:
- Text messages
- Audio message recording
- File attachments
- Unread tracking
- Real-time updates

**Tables**: `conversation_threads`, `conversation_messages`

### 4.8 AI Practice Companion (Studio)

**Free Tier**: 45 audio min + 600 text turns/month

**Features**:
- Custom conversation scenarios
- Real-time grammar corrections
- 11 grammar categories tracked
- Pronunciation assessment (audio)
- Session feedback and summary

**Grammar Categories**:
verb_tense, subject_verb_agreement, preposition, article, word_order, gender_agreement, conjugation, pronoun, plural_singular, spelling, vocabulary

### 4.9 Homework & Progress

**Homework Assignments**:
- Title, instructions, due date
- Resource attachments
- Audio instructions
- Link to AI practice scenario

**Homework Submissions**:
- Text response
- Audio recording
- File attachments
- Tutor feedback workflow

**Progress Tracking**:
- Learning goals with target dates
- Proficiency assessments (8 skill areas)
- Learning stats (lessons, minutes, streaks)

### 4.10 Digital Products Marketplace

**Product Types**: PDFs, ebooks, worksheets, video packages

**Commission Model**:
- 15% until $500 lifetime sales
- 10% after $500 lifetime sales

**Features**:
- File upload or external link
- Download limits
- Sales dashboard
- Transaction history

### 4.11 Tutor Site Builder

**Customizable Sections**:
1. Hero - Banner, headline, CTA
2. About - Bio content
3. Lessons - Service offerings
4. Reviews - Testimonials
5. Resources - Custom links
6. FAQ - Q&A section
7. Digital Products - Catalog
8. Contact - Booking CTA

**Theme System**:
- 4 archetypes: Professional, Immersion, Academic, Polyglot
- Color customization
- Font selection
- Border radius options

### 4.12 Stripe Connect Integration

**Onboarding Flow**:
1. Tutor clicks "Connect Stripe"
2. Creates Express Connect account
3. Completes Stripe onboarding
4. Webhook confirms verification
5. Ready to accept payments

**Payment Routing**:
- Destination charges to tutor account
- Platform fee: 0% (configurable)
- Direct bank transfer to tutor

### 4.13 Notifications

**Types** (14+):
- booking_new, booking_confirmed, booking_cancelled
- booking_reminder, payment_received, payment_failed
- message_new, student_new, student_access_request
- package_purchased, package_expiring
- review_received, system_announcement

### 4.14 Admin Dashboard

**Sections**:
- Dashboard (platform metrics)
- Tutors (list, search, impersonate)
- Students (list, search)
- Support (ticket management)
- Moderation (content reports)
- Audit Log (all actions)
- Export (CSV data export)

### 4.15 Internationalization

**Supported Languages** (10):
English, Spanish, French, Portuguese, German, Italian, Japanese, Korean, Dutch, Chinese

**Content**:
- UI translations
- 140+ SEO blog articles
- 7 blog clusters

---

## 5. User Journeys

### 5.1 Tutor Journey

```
1. DISCOVERY & SIGNUP
   → Sign up with email/password
   → Auto-receive 14-day Pro trial

2. ONBOARDING (7 steps)
   1. Profile (name, username, timezone, avatar)
   2. Professional info (tagline, bio)
   3. Languages & services (create lesson types, packages)
   4. Availability (weekly recurring slots)
   5. Calendar sync (Google/Outlook)
   6. Video provider (Zoom, Meet, Teams, LiveKit)
   7. Payment setup (Stripe Connect or manual)

3. DAILY OPERATIONS
   → View dashboard (upcoming lessons, metrics)
   → Check AI Copilot briefing for next lesson
   → Manage student access requests
   → Update availability as needed

4. LESSONS
   → Enter classroom (Studio: LiveKit, else external)
   → Conduct lesson with notes
   → Optional: record audio
   → Post-lesson: notes, homework, assessments

5. MONETIZATION
   → Receive Stripe payments (0% commission)
   → Track revenue in analytics
   → Sell digital products (15-10% commission)

6. GROWTH
   → Build custom tutor site
   → Email campaigns
   → Optimize with analytics
```

### 5.2 Student Journey

```
1. DISCOVERY
   → Find tutor via search, profile, or direct link
   → View public profile and reviews

2. BOOKING
   Option A: Guest booking
   - Fill form, pay, receive confirmation

   Option B: Create account
   - Sign up, browse tutors, book

3. LESSONS
   → Receive reminder email
   → Join video call
   → Interactive lesson with tutor

4. BETWEEN LESSONS
   → AI Practice with custom scenarios
   → Complete homework assignments
   → Track progress and goals

5. ONGOING
   → Purchase packages or subscriptions
   → View learning journey
   → Message tutor directly
```

---

## 6. Database Schema

### 6.1 Core Tables

| Table | Purpose |
|-------|---------|
| `profiles` | Tutor accounts, Stripe Connect fields |
| `students` | Student records per tutor |
| `bookings` | Individual lesson bookings |
| `services` | Lesson types with pricing |
| `availability` | Weekly recurring slots |
| `blocked_times` | Manual time blocks |

### 6.2 Payment Tables

| Table | Purpose |
|-------|---------|
| `session_package_templates` | Package offerings |
| `session_package_purchases` | Student package purchases |
| `session_package_redemptions` | Package usage tracking |
| `lesson_subscription_templates` | Recurring plans |
| `lesson_subscriptions` | Active subscriptions |
| `lesson_allowance_periods` | Monthly credits + rollover |
| `payments_audit` | Complete payment log |

### 6.3 Communication Tables

| Table | Purpose |
|-------|---------|
| `conversation_threads` | Tutor-student threads |
| `conversation_messages` | Individual messages |
| `notifications` | User notifications |

### 6.4 Progress Tables

| Table | Purpose |
|-------|---------|
| `learning_goals` | Student goals with targets |
| `proficiency_assessments` | Skill assessments |
| `homework_assignments` | Homework records |
| `homework_submissions` | Student submissions |

### 6.5 Marketplace Tables

| Table | Purpose |
|-------|---------|
| `digital_products` | Product definitions |
| `digital_product_purchases` | Purchase records |
| `marketplace_transactions` | Commission tracking |

### 6.6 Platform Tables

| Table | Purpose |
|-------|---------|
| `support_tickets` | User support requests |
| `content_moderation_reports` | Moderation queue |
| `admin_audit_logs` | Admin action logs |
| `processed_stripe_events` | Webhook deduplication |

---

## 7. API & Integrations

### 7.1 External APIs

| Service | Purpose | Authentication |
|---------|---------|----------------|
| **Stripe** | Payments, Connect, Billing | API key |
| **Supabase** | Database, Auth, Storage | Service role key |
| **LiveKit** | Video conferencing | API key/secret |
| **Deepgram** | Speech-to-text | API key |
| **OpenAI** | AI features | API key |
| **Resend** | Email delivery | API key |
| **Google Calendar** | Calendar sync | OAuth 2.0 |
| **Microsoft Graph** | Outlook sync | OAuth 2.0 |

### 7.2 Cron Jobs (Vercel Cron)

| Endpoint | Schedule | Purpose |
|----------|----------|---------|
| `/api/cron/send-reminders` | Hourly | Lesson reminders |
| `/api/cron/calendar-sync` | Every 30 min | External calendar sync |
| `/api/cron/lesson-analysis` | Hourly | AI recording analysis |
| `/api/cron/generate-briefings` | Every 30 min | AI lesson briefings |
| `/api/cron/homework-reminders` | Hourly | Homework due reminders |
| `/api/cron/message-digest` | Daily | Message digest emails |
| `/api/cron/cleanup-analytics` | Daily 3am | Analytics cleanup |

### 7.3 Webhook Endpoints

| Endpoint | Source | Purpose |
|----------|--------|---------|
| `/api/stripe/webhook` | Stripe | Payment events |
| `/api/resend/webhook` | Resend | Email delivery events |
| `/api/deepgram/webhook` | Deepgram | Transcription complete |
| `/api/livekit/webhook` | LiveKit | Room events |

---

## 8. Environment Variables

### 8.1 Required

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Stripe Price IDs
STRIPE_PRO_MONTHLY_PRICE_ID=
STRIPE_PRO_ANNUAL_PRICE_ID=
STRIPE_STUDIO_MONTHLY_PRICE_ID=
STRIPE_STUDIO_ANNUAL_PRICE_ID=
STRIPE_STUDIO_LIFETIME_PRICE_ID=

# AI Services
OPENAI_API_KEY=
DEEPGRAM_API_KEY=

# Email
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=
CRON_SECRET=
```

### 8.2 Optional

```bash
# LiveKit (Studio tier)
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
NEXT_PUBLIC_LIVEKIT_URL=

# S3 Recording Storage
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=
S3_REGION=
S3_ENDPOINT=

# Calendar OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=

# Rate Limiting
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_GA_MEASUREMENT_ID=

# Admin
ADMIN_AUTH_SECRET=
```

---

## 9. File Structure

```
/app
├── app/
│   ├── (auth)/           # Auth pages (login, signup, reset)
│   ├── (dashboard)/      # Tutor dashboard routes
│   │   ├── analytics/
│   │   ├── availability/
│   │   ├── bookings/
│   │   ├── calendar/
│   │   ├── classroom/    # LiveKit classroom
│   │   ├── dashboard/
│   │   ├── digital-products/
│   │   ├── messages/
│   │   ├── notifications/
│   │   ├── pages/        # Site builder
│   │   ├── services/
│   │   ├── settings/
│   │   └── students/
│   ├── (public)/         # Public pages
│   │   ├── [username]/   # Tutor public site
│   │   ├── bio/[username]/
│   │   └── book/[username]/
│   ├── admin/            # Admin dashboard
│   ├── api/              # API routes
│   │   ├── cron/
│   │   ├── livekit/
│   │   ├── practice/
│   │   ├── stripe/
│   │   └── webhooks/
│   └── student/          # Student portal
│       ├── billing/
│       ├── calendar/
│       ├── drills/
│       ├── homework/
│       ├── journey/
│       ├── messages/
│       ├── practice/
│       ├── progress/
│       ├── schedule/
│       └── settings/
├── components/
│   ├── auth/
│   ├── booking/
│   ├── calendar/
│   ├── classroom/
│   ├── dashboard/
│   ├── forms/
│   ├── landing/
│   ├── marketing/
│   ├── practice/
│   ├── student/
│   └── ui/               # shadcn components
├── lib/
│   ├── actions/          # Server actions
│   ├── ai/               # AI utilities
│   ├── payments/         # Payment logic
│   ├── repositories/     # Data access
│   ├── services/         # Business logic
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   └── validators/       # Zod schemas
├── supabase/
│   └── migrations/       # Database migrations
└── messages/             # i18n translations
```

---

## 10. Development Workflow

### 10.1 Commands

```bash
# Development
npm run dev              # Start dev server (Turbopack)

# Build
npm run build            # Production build
npm run start            # Production server

# Testing
npm test                 # Unit tests (Vitest)
npm run test:e2e         # E2E tests (Playwright)
npm run test:all         # All tests

# Quality
npm run lint             # ESLint
npm run type-check       # TypeScript check

# Tools
npm run storybook        # Component docs
npm run translate        # i18n via DeepL
```

### 10.2 Database Workflow

```bash
# Create migration
supabase migration new <name>

# Apply migrations
supabase db push

# Generate types
npm run generate-types
```

### 10.3 Deployment (Vercel)

**Configuration**:
- Build command: `npm run vercel-build`
- Install command: `cd app && npm install`
- Output directory: `app/.next`
- Root directory: `app`

---

## Summary

TutorLingua is a comprehensive SaaS platform enabling independent language tutors to:

1. **Own their repeat business** with 0% commission on lessons
2. **Manage their entire operation** (calendar, students, payments, communication)
3. **Deliver lessons** via native video conferencing (Studio tier)
4. **Leverage AI** for practice, drills, and lesson analysis
5. **Build their brand** with customizable public sites
6. **Scale revenue** through packages, subscriptions, and digital products

The platform uses a modern Next.js + Supabase + Stripe stack with real-time features, comprehensive analytics, and multi-language support across 10 languages.
