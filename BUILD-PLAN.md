# Master Build Plan - All Files Overview

This document provides a quick reference to all build files in sequential order. Each file is a self-contained guide for building a specific component.

## Feature Integration Overview

- **Professional Plan (Core MVP)**  
  - Business & Admin: `04-user-profiles.md`, `06-service-listings.md`, `07-stripe-integration.md`, `08-booking-system.md`, `09-student-crm.md`
  - Marketing & Conversion: `05-link-in-bio.md`, `11-email-system.md`, `12-analytics-tracking.md`, `18-landing-page.md`
  - Digital Classroom: `10-zoom-integration.md`, `13-lesson-notes.md`
- **Growth Plan (Premium Upsell)**  
  - Growth & Ads Power-Up: `22-growth-ad-center.md`, `23-lead-hub.md`, `24-ai-content-marketing.md`
  - AI Teaching Assistant: `25-ai-teaching-assistant.md`
  - Advanced Classroom Intelligence: `14-ai-conversation-partner.md`, `15-lesson-plan-generator.md`, `17-progress-tracking.md`
- **Studio Plan (Add-Ons)**  
  - Expansion Modules: `26-group-sessions.md`, `27-resource-marketplace.md`, `28-ceo-dashboard.md`
  - Voice/Immersive AI: `15-lesson-plan-generator.md`, `16-vocabulary-system.md`, `17-progress-tracking.md` (feeds CEO dashboard insights)

Use this map to understand how new feature requests slot into the build sequence and which files to create next.

### Goal Checkpoints

**Goal 1: Launch conversion-focused funnel (Landing → Booking → Payment → Trust)**
- `04-user-profiles.md` – one-click Tutor Bio Site + parent credibility page with testimonials & progress stats.
- `05-link-in-bio.md` – link hub with lead magnets, WhatsApp/DM quick contacts, review widgets.
- `06-service-listings.md` – services + packages surface pricing/availability.
- `07-stripe-integration.md` – Stripe/PayPal payment links and subscription upgrades.
- `08-booking-system.md` – “Book a Lesson” funnel, Zoom hooks, analytics events.
- `09-student-crm.md` (upcoming) – simple CRM, student list, pipeline.
- `11-email-system.md` – automated follow-up emails/SMS for leads.

**Goal 2: Make TutorLingua stickier than Linktree (AI + CRM automation)**
- `09-student-crm.md` – tags, performance notes, parent feedback button.
- `14-ai-conversation-partner.md`, `15-lesson-plan-generator.md` – AI lesson and homework builders.
- `16-vocabulary-system.md`, `17-progress-tracking.md` – progress dashboards feeding parent updates.
- `23-lead-hub.md`, `24-ai-content-marketing.md` – AI content assistant for IG/TikTok and automated follow-up.
- `25-ai-teaching-assistant.md` – parent update builder + live transcription.
- `11-email-system.md` / `12-analytics-tracking.md` – retention benchmarks (40% WAU) and NPS instrumentation.

Track milestone metrics in analytics dashboards: 100 tutor signups, 10 paid tutors, 50 booked lessons (Goal 1); 500 tutor accounts, 40% WAU, NPS > 30 (Goal 2).

> 📌 **Security**: Follow the global checklist in `SECURITY.md` as you progress through each module. Every feature guide should include (or reference) a “Security Considerations” subsection covering RLS, secrets, third-party risks, and logging.

### Open Follow-Ups

- Calendar sync placeholders: replace stubbed `initiateCalendarSync` action with real Google/Outlook OAuth flows and persist connection state so onboarding status updates automatically.
- Calendar completion signals: store social/calendar completion progress in Supabase to power Onboarding skip/redirect rules.

## Phase 1: Foundation (Week 1-2)

### ✅ 00-project-setup.md
**Status**: Created
**Time**: 1-2 hours
**What you'll build**: 
- Next.js 14+ project with TypeScript
- Supabase integration
- Tailwind CSS + shadcn/ui
- Development environment
- Essential dependencies

**Ready to build**: YES - Start here!

---

