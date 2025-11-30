# TutorLingua Platform Documentation

## 1. PROJECT OVERVIEW

### What is TutorLingua?

TutorLingua is a comprehensive business management platform built specifically for independent language tutors. It serves as the "operating system" for tutors who want to own their repeat business while still using marketplaces like Preply, iTalki, and Verbling for student discovery.

### Core Value Proposition

- **Own Your Repeat Business**: Get discovered on marketplaces (Preply, iTalki), book students directly through your own branded channels, and keep 100% of direct booking revenue
- **All-in-One Platform**: Replace 10+ scattered tools (Calendly, Beacons, spreadsheets, payment processors) with one integrated system
- **Zero Platform Fees**: 0% commission on direct bookings through TutorLingua
- **Quick Setup**: Most tutors are ready in 10 minutes

### Target Users

**Primary Users (Tutors)**:
- Independent language tutors seeking to build their own business
- Tutors currently using marketplaces who want to reduce commission costs
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
- next-intl for internationalization (English & Spanish)

**Backend**:
- Next.js Server Actions ("use server")
- Supabase (PostgreSQL + Auth + Storage + RLS)
- Stripe for payments & Stripe Connect for marketplace model
- Resend for email delivery

**Key Libraries**:
- @supabase/ssr for server-side auth
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
│   │   └── upgrade/             # Subscription upgrade
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
│   ├── ui/                      # shadcn/ui components
│   └── ...
├── lib/                         # Business logic & utilities
│   ├── actions/                 # Server actions (30+ modules)
│   ├── supabase/                # Supabase clients
│   ├── stripe.ts                # Stripe utilities
│   ├── calendar/                # Calendar integrations
│   ├── emails/                  # Email templates
│   ├── validators/              # Zod schemas
│   ├── types/                   # TypeScript types
│   ├── constants/               # Constants & config
│   ├── repositories/            # Data access layer
│   ├── services/                # Business services
│   ├── payments/                # Payment processing
│   ├── pricing/                 # Pricing calculations
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

2. **students**
   - Student records managed by tutors
   - Contact info, learning goals, proficiency level
   - Access control (pending/approved/denied/suspended)
   - Email preferences, timezone
   - Source tracking (booking_page, import, manual)

3. **bookings**
   - Scheduled lessons between tutors and students
   - Service reference, datetime, duration, timezone
   - Payment status (paid/unpaid), amount, currency
   - Meeting URL and provider info
   - Status (pending/confirmed/cancelled/completed)

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

13. **conversation_messages**
    - Individual messages in threads
    - Sender role (tutor/student/system)
    - Read status tracking
    - Attachments (JSONB)

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
- `updateVideoSettings(data)` - Video conferencing (Zoom, Google Meet, Calendly, custom)

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
4. Chooses payment option (session package or direct payment)
5. `createBookingAndCheckout()` server action:
   - Validates service pricing
   - Checks availability conflicts
   - Creates or updates student record
   - Creates booking (pending or confirmed)
   - If package: redeems minutes, confirms booking
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
- `cancelBooking()` - Cancels booking, refunds package minutes
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

**What it does**: Direct messaging between tutors and students within the platform.

**Where the code lives**:
- Tutor: `/app/(dashboard)/messages/page.tsx`
- Student: `/app/student-auth/messages/page.tsx`
- Actions: `/lib/actions/messaging.ts`
- Components: `/components/messaging/message-composer.tsx`

**How it works**:
1. Conversation thread created per tutor-student pair
2. Either party sends message → saved to `conversation_messages`
3. Updates `conversation_threads.last_message_preview`
4. Tracks unread status per user
5. Messages support attachments (JSONB field)

**Key actions**:
- `sendThreadMessage(formData)` - Sends message
- `getUnreadMessageCount()` - Badge count for UI

---

### Feature: Student Management

**What it does**: Full student CRM with notes, lesson history, and access control.

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

**Key actions**:
- `getTutorSiteData()` - Fetches site data
- `updateTutorSite()` - Saves site changes
- `publishTutorSite()` - Publishes draft
- `addTutorSiteReview()` - Adds testimonial

---

## 4. API ROUTES

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

---

## 5. AUTHENTICATION & AUTHORIZATION

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
]
```

**Onboarding Gate**:
- Incomplete onboarding → redirect to `/onboarding`
- Checks `profiles.onboarding_completed` field

**Plan Tier Gates**:
- Growth routes: `/ai`, `/analytics`, `/marketing`
- Studio routes: `/group-sessions`, `/marketplace`, `/ceo`
- Redirects to `/upgrade?plan={required_plan}`

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

## 6. INTEGRATIONS

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

**Scopes**: `https://www.googleapis.com/auth/calendar`

**Provider**: Google OAuth 2.0

**Flow**: Authorization code grant with refresh tokens (popup-based)

**Features**:
- Fetches events with titles (not just busy times)
- Displays in calendar with color coding
- Prevents double-booking
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

---

## 7. KEY SERVER ACTIONS

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

---

## 8. COMPONENT LIBRARY

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
- Step components: Theme, Layout, Content, Pages

**Student Portal** (`/components/student-auth/`):
- `StudentLoginForm` - Student authentication
- `StudentSignupForm` - Student registration
- `StudentPortalLayout` - Portal layout wrapper
- `StudentCalendar` - Student's booking calendar
- `TutorSearch` - Search and discover tutors
- `StudentConnectButton` - Request tutor connection
- `StudentBookingForm` - Book lessons
- `ConnectionRequestModal` - Connection request UI

**Admin** (`/components/admin/`):
- Admin dashboard components for platform management

---

## 9. ENVIRONMENT VARIABLES

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

# AI Features (Growth Plan)
OPENAI_API_KEY=sk-...
```

---

## 10. DEVELOPMENT

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

- Supports English (`en`) and Spanish (`es`)
- Uses `next-intl` for translations
- Landing page copy in `/lib/constants/landing-copy.ts`

### SEO Blog Content

Located in `/docs/blog/`:
- 80+ SEO-optimized articles in English and Spanish
- 7 topic clusters: Commissions, Tools, Business, Retention, Marketing, Specializations, Operations
- Blog utilities in `/lib/blog.ts`
- Public routes: `/blog/[slug]`, `/es/blog/[slug]`

### Feature Flags & Plans

**Plans**:
- **Professional** (free): 20 students, core features
- **Growth** ($29/mo): Unlimited students, website, analytics, marketing tools
- **Studio** (TBD): Group sessions, marketplace, advanced features

### Testing

- **Unit tests**: Node test runner in `/tests/`
- **E2E tests**: Playwright in `/e2e/`
- **Accessibility**: @axe-core/playwright integration

---

This documentation covers all **working, functional features** in the TutorLingua platform as of the current codebase state.

*Last updated: November 2024*
