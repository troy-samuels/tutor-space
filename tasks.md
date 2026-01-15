# TutorLingua Change Plan (Draft Tasks)

## Engineering principles (10x checklist)
- Preserve data integrity: validate on both client and server; never trust UI-only checks.
- Minimize UX friction: reduce steps, keep actions discoverable, prevent dead-ends.
- Backward compatible storage: add fields to JSON config before schema changes; migrate safely.
- Consistent copy and affordances: shared language across pages; one naming standard.
- Observability and auditing: keep existing audit logging intact for auth and student updates.

## User stories
1) As a tutor, I can log in with either email or username, and I see a subtle success indicator instead of a disruptive wizard.
2) As a tutor, my browser correctly remembers my login credentials without pulling stale sessions.
3) As a tutor, I can share my booking page or a specific service link from the dashboard with quick copy/share icons.
4) As a tutor, my dashboard focuses on action items (no embedded calendar) and recent activity links me to CRM or bookings.
5) As a tutor, I can manage bookings with less friction, avoid conflicts, and scroll within upcoming/past lists.
6) As a tutor, I can create a one-to-one service in a single step without a progress bar or max-students field.
7) As a tutor, I can edit a student profile directly in the CRM side panel, and risk indicators are removed.
8) As a tutor, I can set my location and years of experience for my public page and preview, without a signature block.
9) As a tutor, I see a Studio/Pro badge color that matches the product theme.
10) As a tutor, I can contact support via chat or a simple message flow that admins can respond to.

## Tasks (with file/area mappings + acceptance criteria)

### 5) Student CRM: editable side panel, remove risk indicators
Files/Areas:
- `app/components/students/add-students-panel.tsx`
- `app/components/students/StudentDetailView.tsx`
- `app/components/students/StudentDetailsTab.tsx`
- `app/lib/actions/students/update.ts`
- `app/lib/repositories/students.ts`
- `app/app/(dashboard)/students/[studentId]/page.tsx`

Work:
- Add an editable student profile section in the side panel (contact info, goals, notes, status).
- Implement update action for student fields (use repository update).
- Remove risk indicator UI (risk status badge, risk icons in list).

Acceptance criteria:
- Tutor can view and edit full student details from the CRM side panel.
- Risk badges/icons are not displayed anywhere in CRM UI.

Edge cases:
- Partial student data; validation for required email/full name.
- Concurrent edits (optimistic update or refresh).

Tests:
- Unit: update action validates and persists student fields.
- E2E: edit student details in side panel and see updates.

### 6) Pages: add location + years of experience, remove signature text
Files/Areas:
- `app/app/(dashboard)/pages/editor/studio-editor-client.tsx`
- `app/lib/types/site.ts`
- `app/lib/site/site-config.ts`
- `app/lib/actions/tutor-sites/site-config.ts`
- `app/lib/actions/tutor-sites/public.ts`
- `app/app/(public)/[username]/page.tsx`
- `app/app/(public)/[username]/public-profile-client.tsx`

Work:
- Extend site config to include `location` and `years_experience` (or similar).
- Add editable inputs in the /pages editor and surface in preview chips.
- Render location and years of experience on public profile.
- Remove signature-name block from preview and public profile footer.

Acceptance criteria:
- Location and years of experience are editable in /pages and visible in preview.
- Public profile displays location and years of experience when provided.
- Signature text block with name is removed from preview and public profile.

Edge cases:
- Empty values hide chips gracefully.
- Existing site configs remain valid without migration errors.

Tests:
- Unit: normalizeSiteConfig handles new fields.
- E2E: update location/experience, publish, verify public page.

### 7) Top-right Studio/Pro badge color
Files/Areas:
- `app/components/dashboard/header.tsx`

Work:
- Update badge colors to align with theme (use primary/secondary tokens rather than purple/blue).

Acceptance criteria:
- Studio/Pro badge colors match product theme across light backgrounds.

Tests:
- Visual: check dropdown badge contrast and consistency.

