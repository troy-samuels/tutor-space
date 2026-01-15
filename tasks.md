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
7) As a tutor, I can set my location and years of experience for my public page and preview, without a signature block.

## Tasks (with file/area mappings + acceptance criteria)

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

8) Pages location/experience
   - Given a tutor adds location and years in /pages
   - When they publish the site
   - Then the public page shows those values and no signature block

### 7) Refactoring: Split large components and extract hooks
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

### 8) Refactoring: Extract shared UI components and hooks
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
