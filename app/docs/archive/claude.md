# TutorLingua Platform Documentation

## 1. PROJECT OVERVIEW

### What is TutorLingua?

TutorLingua is a comprehensive business management platform built specifically for independent language tutors. It serves as the "operating system" for tutors who want to own their repeat business while still using marketplaces like Preply, iTalki, and Verbling for student discovery.

### Core Value Proposition

- **Complementary to Marketplaces**: Use Preply, iTalki, and Verbling for student discovery; use TutorLingua for direct bookings from repeat students and social followers
- **Own Your Repeat Business**: Keep 100% of revenue from direct bookings (vs. 15-33% commission on marketplaces)
- **All-in-One Platform**: Replace 10+ scattered tools (Calendly, Beacons, spreadsheets, payment processors) with one integrated system
- **Zero Platform Fees**: 0% commission on direct bookings through TutorLingua
- **Quick Setup**: Most tutors are ready in 10 minutes

### Target Users

**Primary Users (Tutors)**:
- Language tutors on Preply, iTalki, or Verbling who want to capture repeat business directly
- Independent tutors seeking to reduce commission costs (save $3,000-$8,000/year)
- Teachers who want professional online presence and booking automation

**Secondary Users (Students)**:
- Language learners who book lessons directly from tutors
- Students can request access to book lessons and view lesson history
- Parents of student learners

### Tech Stack

**Frontend**:
- Next.js 15.5.4 (App Router with Turbopack)
- React 19.1.0
- TypeScript 5.x
- Tailwind CSS 4.x
- shadcn/ui component library
- Lucide React icons
- next-intl for internationalization (10 languages)

**Backend**:
- Next.js Server Actions ("use server")
- Supabase (PostgreSQL + Auth + Storage + RLS + Realtime)
- Stripe for payments & Stripe Connect for marketplace model
- Resend for email delivery

**Video & Audio**:
- LiveKit for native video conferencing (Studio tier)
- Deepgram for speech-to-text transcription
- OpenAI for AI practice and grammar correction

**Key Libraries**:
- @supabase/ssr for server-side auth
- @livekit/components-react for video UI
- @deepgram/sdk for transcription
- react-hook-form + zod for form validation
- date-fns & date-fns-tz for timezone handling
- @dnd-kit for drag-and-drop interfaces
- lottie-react for animations

---

## 2. ARCHITECTURE

### File Structure Overview

```
app/
├── app/                          # Next.js App Router pages
│   ├── (dashboard)/             # Protected tutor dashboard routes
│   │   ├── dashboard/           # Main dashboard
│   │   ├── bookings/            # Booking management
│   │   ├── students/            # Student CRM
│   │   ├── availability/        # Calendar availability
│   │   ├── messages/            # Messaging system
│   │   ├── pages/               # Tutor site builder
│   │   ├── digital-products/    # Digital product sales
│   │   ├── settings/            # Account settings
│   │   ├── analytics/           # Analytics & reporting
│   │   ├── calendar/            # Calendar view
│   │   ├── onboarding/          # New user onboarding
│   │   ├── admin/               # Platform admin dashboard
│   │   ├── upgrade/             # Subscription upgrade
│   │   ├── notifications/       # Notification center
│   │   ├── practice-scenarios/  # AI practice scenario builder
│   │   ├── marketplace/         # Marketplace sales dashboard
│   │   ├── classroom/           # LiveKit video classroom (Studio)
│   │   ├── student/             # Student management pages
│   │   └── ai/                  # AI assistant dashboard
│   ├── (public)/                # Public-facing pages
│   │   ├── [username]/          # Dynamic tutor pages
│   │   ├── page/[username]/     # Tutor site pages
│   │   ├── bio/[username]/      # Link-in-bio pages
│   │   ├── profile/[username]/  # Public profiles
│   │   ├── products/[username]/ # Digital product catalog
│   │   ├── privacy/             # Privacy policy
│   │   ├── terms/               # Terms of service
│   │   └── blog/                # SEO blog content (EN/ES)
│   ├── api/                     # API routes
│   │   ├── stripe/              # Stripe webhooks & checkout
│   │   ├── calendar/            # Calendar OAuth
│   │   ├── analytics/           # Analytics endpoints
│   │   ├── refunds/             # Refund management
│   │   ├── admin/               # Admin dashboard API
│   │   ├── email/               # Email operations
│   │   ├── pricing/             # Pricing calculations
│   │   ├── practice/            # AI Practice endpoints
│   │   ├── livekit/             # LiveKit token & recording
│   │   ├── webhooks/            # Deepgram, LiveKit, Resend webhooks
│   │   ├── booking/             # Booking API
│   │   └── cron/                # Scheduled tasks
│   ├── book/                    # Public booking flow
│   ├── signup/                  # Registration
│   ├── login/                   # Login
│   └── student-auth/            # Student portal
├── components/                   # React components
│   ├── dashboard/               # Dashboard UI components
│   ├── booking/                 # Booking flow components
│   ├── students/                # Student management UI
│   ├── settings/                # Settings forms
│   ├── marketing/               # Marketing tools UI
│   ├── landing/                 # Landing page components
│   ├── classroom/               # LiveKit classroom components
│   ├── drills/                  # AI drill game components
│   ├── messaging/               # Realtime messaging components
│   ├── ui/                      # shadcn/ui components
│   └── ...
├── lib/                         # Business logic & utilities
│   ├── actions/                 # Server actions (40+ modules)
│   ├── supabase/                # Supabase clients
│   ├── stripe.ts                # Stripe utilities
│   ├── livekit.ts               # LiveKit utilities
│   ├── deepgram.ts              # Deepgram utilities
│   ├── calendar/                # Calendar integrations
│   ├── emails/                  # Email templates
│   ├── validators/              # Zod schemas
│   ├── types/                   # TypeScript types
│   ├── constants/               # Constants & config
│   ├── repositories/            # Data access layer
│   ├── services/                # Business services
│   ├── payments/                # Payment processing
│   ├── pricing/                 # Pricing calculations
│   ├── practice/                # AI Practice constants & utils
│   ├── subscription/            # Lesson subscription utilities
│   ├── admin/                   # Admin utilities
│   ├── middleware/              # Custom middleware
│   ├── utils/                   # Utility functions
│   ├── blog.ts                  # Blog content utilities
│   └── telemetry/               # Analytics tracking
├── supabase/migrations/         # Database migrations
├── middleware.ts                # Route protection & auth
└── package.json                 # Dependencies
```

### Database Schema (PostgreSQL via Supabase)

**Core Tables**:

1. **profiles** (auth.users extension)
   - User account data (tutors)
   - Settings, timezone, avatar, bio, social links
   - Onboarding state, subscription plan
   - Payment settings, Stripe Connect status
   - Video conferencing preferences
   - Tier (standard/studio)

2. **students**
   - Student records managed by tutors
   - Contact info, learning goals, proficiency level
   - Access control (pending/approved/denied/suspended)
   - Email preferences, timezone
   - Source tracking (booking_page, import, manual)
   - Labels (text array for tagging/organization)

3. **bookings**
   - Scheduled lessons between tutors and students
   - Service reference, datetime, duration, timezone
   - Payment status (paid/unpaid), amount, currency
   - Meeting URL and provider info
   - Status (pending/confirmed/cancelled/completed)
   - Egress ID (for LiveKit recording tracking)

4. **services**
   - Lesson types offered by tutors
   - Name, description, duration, pricing
   - Active status, approval requirements
   - Stripe product/price IDs

5. **availability**
   - Weekly recurring availability slots
   - Day of week (0-6), start/end times
   - One tutor can have multiple slots per day

6. **session_package_templates**
   - Pre-paid lesson packages
   - Session count, total minutes, pricing
   - Stripe integration

7. **session_package_purchases**
   - Student package purchases
   - Remaining minutes, expiration
   - Redemption history

8. **tutor_sites**
   - Custom tutor website builder data
   - About section, hero image, gallery
   - Theme settings (colors, fonts, spacing)
   - Section visibility toggles
   - Published/draft status
   - Theme archetype (professional/immersion/academic/polyglot)
   - Theme heading font, border radius

9. **tutor_site_services**, **tutor_site_reviews**, **tutor_site_resources**, **tutor_site_products**
   - Junction tables for tutor site content
   - Services to display, testimonials, resource links, digital products

10. **digital_products**
    - Downloadable products (PDFs, ebooks, etc.)
    - Fulfillment type (file/link)
    - Pricing, Stripe integration
    - Download limits

11. **digital_product_purchases**
    - Purchase records with download tracking
    - Download tokens, limits
    - Status (pending/paid/refunded)

12. **conversation_threads**
    - Message threads between tutors and students
    - Last message preview, unread status
    - Unique per tutor-student pair
    - Realtime enabled

13. **conversation_messages**
    - Individual messages in threads
    - Sender role (tutor/student/system)
    - Read status tracking
    - Attachments (JSONB)
    - Audio URL support
    - Realtime enabled

14. **calendar_connections**
    - OAuth tokens for Google/Outlook calendar sync
    - Provider, account info, sync status
    - Access/refresh tokens (encrypted)

15. **blocked_times**
    - Manual unavailability overrides
    - Start/end timestamps, optional label

16. **student_access_requests**
    - Calendar access request workflow
    - Status (pending/approved/denied)
    - Tutor notes, student message

17. **refund_requests**
    - Refund workflow for Stripe Connect
    - Amount, reason, status
    - Actor (student/tutor/admin)

18. **email_campaigns**
    - Bulk email history
    - Audience filters, template IDs
    - Recipient count, status

19. **email_queue**, **email_preferences**
    - Email automation infrastructure
    - Unsubscribe management

20. **links**
    - Link-in-bio items
    - URL, title, icon, button style
    - Click tracking, sort order

21. **student_tutor_connections**
    - Student-tutor relationship management
    - Connection requests with approval workflow
    - Status (pending/approved/rejected)
    - Initial message from student, tutor notes

22. **support_tickets**
    - Platform support ticket system
    - Subject, message, category
    - Status (open/in_progress/closed)
    - User role tracking (tutor/student)

23. **student_site_reviews**
    - Student reviews on tutor sites
    - Rating, comment, approval status
    - Pinned review feature