### ✅ 01-database-schema.md
**Status**: Created
**Time**: 2-3 hours
**What you'll build**:
- Complete PostgreSQL schema
- 8 core tables (profiles, services, bookings, students, etc.)
- Row Level Security (RLS) policies
- Database indexes
- TypeScript type generation

**Prerequisites**: 00-project-setup.md

---

### ✅ 02-authentication.md
**Status**: Created
**Time**: 3-4 hours
**What you'll build**:
- Email/password auth
- Google OAuth
- Login/signup pages
- Password reset flow
- Protected routes
- Auth state management

**Prerequisites**: 00-project-setup.md, 01-database-schema.md

---

### 📝 03-basic-dashboard.md
**Status**: To be created
**Time**: 2-3 hours
**What you'll build**:
- Main dashboard layout
- Navigation sidebar
- User menu
- Mobile responsive header
- Quick stats overview
- Empty states

**Prerequisites**: 02-authentication.md

---

## Phase 2: Core Business Features (Week 3-4)

### 📝 04-user-profiles.md
**Status**: To be created
**Time**: 4-5 hours
**What you'll build**:
- Tutor profile pages
- Custom subdomain routing (username.platform.com)
- Profile editing form
- Avatar upload
- Bio and tagline
- Social media links
- Public profile view

**Prerequisites**: 03-basic-dashboard.md

**Key features**:
- Rich text bio editor
- Image upload to Supabase Storage
- Username validation (unique, URL-safe)
- Preview mode

---

### 📝 05-link-in-bio.md
**Status**: To be created
**Time**: 3-4 hours
**What you'll build**:
- Link management CRUD
- Drag-and-drop reordering
- Link preview
- Click tracking
- Custom button styles
- Visibility toggle

**Prerequisites**: 04-user-profiles.md

**Key features**:
- Beautiful link cards
- Analytics per link
- Icon support
- Multiple themes

---

### 📝 06-service-listings.md
**Status**: To be created
**Time**: 3-4 hours
**What you'll build**:
- Service creation form
- Pricing management
- Duration settings
- Service descriptions
- Active/inactive toggle
- Service packages
- Package redemption rules
- Upsell messaging for premium add-ons

**Prerequisites**: 03-basic-dashboard.md

**Key features**:
- Multiple pricing tiers
- Group vs 1-on-1 sessions
- Approval workflows
- Service templates
- Bundled session tracking

---

### 📝 07-stripe-integration.md
**Status**: To be created
**Time**: 5-6 hours
**What you'll build**:
- Stripe customer creation
- Payment intent flow
- Webhook handling
- Subscription management
- Invoice generation
- Payment history
- Upfront payment enforcement
- Multi-currency pricing (Stripe Prices)
- Package balance tracking

**Prerequisites**: 06-service-listings.md

**Key features**:
- Secure payment processing
- Multiple payment methods
- Automatic retry for failed payments
- Customer portal
- Multi-currency support
- Invoice + receipt webhooks for email automation

---

### 📝 08-booking-system.md
**Status**: To be created
**Time**: 6-8 hours
**What you'll build**:
- Availability calendar
- Time slot selection
- Timezone handling
- Booking form
- Confirmation emails
- Booking management (reschedule/cancel)
- Package redemption and balance checks
- Buffer rules per service
- Calendar sync (Google/Outlook) roadmap hooks

**Prerequisites**: 06-service-listings.md, 07-stripe-integration.md

**Key features**:
- Smart availability checking
- Buffer time between sessions
- Recurring availability
- Calendar sync (Google Calendar integration)
- Student-local timezone display
- Package usage tracking

---

### 📝 09-student-crm.md
**Status**: To be created
**Time**: 4-5 hours
**What you'll build**:
- Student list with search/filter
- Student profile pages
- Add/edit student forms
- Contact information
- Learning goals tracking
- Student notes
- CEFR level assessment
- Session package status
- Activity timeline with auto-logged emails/reminders

**Prerequisites**: 03-basic-dashboard.md

**Key features**:
- Quick add from booking
- Import from CSV
- Student tagging
- Activity timeline
- CEFR progress dashboard

---

## Phase 3: Essential Tools (Week 5-6)

