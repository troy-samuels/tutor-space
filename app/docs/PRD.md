# TutorLingua Product Requirements Document (PRD)

**Version:** 1.0
**Last Updated:** January 2026
**Author:** Product Team
**Status:** Pre-Launch

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Target Users & Personas](#3-target-users--personas)
4. [Product Vision & Strategy](#4-product-vision--strategy)
5. [Success Metrics & OKRs](#5-success-metrics--okrs)
6. [Feature Requirements](#6-feature-requirements)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Competitive Analysis](#8-competitive-analysis)
9. [Go-to-Market Strategy](#9-go-to-market-strategy)
10. [Risks & Mitigations](#10-risks--mitigations)
11. [Roadmap & Milestones](#11-roadmap--milestones)
12. [Appendices](#12-appendices)

---

## 1. Executive Summary

### Product Overview

**TutorLingua** is an all-in-one operating system for independent language tutors designed to help them own their repeat business while reducing marketplace commissions. The platform serves as a **complementary tool** to marketplaces like Preply, iTalki, and Verbling—not a replacement.

### Origin Story

TutorLingua was built to solve a real problem experienced firsthand: a Spanish tutor on Preply losing 33% of every lesson to commission fees on students she had already acquired. After observing this pain point over months of repeat lessons with the same students, the solution became clear—tutors need a way to keep 100% of revenue from their repeat students while still using marketplaces for discovery.

### Value Proposition

> "Use marketplaces for discovery. Use TutorLingua for repeat bookings. Keep 100% of your revenue."

### Key Differentiators

| Feature | TutorLingua | Traditional Tools |
|---------|-------------|-------------------|
| **Commission** | 0% on direct bookings | 15-33% on marketplaces |
| **AI Practice** | Built-in freemium AI companion | Not available |
| **All-in-One** | Booking, CRM, payments, video, AI | Requires 5-10 separate tools |
| **Positioning** | Complement to marketplaces | Replacement or standalone |

### Business Model

| Revenue Stream | Price | Description |
|----------------|-------|-------------|
| **Pro Monthly** | $29/mo | Full platform access |
| **Pro Annual** | $199/yr | 43% savings (~$17/mo) |
| **Studio Monthly** | $79/mo | Pro + video, transcription, AI drills |
| **Studio Annual** | $499/yr | 47% savings (~$42/mo) |
| **AI Practice Blocks** | $5 each | Student add-on (45 audio min + 300 text turns) |
| **Digital Products** | 10-15% commission | Marketplace for tutor content |

### Key Metrics Target (12 Months)

- **MRR:** $10,000
- **Paying Tutors:** 345
- **Monthly Churn:** <5%
- **LTV:CAC:** >5:1

---

## 2. Problem Statement

### Market Opportunity

The online language tutoring market is experiencing explosive growth:

- **Global EdTech market:** $340B+ at 18.3% CAGR
- **Preply tutors:** 100,000+ across 90+ languages
- **iTalki tutors:** 30,000+ in 150+ languages
- **Growth rate:** 100% YoY increase in tutor registrations since 2022

### The Commission Problem

Language tutors on marketplaces face punishing commission structures:

| Platform | Commission | Tutor Keeps (on $50/hr) |
|----------|------------|-------------------------|
| Preply | 18-33% | $33.50-$41.00 |
| iTalki | 15% | $42.50 |
| Verbling | ~15% | $42.50 |
| **TutorLingua** | **0%** | **$50.00** |

### The Math That Sells

For a tutor earning $2,000/month on Preply (at 33% commission):

| Item | Cost |
|------|------|
| Annual commission to Preply | $7,920 |
| Annual TutorLingua subscription | $348 |
| **Annual Savings** | **$7,572** |

### User Pain Points

Based on informal feedback from active tutors:

1. **High commission fees** - Paying 15-33% on students they've already acquired
2. **No ownership** - Platform owns the student relationship, not the tutor
3. **Tool fragmentation** - Using 10+ separate tools (Calendly, Stripe, spreadsheets, etc.)
4. **Manual busywork** - Sending reminders, tracking payments, managing schedules
5. **No student engagement** - No way to keep students practicing between lessons

### Why Now?

1. **Post-pandemic normalization** - Online tutoring is now mainstream
2. **AI maturity** - GPT-4 enables affordable conversational AI practice
3. **Creator economy mindset** - Tutors thinking like independent businesses
4. **Commission fatigue** - Growing awareness of marketplace fee structures

---

## 3. Target Users & Personas

### Primary Persona: The Marketplace Tutor

**Name:** Maria
**Role:** Spanish language tutor on Preply
**Location:** Spain (Europe-first market)
**Experience:** 3+ years tutoring, 50+ repeat students
**Monthly Revenue:** $2,000-4,000
**Tech Comfort:** Moderate (uses Google Calendar, WhatsApp, basic tools)

**Demographics:**
- Age: 28-45
- Education: University degree (often in languages/education)
- Languages: Teaches Spanish, often speaks 2-3 languages

**Goals:**
- Reduce commission costs on repeat students
- Own student relationships for long-term business stability
- Spend less time on admin, more time teaching
- Appear professional to students and prospects

**Frustrations:**
- Paying 33% commission on students she's had for 2+ years
- Managing calendar conflicts between Preply and personal life
- No way for students to practice between lessons
- Scattered tools: Calendly, Venmo, WhatsApp, spreadsheets

**Jobs to Be Done:**
1. When I have a repeat student booking, I want to receive 100% of the payment so that I keep the revenue I've earned
2. When I'm preparing for a lesson, I want to see student history and notes so that I can personalize the experience
3. When students want to practice, I want to offer AI conversation practice so that they improve between lessons
4. When managing my schedule, I want one calendar that syncs everything so that I avoid double-bookings

**Quote:**
> "I love teaching on Preply—it's how I found most of my students. But paying $600/month in commissions on students I've taught 50+ times feels unfair."

---

### Secondary Persona: The Language Learner

**Name:** Thomas
**Role:** German professional learning Spanish
**Location:** Germany
**Learning Goal:** Business Spanish for client meetings
**Budget:** €50-100/month for lessons + practice

**Goals:**
- Improve conversational fluency quickly
- Practice between weekly lessons
- Track progress over time
- Convenient booking and payment

**Frustrations:**
- Forgetting vocabulary between lessons
- No one to practice with outside lessons
- Unclear progress—is he improving?

**Jobs to Be Done:**
1. When I want to book a lesson, I want a simple calendar view so that I can see available times quickly
2. When I have free time, I want to practice conversation with AI so that I maintain momentum
3. When I complete a lesson, I want to review what I learned so that I retain vocabulary

---

### Tertiary Persona: Platform Administrator

**Name:** Admin
**Role:** TutorLingua platform operator
**Location:** Remote

**Goals:**
- Monitor platform health
- Handle support escalations
- Manage content moderation
- Track business metrics

**Jobs to Be Done:**
1. When there's a payment dispute, I want to review transaction history so that I can resolve fairly
2. When content is reported, I want a moderation queue so that I can take appropriate action
3. When tracking growth, I want a dashboard with key metrics so that I can report to stakeholders

---

## 4. Product Vision & Strategy

### Vision Statement

> TutorLingua will be the operating system that enables every independent language tutor to build a sustainable, profitable teaching business—keeping 100% of their repeat student revenue while delivering exceptional learning experiences through AI-enhanced tools.

### Strategic Positioning

**Complementary, Not Competitive**

TutorLingua is NOT positioned as a replacement for marketplaces. This is intentional:

| Marketplaces | TutorLingua |
|--------------|-------------|
| Student discovery | Student retention |
| First lessons | Repeat lessons |
| 15-33% commission | 0% commission |
| Platform owns relationship | Tutor owns relationship |

**The Workflow:**
1. Tutor gets discovered on Preply/iTalki
2. Completes first lesson(s) through marketplace
3. Shares TutorLingua booking link for repeat sessions
4. Keeps 100% of direct booking revenue

This positioning removes the "scary" decision of leaving marketplaces entirely.

### Core Value Pillars

1. **Zero Commission** - Keep 100% of direct booking revenue
2. **All-in-One** - Replace 10+ scattered tools with one platform
3. **AI-Enhanced** - Student practice, lesson briefings, drills
4. **Tutor-First** - Built specifically for language tutors, not generic scheduling

### Primary Hook: AI Practice

Based on user feedback, the #1 differentiating feature is **AI Practice for Students**—not just commission savings. This is the moat competitors cannot easily replicate:

- Keeps students engaged between lessons
- Provides value to students (not just tutors)
- Creates stickiness (students practice → tutors stay)
- Enables freemium acquisition path

### Long-Term Direction

**Year 1:** Establish product-market fit with 345 paying tutors
**Year 2:** Expand to adjacent niches (music tutors, academic tutoring)
**Year 3:** Platform for all independent educators

---

## 5. Success Metrics & OKRs

### North Star Metric

**Monthly Recurring Revenue (MRR)**

This is the single most important metric because it:
- Validates willingness to pay (price sensitivity concern)
- Indicates sustainable growth
- Directly measures business viability

### 12-Month OKRs

#### Objective 1: Achieve Product-Market Fit
**Key Results:**
- KR1: Reach $10,000 MRR by December 2026
- KR2: Maintain monthly churn below 5%
- KR3: Achieve 25%+ trial-to-paid conversion rate
- KR4: 80%+ of active tutors have at least one student booking per month

#### Objective 2: Validate AI as Primary Hook
**Key Results:**
- KR1: 50% of Studio tutors have students using AI Practice
- KR2: AI Practice students show 2x higher tutor retention
- KR3: Average AI Practice session length > 10 minutes

#### Objective 3: Establish Sustainable Acquisition
**Key Results:**
- KR1: CAC below $50 (organic channels only)
- KR2: LTV:CAC ratio > 7:1
- KR3: 1,000 monthly website visitors by month 6

### Leading Indicators (Weekly Tracking)

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| Website visitors | 1,000/mo by M6 | Top of funnel health |
| Trial signups | 50/mo by M6 | Conversion opportunity |
| Trial-to-paid conversion | 25%+ | Product value validation |
| Cold emails sent | 50/week | Outbound activity |
| Cold email reply rate | 5%+ | Message resonance |

### Lagging Indicators (Monthly Tracking)

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| MRR | $10K by M12 | Primary business metric |
| Paying customers | 345 by M12 | Customer base size |
| Monthly churn | <5% | Revenue sustainability |
| Net Revenue Retention | >100% | Expansion potential |
| LTV:CAC | >5:1 | Business model health |

### Milestone Checkpoints

| Month | MRR Target | Tutors | Go/No-Go Decision |
|-------|------------|--------|-------------------|
| 3 | $500 | 17 | If <10: reassess positioning |
| 6 | $2,000 | 69 | If <40: consider pivot or pause |
| 9 | $5,000 | 172 | If <100: aggressive tactics needed |
| 12 | $10,000 | 345 | Success: plan Year 2 expansion |

---

## 6. Feature Requirements

### Feature Prioritization Framework

**MoSCoW Method:**
- **Must Have:** Core functionality required for launch
- **Should Have:** Important features that enhance value
- **Could Have:** Nice-to-have features for future iterations
- **Won't Have:** Explicitly out of scope

---

### 6.1 Tutor Features

#### 6.1.1 Onboarding & Profile (Must Have)

**User Stories:**
- As a new tutor, I want a guided setup wizard so that I can start accepting bookings within 10 minutes
- As a tutor, I want to set my timezone so that students see availability in their local time
- As a tutor, I want to upload an avatar and bio so that I appear professional

**Acceptance Criteria:**
- [ ] 7-step onboarding flow completes in <10 minutes
- [ ] Username uniqueness validated in real-time
- [ ] Avatar upload to Supabase Storage (max 5MB)
- [ ] Timezone selection from comprehensive list
- [ ] Social links optional (website, Instagram, LinkedIn)
- [ ] Onboarding completion gate enforced by middleware

**Key Files:**
- `/app/(dashboard)/onboarding/page.tsx`
- `/lib/actions/onboarding.ts`
- `/components/onboarding/steps/`

---

#### 6.1.2 Services & Pricing (Must Have)

**User Stories:**
- As a tutor, I want to create lesson types with different durations and prices so that I can offer variety
- As a tutor, I want to create session packages so that students can prepay for discounts
- As a tutor, I want prices synced to Stripe so that checkout works seamlessly

**Acceptance Criteria:**
- [ ] Create services with: name, duration (minutes), price, currency
- [ ] Support 11+ currencies (EUR, USD, GBP, etc.)
- [ ] Auto-sync to Stripe Connect when connected
- [ ] Session packages with total minutes and discount pricing
- [ ] Default services created on signup (Trial, Standard, 10-Pack)

**Key Files:**
- `/app/(dashboard)/services/page.tsx`
- `/lib/actions/services.ts`
- `/lib/services/stripe-connect-products.ts`

---

#### 6.1.3 Availability & Calendar (Must Have)

**User Stories:**
- As a tutor, I want to set weekly recurring availability so that students know when I'm free
- As a tutor, I want to sync Google Calendar so that external events block my availability
- As a tutor, I want to manually block times so that I can take vacation

**Acceptance Criteria:**
- [ ] Weekly recurring slots (day, start time, end time)
- [ ] Multiple slots per day allowed
- [ ] Google Calendar OAuth with popup flow
- [ ] Outlook Calendar OAuth with popup flow
- [ ] External events display in calendar views
- [ ] Manual blocked times with optional labels
- [ ] Two-way sync: blocked times appear as "Busy" on external calendars

**Key Files:**
- `/app/(dashboard)/availability/page.tsx`
- `/app/(dashboard)/calendar/page.tsx`
- `/lib/actions/calendar.ts`
- `/lib/calendar/busy-windows.ts`

---

#### 6.1.4 Booking Management (Must Have)

**User Stories:**
- As a tutor, I want to view all upcoming and past bookings so that I can manage my schedule
- As a tutor, I want to create bookings for existing students so that I can schedule directly
- As a tutor, I want to mark manual payments as received so that I can track who has paid

**Acceptance Criteria:**
- [ ] List view with filters (upcoming, completed, cancelled)
- [ ] Create booking: select student, service, date/time
- [ ] Cancel booking with optional refund (package minutes or subscription credit)
- [ ] Reschedule with conflict detection
- [ ] Mark as paid for manual payments
- [ ] Reschedule history tracking

**Key Files:**
- `/app/(dashboard)/bookings/page.tsx`
- `/lib/actions/bookings.ts`
- `/lib/actions/reschedule.ts`

---

#### 6.1.5 Student CRM (Must Have)

**User Stories:**
- As a tutor, I want to view all my students in one place so that I can manage relationships
- As a tutor, I want to add notes and labels to students so that I can organize and remember context
- As a tutor, I want to see student lesson history so that I know their progress

**Acceptance Criteria:**
- [ ] Student list with search and label filters
- [ ] Student detail page with: profile, notes, lesson history, packages, subscriptions
- [ ] Labels as tags (text array, GIN indexed)
- [ ] Manual student creation
- [ ] CSV import for bulk upload
- [ ] Access control workflow (approve/deny student requests)

**Key Files:**
- `/app/(dashboard)/students/page.tsx`
- `/app/(dashboard)/students/[studentId]/page.tsx`
- `/lib/actions/students.ts`

---

#### 6.1.6 Messaging (Must Have)

**User Stories:**
- As a tutor, I want to message students directly so that I can communicate without email
- As a tutor, I want to see unread message counts so that I don't miss important messages
- As a tutor, I want to send voice notes so that I can give quick audio feedback

**Acceptance Criteria:**
- [ ] Thread-based messaging (one thread per tutor-student pair)
- [ ] Realtime updates via Supabase Realtime
- [ ] Unread count badge in navigation
- [ ] File attachments (images, PDFs)
- [ ] Audio message recording and playback
- [ ] Mark as read on open

**Key Files:**
- `/app/(dashboard)/messages/page.tsx`
- `/lib/actions/messaging.ts`
- `/components/messaging/`

---

#### 6.1.7 Payments & Stripe Connect (Must Have)

**User Stories:**
- As a tutor, I want to connect Stripe so that I receive payments directly
- As a tutor, I want students to pay during booking so that I don't chase payments
- As a tutor, I want to track manual payments so that I know who owes me

**Acceptance Criteria:**
- [ ] Stripe Connect Express onboarding flow
- [ ] Destination charges (funds go directly to tutor)
- [ ] 0% platform fee on direct bookings
- [ ] Checkout session creation for services and packages
- [ ] Manual payment tracking option
- [ ] Webhook processing with idempotency (deduplication table)

**Key Files:**
- `/app/(dashboard)/settings/payments/page.tsx`
- `/lib/stripe.ts`
- `/lib/services/connect.ts`
- `/app/api/stripe/webhook/route.ts`

---

#### 6.1.8 Analytics Dashboard (Should Have)

**User Stories:**
- As a tutor, I want to see revenue trends so that I can track business growth
- As a tutor, I want to see student acquisition sources so that I know where students come from
- As a tutor, I want to see upcoming lessons at a glance so that I'm prepared

**Acceptance Criteria:**
- [ ] Dashboard with KPI cards: revenue MTD, upcoming lessons, active students
- [ ] Revenue breakdown by service type
- [ ] Booking trends over time (chart)
- [ ] Today's schedule widget
- [ ] Student acquisition source tracking

**Key Files:**
- `/app/(dashboard)/dashboard/page.tsx`
- `/app/(dashboard)/analytics/page.tsx`
- `/components/dashboard/metric-cards.tsx`

---

#### 6.1.9 Tutor Site Builder (Should Have)

**User Stories:**
- As a tutor, I want a professional website so that I can attract students
- As a tutor, I want to customize colors and sections so that the site reflects my brand
- As a tutor, I want to add testimonials so that prospects see social proof

**Acceptance Criteria:**
- [ ] Drag-and-drop section editor
- [ ] Theme archetypes: Professional, Immersion, Academic, Polyglot
- [ ] Customizable colors, fonts, spacing
- [ ] Sections: About, Services, Reviews, FAQ, Resources
- [ ] Testimonial management with drag-sort
- [ ] Publishing workflow (draft → published)
- [ ] Public URL: `/{username}`

**Key Files:**
- `/app/(public)/[username]/page.tsx`
- `/lib/actions/tutor-sites.ts`
- `/components/page-builder/`

---

#### 6.1.10 Digital Products (Could Have)

**User Stories:**
- As a tutor, I want to sell downloadable resources so that I have passive income
- As a tutor, I want to track downloads so that I know what's popular

**Acceptance Criteria:**
- [ ] Upload files to Supabase Storage
- [ ] Set price and description
- [ ] Generate download tokens with limits
- [ ] Purchase tracking
- [ ] Tiered commission: 15% → 10% after $500 lifetime sales

**Key Files:**
- `/app/(dashboard)/digital-products/page.tsx`
- `/lib/actions/digital-products.ts`

---

### 6.2 Studio Features (Tier: Studio)

#### 6.2.1 LiveKit Video Classroom (Must Have for Studio)

**User Stories:**
- As a Studio tutor, I want native video conferencing so that I don't need Zoom
- As a tutor, I want to share my screen so that I can show materials
- As a tutor, I want pre-join device testing so that lessons start smoothly

**Acceptance Criteria:**
- [ ] LiveKit integration with JWT token generation
- [ ] Video, audio, screen share support
- [ ] Pre-join screen with device selection
- [ ] Participant name tags
- [ ] Works on latest Chrome, Firefox, Safari, Edge
- [ ] Access gated by Studio tier

**Key Files:**
- `/app/(dashboard)/classroom/[bookingId]/page.tsx`
- `/lib/livekit.ts`
- `/components/classroom/`

---

#### 6.2.2 Lesson Recording & Transcription (Must Have for Studio)

**User Stories:**
- As a Studio tutor, I want to record lessons so that students can review
- As a tutor, I want automatic transcription so that students have text reference
- As a student, I want to listen to lesson recordings so that I can reinforce learning

**Acceptance Criteria:**
- [ ] Audio-only recording (OGG format) for cost efficiency
- [ ] Recording consent modal with all-participant consent
- [ ] S3 egress to Supabase Storage
- [ ] Deepgram transcription with speaker diarization
- [ ] Post-lesson review page with audio player and transcript

**Key Files:**
- `/app/api/livekit/recording/route.ts`
- `/lib/deepgram.ts`
- `/app/api/webhooks/deepgram/route.ts`

---

#### 6.2.3 AI Lesson Briefings (Should Have for Studio)

**User Stories:**
- As a Studio tutor, I want AI-generated lesson prep notes so that I save preparation time
- As a tutor, I want to see student engagement indicators so that I know who needs attention
- As a tutor, I want suggested activities so that I have lesson ideas

**Acceptance Criteria:**
- [ ] Briefing generated before upcoming lessons (cron job)
- [ ] Student context summary (2-3 sentences)
- [ ] Engagement indicators (attendance, homework, practice)
- [ ] 3-5 suggested activities with time estimates
- [ ] 3-5 conversation starters
- [ ] Dashboard widget for upcoming lessons

**Key Files:**
- `/app/(dashboard)/copilot/briefing/[bookingId]/page.tsx`
- `/lib/copilot/briefing-generator.ts`
- `/components/copilot/`

---

#### 6.2.4 AI Drills (Should Have for Studio)

**User Stories:**
- As a student, I want interactive drills based on my lessons so that I practice what I learned
- As a tutor, I want auto-generated drills so that I don't create exercises manually

**Acceptance Criteria:**
- [ ] Drill types: Match, Gap-Fill, Scramble
- [ ] Generated from lesson transcripts
- [ ] Adaptive difficulty based on performance
- [ ] Points and streaks for gamification
- [ ] Accessible from student portal

**Key Files:**
- `/components/drills/`
- `/lib/drills/adaptive-generator.ts`

---

#### 6.2.5 L1 Interference Detection (Could Have for Studio)

**User Stories:**
- As a tutor, I want to see native language error patterns so that I can target corrections
- As a tutor, I want code-switching metrics so that I understand student language mixing

**Acceptance Criteria:**
- [ ] Detect L1 interference patterns from transcripts
- [ ] Code-switching metrics (words per language, switch count)
- [ ] Pattern matching against known L1 interference databases
- [ ] Highlighted errors in lesson review

**Key Files:**
- `/lib/analysis/l1-interference.ts`
- `/lib/analysis/enhanced-processor.ts`

---

### 6.3 Student Features

#### 6.3.1 Public Booking Flow (Must Have)

**User Stories:**
- As a student, I want to book a lesson without creating an account so that booking is frictionless
- As a student, I want to see available times in my timezone so that I book correctly
- As a student, I want to pay securely so that my payment info is safe

**Acceptance Criteria:**
- [ ] Public booking page at `/book/{username}`
- [ ] Service selection with price display
- [ ] Available time slots from tutor availability minus conflicts
- [ ] Guest checkout (name, email, phone, timezone, notes)
- [ ] Stripe Checkout integration
- [ ] Package/subscription credit redemption option
- [ ] Confirmation email sent on booking

**Key Files:**
- `/app/book/[username]/page.tsx`
- `/lib/actions/bookings.ts`
- `/components/booking/`

---

#### 6.3.2 Student Portal (Should Have)

**User Stories:**
- As a student, I want to log in and see my upcoming lessons so that I'm organized
- As a student, I want to see my learning progress so that I feel motivated
- As a student, I want to message my tutor so that I can ask questions

**Acceptance Criteria:**
- [ ] Student login/signup
- [ ] Dashboard with upcoming lessons
- [ ] Progress page: goals, assessments, lesson notes
- [ ] Homework assignments with submission
- [ ] Messages with tutor
- [ ] Subscription and payment history
- [ ] AI Practice access (if tutor has Studio)

**Key Files:**
- `/app/student/`
- `/components/student/`

---

#### 6.3.3 AI Practice Companion (Must Have)

**User Stories:**
- As a student, I want to practice conversation with AI so that I improve between lessons
- As a student, I want grammar corrections so that I learn from mistakes
- As a student, I want pronunciation feedback so that I speak more clearly

**Acceptance Criteria:**
- [ ] Free tier: 45 audio minutes + 600 text turns (requires Studio tutor)
- [ ] Block add-ons: $5 = +45 audio min + +300 text turns
- [ ] Text and audio input modes
- [ ] Real-time grammar corrections (11 error categories)
- [ ] Pronunciation assessment via Deepgram
- [ ] Session summary with feedback
- [ ] Usage tracking in `practice_usage_periods`

**Key Files:**
- `/app/student/practice/[assignmentId]/page.tsx`
- `/app/api/practice/`
- `/components/student/AIPracticeChat.tsx`
- `/lib/practice/constants.ts`

---

#### 6.3.4 Homework Submissions (Should Have)

**User Stories:**
- As a student, I want to submit homework with text, audio, or files so that I complete assignments
- As a student, I want to see tutor feedback so that I know how to improve

**Acceptance Criteria:**
- [ ] Text response field
- [ ] Audio recording (browser-based)
- [ ] File attachments (PDFs, images, max 20MB)
- [ ] Submission status tracking
- [ ] Tutor feedback display
- [ ] Revision workflow (needs_revision status)

**Key Files:**
- `/components/student/HomeworkSubmissionForm.tsx`
- `/lib/actions/homework-submissions.ts`

---

### 6.4 Administrative Features

#### 6.4.1 Admin Dashboard (Should Have)

**User Stories:**
- As an admin, I want to monitor platform health so that I catch issues early
- As an admin, I want to view user metrics so that I track growth

**Acceptance Criteria:**
- [ ] Health monitoring dashboard
- [ ] User count and growth metrics
- [ ] Revenue tracking
- [ ] Failed webhook alerts

**Key Files:**
- `/app/(dashboard)/admin/`
- `/app/api/admin/`

---

#### 6.4.2 Moderation Queue (Could Have)

**User Stories:**
- As an admin, I want to review reported content so that the platform stays safe
- As an admin, I want to take moderation actions so that I can enforce policies

**Acceptance Criteria:**
- [ ] Content report submission by users
- [ ] Moderation queue with priority sorting
- [ ] Actions: warning, content removal, suspension, ban
- [ ] Audit trail for all actions

**Key Files:**
- `/app/admin/moderation/`
- Database: `content_reports`, `moderation_actions`

---

## 7. Non-Functional Requirements

### 7.1 Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page Load (LCP) | <2.5s | Lighthouse CI |
| Time to Interactive | <3.5s | Lighthouse CI |
| API Response (p95) | <500ms | Vercel Analytics |
| Database Query (p95) | <100ms | Supabase Dashboard |

### 7.2 Security

#### Authentication & Authorization
- JWT tokens in httpOnly cookies via Supabase Auth
- Session auto-refresh in middleware
- Route protection for authenticated routes
- Tier-based access control (Pro vs. Studio)

#### Data Protection
- Row Level Security (RLS) on all tables
- OAuth tokens encrypted at rest (AES-256)
- Stripe webhook signature verification
- Rate limiting on checkout and sensitive endpoints
- HTTPS enforced (Vercel default)

#### Compliance
- **GDPR:** Required for Europe-first market
  - Data export capability
  - Account deletion with data purge
  - Cookie consent for analytics
- **Google Calendar API:** Data isolation enforced
  - Calendar data NEVER sent to AI services
  - Runtime guards in all AI modules
  - Audit logging for compliance verification

### 7.3 Reliability

| Metric | Target |
|--------|--------|
| Uptime | 99.9% |
| Error Rate | <0.1% |
| Recovery Time | <1 hour |

### 7.4 Scalability

- **Database:** Supabase PostgreSQL with connection pooling
- **Hosting:** Vercel Edge Functions with auto-scaling
- **Media:** S3-compatible storage for recordings
- **Target capacity:** 10,000 tutors, 50,000 students

### 7.5 Accessibility

- **Target:** WCAG 2.1 Level AA
- **Testing:** @axe-core/playwright in E2E tests
- **Key requirements:**
  - Keyboard navigation
  - Screen reader support
  - Color contrast ratios
  - Focus indicators

### 7.6 Internationalization

**Supported Languages (10):**
| Code | Language | Priority |
|------|----------|----------|
| en | English | Primary |
| es | Spanish | Primary (Europe-first) |
| de | German | High |
| fr | French | High |
| pt | Portuguese | Medium |
| it | Italian | Medium |
| nl | Dutch | Medium |
| ja | Japanese | Low |
| ko | Korean | Low |
| zh | Chinese | Low |

**Currency Support:**
EUR, USD, GBP, CAD, AUD, CHF, SEK, NOK, DKK, PLN, BRL

---

## 8. Competitive Analysis

### 8.1 Direct Competitor: TutorBird

| Feature | TutorLingua | TutorBird |
|---------|-------------|-----------|
| **Pricing** | $29-79/mo | $14.95/mo + $4.95/tutor |
| **Target** | Language tutors | All tutoring types |
| **Positioning** | Complement to marketplaces | Standalone business tool |
| **Commission Model** | 0% on bookings | N/A (not a marketplace) |
| **AI Practice** | Built-in freemium | Not available |
| **Video Conferencing** | Native LiveKit (Studio) | Not available (use Zoom/Skype) |
| **Lesson Transcription** | Deepgram (Studio) | Not available |
| **AI Drills** | Auto-generated | Not available |
| **Lesson Briefings** | AI-powered | Not available |
| **Calendar Sync** | Google + Outlook | Google + Apple + Outlook |
| **Student Portal** | Yes | Yes (Family portal) |
| **Website Builder** | Yes (archetypes) | Yes (drag-and-drop) |
| **Mobile App** | Web-only (responsive) | Web-only (no native) |
| **Rating** | Pre-launch | 4.8/5 (242 reviews) |

**TutorBird Strengths:**
- Lower price point ($14.95 vs. $29)
- Established reputation (4.8 stars)
- Multi-tutor support (tutoring centers)
- Payroll and expense tracking

**TutorLingua Advantages:**
- AI-first approach (Practice, Drills, Briefings)
- Native video conferencing (no Zoom needed)
- Commission-free positioning (save $7K+/year)
- Language tutor specialization
- Lesson transcription and analysis

### 8.2 Indirect Competitors

**Marketplaces (Preply, iTalki, Verbling):**
- 15-33% commission on all bookings
- Own the student relationship
- Strong discovery/SEO
- TutorLingua position: Complementary, not competitive

**DIY Tool Stack (Calendly + Stripe + Notion):**
- Requires managing 5-10 separate tools
- No AI features
- No student engagement tools
- Higher total cost and complexity

### 8.3 Competitive Moat

1. **AI Features** - Expensive and complex to replicate
2. **Positioning** - "Complement, not replace" reduces friction
3. **Language Specialization** - Focused features for this niche
4. **SEO Content** - 140+ articles in 10 languages

---

## 9. Go-to-Market Strategy

### 9.1 Target Market

**Primary:** Europe (Germany, Spain, UK, France)
**Secondary:** North America (US, Canada)
**Rationale:** Origin user (Spanish tutor on Preply) is Europe-based; strong language tutoring market

### 9.2 Acquisition Channels

| Channel | Time/Week | Cost/Month | Expected Customers (Y1) |
|---------|-----------|------------|------------------------|
| Build in Public (Twitter/X) | 3 hrs | $0 | 30-50 |
| Cold Email Outreach | 5 hrs | $50-100 | 50-80 |
| SEO Content | 3 hrs | $0-50 | 40-60 |
| Community Engagement | 2 hrs | $0 | 20-30 |
| Referral Program | 1 hr | $10-25/referral | 40-60 |

**Total Time:** 14-15 hrs/week (within 10-20 hr constraint)

### 9.3 Launch Phases

**Phase 1: Soft Launch (Weeks 1-2)**
- 10 beta users from warm network
- Feedback collection and critical bug fixes
- No public marketing

**Phase 2: Public Launch (Weeks 3-4)**
- Build in Public campaign begins
- First cold email sequences
- SEO optimization of existing content

**Phase 3: Lifetime Deal (Months 4-5)**
- $49 LTD offer for early adopters
- Target: 50 sales = $2,450 cash injection
- Goal: Social proof + testimonials

**Phase 4: Scale (Months 6-12)**
- Double down on top-performing channel
- Referral program launch
- AI Practice as acquisition hook

### 9.4 Pricing Strategy

**Current Pricing:**
| Plan | Price | Annual |
|------|-------|--------|
| Pro | $29/mo | $199/yr (43% off) |
| Studio | $79/mo | $499/yr (47% off) |

**Price Sensitivity Concern:**
Partner feedback suggests $29/month "might be too high" for some tutors. Mitigation strategies:

1. **Strong ROI messaging** - Show $7K+ annual savings vs. commission
2. **14-day free trial** - No credit card required
3. **Annual discount** - $17/mo effective for committed users
4. **Lifetime deals** - $49-99 one-time for early adopters

**Future Consideration:**
If conversion data shows price sensitivity, consider:
- $19/mo entry tier (limited features)
- Usage-based pricing model
- Regional pricing for different markets

---

## 10. Risks & Mitigations

### 10.1 Price Sensitivity (Critical Risk)

**Risk:** Tutors won't pay $29-79/month despite commission savings
**Probability:** Medium
**Impact:** High

**Mitigations:**
1. Strong ROI calculator showing annual savings
2. 14-day free trial with no credit card
3. Lifetime deal for early adopters ($49-99)
4. Monitor trial-to-paid conversion closely
5. A/B test pricing if conversion <15%

### 10.2 Customer Acquisition (High Risk)

**Risk:** Can't reach tutors affordably with organic channels
**Probability:** Medium
**Impact:** High

**Mitigations:**
1. Run 3 channels in parallel (hedge bets)
2. Build in Public for organic reach
3. SEO moat with 140+ articles
4. Community engagement for warm leads
5. Lower CAC target to <$50

### 10.3 High Churn (Medium Risk)

**Risk:** Tutors sign up but don't stick past month 1
**Probability:** Medium
**Impact:** High

**Mitigations:**
1. Onboarding optimization (<7 days to first value)
2. Weekly check-in emails for first month
3. Ship feature requests quickly
4. Exit surveys to understand why
5. Focus on activation metrics

### 10.4 Competition (Low-Medium Risk)

**Risk:** TutorBird adds AI features or Preply lowers commissions
**Probability:** Low
**Impact:** Medium

**Mitigations:**
1. Speed advantage (ship fast, iterate faster)
2. Community loyalty (users become advocates)
3. Niche focus (language tutors specifically)
4. AI moat (expensive and complex to replicate)

### 10.5 Marketplace Retaliation (Low Risk)

**Risk:** Preply blocks outside booking or enforces exclusivity
**Probability:** Low
**Impact:** High

**Mitigations:**
1. Position as "complement" not "replacement"
2. Tutors don't leave marketplaces, just add TutorLingua
3. Build independent acquisition (SEO, referrals)
4. Diversify across multiple marketplaces

### 10.6 Founder Burnout (Medium Risk)

**Risk:** Part-time effort (10-20 hrs/week) becomes unsustainable
**Probability:** Medium
**Impact:** Medium

**Mitigations:**
1. Strict time boundaries enforced
2. Automate repetitive tasks early
3. Hire VA for outreach at $2K MRR
4. Consider going full-time at $5K MRR

---

## 11. Roadmap & Milestones

### 11.1 Q1 2026: Foundation & Launch

**Theme:** "Launch small, learn fast"

**Goals:**
- Launch publicly
- First 20 paying tutors
- $500 MRR

**Key Activities:**

| Week | Focus |
|------|-------|
| 1-2 | Soft launch with 10 beta users |
| 3-4 | Build in Public begins (Twitter/X) |
| 5-6 | Cold email outreach v1 (50 tutors) |
| 7-8 | SEO optimization (10 existing articles) |
| 9-10 | Community entry (5 tutor communities) |
| 11-12 | Implement top 3 feature requests |

**Budget:** $150/month

---

### 11.2 Q2 2026: Traction Engine

**Theme:** "Find what works, double down"

**Goals:**
- 70 paying tutors
- Identify top acquisition channel
- $2,000 MRR

**Key Activities:**

| Week | Focus |
|------|-------|
| 13-14 | Lifetime Deal prep ($49 offer) |
| 15-16 | LTD launch (target: 50 sales) |
| 17-18 | Referral program launch |
| 19-20 | Cold email v2 (new templates) |
| 21-22 | SEO push (4 new high-intent articles) |
| 23-24 | AI Practice promotion to students |

**Budget:** $250/month

---

### 11.3 Q3 2026: Scale What Works

**Theme:** "Pour fuel on the fire"

**Goals:**
- 170 paying tutors
- Predictable acquisition
- $5,000 MRR

**Key Activities:**

| Week | Focus |
|------|-------|
| 25-28 | 2x effort on top channel |
| 29-30 | Partner outreach (5 tutor influencers) |
| 31-32 | Create 3 detailed case studies |
| 33-34 | Pricing test (if conversion issues) |
| 35-36 | Automation to reduce manual work 50% |

**Budget:** $500/month

---

### 11.4 Q4 2026: Sprint to $10K

**Theme:** "Close the gap, no matter what"

**Goals:**
- 345 paying tutors
- Sustainable growth engine
- $10,000 MRR

**Key Activities:**

| Week | Focus |
|------|-------|
| 37-40 | Aggressive outreach (20 emails/day) |
| 41-42 | Annual plan push ("Save 40%") |
| 43-44 | Black Friday offer (new signups) |
| 45-46 | Referral sprint (double rewards) |
| 47-48 | Demo blitz for warm leads |

**Budget:** $900/month

---

## 12. Appendices

### Appendix A: Technical Architecture Summary

**Frontend:**
- Next.js 16 (App Router, Turbopack)
- React 19
- TypeScript (strict mode)
- Tailwind CSS 4
- shadcn/ui components

**Backend:**
- Supabase (PostgreSQL, Auth, Storage, Realtime)
- Server Actions ("use server")
- Row Level Security (RLS)

**Integrations:**
- Stripe Connect (payments)
- LiveKit (video)
- Deepgram (transcription)
- OpenAI GPT-4 (AI features)
- Google/Microsoft OAuth (calendar)
- Resend (email)

### Appendix B: Database Schema Overview

**55+ tables organized by domain:**

| Domain | Key Tables |
|--------|------------|
| Core | profiles, students, bookings, services, availability |
| Payments | session_package_*, lesson_subscription_*, processed_stripe_events |
| Calendar | calendar_connections, calendar_settings, blocked_times |
| Messaging | conversation_threads, conversation_messages |
| Learning | homework_*, learning_goals, proficiency_assessments, lesson_notes |
| AI | practice_scenarios, practice_*, grammar_issues, pronunciation_assessments |
| Studio | lesson_recordings, lesson_drills, lesson_briefings |
| Marketing | tutor_sites, links, digital_products, marketplace_transactions |
| Admin | notifications, content_reports, moderation_actions, support_tickets |

### Appendix C: API Reference

**70+ API routes organized by function:**

- Authentication (3 routes)
- Stripe & Payments (15 routes)
- Calendar & Scheduling (4 routes)
- AI Practice (10 routes)
- LiveKit Video (3 routes)
- Webhooks (3 routes)
- Cron Jobs (7 routes)
- Admin (25 routes)

Full API documentation in `/app/CLAUDE.md`

### Appendix D: User Research Notes

**Status:** Informal feedback only (no structured interviews)

**Primary Feedback Source:** Partner/spouse who teaches Spanish on Preply

**Key Insights:**
1. Commission pain is real and visceral ($660/month lost)
2. $29/month "might be too high" (validates price sensitivity concern)
3. AI Practice is the most exciting feature (not just commission savings)
4. Calendar sync is table stakes (must work with Google)
5. Don't want to leave Preply entirely (complementary positioning resonates)

**Recommended Next Steps:**
1. Conduct 10-15 formal tutor interviews
2. Document specific quotes and pain points
3. Validate pricing with survey (willingness to pay)
4. Test messaging variants (commission savings vs. AI features)

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 2026 | Product Team | Initial comprehensive PRD |

---

*This PRD is a living document and should be updated as the product evolves and market feedback is gathered.*