24. **notifications**
    - Notification center for tutors and students
    - 14+ notification types (booking, payment, message, student events)
    - Read/unread status, grouping by date
    - Action links and rich metadata (JSONB)

25. **booking_reschedule_history**
    - Full audit trail for booking reschedules
    - Tracks who requested (tutor/student), reason, timestamps
    - Original and new scheduled times

26. **practice_scenarios**
    - Custom AI conversation templates created by tutors
    - Title, description, language, proficiency level, topic
    - Custom system prompts, vocabulary/grammar focus
    - Usage tracking (times_used counter)

27. **practice_assignments**
    - AI practice assignments for students
    - Status (assigned/in_progress/completed)
    - Linked to practice scenarios and homework

28. **student_practice_sessions**
    - Active and completed AI practice sessions
    - Message count, grammar corrections tracked
    - Session feedback and ratings

29. **student_practice_messages**
    - Individual messages in AI practice sessions
    - Grammar corrections metadata (JSONB)
    - Token usage tracking

30. **grammar_issues**
    - Grammar error tracking by category
    - 11 categories: verb_tense, subject_verb_agreement, etc.
    - Trend analysis (improving/stable/declining)

31. **pronunciation_assessments**
    - Audio pronunciation analysis records
    - Accuracy scores and feedback

32. **practice_usage_periods**
    - Monthly usage tracking for AI Practice billing
    - Text turns used, audio seconds used
    - Blocks consumed for metered billing

33. **homework_assignments**
    - Tutor-assigned homework with resources
    - Due dates, status tracking, student notes
    - Resource attachments (JSONB)
    - Audio instruction URL

34. **homework_submissions**
    - Student homework submissions
    - Text response, audio URL, file attachments
    - Tutor feedback, review status (pending/reviewed/needs_revision)
    - RLS policies for students and tutors

35. **learning_goals**
    - Student learning goals with progress tracking
    - Target dates, progress percentage
    - Status (active/completed/paused/abandoned)

36. **proficiency_assessments**
    - Skill assessments by area (8 areas)
    - speaking, listening, reading, writing, vocabulary, grammar, pronunciation, overall
    - Levels: beginner → proficient

37. **learning_stats**
    - Aggregate student statistics
    - Total lessons, minutes, streaks
    - Homework completed count

38. **lesson_notes**
    - Post-lesson notes from tutors
    - Topics, vocabulary, grammar points covered
    - Student-visible feedback section

39. **content_reports**
    - Content moderation report system
    - Report types: spam, harassment, inappropriate, scam, etc.
    - Priority levels and resolution workflow

40. **moderation_actions**
    - Audit trail for moderation decisions
    - Actions: warning_issued, content_removed, user_suspended, etc.

41. **marketplace_transactions**
    - Digital product sales tracking
    - Gross revenue, platform fees, net earnings
    - Tiered commission calculation

42. **ai_conversations**
    - AI assistant conversation threads
    - Context types: lesson_prep, student_feedback, etc.
    - Token usage tracking

43. **ai_messages**
    - Individual AI assistant messages
    - Role (user/assistant/system)
    - Message metadata

44. **ai_usage**
    - Monthly AI usage statistics by user
    - Token counts for billing

45. **lifetime_purchases**
    - Pre-signup lifetime deal purchases
    - Email-based linking during signup
    - Stripe session tracking

46. **tutor_reengagement_emails**
    - Re-engagement campaign tracking for inactive tutors
    - Email templates and send history

47. **processed_stripe_events**
    - Webhook deduplication
    - Prevents duplicate event processing

48. **email_events**
    - Raw events from Resend webhooks (bounces, complaints, deliveries, etc.)
    - Tracks message_id, recipient, event_type, reason, metadata
    - Used for delivery tracking and debugging
    - Indexed by email address and event type

49. **email_suppressions**
    - Global suppression list based on bounces/complaints
    - Prevents future sends to bad email addresses
    - Automatically populated by Resend webhook on bounce/complaint/dropped events
    - Checked before every email send via `sendEmail()`

50. **lesson_subscription_templates**
    - Tutor subscription tier offerings
    - Tiers: 2_lessons, 4_lessons, 8_lessons, custom
    - One per service, with pricing and Stripe integration

51. **lesson_subscriptions**
    - Active student subscriptions
    - Status: active, paused, canceled, past_due, trialing
    - Stripe subscription linking

52. **lesson_allowance_periods**
    - Monthly credit tracking with rollover
    - lessons_allocated, lessons_rolled_over, lessons_used
    - is_current flag for billing period

53. **lesson_subscription_redemptions**
    - Links bookings to subscription usage
    - One redemption per booking
    - Refund support for cancellations

---

## 3. CORE FEATURES (Working & Functional)

### Feature: User Onboarding

**What it does**: Guided 6-step onboarding for new tutors to set up their profile, services, and booking system.

**Where the code lives**:
- Pages: `/app/(dashboard)/onboarding/page.tsx`
- Actions: `/lib/actions/onboarding.ts`
- Components: `/components/onboarding/`
- Steps: `/components/onboarding/steps/Step*.tsx`

**How it works**:
1. New tutor signs up → redirected to `/onboarding`
2. Step 1: Profile basics (name, username, timezone, avatar)
3. Step 2: Professional info (tagline, bio, website)
4. Step 3: Languages & first service (name, duration, price)
5. Step 4: Availability (weekly schedule)
6. Step 5: Calendar sync (optional Google/Outlook)
7. Step 6: Payment setup (Stripe Connect or manual)
8. `completeOnboarding()` sets `onboarding_completed = true`
9. Middleware allows access to dashboard

**Key actions**:
- `saveOnboardingStep(step, data)` - Saves each step
- `completeOnboarding()` - Marks onboarding complete
- `checkOnboardingStatus()` - Returns completion state

---

### Feature: Profile Management

**What it does**: Tutors manage their public profile, settings, and account preferences.

**Where the code lives**:
- Pages: `/app/(dashboard)/settings/profile/page.tsx`
- Actions: `/lib/actions/profile.ts`
- Components: `/components/forms/profile-settings-form.tsx`

**How it works**:
1. Form with fields: full_name, username, tagline, bio, avatar, languages, timezone, social links
2. Avatar upload to Supabase Storage (`avatars` bucket)
3. `updateProfile()` server action validates and saves
4. Revalidates `/settings/profile` and `/dashboard`

**Key actions**:
- `updateProfile(formData)` - Updates profile with validation
- `updatePaymentSettings(data)` - Payment methods (Venmo, PayPal, Zelle, Stripe)
- `updateVideoSettings(data)` - Video conferencing (Zoom, Google Meet, Microsoft Teams, Calendly, custom)

---

### Feature: Availability Scheduling

**What it does**: Tutors define weekly recurring availability for bookings.

**Where the code lives**:
- Pages: `/app/(dashboard)/availability/page.tsx`
- Actions: `/lib/actions/availability.ts`
- Components: `/components/availability/availability-dashboard.tsx`

**How it works**:
1. UI shows 7-day week grid
2. Tutor adds time slots for each day (day_of_week: 0-6)
3. Multiple slots per day allowed
4. `saveAvailability(slots)` deletes old slots, inserts new
5. Public booking page checks availability to show open times

**Key actions**:
- `getAvailability()` - Fetches tutor's availability slots
- `saveAvailability(slots)` - Replaces all availability
- Validates with `availabilityFormSchema` (Zod)

---

### Feature: Booking System

**What it does**: Complete booking workflow from public page to confirmation, with conflict detection and payment processing.

**Where the code lives**:
- Public page: `/app/book/page.tsx` or `/app/book/[username]/page.tsx`
- Success: `/app/book/success/page.tsx`
- Actions: `/lib/actions/bookings.ts`
- Components: `/components/booking/`
- Utils: `/lib/utils/booking-conflicts.ts`, `/lib/utils/booking-validation.ts`

**How it works**:

**Public Booking Flow**:
1. Student visits tutor's booking link
2. Selects service → sees available times from tutor's availability
3. Fills form (name, email, phone, timezone, notes)
4. Chooses payment option (session package, subscription, or direct payment)
5. `createBookingAndCheckout()` server action:
   - Validates service pricing
   - Checks availability conflicts
   - Creates or updates student record
   - Creates booking (pending or confirmed)
   - If package: redeems minutes, confirms booking
   - If subscription: redeems lesson credit
   - If Stripe Connect enabled: creates checkout session
   - If manual payment: returns booking ID with payment instructions
6. Sends confirmation emails to student and tutor
7. Redirects to success page or Stripe checkout

**Tutor-Initiated Booking**:
1. From `/bookings` page
2. Select existing student
3. Choose service, time, duration
4. `createBooking()` creates confirmed booking
5. Marks as unpaid (for manual payment tracking)

**Key actions**:
- `createBookingAndCheckout()` - Main public booking flow
- `createBooking()` - Tutor creates booking manually
- `markBookingAsPaid()` - Tutor confirms payment received
- `cancelBooking()` - Cancels booking, refunds package minutes/subscription credits
- `listBookings()` - Fetches tutor's bookings
- `validateBooking()` - Checks conflicts and availability

---

### Feature: Calendar Integration

**What it does**: Two-way sync with Google Calendar and Outlook Calendar to prevent double-bookings.

**Where the code lives**:
- Settings: `/app/(dashboard)/settings/calendar/page.tsx`
- OAuth callback: `/app/api/calendar/oauth/[provider]/route.ts`
- Popup callback: `/app/calendar-callback/page.tsx`
- Actions: `/lib/actions/calendar.ts`, `/lib/actions/calendar-events.ts`
- Config: `/lib/calendar/config.ts`, `/lib/calendar/busy-windows.ts`
- Components: `/components/settings/calendar-connect-card.tsx`

**How it works**:
1. Tutor clicks "Connect Google Calendar" or "Connect Outlook"
2. `requestCalendarConnection(provider, { popup: true })` generates OAuth URL
3. Opens popup window to Google/Microsoft OAuth consent screen
4. Callback receives authorization code
5. Exchanges code for access token + refresh token
6. Stores in `calendar_connections` table (encrypted)
7. Popup shows success message and auto-closes (2 seconds)
8. Parent window receives postMessage and refreshes status
9. Background sync fetches external events
10. Booking validation checks both availability and external calendar events

