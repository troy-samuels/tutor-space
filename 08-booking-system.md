# 08 - Booking System

## Objective

Build the scheduling engine that powers service bookings: availability management, time zone handling, conflict detection, package redemption, calendar sync hooks, and student confirmation flow. This is the heart of the Professional Plan and unlocks Growth (lead conversions) and Studio (group sessions later).

## Prerequisites

- ✅ **06-service-listings.md** — Services defined with duration, buffer rules  
- ✅ **07-stripe-integration.md** — Payment flows ready for paid bookings  
- ✅ **01-database-schema.md** — `bookings`, `availability`, `session_package_redemptions` tables  
- ✅ **02-authentication.md** — Auth + entitlements for plan gating  
- Optional: seed availability slots for testing

## Deliverables

- Availability management UI (recurring schedule + overrides)  
- Booking creation flow (student selects slot, pays via Stripe, receives confirmation)  
- “Book a Lesson” funnel from public profile → slot selection → payment → confirmation  
- Tutor dashboard for upcoming, past, and cancelled sessions  
- Package redemption engine (decrement minutes/credits)  
- Time zone-aware displays for tutor vs. student  
- Hooks for calendar sync (Google/Outlook) and Zoom integration (future steps)

## Implementation Steps

### Step 1: Availability Management

Create `/app/(dashboard)/availability/page.tsx` allowing tutors to define recurring slots.

#### Data Model Recap
`availability` table (from schema) stores day of week, start/end times, type (recurring/specific), timezone, buffer.

#### UI Components
- Week grid with time selectors (use library like `@schedule-x/react` or custom).  
- Switch between recurring weekly schedule vs. specific date overrides.  
- Allow blocking out dates (vacation).  
- Save to Supabase via server actions (`createAvailability`, `deleteAvailability`).

```tsx
// components/availability/availability-grid.tsx
'use client'

import { useState } from 'react'
import { AvailabilitySlot } from './types'
import { saveAvailability } from '@/lib/actions/availability'
import { toast } from 'sonner'

export function AvailabilityGrid({ initialSlots }: { initialSlots: AvailabilitySlot[] }) {
  const [slots, setSlots] = useState(initialSlots)

  async function handleSave(updatedSlots: AvailabilitySlot[]) {
    const { error } = await saveAvailability(updatedSlots)
    if (error) {
      toast.error(error)
      return
    }
    toast.success('Availability updated')
  }

  return (
    <div>
      {/* grid UI showing days and time segments */}
      <button onClick={() => handleSave(slots)} className="btn-primary">
        Save changes
      </button>
    </div>
  )
}
```

> Use 15-minute increments; store in UTC but respect tutor timezone preference.

### Step 2: Generate Time Slots

- Create utility to generate upcoming slots for next 60 days based on availability + service duration + buffer.  
- Consider storing precomputed slots in cache (Redis) for performance later.  
- Function signature: `generateSlots({ tutorId, serviceId, startDate, endDate, timezone })` returns array of slot objects (start/end in ISO).

### Step 3: Student Booking Flow

1. Student selects service from public profile or link-in-bio.  
2. Server component fetches available slots using generator.  
3. Student chooses slot → create `draft` booking record with status `pending_payment`.  
4. Redirect to Stripe checkout (from 07) with metadata `booking_id`.  
5. Webhook updates booking to `confirmed` on success.

Wrap these steps inside a cohesive “Book a Lesson” funnel component that includes: hero copy, availability selector, payment CTA, trust badges/testimonials, and WhatsApp fallback. Track funnel progress with PostHog events so conversion (profile → booking) can be measured.

#### Booking API Route

`/app/api/bookings/create/route.ts`:

```ts
export async function POST(req: Request) {
  const { serviceId, slotStart, slotEnd, studentInfo, packageId } = await req.json()

  // Validate slot availability (no overlapping bookings)
  const conflict = await supabase
    .from('bookings')
    .select('id')
    .eq('service_id', serviceId)
    .eq('status', 'confirmed')
    .overlaps('scheduled_at', [slotStart, slotEnd]) // or use BETWEEN

  if (conflict.error || conflict.data?.length) {
    return NextResponse.json({ error: 'Slot no longer available' }, { status: 409 })
  }

  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      service_id: serviceId,
      tutor_id: tutorId,
      student_id: studentInfo?.studentId ?? null,
      scheduled_at: slotStart,
      duration_minutes,
      status: packageId ? 'pending_confirmation' : 'pending_payment',
      metadata: { timezone: studentInfo?.timezone },
    })
    .select()
    .single()

  // If package provided and has remaining minutes, skip payment and mark confirmed

  return NextResponse.json({ booking })
}
```

> Use Supabase RLS to ensure tutors only see their bookings; students must be authorized.

### Step 4: Package Redemption

- When booking is confirmed, decrement `session_package_purchases.remaining_minutes`.  
- Create entry in `session_package_redemptions` linking booking to purchase.  
- If remaining minutes < required, fallback to payment.  
- Allow tutors to manually adjust via dashboard (admin UI).

### Step 5: Booking Confirmation Workflow

- After Stripe webhook marks booking as paid, send confirmation email (handled in **11-email-system.md**) and update status to `confirmed`.  
- If package redemption, mark as `confirmed` immediately and optionally send invoice (zero dollar).

### Step 6: Tutor Dashboard Views

