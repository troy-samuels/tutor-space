# 11 - Email & Messaging System

## Objective

Deliver transactional and marketing communications that drive conversion, retention, and parent trust: booking confirmations, reminders, follow-ups, lead nurture sequences, and automated parent updates. Includes email (+ optional SMS/WhatsApp handoff) with templating and analytics.

## Prerequisites

- ✅ **07-stripe-integration.md** — Payments confirm before sending receipts  
- ✅ **08-booking-system.md** — Booking events trigger messaging  
- ✅ **05-link-in-bio.md** / **09-student-crm.md** — Leads and students feed messaging lists  
- ✅ Resend (or other email provider) configured, environment keys set (`RESEND_API_KEY`)  
- Optional: Twilio or WhatsApp Business API for SMS/DM follow-up (Growth)

## Deliverables

- Messaging service abstraction (email + optional SMS/WhatsApp)  
- Transactional templates (Resend + React Email) for booking lifecycle, receipts, parent updates  
- Lead nurture automation (Growth plan) with scheduled cadences  
- Daily digest emails for tutors (tasks, upcoming lessons, leads needing response)  
- Parent feedback & testimonial request emails  
- Unsubscribe/preferences center for marketing messages  
- Messaging analytics (open/click rates) feeding Goal metrics

## Implementation Steps

### Step 1: Email Provider Setup

- Use Resend with React Email templates; alternative providers (Postmark, SendGrid) possible later.  
- Configure domain DKIM/SPF for tutorlingua.com to improve deliverability.  
- Store `RESEND_API_KEY` in env, add `RESEND_FROM_EMAIL` (e.g., `hello@tutorlingua.com`).  
- For tutor-specific sender names, set `from: "TutorLingua for {Tutor Name} <lessons@tutorlingua.com>"`.

### Step 2: Messaging Utility