**Key actions**:
- `listCalendarConnections()` - Shows connected calendars
- `requestCalendarConnection(provider, options)` - Initiates OAuth flow
- `disconnectCalendar(provider)` - Removes connection
- `getCalendarEventsWithDetails()` - Fetches external events with titles
- `getCalendarEvents()` - Combines TutorLingua bookings, external events, and blocked times

**Enhanced Calendar Views**:
- Month view with booking count indicators
- Week view with hourly time grid showing all events
- Day view with detailed timeline and event sidebar
- Color-coded events: Yellow (TutorLingua), Blue (Google), Purple (Outlook), Gray (Blocked)
- Click empty slots to block time manually
- Current time indicator in week/day views

---

### Feature: Services & Pricing

**What it does**: Tutors create and manage lesson types with pricing.

**Where the code lives**:
- Pages: `/app/(dashboard)/services/page.tsx`
- Actions: `/lib/actions/services.ts`
- Components: `/components/services/service-form.tsx`
- Validator: `/lib/validators/service.ts`

**How it works**:
1. Create service with: name, description, duration (minutes), price (cents), currency
2. Toggle active status
3. `createService()` inserts into services table
4. Auto-creates link in bio for active services
5. Public booking page lists active services
6. Stripe product/price can be synced (optional)

**Key actions**:
- `createService(payload)` - Creates new service
- `updateService(id, payload)` - Updates service
- `deleteService(id)` - Soft delete (sets is_active=false)

---

### Feature: Session Packages

**What it does**: Tutors sell pre-paid lesson packages (e.g., "10 lessons for $400").

**Where the code lives**:
- Actions: `/lib/actions/session-packages.ts`
- Components: `/components/services/session-package-form.tsx`

**How it works**:
1. Tutor creates package template (session count, total minutes, price)
2. Student purchases package → `session_package_purchases` record
3. Student books lessons using package minutes
4. `redeemPackageMinutes()` creates redemption record
5. Tracks remaining minutes
6. Expires after validity period

**Key actions**:
- `createSessionPackage()` - Creates package template
- `purchasePackage()` - Student buys package
- `redeemPackageMinutes()` - Deducts minutes for booking
- `refundPackageMinutes()` - Restores minutes on cancellation
- `getActivePackages()` - Fetches student's available packages

---

### Feature: Lesson Subscriptions

**What it does**: Monthly recurring lesson plans with soft rollover (students subscribe for 2, 4, 8, or custom lessons per month).

**Where the code lives**:
- Actions: `/lib/actions/lesson-subscriptions.ts`
- Components: `/components/services/SubscriptionTierInput.tsx`
- Booking: `/components/booking/SubscriptionCreditSelector.tsx`

**How it works**:

**Tutor Setup**:
1. Creates subscription tier for a service (2/4/8/custom lessons per month)
2. Sets monthly price and Stripe product/price IDs
3. Tier saved to `lesson_subscription_templates`

**Student Subscription**:
1. Student selects subscription tier during booking
2. Redirected to Stripe checkout for recurring billing
3. `lesson_subscriptions` record created on successful payment
4. `lesson_allowance_periods` tracks monthly credits

**Soft Rollover Policy**:
- Unused lessons roll over to next month (max 1 month)
- If not used in rollover month, credits expire
- Database function `process_subscription_rollover()` handles billing cycle reset

**Booking with Subscription**:
1. Student books lesson
2. System checks `get_subscription_balance()` for available credits
3. If credits available, `redeem_subscription_lesson()` deducts 1 credit
4. `lesson_subscription_redemptions` links booking to subscription
5. On cancellation, `refund_subscription_lesson()` restores credit

**Key Database Functions**:
- `get_subscription_balance(subscription_id)` - Returns available lessons
- `process_subscription_rollover(subscription_id)` - Handles billing cycle
- `redeem_subscription_lesson(subscription_id, booking_id)` - Uses credit
- `refund_subscription_lesson(redemption_id)` - Restores credit

---

### Feature: Digital Products

**What it does**: Tutors sell digital downloads (PDFs, ebooks, worksheets).

**Where the code lives**:
- Pages: `/app/(dashboard)/digital-products/page.tsx`
- Public: `/app/(public)/products/[username]/page.tsx`
- Actions: `/lib/actions/digital-products.ts`

**How it works**:
1. Tutor uploads file to Supabase Storage or provides external URL
2. Sets price, title, description
3. Student purchases → Stripe checkout
4. Download token generated
5. Student can download file X times (download_limit)
6. Purchase tracked in `digital_product_purchases`

**Key actions**:
- `createDigitalProduct()` - Creates product
- `purchaseDigitalProduct()` - Student checkout
- `downloadDigitalProduct(token)` - Serves file

---

### Feature: Payments & Stripe Connect

**What it does**: Full payment processing with Stripe Connect for direct payouts to tutors.

**Where the code lives**:
- API: `/app/api/stripe/connect/`
- Settings: `/app/(dashboard)/settings/payments/page.tsx`
- Lib: `/lib/stripe.ts`, `/lib/payments/`, `/lib/services/connect.ts`
- Components: `/components/settings/StripeConnectPanel.tsx`

**How it works**:

**Stripe Connect Onboarding**:
1. Tutor clicks "Connect Stripe"
2. API creates Stripe Connect account (Express)
3. Generates account link → redirects to Stripe onboarding
4. Stripe collects business info, bank details
5. Webhook confirms account verified → updates `stripe_charges_enabled`
6. Profile updated with `stripe_account_id`

**Payment Flow**:
1. Student books lesson (with Stripe-connected tutor)
2. `createCheckoutSession()` creates Stripe checkout
3. Sets `transfer_destination` to tutor's account
4. Platform fee (currently 0%, configurable)
5. Webhook receives `checkout.session.completed`
6. Booking marked as paid, status = confirmed
7. Funds transferred directly to tutor's bank account

**Key actions**:
- `createCheckoutSession()` - Stripe checkout with destination charges
- `getOrCreateStripeCustomer()` - Creates/retrieves Stripe customer
- Webhook handler: `/api/stripe/webhook/route.ts`
- `refreshAccountStatus()` - Syncs Connect account status

---

### Feature: Messaging System

**What it does**: Direct messaging between tutors and students within the platform with realtime updates.

**Where the code lives**:
- Tutor: `/app/(dashboard)/messages/page.tsx`
- Student: `/app/student/messages/page.tsx`
- Actions: `/lib/actions/messaging.ts`
- Components: `/components/messaging/`
  - `message-composer.tsx` - Send messages
  - `message-display.tsx` - Render messages with audio
  - `RealtimeMessagesContainer.tsx` - Realtime subscriptions

**How it works**:
1. Conversation thread created per tutor-student pair
2. Either party sends message → saved to `conversation_messages`
3. Updates `conversation_threads.last_message_preview`
4. Tracks unread status per user
5. Messages support attachments (JSONB field)
6. Audio messages stored in `message-attachments` bucket
7. Supabase Realtime subscription pushes new messages instantly

**Key actions**:
- `sendThreadMessage(formData)` - Sends message
- `getUnreadMessageCount()` - Badge count for UI

---

### Feature: Student Management

**What it does**: Full student CRM with notes, lesson history, labels, and access control.

**Where the code lives**:
- Pages: `/app/(dashboard)/students/page.tsx`, `/app/(dashboard)/students/[studentId]/page.tsx`
- Import: `/app/(dashboard)/students/import/page.tsx`
- Actions: `/lib/actions/students.ts`, `/lib/actions/tutor-students.ts`
- Components: `/components/students/`

**How it works**:

**Student Creation**:
1. Manual add from dashboard
2. CSV import (bulk upload)
3. Auto-created during public booking
4. Email normalization (lowercase, trimmed)

**Student Labels**:
1. Tutors can tag students with labels (text array)
2. Examples: "beginner", "advanced", "exam_prep", "conversation_only"
3. Filter students by label in CRM
4. GIN index for efficient label querying

**Access Control**:
1. Student requests calendar access (if not auto-approved)
2. Creates `student_access_requests` record
3. Tutor reviews in `/students/access-requests`
4. Approves/denies → updates `students.calendar_access_status`
5. Only approved students can book

**CRM Features**:
- Student notes (learning goals, proficiency, native language)
- Lesson history
- Package purchases
- Subscription status
- Communication preferences (email opt-out)
- Status (active/trial/paused/alumni)

**Key actions**:
- `listStudents()` - Fetches all tutor's students
- `ensureStudent()` - Create or update student
- `importStudentsBatch()` - CSV import with validation
- `approveStudentAccess()` - Approve access request
- `denyStudentAccess()` - Deny access request

---

### Feature: Analytics/Dashboard

**What it does**: Revenue analytics, booking metrics, and business insights.

**Where the code lives**:
- Pages: `/app/(dashboard)/dashboard/page.tsx`, `/app/(dashboard)/analytics/`
- API: `/app/api/analytics/payments/summary/route.ts`
- Components: `/components/dashboard/metric-cards.tsx`

**How it works**:
1. Dashboard aggregates key metrics:
   - Total revenue (MTD, YTD)
   - Bookings count (upcoming, completed)
   - Student count (active, new this month)
   - Package sales
2. Analytics page shows detailed breakdowns:
   - Revenue by service
   - Booking trends over time
   - Student acquisition sources
   - Payment method breakdown (Stripe vs. manual)

**Key components**:
- `MetricCards` - Dashboard KPI cards
- Payment analytics API endpoint
- Link click tracking

---

### Feature: Public Pages

**What it does**: Public-facing tutor pages for branding and bookings.

**Where the code lives**:
- Bio page: `/app/(public)/bio/[username]/page.tsx`
- Profile: `/app/(public)/profile/[username]/page.tsx`
- Tutor site: `/app/(public)/[username]/page.tsx`
- Products: `/app/(public)/products/[username]/page.tsx`
- Actions: `/lib/actions/tutor-sites.ts`

**How it works**:

**Link-in-Bio** (`/bio/[username]`):
- Shows all tutor's links (services, social, custom)
- Click tracking for analytics
- Drag-and-drop reordering
- Customizable button styles