Create `/app/(dashboard)/bookings/page.tsx` to list upcoming bookings, with filters:
- Tabs: Upcoming, Pending, Past, Cancelled  
- Card view showing student info, join link (Zoom), reschedule/cancel buttons  
- Display package info (remaining minutes) if applicable.

### Step 7: Student Portal

- If students have accounts, provide `/app/(student)/bookings` to view upcoming sessions.  
- Non-authenticated students receive unique confirmation link to reschedule/cancel (signed token).

### Step 8: Rescheduling & Cancellation

- Allow students to reschedule up to X hours before session (config).  
- Adjust booking record and notify tutor.  
- If paid via Stripe, create coupon/credit or reuse package minutes.  
- For cancellations, set status `cancelled`, refund or return minutes.

### Step 9: Time Zone Handling

- Store availability/booking times in UTC.  
- Display times using `date-fns-tz` or `luxon` with tutor vs. student local time.  
- Provide toggle for tutor to view in either timezone.  
- Ensure Daylight Saving transitions handled correctly (generate slots using moment/timezone aware library).

### Step 10: Calendar Sync Hooks

- Outline integration for Google Calendar (future file) but set up placeholders:  
  - On booking confirmation, insert event into `calendar_events` table.  
  - When calendar integration active, push to Google/Outlook.  
  - Provide ICS download link as fallback.

### Step 11: Zoom/Video Integration Hook

- After booking confirmed, call Zoom API (covered in **10-zoom-integration.md**).  
- Store meeting link in `bookings.meeting_url`.  
- Display join button in dashboard and student confirmations.

### Step 12: Reminder & Follow-up

- Trigger reminder jobs 24h & 1h before session (using Resend/cron).  
- After session ends, automatically create `lesson_notes` entry (empty) and send review request (Growth plan).

### Step 13: Analytics & Reporting

- Log booking funnel events: `booking_view`, `booking_started`, `booking_completed`.  
- Connect to analytics dashboard (12) for conversion metrics.  
- Track no-shows by marking `status = 'no_show'` in post-session workflow.

### Step 14: Growth & Studio Considerations

- Growth plan: integrate lead capture flow so new leads can book trial sessions; auto-tag in `leads` table.  
- Studio plan: allow multi-student bookings for group classes, linking to `group_sessions`.  
- Offer upsell messages in booking flow (e.g., “Upgrade to Growth for promo codes”).

### Step 15: Accessibility & Responsiveness

- Booking grid must be navigable by keyboard (arrow keys).  
- Provide `aria-live` updates when slots selected/unavailable.  
- Ensure mobile view shows vertical list of slots with clear times.  
- Add skeleton states while fetching availability.

## Testing Checklist

- [ ] Tutor can define recurring availability and override specific dates.  
- [ ] Service duration + buffer generate correct slots with no overlaps.  
- [ ] Student can select slot, pay (Stripe) or redeem package, and booking becomes `confirmed`.  
- [ ] “Book a Lesson” funnel events fire (`booking_view`, `booking_started`, `booking_completed`) for analytics reporting.  
- [ ] Package minutes decrement correctly and prevent over-redemption.  
- [ ] Rescheduling updates booking and frees old slot.  
- [ ] Cancellation updates status and handles refunds/package restore.  
- [ ] Timezone display accurate for tutor and student (DST changes tested).  
- [ ] Dashboard lists upcoming/past bookings with correct filtering.  
- [ ] Reminders scheduled and ICS/Zoom hooks prepared for next steps.

## AI Tool Prompts

### Availability Builder
```
Create a React component for managing weekly availability with 30-minute slots.
Features: select multiple slots per day, copy/paste day schedule, save via server action.
Use shadcn/ui and Tailwind.
```

### Slot Generator Utility
```
Write a TypeScript function that takes availability rules and returns available time slots for a service.
Inputs: tutorId, service duration, buffer, startDate, endDate.
Check for existing bookings to avoid conflicts.
```

### Booking Workflow
```
Implement a booking flow that:
1. Creates a pending booking in Supabase
2. Redirects to Stripe Checkout
3. On webhook success, marks booking confirmed and sends confirmation email
Use Next.js App Router and Supabase server actions.
```

## Common Gotchas

- **Race conditions**: Two students attempting same slot simultaneously—wrap booking creation in transaction or use `select ... FOR UPDATE`.  
- **Buffer enforcement**: Ensure buffer applies both before and after session when generating slots.  
- **Time zone mismatches**: Always convert to tutor timezone when storing recurring availability; convert to student timezone for display.  
- **Package expiry**: Check `expires_at` before redeeming.  
- **Cancellation policies**: Outline refund logic (e.g., 24-hour cutoff) and enforce before refunding.

## Next Steps

1. Integrate Zoom (`10-zoom-integration.md`) and email reminders (`11-email-system.md`).  
2. Build analytics tracking (`12-analytics-tracking.md`) using booking events.  
3. Implement student CRM enhancements (`09-student-crm.md`) to view booking history.  
4. Extend to group sessions in **26-group-sessions.md**.

## Success Criteria

✅ Tutors can publish availability and accept bookings without conflicts  
✅ Payments (or packages) confirm bookings and update records automatically  
✅ Both tutor and student see accurate time zones and session details  
✅ Booking data feeds reminders, lesson notes, and analytics pipelines  
✅ Zoom/meeting links auto-generate and attach to confirmed bookings  
✅ System ready to extend with calendar sync, Zoom, and group sessions

**Estimated Time**: 6-8 hours