### 📝 10-zoom-integration.md
**Status**: To be created
**Time**: 2-3 hours
**What you'll build**:
- Zoom API integration
- Auto-generate meeting links
- Add to booking confirmation
- Meeting password generation
- Calendar invite generation
- Embedded classroom shell with video + collaborative whiteboard (Phase 2 hook)

**Prerequisites**: 08-booking-system.md

**Key features**:
- One-click meeting creation
- Automatic calendar invites
- Meeting recording settings
- Support for future in-app whiteboard/VoIP

---

### 📝 11-email-system.md
**Status**: To be created
**Time**: 3-4 hours
**What you'll build**:
- Email templates (React Email)
- Booking confirmations
- Reminders (24h, 1h before)
- Cancellation notices
- Password reset emails
- Welcome emails
- Invoice + receipt email flows
- Review request + follow-up automation
- Lead magnet delivery sequence

**Prerequisites**: 08-booking-system.md

**Key features**:
- Beautiful responsive emails
- Branded templates
- Automated sending
- Email preferences
- SMS handoff consideration

---

### 📝 12-analytics-tracking.md
**Status**: To be created
**Time**: 2-3 hours
**What you'll build**:
- Link click tracking
- Page view analytics
- Booking conversion tracking
- Revenue analytics
- Dashboard charts
- Export reports
- Lead magnet funnel analytics
- Review request performance

**Prerequisites**: 05-link-in-bio.md, 08-booking-system.md

**Key features**:
- Real-time metrics
- Date range filtering
- Visual charts
- Export to CSV
- Tier-based reporting filters (Professional vs Growth)

---

### 📝 13-lesson-notes.md
**Status**: To be created
**Time**: 3-4 hours
**What you'll build**:
- Post-lesson note creation
- Note templates
- Homework assignment
- Vocabulary tracking
- Topics covered
- Performance ratings
- Student progress timeline
- Resource library with tagging and file uploads
- Lesson plan builder with drag-and-drop resources
- Interactive activities (sentence sort, categorization bins, image hotspots)
- Classroom asset sharing with students

**Prerequisites**: 09-student-crm.md, 08-booking-system.md

**Key features**:
- Rich text editor
- Auto-save drafts
- Share with students
- Note templates
- Centralized resource storage
- Interactive widget framework

---

## Phase 4: AI Features (Week 6-7)

### 📝 14-ai-conversation-partner.md
**Status**: To be created
**Time**: 4-5 hours
**What you'll build**:
- GPT-4 text chat interface
- Language-specific prompts
- Conversation scenarios
- Message history
- Error correction
- Vocabulary extraction
- 24/7 practice partner for students (web + mobile responsive)
- Tutor-configured goal templates

**Prerequisites**: 09-student-crm.md

**Key features**:
- Role-play scenarios
- Difficulty levels (A1-C2)
- Real-time corrections
- Save conversations
- Hooks for future voice mode (Azure Speech)

**AI Costs**: ~$0.03-0.10 per conversation

---

### 📝 15-lesson-plan-generator.md
**Status**: To be created
**Time**: 3-4 hours
**What you'll build**:
- AI lesson plan generation
- CEFR-aligned content
- Topic input
- Duration customization
- Exercise generation
- Lesson templates
- Immersive content engine (worksheets, dialogues, quizzes)
- Content clipper ingestion pipeline

**Prerequisites**: 13-lesson-notes.md

**Key features**:
- Multiple lesson types
- Student level adaptation
- Save/edit plans
- Share with students
- Export to resource library
- Regenerate sections on demand

**AI Costs**: ~$0.05-0.15 per lesson plan

---

### 📝 16-vocabulary-system.md
**Status**: To be created
**Time**: 3-4 hours
**What you'll build**:
- Vocabulary word lists
- Spaced repetition flashcards
- Word definitions
- Example sentences
- Pronunciation
- Progress tracking
- AI-generated practice activities
- Voice playback + recording review

**Prerequisites**: 13-lesson-notes.md, 14-ai-conversation-partner.md

**Key features**:
- Auto-extract from conversations
- Spaced repetition algorithm
- Audio pronunciation
- Practice modes
- Personalized challenges by weakness

---

