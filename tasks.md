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

---

## UX Overhaul: Calendar/Availability + Booking Friction (NEW)

### Goal
Consolidate the fragmented calendar/availability/booking experience into a unified, frictionless workflow for Pro tier tutors. **Core insight: experienced tutors want one place to see their schedule and make quick changes, not three separate pages.**

### Priority Focus
- **Primary**: Calendar/availability confusion + Booking workflow friction
- **Tier**: Pro tier (broader audience)
- **Approach**: Phased rollout (quick wins first)

---

### Phase 1: Quick Wins (Week 1-2)

#### 1.1 Visualize Availability in Calendar Week View
**Problem**: Tutors can't see their "bookable windows" when looking at their calendar.

**Solution**: Show recurring availability as semi-transparent green background zones in the week view.

**Files to modify**:
- `/components/dashboard/calendar-week-view.tsx` - Add availability zone rendering
- `/app/(dashboard)/calendar/page.tsx` - Fetch availability data
- `/components/dashboard/calendar-page-client.tsx` - Pass availability to week view

#### 1.2 Add "Edit Availability" Quick Link
**Problem**: Tutors navigate away from calendar to edit availability.

**Solution**: Add gear icon that opens a slide-over drawer with the availability editor.

**Files to modify**:
- `/components/dashboard/calendar-page-client.tsx` - Add gear button
- **New**: `/components/dashboard/availability-drawer.tsx` - Compact availability editor in drawer

#### 1.3 Enhance Quick Booking Modal
**Problem**: 3-step wizard is slow for repeat bookings.

**Solution**: Add "Quick mode" toggle that shows all fields in one scrollable form.

**Files to modify**:
- `/components/dashboard/calendar-booking-modal.tsx` - Add quick mode toggle
  - Single form with Service, Student, Date/Time, Payment visible
  - Recent students as quick-select chips
  - Auto-select most-used service
  - Preference saved in localStorage

#### 1.4 Add Calendar Sync Status
**Problem**: Tutors don't know if their Google/Outlook calendar is connected.

**Solution**: Add connection status indicator with link to settings.

**Files to modify**:
- `/components/dashboard/calendar-page-client.tsx` - Add "Connect calendars" button with green dot status

---

### Phase 2: Availability Integration (Week 3-4)

#### 2.1 Inline Availability Editing
**Problem**: Editing availability requires navigating to a separate page.

**Solution**: Click availability zones directly in week view to edit them.

**Files to modify**:
- `/components/dashboard/calendar-week-view.tsx` - Click handler for availability zones
- **New**: `/components/dashboard/availability-inline-editor.tsx` - Popover for quick edits

#### 2.2 Quick Availability Override
**Problem**: Tutors want to mark specific times unavailable without changing their weekly pattern.

**Solution**: Add "Set unavailable (one-time)" option in slot actions.

**Files to modify**:
- `/components/dashboard/slot-quick-actions.tsx` - Add one-time override options
- `/lib/actions/availability.ts` - Add `createOneTimeException()` action

#### 2.3 Merge Availability Tab into Calendar
**Problem**: Availability and Calendar are separate nav items causing confusion.

**Solution**: Add "Availability" as third view tab in calendar (alongside Month/Week).

**Files to modify**:
- `/components/dashboard/calendar-page-client.tsx` - Add Availability tab
- `/components/dashboard/nav-config.ts` - Redirect `/availability` to `/calendar?tab=availability`

---

### Phase 3: Unified Booking Experience (Week 5-6)

#### 3.1 Single-Page Booking Form
**Problem**: Power users find the wizard slow.

**Solution**: Optional single-page form with all fields visible.

**Files to create**:
- **New**: `/components/booking/quick-booking-form.tsx` - All-in-one booking form
  - Progressive disclosure for new student section
  - Remembers last-used student and service
  - Keyboard shortcuts (Tab through, Enter to submit)

#### 3.2 Calendar-First Booking Flow
**Problem**: Most bookings should start from clicking a calendar slot.

**Solution**: Clicking empty slot opens pre-filled booking modal.

**Files to modify**:
- `/components/dashboard/calendar-booking-modal.tsx`
  - Pre-select time from clicked slot
  - Default to most recent student (configurable)
  - Default to most-used service
  - Single "Book" button for repeat bookings

#### 3.3 Simplify Bookings Page
**Problem**: Bookings page duplicates calendar functionality.

**Solution**: Bookings page becomes read-only list; creation happens from calendar.

**Files to modify**:
- `/app/(dashboard)/bookings/page.tsx` - Remove "New Lesson" button
- `/components/bookings/booking-dashboard.tsx` - Simplify to list-only view
  - Keep: Today's lessons, Upcoming/Past lists, Mark as paid
  - Remove: Creation modal and form states

---

### Phase 4: Polish (Week 7-8)

#### 4.1 Framer Motion Transitions
- Smooth view switching animations
- Drawer open/close animations
- Subtle hover effects on calendar slots

#### 4.2 Mobile Optimizations
- Default to day view on mobile
- Bottom sheet for quick actions (not popover)
- Larger touch targets

#### 4.3 Keyboard Shortcuts
**New**: `/lib/hooks/useCalendarShortcuts.ts`
- `N` = New booking
- `B` = Block time
- `A` = Edit availability
- `T` = Jump to today

---

### Critical Files Summary

| File | Changes |
|------|---------|
| `/components/dashboard/calendar-page-client.tsx` | Major - availability viz, tabs, quick links |
| `/components/dashboard/calendar-week-view.tsx` | Major - availability zones, click handling |
| `/components/dashboard/calendar-booking-modal.tsx` | Medium - quick mode, better defaults |
| `/components/dashboard/slot-quick-actions.tsx` | Medium - more action options |
| `/components/bookings/booking-dashboard.tsx` | Medium - simplify to list-only |
| `/lib/actions/availability.ts` | Small - add partial update, exceptions |
| `/components/dashboard/nav-config.ts` | Small - redirect availability |

### New Components to Create

1. `/components/dashboard/availability-drawer.tsx` - Slideover availability editor
2. `/components/dashboard/availability-inline-editor.tsx` - Popover for inline edits
3. `/components/booking/quick-booking-form.tsx` - Single-page booking form
4. `/lib/hooks/useCalendarShortcuts.ts` - Keyboard shortcuts

---

### Verification Plan

**After Each Phase**:
1. Manual testing: Walk through tutor booking flow end-to-end
2. Existing tests: Run `npm test` to ensure no regressions
3. Browser testing: Test in Chrome, Safari, Firefox
4. Mobile testing: Test on iOS Safari, Android Chrome

**Key User Journeys to Test**:
1. Click calendar slot → Quick book → Verify booking created
2. Open availability drawer → Add slot → Verify visible in week view
3. Create booking from calendar → Mark as paid from bookings page
4. Block time from calendar → Verify conflict prevents booking

---

### Success Metrics
- **Time to create booking**: 50% reduction (target: ~20s from ~45s)
- **Page navigations for booking**: 60% reduction
- **Support tickets about calendar/availability**: 40% reduction