### 8) Help/Support: operational chat or message flow
Files/Areas:
- `app/app/(public)/help/page.tsx`
- `app/app/(public)/contact/page.tsx`
- `app/app/api/support/route.ts`
- `supabase/migrations/20251128100000_create_support_tickets.sql`
- (New) `app/app/(dashboard)/support/page.tsx` and admin view `app/app/admin/support/page.tsx` if needed

Work:
- Add a tutor-facing support UI (chat or ticket form) that posts to `/api/support`.
- Allow follow-up messages or status visibility (may require new support message table).
- Provide an admin-facing support inbox view to respond and update status.

Acceptance criteria:
- Tutor can submit support requests in-app (not just mailto).
- Support requests are visible to admins and can be responded to.

Edge cases:
- Unauthorized users cannot submit tickets.
- Support form handles offline or error states gracefully.

Tests:
- Unit: support API rejects invalid payloads.
- E2E: submit ticket and verify it appears in admin view.

## Comprehensive acceptance tests (Gherkin-style)
1) Auth login with username
   - Given a tutor has a username and password
   - When they log in using the username
   - Then they are redirected to the dashboard and see a subtle success indicator

2) Autofill integrity
   - Given a tutor previously logged in with email/password
   - When they revisit the login page
   - Then the browser autofill suggests the correct credentials

3) Password recovery flow
   - Given a tutor requests a password reset
   - When they use the reset link and set a new password
   - Then they can log in with the new password and old password fails

4) Dashboard share dropdown
   - Given a tutor has at least one service
   - When they open the booking link dropdown
   - Then they can copy/share the full booking page and a specific service link

5) Recent activity routing
   - Given a new student and a new booking appear in recent activity
   - When the tutor clicks each entry
   - Then they are routed to CRM student detail and bookings page respectively

6) Booking conflict blocking
   - Given a tutor selects a time that conflicts with existing bookings
   - When they attempt to continue
   - Then the booking flow blocks progression with a clear message

7) Services single-step form
   - Given a tutor creates a new service
   - When they fill in required fields
   - Then the service saves without step navigation or max-students input

8) CRM editing
   - Given a tutor opens a student detail side panel
   - When they edit contact info and notes
   - Then the updates persist and are visible on reload

9) Pages location/experience
   - Given a tutor adds location and years in /pages
   - When they publish the site
   - Then the public page shows those values and no signature block

10) Support request
   - Given a tutor submits a support message
   - When an admin opens the support inbox
   - Then the ticket is visible with the submitted details

### 9) Refactoring: Split large components and extract hooks
Files/Areas:
- `app/components/dashboard/calendar-page-client.tsx`
- `app/components/bookings/booking-dashboard.tsx`
- `app/app/api/stripe/webhook/route.ts`
- `app/lib/analysis/student-speech-analyzer.ts`
- `app/lib/analysis/tutor-speech-analyzer.ts`

Work:
- Split `CalendarPageClient` (636 lines) by extracting:
  - `useCalendarEvent` hook (event selection, popover state)
  - `useCalendarSlot` hook (quick actions, slot selection)
  - `useSidebarData` hook (daily lessons, external events)
  - Use `useReducer` for related calendar state (13+ useState calls)