```ts
// lib/messaging/email.ts
import { Resend } from 'resend'
import BookingConfirmationEmail from '@/emails/booking-confirmation'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function sendBookingConfirmationEmail({
  to,
  booking,
  service,
  zoomLink,
  parentRecipients = [],
}: {
  to: string
  booking: BookingWithRelations
  service: Service
  zoomLink: string
  parentRecipients?: string[]
}) {
  await resend.emails.send({
    from: `TutorLingua <${process.env.RESEND_FROM_EMAIL}>`,
    to: [to, ...parentRecipients],
    subject: `You're booked! ${service.name} on ${formatDate(booking.scheduled_at)}`,
    react: (
      <BookingConfirmationEmail
        booking={booking}
        service={service}
        zoomLink={zoomLink}
      />
    ),
  })
}
```

Reuse helper for other templates (reminders, cancellations, receipts, parent updates).

### Step 3: Template Library

Create `/emails` directory with React Email templates:

- `booking-confirmation.tsx`  
- `booking-reminder.tsx` (24h / 1h variants)  
- `booking-cancelled.tsx`  
- `payment-receipt.tsx` (Stripe invoice summary)  
- `lead-nurture-1.tsx`, `lead-nurture-2.tsx`, `lead-nurture-3.tsx` (Growth plan)  
- `parent-update.tsx` (uses AI summary)  
- `daily-digest.tsx` for tutor overview  
- `testimonial-request.tsx` linking to review form  
- `onboarding-checklist.tsx` for new tutors (<5 min setup)

Ensure templates include CTA buttons, testimonial quotes, and disclaimers (opt-out).

### Step 4: Event Triggers

Hook into key system events:

- **Booking confirmed** → send confirmation email + optional SMS (if phone available).  
- **Reminder schedule** → 24h and 1h before session (use cron job/queue).  
- **Booking cancelled/rescheduled** → notify both tutor and student.  
- **Package low balance** → alert tutor/student when remaining minutes below threshold.  
- **Lead captured** → send automated welcome email (Goal 1).  
- **Lead nurture** (Growth plan): schedule follow-up emails at 24h, 3 days, 7 days.  
- **Parent feedback request** → after lesson, send testimonial/NPS survey.  
- **Daily digest** → each morning, compile upcoming lessons, unpaid invoices, leads requiring response.  
- **Tutor onboarding** → after signup, send “Complete these steps in 5 minutes” checklist linking to profile/services/booking.

Implementation approach:

- Use Supabase Edge Functions or Next.js Cron jobs (`@vercel/cron`) to schedule reminders/digests.  
- Store pending jobs in `notification_queue` table with `send_at`, `channel`, `payload`.  
- Worker function processes queue every few minutes (Edge Function or background job).

### Step 5: SMS / WhatsApp (Optional)

- Integrate Twilio or WhatsApp Business API for tutors wanting SMS reminders or DM follow-ups.  
- Provide toggle in settings to enable SMS (with cost note).  
- For WhatsApp, reuse quick contact templating from link-in-bio; send message via API or instruct manual send by prefilled link.  
- Growth plan: add automated WhatsApp nurture sequence with AI-generated scripts (tie into `24-ai-content-marketing.md`).

### Step 6: Preferences & Compliance

- Create `/app/(dashboard)/settings/notifications` for tutors to choose which messages go to students/parents (email/SMS/WhatsApp).  
- Add unsubscribe link for marketing emails (leads); transactional emails exempt but offer preference center.  
- Store student/parent communication preferences in `students` table (`allow_email`, `allow_sms`).  
- Track message sends in `notification_logs` table for audit and analytics.

### Step 7: Analytics & Goal Tracking

- Log events to analytics pipeline: `email_sent`, `email_opened`, `email_clicked`, `sms_sent`.  
- Use Resend webhooks for delivery/open/click; store in `notification_logs`.  
- Dashboard metrics: conversion rate from nurture sequence, reminder effectiveness, NPS response rate.  
- Surface milestone counts (100 tutor signups, 50 booked lessons) via email when achieved.

### Step 8: UI Components

- Notification settings forms for tutors (toggle reminders, daily digest, parent updates).  
- Lead pipeline actions for manual send (“Send nurture email #2”).  
- Student detail drawer shows communication history (email subject, sent time, status).  
- Provide quick “Send parent update” button to open modal and confirm recipients.

### Step 9: Testing Strategy

- Use Resend test mode or dev email address for local testing.  
- For cron jobs, simulate events by manually invoking handler.  
- Ensure non-deliveries (bounce) are captured and flagged on student record.  
- Validate email rendering on mobile clients (Gmail, Outlook).  
- Confirm SMS/WhatsApp fallback behave when providers unavailable.

## Testing Checklist

- [ ] Booking confirmation, reminder, cancellation, and receipt emails send with correct data.  
- [ ] Lead capture triggers welcome email and schedules nurture series (Growth plan).  
- [ ] Parent feedback/testimonial requests delivered within set window after session.  
- [ ] Daily digest email summarizes upcoming lessons, overdue invoices, leads.  
- [ ] SMS/WhatsApp toggles respect communication preferences.  
- [ ] Unsubscribe/preferences center updates contact settings instantly.  
- [ ] Notification logs capture send status, opens, clicks.  
- [ ] Emails render correctly in dark mode/mobile clients.

## AI Tool Prompts

### React Email Template
```
Create a React Email template for a booking confirmation.
Include lesson details, Zoom join button, trust badges/testimonials, and WhatsApp fallback link.
```

### Nurture Sequence Scheduler
```
Write a server action that schedules a three-step lead nurture sequence.
Insert jobs into notification_queue with send times (now, +24h, +72h).
```

### Daily Digest Generator
```
Generate a daily digest email for tutors summarizing upcoming lessons, unpaid invoices, and leads needing follow-up.
Pull data from Supabase and render via React Email.
```

## Common Gotchas

- **Rate limits**: Batch sends to avoid provider rate caps; use queues.  
- **Timezone**: Schedule reminders based on student timezone; store timezone per contact.  
- **Deliverability**: Avoid spam triggers—keep marketing emails under 60% image content, include physical address, unsubscribe link.  
- **SMS regulations**: For US/Canada, implement double opt-in and honor STOP keywords.  
- **Tracking accuracy**: Email open tracking may be blocked by privacy features—use clicks and conversions as truth.

## Next Steps

1. Feed messaging metrics into analytics dashboards (**12-analytics-tracking.md**).  
2. Integrate with AI tools for parent updates, homework reminders (**15**, **25**).  
3. Extend WhatsApp/DM automation via `24-ai-content-marketing.md`.  
4. Add in-app notifications and push as future enhancements.

## Success Criteria

✅ All critical booking/payment events trigger timely, branded communications  
✅ Tutors convert leads faster via automated nurture and WhatsApp/SMS follow-ups  
✅ Parents receive consistent updates and review requests, boosting credibility  
✅ Messaging analytics inform Goal milestones (conversion, retention, NPS)  
✅ System extensible for AI-generated content and multi-channel campaigns

**Estimated Time**: 4-5 hours