**Profile Page** (`/profile/[username]`):
- Public tutor profile with bio, languages, avatar
- Social media links
- Booking CTA button

**Tutor Site** (`/[username]`):
- Full-featured custom website builder
- Sections: About, Lessons, Reviews, Booking CTA, Resources, FAQ, Digital Products
- Customizable theme: colors, fonts, spacing
- Layout options: minimal/bold/centered for hero
- Gallery images
- Testimonials (drag-and-drop sort)
- Publishing workflow (draft/published)
- Version history (snapshots)

**Teaching Archetypes**:
- 4 cultural banner themes:
  - **Professional**: Business-focused, dark/trust themes (border radius: lg)
  - **Immersion**: Warm, friendly, community-focused (border radius: 3xl)
  - **Academic**: Formal, scholarly presentation (border radius: xl, serif headings)
  - **Polyglot**: Modern, global, polyglot-friendly (border radius: 2xl)

**Key actions**:
- `getTutorSiteData()` - Fetches site data
- `updateTutorSite()` - Saves site changes
- `publishTutorSite()` - Publishes draft
- `addTutorSiteReview()` - Adds testimonial

---

### Feature: AI Practice Companion

**What it does**: Subscription-based conversational AI practice for students to practice between lessons. Features real-time grammar corrections, pronunciation assessment, vocabulary tracking, and session feedback.

**Where the code lives**:
- Student pages: `/app/student/practice/[assignmentId]/page.tsx`, `/app/student/practice/subscribe/page.tsx`
- Tutor builder: `/app/(dashboard)/practice-scenarios/page.tsx`
- API routes: `/app/api/practice/`
- Components: `/components/student/AIPracticeChat.tsx`, `/components/student/AIPracticeCard.tsx`
- Actions: `/lib/actions/progress.ts`, `/lib/actions/ai-assistant.ts`
- Constants: `/lib/practice/constants.ts`

**How it works**:

**Practice Scenario Creation (Tutor)**:
1. Tutor opens Practice Scenarios builder
2. Creates scenario with title, language, proficiency level, topic
3. Customizes system prompt and focus areas (vocabulary/grammar)
4. Sets max messages per session
5. Assigns scenario to student as homework

**AI Practice Session (Student)**:
1. Student subscribes to AI Practice ($8/month base)
2. Views assigned practice scenarios in progress dashboard
3. Opens assigned session → starts conversation with AI
4. Types or speaks (audio input with pronunciation assessment)
5. AI responds with grammar corrections inline
6. Grammar errors tracked by category (11 types)
7. Session ends manually or at message limit
8. Displays session summary with feedback, rating, vocabulary

**Usage-Based Billing**:
- Base tier: $8/month = 100 audio minutes + 300 text turns
- Block add-ons: $5 each = +60 audio minutes + +200 text turns
- Blocks auto-charge via Stripe metered billing when exceeded
- Usage tracked in `practice_usage_periods` table

**Grammar Categories Tracked**:
verb_tense, subject_verb_agreement, preposition, article, word_order, gender_agreement, conjugation, pronoun, plural_singular, spelling, vocabulary

**Key actions**:
- `getStudentPracticeData()` - Fetches practice assignments and stats
- `getTutorStudentPracticeData()` - Tutor CRM view of student practice
- `getStudentPracticeAnalytics()` - Analytics summary with grammar trends

---

### Feature: AI Drills

**What it does**: Interactive drill games for language practice - match, gap-fill, and word scramble.

**Where the code lives**:
- Components: `/components/drills/`
  - `MatchGame.tsx` - Word/phrase matching drills
  - `GapFillGame.tsx` - Fill-in-the-blank exercises
  - `ScrambleGame.tsx` - Word scramble challenges
  - `DrillModal.tsx` - Modal wrapper for drill presentation

**How it works**:
1. AI generates drill content based on lesson or practice session
2. Student selects drill type (match, gap-fill, scramble)
3. Gamified interface with points and streaks
4. Difficulty progression based on performance
5. Results tracked for tutor review

**Drill Types**:
- **Match Game**: Connect words/phrases with translations or definitions
- **Gap-Fill**: Complete sentences with missing words
- **Scramble**: Rearrange scrambled words into correct sentences

---

### Feature: Homework Planner

**What it does**: Tutors assign homework with resources and due dates. Students view and complete homework from their portal.

**Where the code lives**:
- Tutor page: `/app/(dashboard)/students/[studentId]/page.tsx`
- Student page: `/app/student/progress/page.tsx`
- Components: `/components/students/HomeworkPlanner.tsx`, `/components/students/HomeworkTab.tsx`
- Actions: `/lib/actions/progress.ts`

**How it works**:

**Tutor Creates Homework**:
1. Opens student detail page
2. Scrolls to Homework Planner section
3. Enters title, instructions, due date
4. Adds resource attachments (PDFs, videos, links)
5. Optionally adds audio instructions URL
6. Optionally links to AI practice assignment
7. Student immediately sees in progress portal

**Student Completes Homework**:
1. Views homework in progress dashboard
2. Opens to see instructions and resources
3. Completes work and clicks "Mark as completed"
4. Optionally adds completion notes
5. Tutor sees completion status

**Key actions**:
- `assignHomework()` - Creates homework assignment
- `updateHomeworkStatus()` - Changes status
- `markHomeworkCompleted()` - Student marks complete

---

### Feature: Homework Submissions

**What it does**: Students submit homework with text, audio recordings, and file attachments. Tutors review and provide feedback.

**Where the code lives**:
- Components: `/components/student/HomeworkSubmissionForm.tsx`, `/components/student/AudioRecorder.tsx`
- Actions: `/lib/actions/homework-submissions.ts`

**How it works**:

**Student Submission**:
1. Opens homework assignment
2. Writes text response
3. Records audio response (browser-based recording)
4. Attaches files (PDFs, images up to 20MB)
5. Submits → `homework_submissions` record created

**Tutor Review**:
1. Views submission in student detail page
2. Listens to audio, reads text, downloads files
3. Writes feedback
4. Sets status: reviewed or needs_revision
5. Student sees feedback in portal

**Key actions**:
- `submitHomework()` - Student submits work
- `reviewHomeworkSubmission()` - Tutor provides feedback
- `getHomeworkSubmissions()` - Fetch submissions for assignment

---

### Feature: Student Progress Tracking

**What it does**: Unified progress dashboard for students with goals, proficiency assessments, learning stats, and lesson notes.

**Where the code lives**:
- Student page: `/app/student/progress/page.tsx`
- Components: `/app/student/progress/StudentProgressClient.tsx`
- Actions: `/lib/actions/progress.ts`

**How it works**:
1. Tutor records learning goals (e.g., "Achieve B2 by June")
2. Tutor records proficiency assessments after lessons
3. Tutor adds lesson notes with student-visible feedback
4. Student views unified progress dashboard showing:
   - Learning stats (total lessons, minutes, streaks)
   - Active and completed goals with progress bars
   - Latest assessments per skill area (8 areas)
   - Recent lesson notes and feedback
   - Open homework assignments
   - AI Practice status

**Proficiency Levels**:
beginner → elementary → intermediate → upper_intermediate → advanced → proficient

**Skill Areas**:
speaking, listening, reading, writing, vocabulary, grammar, pronunciation, overall

**Key actions**:
- `getStudentProgress()` - Fetches all progress data
- `createLearningGoal()` - Add goal with target date
- `updateLearningGoalProgress()` - Update goal completion
- `recordProficiencyAssessment()` - Record skill assessment

---

### Feature: Notifications System

**What it does**: Comprehensive notification center for tutors with 14+ notification types, grouped by date.

**Where the code lives**:
- Page: `/app/(dashboard)/notifications/page.tsx`
- Actions: `/lib/actions/notifications.ts`

**How it works**:
1. Events trigger notifications (booking, payment, message, etc.)
2. Notifications stored with type, title, message, metadata
3. Grouped by date (Today, Yesterday, specific dates)
4. Unread badge tracking in sidebar
5. "Mark all as read" functionality
6. Delete individual notifications
7. Filter by All/Unread tabs

**Notification Types**:
booking_new, booking_confirmed, booking_cancelled, booking_reminder, payment_received, payment_failed, message_new, message_reply, student_new, student_access_request, package_purchased, package_expiring, review_received, review_approved, system_announcement, account_update, homework_submitted

**Key actions**:
- `getNotifications()` - Fetches paginated notifications
- `markNotificationRead()` - Mark single as read
- `markAllNotificationsRead()` - Mark all as read
- `deleteNotification()` - Remove notification

---

### Feature: Marketplace Sales Dashboard

**What it does**: Real-time sales dashboard for digital products with tiered commission tracking.

**Where the code lives**:
- Page: `/app/(dashboard)/marketplace/page.tsx`
- Component: `/app/(dashboard)/marketplace/marketplace-dashboard.tsx`

**How it works**:
1. Tutors sell digital products (PDFs, ebooks, etc.)
2. Sales tracked in `marketplace_transactions` table
3. Dashboard shows:
   - Gross revenue, earnings, platform fees
   - Transaction list with product details
   - Commission rate progress tracker
4. Tiered commission: 15% until $500 lifetime sales, then 10%

**Key features**:
- `get_tutor_commission_rate()` - Dynamic commission calculation
- Product category and level tracking
- Transaction history with status

---

### Feature: Practice Scenarios Builder

**What it does**: Tutors create custom AI conversation practice templates for students.

**Where the code lives**:
- Page: `/app/(dashboard)/practice-scenarios/page.tsx`
- Component: `/components/practice/ScenarioBuilder.tsx`

**How it works**:
1. Tutor opens Practice Scenarios page
2. Creates new scenario with:
   - Title and description
   - Target language and proficiency level
   - Topic (e.g., "Restaurant ordering", "Job interview")
   - Custom system prompt (with default template)
   - Vocabulary and grammar focus areas
   - Max messages per session
3. Toggles scenario active/inactive
4. Assigns to students for practice
5. Tracks usage (times_used counter)

**Supported Languages**:
English, Spanish, French, German, Portuguese, Italian, Chinese, Japanese, Korean, Arabic, Russian, Hindi, Dutch, Polish, Turkish