- Split `BookingDashboard` (1192 lines) by extracting:
  - `useBookingForm` hook (form state, selected service/student)
  - `useBookingSlots` hook (day/time options, slot selection)
  - `useBookingList` hook (bookings, today's lessons, filtering)
- Split `handleCheckoutSessionCompleted()` (~480 lines) into:
  - `handleLifetimePurchase()`
  - `handleDigitalProductCheckout()`
  - `handleBookingPayment()`
  - `handleSignupCheckout()`
- Consolidate speech analyzers by creating `SpeechAnalyzerBase` abstract class with shared logic (filler words, truncation, prompt building)

Acceptance criteria:
- `calendar-page-client.tsx` reduced from 636 to ~400 lines
- `booking-dashboard.tsx` reduced from 1192 to ~500 lines
- Stripe webhook handler has focused functions under 100 lines each
- Speech analyzers share common base class with ~200 lines of shared logic
- All existing functionality preserved; tests pass

Edge cases:
- Ensure hook dependencies don't cause unnecessary re-renders
- State updates remain atomic when split across hooks
- Error handling maintained in extracted functions

Tests:
- Existing tests continue to pass after refactoring
- Type checking passes: `npm run typecheck`
- Build succeeds: `npm run build`

### 10) Refactoring: Extract shared UI components and hooks
Files/Areas:
- `app/components/dashboard/event-details-popover.tsx`
- `app/components/dashboard/slot-quick-actions.tsx`
- `app/components/dashboard/calendar-week-view.tsx`
- `app/components/dashboard/calendar-page-client.tsx`
- `app/components/dashboard/quick-block-dialog.tsx`
- `app/components/dashboard/calendar-booking-modal.tsx`
- `app/components/services/service-dashboard.tsx`
- `app/components/bookings/booking-dashboard.tsx`
- `app/components/students/StudentDetailsTab.tsx`
- `app/app/(public)/[username]/public-profile-client.tsx`

Work:
- Create `usePopoverPosition()` hook for viewport boundary adjustment (used by event-details-popover, slot-quick-actions)
- Create `usePopoverClose()` hook for click-outside and escape key handling
- Create `FeedbackBanner` component for success/error messages (used by calendar-week-view, event-details-popover, calendar-page-client)
- Create `StatusAlert` component for form status messages (used by service-dashboard, booking-dashboard, StudentDetailsTab)
- Create `/lib/utils/time-calculations.ts` with:
  - `calculateEndTime(startTime: string, durationMinutes: number): string`
  - `parseTimeString(timeStr: string): { hour: number; minute: number }`
- Create `/lib/utils/timezone-formatting.ts` with:
  - `formatTimeInTimezone(date: Date, timezone: string, format?: string): string`
  - `formatSecondaryTimezone(baseDate, baseTimezone, targetTimezone): string`
- Extract shared `CTAContent` component from `public-profile-client.tsx` to consolidate Desktop/Mobile CTAs (80+ lines duplicated)

Acceptance criteria:
- Popover positioning logic consolidated in single hook
- Popover close logic (click-outside, escape) consolidated in single hook
- Feedback/status UI consistent across all components
- Time calculations use shared utilities
- Public profile CTAs share common content component
- ~250 lines of duplication eliminated

Edge cases:
- Popover positioning handles edge of viewport correctly
- Time calculations handle timezone edge cases
- Components degrade gracefully if hooks fail

Tests:
- Unit tests for time calculation utilities
- Existing component tests continue to pass
- Visual regression check for feedback/status components

### 11) Refactoring: Quick wins and cleanup
Files/Areas:
- `app/components/dashboard/event-details-popover.tsx`
- `app/components/dashboard/header.tsx`
- `app/components/services/service-dashboard.tsx`
- `app/app/api/admin/retry-transcriptions/route.ts`
- `app/app/api/webhooks/livekit/route.ts`
- `app/lib/repositories/recordings.ts`
- `app/lib/storage/signed-urls.ts` (new)

Work:
- Remove unused `isConflict` prop from `event-details-popover.tsx` (declared but never passed)
- Reduce over-memoization in `header.tsx`: consolidate 9 useMemo declarations into single memoized object
- Review and clean unused `profileUsername` prop usage in `service-dashboard.tsx`
- Extract `updateRecordingStatus()` helper in `/lib/repositories/recordings.ts`:
  - Consolidates 6 repeated update patterns across retry-transcriptions and livekit webhooks
- Create `/lib/storage/signed-urls.ts` with `getSignedUrl()` helper:
  - Consolidates identical signed URL creation logic from 2 files

Acceptance criteria:
- No unused props in popover components
- Header component has cleaner memoization (1-2 useMemo vs 9)
- Recording status updates use single repository function
- Signed URL creation uses shared utility
- ~50 lines of duplication eliminated

Edge cases:
- Ensure memoization consolidation doesn't break render performance
- Recording status updates handle all existing status values

Tests:
- Type checking confirms no unused variables
- Existing tests pass
- Build succeeds