### 📝 17-progress-tracking.md
**Status**: To be created
**Time**: 4-5 hours
**What you'll build**:
- Student progress dashboard
- Skill level tracking
- Lesson count
- Total hours
- Vocabulary size
- Progress charts
- Milestone celebrations
- AI weakness detection and alerts
- Cohort analytics feeding CEO dashboard

**Prerequisites**: 09-student-crm.md, 13-lesson-notes.md

**Key features**:
- Visual progress bars
- Skill breakdown
- Goals setting
- Achievement badges
- Automated insight summaries

---

## Phase 5: Polish & Launch (Week 7-8)

### 📝 18-landing-page.md
**Status**: To be created
**Time**: 4-5 hours
**What you'll build**:
- Marketing homepage
- Feature showcase
- Pricing table
- Testimonials
- FAQ section
- CTA buttons
- Email capture
- Language flag selector and service listings
- Lead magnet download CTA with email capture
- Auto-surfaced verified reviews from CRM

**Prerequisites**: None (can be built anytime)

**Key features**:
- Hero section
- Social proof
- Feature comparison
- Mobile responsive
- Link-in-bio mode for social bios

---

### 📝 19-onboarding.md
**Status**: To be created
**Time**: 3-4 hours
**What you'll build**:
- Step-by-step setup wizard
- Profile completion
- First service creation
- Availability setup
- Bank connection
- Tutorial tooltips
- Progress checklist

**Prerequisites**: All core features

**Key features**:
- Multi-step form
- Skip options
- Progress indicator
- Contextual help

---

### 📝 20-settings-billing.md
**Status**: To be created
**Time**: 3-4 hours
**What you'll build**:
- Account settings
- Subscription management
- Billing history
- Payment methods
- Invoice download
- Plan upgrade/downgrade
- Cancel subscription
- Growth/Studio add-on toggles
- Usage-based billing metrics

**Prerequisites**: 07-stripe-integration.md

**Key features**:
- Stripe Customer Portal
- Usage metrics
- Billing alerts
- Add-on entitlement management

---

### 📝 21-testing-deployment.md
**Status**: To be created
**Time**: 4-6 hours
**What you'll build**:
- Testing checklist
- Manual QA flows
- Performance testing
- Security audit
- Vercel deployment
- Environment setup
- Domain configuration
- SSL setup

**Prerequisites**: All features complete

**Key features**:
- Production deployment
- Monitoring setup
- Error tracking
- Analytics

---

## Phase 6: Growth & Studio Add-Ons (Optional / Premium)

### 📝 22-growth-ad-center.md
**Status**: To be created
**Time**: 6-8 hours
**What you'll build**:
- Meta Ads API integration
- Simplified campaign builder (objective, audience, budget)
- Creative management (ad copy, assets)
- Performance dashboard (CPA, ROAS, spend pacing)
- Saved presets/templates per tutor

**Prerequisites**: 06-service-listings.md, 12-analytics-tracking.md

**Key features**:
- Guardrails for ad spend limits
- Campaign health alerts
- Export reports for clients

---

### 📝 23-lead-hub.md
**Status**: To be created
**Time**: 5-6 hours
**What you'll build**:
- Lead ingestion from Meta lead forms, landing pages, and manual entry
- Unified inbox with status pipeline
- Lead assignment and tagging
- Follow-up scheduling and reminders
- Lead-to-booking conversion tracking

**Prerequisites**: 05-link-in-bio.md, 11-email-system.md

**Key features**:
- Duplicate detection
- One-click nurture sequences
- Integrations queue for future channels

---

### 📝 24-ai-content-marketing.md
**Status**: To be created
**Time**: 5-6 hours
**What you'll build**:
- AI-powered content calendar
- SEO topic and keyword suggestions
- Social caption and script generation
- Blog/PDF lead magnet drafts
- Performance tracking loop back into analytics

**Prerequisites**: 12-analytics-tracking.md, 15-lesson-plan-generator.md

**Key features**:
- Tutor voice profiles
- Suggested posting cadences
- Export to Canva/Notion workflows

---