---

### Feature: Booking Reschedule

**What it does**: Full reschedule workflow with history tracking and conflict detection.

**Where the code lives**:
- Actions: `/lib/actions/reschedule.ts`

**How it works**:
1. Tutor or student requests reschedule
2. System checks for conflicts
3. If available, booking updated with new time
4. `original_scheduled_at` preserved for reference
5. `reschedule_count` incremented
6. Full history tracked in `booking_reschedule_history`

**Key actions**:
- `rescheduleBooking()` - Reschedule with conflict check
- `getBookingRescheduleHistory()` - View reschedule history

---

### Feature: Content Moderation

**What it does**: Report system for platform content with admin review workflow.

**Where the code lives**:
- Admin page: `/app/admin/moderation/`
- API: `/api/admin/moderation`

**How it works**:
1. User reports content (message, review, profile, etc.)
2. Report created with reason and priority
3. Admin reviews in moderation dashboard
4. Resolution actions: no_action, warning_issued, content_removed, user_suspended, user_banned
5. Full audit trail in `moderation_actions` table

**Report Reasons**:
spam, harassment, inappropriate, scam, impersonation, copyright, other

**Priority Levels**:
low, normal, high, urgent

---

### Feature: Support Tickets

**What it does**: Platform support ticket system for tutors and students.

**Where the code lives**:
- Migration: `20251128100000_create_support_tickets.sql`

**How it works**:
1. User submits support ticket with subject, message, category
2. Ticket created with status "open"
3. Admin reviews and responds
4. Status workflow: open → in_progress → closed
5. Tracks user role (tutor/student) for context

---

### Feature: Admin Health & Config

**What it does**: Platform health monitoring and centralized configuration.

**Where the code lives**:
- Pages: `/app/admin/health/`, `/app/admin/settings/`
- API: `/api/admin/health`

**How it works**:
- System health monitoring with status tracking
- Platform-wide configuration settings
- Admin user management
- Tutor inactivity tracking with re-engagement emails

---

### Feature: Help Center

**What it does**: Searchable help documentation with categorized articles for tutors and students, with i18n support.

**Where the code lives**:
- Pages: `/app/(public)/help/page.tsx`, `/app/(public)/help/[slug]/page.tsx`
- Spanish: `/app/(public)/es/help/page.tsx`, `/app/(public)/es/help/[slug]/page.tsx`
- Utilities: `/lib/help.ts`
- Content: `/docs/help/` (Markdown files)

**How it works**:
1. Help articles stored as Markdown files in `/docs/help/`
2. `lib/help.ts` parses frontmatter for title, category, reading time
3. Main page shows categorized article list with search
4. Article pages render Markdown with syntax highlighting
5. i18n support via locale-prefixed routes

**Categories**:
getting-started, booking, payments, calendar, students, marketing, studio, ai-practice, account

---

### Feature: Niche Landing Pages

**What it does**: Dynamic SEO landing pages for specific tutoring niches to improve organic discovery.

**Where the code lives**:
- Page: `/app/(public)/for/[slug]/page.tsx`
- Data: `/lib/marketing/niche-data.ts`

**How it works**:
1. Slug-based routing for niches (e.g., `/for/spanish-conversation`, `/for/business-english`)
2. `niche-data.ts` contains structured content per niche:
   - Hero title and subtitle
   - Target audience description
   - Benefits and features
   - SEO metadata
3. Page renders with niche-specific content and CTA to signup

**Example Niches**:
spanish-conversation, business-english, exam-prep-ielts, kids-tutoring, accent-reduction, medical-english

---

## 4. STUDIO TIER FEATURES

### Feature: LiveKit Video Classroom

**What it does**: Native video conferencing for lessons using LiveKit, available exclusively for Studio tier tutors.

**Where the code lives**:
- Classroom page: `/app/(dashboard)/classroom/[bookingId]/page.tsx`
- API token route: `/app/api/livekit/token/route.ts`
- API recording route: `/app/api/livekit/recording/route.ts`
- LiveKit utilities: `/lib/livekit.ts`
- Components: `/components/classroom/`
  - `VideoStage.tsx` - Main video canvas
  - `ControlBar.tsx` - Video controls (mute, camera, screen share)
  - `RecordingControls.tsx` - Start/stop recording
  - `SessionHeader.tsx` - Session info and duration
  - `SidebarTabs.tsx` - Tabs for chat, notes, participants
  - `NotesEditor.tsx` - Real-time lesson notes
  - `ChatTab.tsx` - In-room messaging
  - `MicVolumeIndicator.tsx` - Audio level visualization
  - `ParticipantNameTag.tsx` - Name badges for participants
  - `PreJoinScreen.tsx` - Pre-join setup and device testing
  - `RecordingConsentModal.tsx` - Recording consent workflow
  - `StudioSidebar.tsx` - Sidebar container with tabs

**How it works**:

**Classroom Flow**:
1. Tutor or student navigates to `/classroom/[bookingId]`
2. Page fetches LiveKit token from `/api/livekit/token`
3. API validates:
   - User is authenticated
   - User is participant in the booking (tutor or student)
   - Tutor has Studio tier subscription
4. Returns signed LiveKit access token
5. Client connects to LiveKit Cloud
6. VideoConference component renders full video room
7. On disconnect, user is redirected to `/dashboard`

**Recording Flow**:
1. Tutor clicks "Start Recording"
2. Recording consent modal shown to all participants
3. All participants must consent
4. `/api/livekit/recording` starts S3 egress
5. `egress_id` stored in booking record
6. Recording saved to S3-compatible storage (Supabase)
7. On lesson end, recording stops automatically

**Error Handling**:
- 401: Not authenticated → "Please sign in" message
- 403: Not authorized or tutor lacks Studio tier → "Access Denied" with upgrade CTA
- 404: Booking not found
- 503: LiveKit not configured (missing env vars)

**Key files**:
- `lib/livekit.ts`:
  - `createAccessToken(userId, roomName, options)` - Generates JWT token
  - `getRoomServiceClient()` - Server-side room management
  - `getEgressClient()` - Recording management
  - `isLiveKitConfigured()` - Checks if env vars are set
  - `getS3RecordingOptions()` - S3 egress configuration

**Environment Variables**:
```bash
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud

# S3-compatible storage for recordings
SUPABASE_S3_ENDPOINT=your_s3_endpoint
SUPABASE_S3_ACCESS_KEY=your_access_key
SUPABASE_S3_SECRET_KEY=your_secret_key
SUPABASE_S3_BUCKET=recordings
```

**Dependencies**:
- `@livekit/components-react` - React components for video UI
- `@livekit/components-styles` - LiveKit default styles
- `livekit-server-sdk` - Server-side token generation and room management

---

### Feature: Lesson Transcription

**What it does**: Deepgram-powered speech-to-text transcription of lesson recordings.

**Where the code lives**:
- Webhook: `/app/api/webhooks/deepgram/route.ts`
- Utilities: `/lib/deepgram.ts`
- Admin retry: `/app/api/admin/retry-transcriptions/route.ts`

**How it works**:
1. Lesson recording saved to S3
2. Deepgram API called with recording URL
3. Transcription returned via webhook
4. Transcript stored and associated with booking
5. Tutor can view transcript in lesson detail

**Key utilities**:
- `transcribeAudio(audioUrl)` - Initiates Deepgram transcription
- Webhook handler processes callback

---

### Feature: Lesson Review & Post-Lesson Insights

**What it does**: Post-lesson review page with video replay, AI-generated summaries, key moments, auto-generated drills, and fluency feedback.

**Where the code lives**:
- Page: `/app/(dashboard)/student/review/[bookingId]/page.tsx`
- Cron: `/app/api/cron/lesson-analysis/route.ts`
- Analysis utils: `/lib/analysis/lesson-insights.ts`
- Migration: `supabase/migrations/20250115000000_post_lesson_insights.sql`

**How it works**:

**Lesson Analysis Pipeline**:
1. Lesson recording saved to S3 via LiveKit egress
2. Cron job `/api/cron/lesson-analysis` polls for unprocessed recordings
3. Deepgram transcribes audio → transcript stored in `lesson_recordings`
4. OpenAI analyzes transcript for:
   - Key moments with timestamps
   - AI-generated summary (3-5 bullet points)
   - Fluency assessment (speaking pace, filler words, grammar patterns)
   - Auto-generated drill content (vocabulary, grammar exercises)
5. Results stored in `lesson_recordings` and `lesson_drills` tables
6. `processing_logs` tracks pipeline status

**Review Page Features**:
1. Video replay with seeking to key moments
2. AI-generated lesson summary
3. Key moments timeline with clickable timestamps
4. Auto-generated drills based on lesson content
5. Fluency feedback with metrics
6. Student can replay specific moments

**Database tables**:
- `lesson_recordings` - Enhanced with `ai_summary`, `key_moments` (JSONB), `fluency_score`
- `lesson_drills` - Generated drills linked to booking
- `processing_logs` - Pipeline audit trail

**Key functions**:
- `generateLessonInsights(transcriptId)` - Runs full analysis pipeline
- `getKeyMoments(transcript)` - Extracts important moments
- `generateDrills(transcript, language)` - Creates practice exercises

---

## 5. API ROUTES

**Authentication**:
- `GET /api/auth/me` - Get current user

**Stripe**:
- `POST /api/stripe/booking-checkout` - Create checkout session
- `POST /api/stripe/webhook` - Stripe webhooks
- `POST /api/stripe/connect/accounts` - Create Connect account
- `GET /api/stripe/connect/status` - Refresh account status
- `POST /api/stripe/connect/login-link` - Connect dashboard link
- `POST /api/stripe/connect/account-link` - Onboarding link
- `POST /api/stripe/billing-portal` - Billing portal session
- `POST /api/stripe/sync-customer` - Sync customer data
- `POST /api/stripe/subscription-checkout` - Create subscription checkout

**Calendar**:
- `GET /api/calendar/oauth/[provider]` - OAuth callback (Google/Outlook)
- `GET /calendar-callback` - Popup callback page with auto-close

**Analytics**:
- `GET /api/analytics/payments/summary` - Payment analytics

**Refunds**:
- `POST /api/refunds/request` - Student requests refund
- `POST /api/refunds/approve` - Tutor approves refund

**Utilities**:
- `POST /api/username/check` - Check username availability
- `POST /api/links/[id]/click` - Track link click

**Cron Jobs**:
- `POST /api/cron/send-reminders` - Send lesson reminders
- `POST /api/cron/homework-reminders` - Send homework reminders
- `POST /api/cron/lesson-analysis` - Analyze recordings and generate AI insights (Studio)

**AI Practice**:
- `POST /api/practice/chat` - AI conversation with grammar corrections
- `POST /api/practice/audio` - Audio processing and pronunciation assessment
- `POST /api/practice/subscribe` - Create AI Practice subscription
- `POST /api/practice/end-session` - Finalize session and generate feedback
- `GET /api/practice/usage` - Get current usage period and allowances
- `POST /api/practice/assign` - Assign practice scenario to student
- `GET /api/practice/scenarios` - List tutor's practice scenarios
- `GET /api/practice/stats` - Practice statistics
- `GET /api/practice/progress` - Student practice progress

**LiveKit (Studio)**:
- `POST /api/livekit/token` - Generate WebRTC access token
- `POST /api/livekit/recording` - Start/stop room recording

**Webhooks**:
- `POST /api/webhooks/deepgram` - Transcription webhook
- `POST /api/webhooks/livekit` - LiveKit event webhooks
- `POST /api/webhooks/resend` - Email service webhooks

**Booking**:
- `POST /api/booking/inline` - Inline booking interface

**Admin**:
- `GET /api/admin/health` - System health check
- `GET /api/admin/moderation` - Moderation queue
- `POST /api/admin/moderation/resolve` - Resolve moderation report
- `GET /api/admin/tutors/inactive` - List inactive tutors
- `POST /api/admin/tutors/reengagement` - Send re-engagement emails
- `POST /api/admin/retry-transcriptions` - Retry failed transcriptions
- `GET /api/admin/export/tutors` - Export tutor data (CSV)
- `GET /api/admin/export/revenue` - Export revenue data (CSV)
- `GET /api/admin/export/students` - Export student data (CSV)
- `GET /api/admin/analytics/page-views` - Page view analytics

**Pricing**:
- `GET /api/pricing/founder` - Founder pricing info

---

## 6. AUTHENTICATION & AUTHORIZATION

### How Auth Works

**Supabase Auth**:
- Email/password authentication
- JWT tokens stored in httpOnly cookies
- Session managed via `@supabase/ssr`
- Middleware validates sessions on protected routes

### User Types

**Tutors** (primary users):
- Stored in `profiles` table (extends auth.users)
- Full access to dashboard features
- Create bookings, manage students

**Students**:
- Can have optional auth.users account (user_id field)
- Guest checkouts allowed (email-only)
- Authenticated students access student portal

### Protected Routes

**Middleware** (`middleware.ts`):
```typescript
PROTECTED_ROUTES = [
  "/dashboard",
  "/availability",
  "/bookings",
  "/students",
  "/services",
  "/pages",
  "/settings",
  "/analytics",
  "/marketing",
  "/onboarding",
  "/calendar",
  "/digital-products",
  "/messages",
  "/classroom",
]
```

**Onboarding Gate**:
- Incomplete onboarding → redirect to `/onboarding`
- Checks `profiles.onboarding_completed` field

**Plan Access**:
- Pro routes require any paid plan (Pro or Studio tier)
- Studio routes (`/classroom`, `/studio`) require Studio tier subscription
- Unpaid users (`professional`) are redirected to `/settings/billing`
- Exceptions: `/settings/billing`, `/settings/profile`, `/onboarding` are accessible to all authenticated users

### RLS Policies

**Pattern**: Tutors own their data
```sql
CREATE POLICY "Tutors manage bookings"
  ON bookings FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());
```

**Public Access**:
```sql
CREATE POLICY "Public view published sites"
  ON tutor_sites FOR SELECT
  USING (status = 'published');
```

---

## 7. INTEGRATIONS

### Stripe Connect

**Purpose**: Direct payouts to tutors, platform marketplace model

**Flow**:
1. Tutor connects via Express onboarding
2. Platform creates destination charges
3. Funds transfer directly to tutor account
4. Platform can take optional fee (currently 0%)

**Files**:
- `/lib/services/connect.ts`
- `/lib/payments/`
- `/api/stripe/connect/`

### Google Calendar OAuth

**Scopes**: `https://www.googleapis.com/auth/calendar.events` (events only)

**Provider**: Google OAuth 2.0

**Flow**: Authorization code grant with refresh tokens (popup-based)

**Features**:
- Reads busy times/events to prevent double-booking
- Creates booking events (optionally with attendee email)
- Displays in calendar with color coding
- Auto-refresh tokens before expiration

### Microsoft Outlook OAuth

**Scopes**: `Calendars.ReadWrite`, `offline_access`

**Provider**: Microsoft Graph API

**Flow**: Authorization code grant with refresh tokens (popup-based)

**Features**:
- Fetches calendar events with details
- Displays in calendar with color coding
- Prevents double-booking
- Auto-refresh tokens before expiration

### Email Service

**Provider**: Resend

**Templates**: React Email components in `/emails/`

**Features**:
- Transactional emails
- Bulk campaigns
- Unsubscribe management
- Email queue

### LiveKit

**Purpose**: Native video conferencing for Studio tier

**Provider**: LiveKit Cloud

**Features**:
- Real-time video and audio
- Screen sharing
- Recording with S3 egress
- Room-based architecture

### Deepgram

**Purpose**: Speech-to-text transcription

**Provider**: Deepgram API

**Features**:
- Asynchronous transcription via webhook
- Speaker diarization
- Timestamped transcripts

---

## 8. KEY SERVER ACTIONS

Located in `/lib/actions/`:

**Authentication**:
- `signUp(email, password)` - Register tutor
- `signIn(email, password)` - Login
- `signOut()` - Logout
- `resetPassword(email)` - Password reset

**Availability** (`availability.ts`):
- `getAvailability()` - Fetch weekly schedule
- `saveAvailability(slots)` - Update availability

**Blocked Times** (`blocked-times.ts`):
- `createBlockedTime()` - Manual unavailability
- `deleteBlockedTime()` - Remove block

**Bookings** (`bookings.ts`):
- `listBookings()` - Fetch bookings
- `createBooking(input)` - Tutor creates booking
- `createBookingAndCheckout()` - Public booking flow
- `markBookingAsPaid(bookingId)` - Payment confirmation
- `cancelBooking(bookingId)` - Cancel with refund

**Calendar** (`calendar.ts`, `calendar-events.ts`):
- `listCalendarConnections()` - Connected calendars
- `requestCalendarConnection(provider, options)` - OAuth flow
- `disconnectCalendar(provider)` - Remove connection
- `getCalendarEvents()` - All events (TutorLingua + external + blocked)
- `getWeekEvents()` - Week view events
- `getDayEvents()` - Day view events

**Digital Products** (`digital-products.ts`):
- `createDigitalProduct()` - Create product
- `purchaseDigitalProduct()` - Checkout
- `downloadProduct(token)` - Serve file

**Messaging** (`messaging.ts`):
- `sendThreadMessage()` - Send message
- `getUnreadMessageCount()` - Badge count

**Onboarding** (`onboarding.ts`):
- `saveOnboardingStep(step, data)` - Save progress
- `completeOnboarding()` - Finish onboarding

**Profile** (`profile.ts`):
- `updateProfile(formData)` - Update profile
- `updatePaymentSettings()` - Payment methods
- `updateVideoSettings()` - Video conferencing

**Services** (`services.ts`):
- `createService(payload)` - Create service
- `updateService(id, payload)` - Edit service

**Session Packages** (`session-packages.ts`):
- `createSessionPackage()` - Create package
- `purchasePackage()` - Student purchase
- `redeemPackageMinutes()` - Use package
- `refundPackageMinutes()` - Restore on cancellation

**Lesson Subscriptions** (`lesson-subscriptions.ts`):
- `createSubscriptionTemplate()` - Create subscription tier
- `subscribeToLessons()` - Student subscribes
- `redeemSubscriptionLesson()` - Use subscription credit
- `refundSubscriptionLesson()` - Restore credit on cancellation
- `getSubscriptionBalance()` - Check available lessons

**Students** (`students.ts`, `tutor-students.ts`):
- `listStudents()` - Fetch all students
- `ensureStudent()` - Create or update
- `importStudentsBatch()` - CSV import
- `approveStudentAccess()` - Approve access
- `denyStudentAccess()` - Deny access

**Tutor Sites** (`tutor-sites.ts`):
- `getTutorSiteData()` - Fetch site data
- `updateTutorSite()` - Save changes
- `publishTutorSite()` - Publish draft
- `addTutorSiteReview()` - Add testimonial

**Student Connections** (`student-connections.ts`):
- `requestConnection()` - Student requests to connect with tutor
- `approveConnection()` - Tutor approves connection
- `rejectConnection()` - Tutor rejects connection
- `getConnectedTutors()` - Student's connected tutors
- `getPendingConnectionRequests()` - Tutor's pending requests

**Reviews** (`reviews.ts`):
- `submitReview()` - Student submits review
- `approveReview()` - Tutor approves review for display
- `pinReview()` - Pin review to top of site
- `getApprovedReviews()` - Fetch approved reviews

**Email Campaigns** (`email-campaigns.ts`):
- `createCampaign()` - Create bulk email campaign
- `sendCampaign()` - Send to recipients
- `getCampaignStats()` - Open/click rates

**Progress & Homework** (`progress.ts`):
- `getStudentProgress()` - Fetches all progress data for student
- `getTutorStudentProgress()` - Tutor view of student progress
- `createLearningGoal()` - Add goal with target date
- `updateLearningGoalProgress()` - Update goal completion
- `recordProficiencyAssessment()` - Record skill assessment
- `assignHomework()` - Create homework assignment
- `updateHomeworkStatus()` - Change homework status
- `markHomeworkCompleted()` - Student marks complete
- `getStudentPracticeData()` - Practice assignments and stats
- `getTutorStudentPracticeData()` - Tutor CRM view of practice
- `getStudentPracticeAnalytics()` - Analytics with grammar trends