### 📝 25-ai-teaching-assistant.md
**Status**: To be created
**Time**: 8-10 hours
**What you'll build**:
- Chrome extension (Manifest V3) shell
- Live session transcription (Web Speech / Azure Speech)
- Real-time error detection and tagging
- Automatic session summary pushed to student profile
- Content clipper transforming web pages/videos into lessons

**Prerequisites**: 10-zoom-integration.md, 13-lesson-notes.md, 17-progress-tracking.md

**Key features**:
- Offline-safe queueing
- Tutor consent + privacy controls
- Sync back to Supabase via edge functions

---

### 📝 26-group-sessions.md
**Status**: To be created
**Time**: 5-6 hours
**What you'll build**:
- Group class creation wizard
- Multi-student bookings
- Tiered pricing and discounts
- Class size limits and waitlists
- Group chat and announcements
- Attendance tracking

**Prerequisites**: 08-booking-system.md, 07-stripe-integration.md

**Key features**:
- Package compatibility
- Automatic reminder batching
- Export attendee lists

---

### 📝 27-resource-marketplace.md
**Status**: To be created
**Time**: 6-8 hours
**What you'll build**:
- Tutor-to-tutor resource listings
- Preview and purchase flow
- Revenue share and payouts
- Review and rating system
- Search filters and tags
- Licensing controls

**Prerequisites**: 13-lesson-notes.md, 07-stripe-integration.md

**Key features**:
- Versioning and updates
- Fraud prevention workflows
- Bundle pricing

---

### 📝 28-ceo-dashboard.md
**Status**: To be created
**Time**: 6-8 hours
**What you'll build**:
- Revenue forecasting models
- Churn prediction insights
- MRR/ARR tracking
- Student retention cohorts
- Alerting for at-risk students
- Exportable executive summaries

**Prerequisites**: 12-analytics-tracking.md, 17-progress-tracking.md

**Key features**:
- Scenario planning toggles
- Tier-based benchmarking
- AI-generated action recommendations

---

## Build Order Strategy

### Critical Path (Must Build)
1. 00 → 01 → 02 → 03 → 04 → 06 → 07 → 08 → 18 → 21
2. This gives you: Auth, Profile, Services, Payments, Booking, Landing, Deploy
3. **Estimated time**: 35-45 hours

### Full MVP (Recommended)
- Critical Path + 05, 09, 10, 11, 13
- Adds: Links, Students, Zoom, Email, Notes
- **Estimated time**: 50-65 hours (6-8 weeks part-time)

### MVP + AI Features
- Full MVP + 14, 15, 16, 17
- Adds: AI conversation, lesson plans, vocabulary, progress
- **Estimated time**: 65-80 hours (8-10 weeks part-time)

### Complete Platform
- Everything including Phase 6 (22-28)
- **Estimated time**: 120-150 hours (3-4 months part-time)

---

## Quick Start Guide

**Week 1**: Complete 00, 01, 02 (Foundation)
**Week 2**: Complete 03, 04, 05 (Dashboard & Profile)
**Week 3**: Complete 06, 07 (Services & Payments)
**Week 4**: Complete 08, 09 (Booking & Students)
**Week 5**: Complete 10, 11, 12, 13 (Tools)
**Week 6**: Complete 14, 15 (AI Basic)
**Week 7**: Complete 16, 17 (AI Advanced)
**Week 8**: Complete 18, 19, 20, 21 (Launch)
**Week 9 (Optional)**: Tackle Growth & Studio add-ons (22-28) based on demand

---

## File Creation Status

- ✅ Created: 00, 01, 02, README, this file
- 📝 To create: 03-28 (26 files remaining)

---

## Next Steps

1. **Start building**: Begin with 00-project-setup.md
2. **Request more files**: Tell me which files (03-25) you want created next
3. **Adapt as needed**: Each file is independent enough to customize
4. **Track progress**: Check off items as you complete them

## Recommended Next Files to Create

If building the full MVP, request these in order:
1. **03-basic-dashboard.md** - Need this to build anything else
2. **04-user-profiles.md** - Core feature
3. **06-service-listings.md** - Required for booking
4. **07-stripe-integration.md** - Required for payments
5. **08-booking-system.md** - Core feature

Would you like me to create these files next?