**Homework Submissions** (`homework-submissions.ts`):
- `submitHomework()` - Student submits work
- `reviewHomeworkSubmission()` - Tutor provides feedback
- `getHomeworkSubmissions()` - Fetch submissions

**AI Assistant** (`ai-assistant.ts`):
- `createAIConversation()` - Start new AI conversation
- `addAIMessage()` - Add message to conversation
- `getAIConversationHistory()` - Fetch conversation history
- `trackAIUsage()` - Track token usage

**Notifications** (`notifications.ts`):
- `getNotifications()` - Fetches paginated notifications
- `markNotificationRead()` - Mark single as read
- `markAllNotificationsRead()` - Mark all as read
- `deleteNotification()` - Remove notification
- `createNotification()` - Create new notification

**Reschedule** (`reschedule.ts`):
- `rescheduleBooking()` - Reschedule with conflict check
- `getBookingRescheduleHistory()` - View reschedule history

**Engagement** (`engagement.ts`):
- `trackEngagement()` - Track user engagement metrics
- `getEngagementStats()` - Engagement analytics

**Student Billing** (`student-billing.ts`):
- `getStudentSubscription()` - Fetch subscription status
- `cancelStudentSubscription()` - Cancel subscription

**Stripe Payments** (`stripe-payments.ts`):
- Additional Stripe-related payment operations

**Trial** (`trial.ts`):
- `createAutoTrial()` - Create 14-day free trial on signup

---

## 9. COMPONENT LIBRARY

### UI Components (shadcn/ui)

Located in `/components/ui/`:

- `avatar.tsx` - User avatars
- `button.tsx` - Button variants
- `card.tsx` - Card containers
- `input.tsx` - Form inputs
- `select.tsx` - Dropdowns
- `textarea.tsx` - Multi-line inputs
- `dialog.tsx` - Modals
- `form.tsx` - Form components
- `tabs.tsx` - Tab navigation
- `badge.tsx` - Status badges
- `skeleton.tsx` - Loading skeletons
- `checkbox.tsx` - Checkboxes
- `dropdown-menu.tsx` - Dropdown menus
- `label.tsx` - Form labels
- `table.tsx` - Data tables
- `color-picker.tsx` - HSL color picker for themes
- `resizable.tsx` - Resizable panel component
- `tooltip.tsx` - Hover tooltips

### Custom Components

**Calendar**:
- `DashboardBookingCalendar` - Month view with booking dots
- `CalendarWeekView` - Week grid with hourly slots
- `CalendarDayView` - Day timeline with event sidebar
- `CalendarEventBlock` - Color-coded event blocks
- `CalendarColorLegend` - Event type legend
- `QuickBlockDialog` - Quick time blocking modal
- `CalendarPageClient` - View switcher wrapper

**Dashboard**:
- `DashboardShell` - Layout wrapper
- `Header` - Top navigation
- `Sidebar` - Side navigation
- `BottomNav` - Mobile navigation
- `MetricCards` - KPI cards
- `CalendarSidebar` - Today's lessons widget

**Booking**:
- `PublicBookingLanding` - Public booking page
- `StudentInfoForm` - Booking form
- `AccessRequestStatus` - Access request UI
- `StudentLessonHistory` - Lesson history widget
- `InlineBookingSheet` - Inline booking interface
- `SubscriptionCreditSelector` - Select subscription for booking

**Settings**:
- `ProfileWizard` - Multi-step profile setup
- `SettingsNav` - Settings navigation
- `ConnectStripeButton` - Stripe Connect CTA
- `CalendarConnectCard` - Calendar sync card

**Onboarding**:
- `OnboardingTimeline` - Progress tracker
- `TimelineStep` - Individual step
- Steps 1-6 components in `/components/onboarding/steps/`

**Marketing**:
- `LinkManager` - Link-in-bio dashboard
- `SiteEditor` - Tutor site builder
- `SitePreview` - Live site preview
- `EmailComposer` - Campaign composer

**Page Builder** (`/components/page-builder/`):
- `PageBuilderWizard` - Multi-step site creation wizard
- `WizardContext` - State management for wizard
- `SimplifiedPreview` - Wizard preview panel
- `circular-progress-wheel.tsx` - Progress indicator
- `mobile-preview-toggle.tsx` - Mobile/desktop preview
- Step components: Theme, Layout, Content, Pages, Profile, FAQ

**Student Portal** (`/components/student/`):
- `StudentLoginForm` - Student authentication
- `StudentSignupForm` - Student registration
- `StudentPortalLayout` - Portal layout wrapper
- `StudentCalendar` - Student's booking calendar
- `TutorSearch` - Search and discover tutors
- `StudentConnectButton` - Request tutor connection
- `StudentBookingForm` - Book lessons
- `ConnectionRequestModal` - Connection request UI
- `UpcomingLessons` - Student's upcoming lessons

**Student Components** (`/components/student/`):
- `AIPracticeChat` - Main AI conversation interface
- `AIPracticeCard` - Subscription and usage display card
- `AudioInputButton` - Pronunciation recording and assessment
- `AudioRecorder` - Browser-based audio recording
- `HomeworkPracticeButton` - Homework completion actions
- `HomeworkSubmissionForm` - Submit homework with text/audio/files
- `SubscribeClient` - AI Practice subscription flow

**Classroom** (`/components/classroom/`):
- `VideoStage.tsx` - Main video canvas
- `ControlBar.tsx` - Video controls (mute, camera, screen share)
- `RecordingControls.tsx` - Start/stop recording
- `SessionHeader.tsx` - Session info and duration
- `SidebarTabs.tsx` - Tabs for chat, notes, participants
- `NotesEditor.tsx` - Real-time lesson notes
- `ChatTab.tsx` - In-room messaging
- `MicVolumeIndicator.tsx` - Audio level visualization
- `ParticipantNameTag.tsx` - Name badges for participants
- `PreJoinScreen.tsx` - Pre-join setup and device testing
- `RecordingConsentModal.tsx` - Recording consent workflow
- `StudioSidebar.tsx` - Sidebar container with tabs

**Drills** (`/components/drills/`):
- `MatchGame.tsx` - Word/phrase matching drills
- `GapFillGame.tsx` - Fill-in-the-blank exercises
- `ScrambleGame.tsx` - Word scramble challenges
- `DrillModal.tsx` - Modal wrapper for drill presentation

**Messaging** (`/components/messaging/`):
- `message-composer.tsx` - Send messages
- `message-display.tsx` - Render messages with audio
- `RealtimeMessagesContainer.tsx` - Realtime subscriptions

**AI Practice** (`/components/practice/`):
- `ScenarioBuilder` - Create custom AI conversation templates

**AI Interface** (`/components/ai/`):
- `AIChatInterface` - AI assistant conversation interface

**Students CRM** (`/components/students/`):
- `HomeworkPlanner` - Tutor homework assignment interface (old)
- `HomeworkTab` - New homework tab component
- `AIPracticeAnalytics` - Student AI practice analytics view
- `StudentProgressPanel` - Progress overview
- `StudentDetailTabs` - Tabbed student detail view
- `StudentDetailsTab` - Basic student info
- `StudentLessonsCalendar` - Student's lesson history calendar
- `StudentMessagesTab` - Student messages
- `StudentPaymentsTab` - Payment history
- `StudentProfileCard` - Student profile card
- `StudentUpcomingLessons` - Upcoming lessons list
- `StudentAIPracticeTab` - AI practice tab

**Services** (`/components/services/`):
- `service-dashboard.tsx` - Services management
- `service-form.tsx` - Create/edit service
- `SubscriptionTierInput.tsx` - Configure subscription tiers

**Admin** (`/components/admin/`):
- Admin dashboard components for platform management
- Moderation queue interface
- Health monitoring dashboard
- `TutorPlanManager` - Manage tutor plans

---

## 10. ENVIRONMENT VARIABLES

### Required (Core Functionality)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
SUPABASE_SERVICE_ROLE_KEY=eyJhb...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
RESEND_API_KEY=re_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Stripe Subscription (All-Access Plan)
STRIPE_ALL_ACCESS_PRICE_ID=price_...
STRIPE_LIFETIME_PRICE_ID=price_...

# AI Features (Required for AI Practice Companion)
OPENAI_API_KEY=sk-...
```

### Optional (Extended Features)

```bash
# Stripe Connect (for marketplace payouts)
STRIPE_CONNECT_RETURN_URL=https://app.tutorlingua.co/settings/payments
STRIPE_CONNECT_REFRESH_URL=https://app.tutorlingua.co/settings/payments
# For local dev: http://localhost:3000/settings/payments

# Calendar OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_OAUTH_REDIRECT_URL=...

MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
MICROSOFT_OAUTH_REDIRECT_URL=...

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### Studio Tier (Video & Transcription)

```bash
# LiveKit Video Conferencing
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud

# Deepgram Transcription
DEEPGRAM_API_KEY=your_api_key

# S3-compatible Storage (for recordings)
SUPABASE_S3_ENDPOINT=your_s3_endpoint
SUPABASE_S3_ACCESS_KEY=your_access_key
SUPABASE_S3_SECRET_KEY=your_secret_key
SUPABASE_S3_BUCKET=recordings
```

---

## 11. DEVELOPMENT

### Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
npm test             # Unit tests (Node test runner)
npm run test:e2e     # Playwright E2E tests
npm run test:e2e:ui  # Playwright UI mode
npm run type-check   # TypeScript check
npm run smoke        # Lint + unit tests
```

### Database Migrations

```bash
supabase db push     # Apply migrations
supabase migration up # Apply specific migration
```

### Code Quality

- TypeScript strict mode
- ESLint with Next.js config
- Zod for runtime validation
- Server actions for type-safe API
- RLS for database security

---

## ADDITIONAL NOTES

### Internationalization

TutorLingua supports 10 languages:
- English (en)
- Spanish (es)
- French (fr)
- Portuguese (pt)
- German (de)
- Italian (it)
- Japanese (ja)
- Korean (ko)
- Dutch (nl)
- Chinese (zh)

Uses `next-intl` for translations. Landing page copy in `/lib/constants/landing-copy.ts`.

### SEO Blog Content

Located in `/app/docs/blog/`:
- **140+ SEO-optimized articles** across 10 languages
- 7 topic clusters: Commissions, Tools, Business, Retention, Marketing, Specializations, Operations
- Blog utilities in `/lib/blog.ts`
- Public routes: `/blog/[slug]`, `/{lang}/blog/[slug]`

**Language Coverage**:
| Cluster | EN | ES | FR | PT | DE | IT | JA | KO | NL | ZH |
|---------|----|----|----|----|----|----|----|----|----|----|
| 1. Commissions (9 articles) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2. Tools (9 articles) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 3-7. (English only) | ✅ | - | - | - | - | - | - | - | - | - |

**Slug Conventions**:
- European languages (DE, IT, NL, PT, FR, ES): Native language slugs
- CJK languages (JA, KO, ZH): Romanized slugs (e.g., `yoyaku-system-tutor-osusume`)

### Pricing Model

**Platform Subscription Plans** (Tutor Accounts):

| Plan ID | Display Name | Price | Tier | Description |
|---------|--------------|-------|------|-------------|
| `professional` | Free | $0 | Free | Default for new signups / trial expired |
| `pro_monthly` | Pro Monthly | $39/month | Pro | Full platform access |
| `pro_annual` | Pro Annual | $351/year | Pro | 25% off ($29.25/mo effective) |
| `tutor_life` | Pro Lifetime | $299 one-time | Pro | Lifetime Pro access (launch pricing) |
| `studio_monthly` | Studio Monthly | $79/month | Studio | Pro + LiveKit video, transcription, drills, clips |
| `studio_annual` | Studio Annual | $711/year | Studio | 25% off ($59.25/mo effective) |
| `studio_life` | Studio Lifetime | $499 one-time | Studio | Lifetime Studio access (launch pricing) |
| `founder_lifetime` | Founder Lifetime | $49 one-time | Pro | Legacy grandfathered lifetime deal |
| `all_access` | Pro (Legacy) | $39/month | Pro | Legacy plan, maps to pro_monthly |

**Tier Feature Access**:

| Feature | Free | Pro | Studio |
|---------|------|-----|--------|
| Dashboard, Calendar, Bookings | - | Yes | Yes |
| Students, Services, Availability | - | Yes | Yes |
| Messages, Pages, Analytics, Marketing | - | Yes | Yes |
| LiveKit Native Video | - | - | Yes |
| Lesson Transcription | - | - | Yes |
| AI Drill Generation | - | - | Yes |
| Marketing Clips | - | - | Yes |
| Learning Roadmaps | - | - | Yes |

**Auto-Trial System**:
- New tutors automatically start a 14-day free trial on signup (via `createAutoTrial()`)
- No credit card required upfront
- During trial, users have Pro tier access with full platform access
- After trial ends without payment method, subscription reverts to `professional`
- Users can add payment method anytime to continue

**Middleware Access Control**:
- Pro routes require any paid plan (Pro or Studio tier)
- Studio routes (`/studio`, `/classroom`) require Studio tier subscription
- Unpaid users (`professional`) are redirected to `/settings/billing`
- Exceptions: `/settings/billing`, `/settings/profile`, `/onboarding` are accessible to all authenticated users

**Code Reference**:
- Plan types: `/lib/types/payments.ts` (`PlatformBillingPlan`, `PlanTier`)
- Subscription helpers: `/lib/payments/subscriptions.ts` (`getPlanTier`, `hasProAccess`, `hasStudioAccess`)
- Trial creation: `/lib/actions/trial.ts`
- Access control: `/middleware.ts` (tier-based route gating)
- Entitlements: Auth provider returns `isPaid`, `hasProAccess`, `hasStudioAccess`, `tier` flags

**Student AI Materials Subscription** (Studio Feature):
- **Price**: $10/month flat fee
- **Revenue Share**: 75% platform / 25% tutor
- Platform receives: $7.50/student/month
- Tutor receives: $2.50/student/month (passive income)
- Platform API cost: ~$1.50/month (at 4 hrs avg usage)
- **Platform net profit**: ~$6.00/student/month (80% margin)

**AI Practice Companion** (Student Subscription):
- **Base tier**: $8/month = 100 audio minutes + 300 text turns
- **Add-on blocks**: $5 each = +60 audio minutes + +200 text turns
- **Billing**: Metered via Stripe (blocks auto-charge when exceeded)
- **Constants**: `/lib/practice/constants.ts`

**Marketplace Commissions** (Digital Products):
- **Tier 1**: 15% platform fee (up to $500 lifetime sales)
- **Tier 2**: 10% platform fee (after $500 lifetime sales)

**Value Proposition vs. Marketplaces**:

| Platform    | Commission | Tutor Keeps on $50/hr |
|-------------|------------|----------------------|
| Preply      | 18-33%     | $33.50-$41.00        |
| iTalki      | 15%        | $42.50               |
| Verbling    | ~15%       | $42.50               |
| TutorLingua | 0%         | $50.00               |

For a tutor earning $2,000/month on Preply (33% commission):
- Commission cost: $660/month ($7,920/year)
- TutorLingua Pro cost: $39/month ($468/year)
- **Annual savings: $7,452**

### Marketplace Positioning Strategy

TutorLingua is positioned as **complementary to marketplaces**, not competitive:

**Discovery vs. Retention Model**:
- **Marketplaces (Preply, iTalki, Verbling)**: Use for student discovery and first-time bookings
- **TutorLingua**: Use for direct bookings from repeat students and social followers

**Key Messaging**:
- "Use marketplaces to get discovered. Use TutorLingua for direct bookings."
- "Stay on Preply for new students. But repeat lessons go through TutorLingua."
- "Not a replacement, an addition."

**Tutor Workflow**:
1. Get discovered on marketplace (Preply, iTalki, etc.)
2. Complete first lesson(s) through marketplace
3. Share TutorLingua booking link with repeat students
4. Keep 100% of direct booking revenue

**Why This Works**:
- Tutors don't want to leave marketplaces entirely (discovery value)
- But commissions on repeat students feel unfair (15-33% for students they already found)
- TutorLingua captures the "repeat student" segment only
- Complementary positioning = easier adoption (no "all-or-nothing" decision)

### Testing

- **Unit tests**: Node test runner in `/tests/`
- **E2E tests**: Playwright in `/e2e/`
- **Accessibility**: @axe-core/playwright integration

---

## IMPLEMENTATION LOG

### 12 December 2025: Cluster-2-Tools Translation (7 Languages)

**Completed Translation Work**:
- Translated all 9 cluster-2-tools articles to 7 additional languages
- Total new files: 63 (9 articles × 7 languages)
- Languages: German (DE), Portuguese (PT), Dutch (NL), Italian (IT), Japanese (JA), Korean (KO), Chinese (ZH)

**Articles Translated**:
1. `tutor-tech-stack-2025` - Complete tech stack guide
2. `best-booking-system-tutors` - Booking system comparison
3. `accept-payments-private-tutor` - Payment processing guide
4. `best-link-in-bio-tutors` - Link-in-bio tools
5. `create-tutor-website-no-coding` - No-code website creation
6. `automated-lesson-reminders` - Lesson reminder automation
7. `stop-using-spreadsheets-tutoring` - CRM over spreadsheets
8. `automatic-zoom-links-students` - Zoom link automation
9. `best-free-tools-language-tutors-2025` - Free tools roundup

**Directory Structure**:
- `/app/docs/blog/{lang}/cluster-2-tools/` for each language
- Localized slugs, categories, tags, and SEO keywords
- `alternateLocale` field linking back to English source
- Internal links updated to same-language cluster-1 articles

---

### 11 December 2025: E2E Testing & Documentation Refresh

**E2E Smoke Test Fixes**:
- Fixed E2E golden path test (`e2e/smoke-golden-path.spec.ts`)
- Discovered database trigger `handle_new_user()` auto-creates 3 default services
- Updated test to use auto-created services instead of manual creation
- Fixed service name matching for booking validation

**Documentation Refresh**:
- Added Help Center feature documentation (Section 3)
- Added Niche Landing Pages feature documentation (Section 3)
- Added Lesson Review & Post-Lesson Insights feature documentation (Section 4 - Studio)
- Added missing API routes: cron/lesson-analysis, admin exports, pricing/founder
- Updated README.md Application Map with new routes
- Updated README.md Key Flows with new features

**New Routes Documented**:
- `/help`, `/help/[slug]` - Help center
- `/for/[slug]` - Niche landing pages
- `/student/review/[bookingId]` - Post-lesson review (Studio)
- `/student/drills`, `/student/library` - Student portal routes
- `/{lang}/blog/[slug]` - Extended blog language support

---

### 10 December 2025: Documentation Update

**Updated documentation** to reflect all December 2025 features:
- LiveKit Video Classroom (Studio tier)
- Lesson Subscriptions with soft rollover
- Homework Submissions with audio/text/file support
- Realtime Messaging via Supabase
- AI Drills (match, gap-fill, scramble)
- Teaching Archetypes (Professional, Immersion, Academic, Polyglot)
- Student Labels for CRM
- Microsoft Teams video provider
- 10 i18n languages
- New UI components (color-picker, resizable, tooltip)

### 9 December 2025: Studio Tier - LiveKit Classroom

**Completed Tasks**:

1. **LiveKit Server-Side Integration**
   - Created `/lib/livekit.ts` with token generation utilities
   - Created `/app/api/livekit/token/route.ts` for secure token generation
   - Validates booking participation and Studio tier access

2. **Classroom Video Room Page**
   - Created `/app/(dashboard)/classroom/[bookingId]/page.tsx`
   - Installed `@livekit/components-react` and `@livekit/components-styles`
   - Full VideoConference UI with loading and error states
   - Error handling for 401/403/404 scenarios
   - Tier-based access control with upgrade CTA

3. **Database Updates**
   - Added `tier` column to profiles table (enum: 'standard', 'studio')
   - Added `egress_id` column to bookings for recording tracking

4. **Environment Configuration**
   - Configured LiveKit credentials
   - Configured S3 storage for recordings

**Status**: Working and verified. Video conferencing connects successfully.

---

*Last updated: 12 December 2025*
