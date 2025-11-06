# 10 - Zoom Integration

## Objective

Automatically generate video meeting links for each booking, embed them in tutor/student dashboards, and sync recordings/attendance for lesson notes. This keeps the “Book a Lesson” funnel frictionless and supports future AI transcription (Goal 2).

## Prerequisites

- ✅ **08-booking-system.md** — Bookings confirmed and need meeting links  
- ✅ **07-stripe-integration.md** — Payments confirm before meeting creation  
- ✅ **02-authentication.md** — Secure server actions with tutor context  
- ✅ Zoom account (JWT deprecated → use OAuth app or Server-to-Server OAuth)  
- Optional: Supabase Edge Functions enabled for background jobs

## Deliverables

- Zoom OAuth / Server-to-Server OAuth configuration with secure secret storage  
- `/app/api/zoom/oauth/callback` for account linking (if OAuth)  
- Utility to create/update Zoom meetings per booking (`lib/zoom.ts`)  
- Webhook handler for Zoom events (meeting started, ended, recording)  
- UI components showing join buttons and recording links  
- Fallback instructions for tutors without Zoom (Google Meet, Teams)

## Implementation Steps

### Step 1: Choose Auth Method

- **Recommended**: Server-to-Server OAuth (Zoom Marketplace) for easiest server use.  
  - Create app → get `accountId`, `clientId`, `clientSecret`.  
  - Store in Supabase secrets or environment variables (`ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`).  
- Alternative: User-level OAuth if tutors connect their own Zoom accounts. Requires storing refresh tokens per tutor (`profiles.zoom_access_token`).  
- Document pros/cons: Server-to-Server simpler but uses platform Zoom account; user-level gives personalized branding. Start with platform-level for MVP, plan user-level for Studio later.

### Step 2: Zoom Client Helper

```ts
// lib/zoom.ts
import ky from 'ky'

const ZOOM_BASE_URL = 'https://api.zoom.us/v2'

async function getAccessToken() {
  const basicAuth = Buffer.from(
    `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
  ).toString('base64')

  const response = await ky.post('https://zoom.us/oauth/token', {
    searchParams: {
      grant_type: 'account_credentials',
      account_id: process.env.ZOOM_ACCOUNT_ID!,
    },
    headers: {
      Authorization: `Basic ${basicAuth}`,
    },
  }).json<{ access_token: string }>()

  return response.access_token
}

export async function createZoomMeeting(payload: {
  topic: string
  startTime: string
  duration: number
  agenda?: string
  password?: string
  timezone?: string
}) {
  const token = await getAccessToken()
  const response = await ky
    .post(`${ZOOM_BASE_URL}/users/me/meetings`, {
      json: {
        type: 2,
        topic: payload.topic,
        agenda: payload.agenda,
        start_time: payload.startTime,
        duration: payload.duration,
        timezone: payload.timezone,
        settings: {
          join_before_host: true,
          waiting_room: false,
          approval_type: 2,
          audio: 'voip',
          auto_recording: 'cloud', // optional, align with AI assistant
        },
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .json<ZoomMeetingResponse>()

  return response
}
```

Define `ZoomMeetingResponse` interface containing `join_url`, `start_url`, `password`, etc.

### Step 3: Hook Into Booking Confirmation

- In booking confirmation flow (after Stripe webhook), call `createZoomMeeting` with:  
  - `topic`: `${service.name} with ${studentName}`  
  - `start_time`: booking scheduled time (convert to ISO, e.g., `'2024-04-01T15:00:00Z'`)  
  - `duration`: `booking.duration_minutes`  
  - `timezone`: tutor timezone (optional)  
- Update `bookings` table with `meeting_url`, `meeting_start_url`, `meeting_password`, `provider = 'zoom'`.  
- Send join links via confirmation email (`11-email-system.md`) and show in dashboards.

### Step 4: Expose Join Buttons in UI

- Dashboard booking cards show “Join Zoom” button for tutors (use `start_url`) and students (use `join_url`).  
- Student portal/reschedule page also includes link and password.  
- Provide “Copy link” button and optional QR code for mobile.  
- For parent credibility page (Goal 1), highlight “Lessons happen via secure Zoom link.”

### Step 5: Zoom Webhooks (Optional but Recommended)

- Create Zoom Event Subscription for:  
  - `meeting.started` — mark booking status `in_progress`.  
  - `meeting.ended` — mark `completed`, trigger lesson note template.  
  - `recording.completed` — save recording download URL for AI assistant.  
- Set endpoint `/app/api/zoom/webhook` verifying secret token.  
- Use Supabase to update booking records and insert events into `lead_events` / `lesson_notes`.

### Step 6: Recording & AI Integration

- If auto recording enabled, store `recording_files` metadata in Supabase table (e.g., `ai_transcripts`).  
- Once recording ready, queue transcription (via `25-ai-teaching-assistant.md`).  
- Allow tutors to toggle recording per service or booking; store preference in `services.auto_recording`.

### Step 7: Alternative Meeting Providers

- Provide fallback toggle in service settings to use Google Meet or manual link:  
  - Google Meet integration will rely on OAuth later.  
  - Manual link field per booking if tutor wants to use another platform.  
- In UI show provider badge (Zoom, Google Meet, Manual).  
- Save manual links in `bookings.meeting_url` and skip Zoom API call.

### Step 8: Security & Permissions

- Restrict `start_url` to tutors only; never expose to students/parents.  
- Optionally set meeting password and embed in link (`?pwd=`).  
- Use waiting room optional; for kids, keep on for safety.  
- Ensure tokens stored securely; rotate credentials periodically.

### Step 9: Testing

- Use Zoom sandbox/personal account to verify meeting creation and cancellation.  
- Run through booking flow: confirm meeting created, join works, cancellation deletes meeting.  
- Test webhooks via Zoom “Send sample event.”  
- Confirm meeting times align with booked times/timezones.

## Testing Checklist

- [ ] Booking confirmation creates Zoom meeting with correct topic/start time/duration.  
- [ ] Join link visible to student, start link visible to tutor, with proper permissions.  
- [ ] Cancelling booking deletes or updates Zoom meeting.  
- [ ] Zoom webhooks (if enabled) update booking status and trigger lesson note creation.  
- [ ] Recording metadata stored for AI assistant when auto recording on.  
- [ ] Manual meeting provider toggle works and bypasses Zoom calls.  
- [ ] Access tokens are refreshed automatically (no 401 errors).  
- [ ] Meeting info appears in emails, dashboards, and calendar exports.

## AI Tool Prompts

### Zoom Meeting Hook
```
Write a function that creates a Zoom meeting using Server-to-Server OAuth and returns join/start URLs.
Inputs: topic, startTime, duration, timezone.
Use ky or fetch and TypeScript types.
```

### Booking Integration
```
Add post-payment booking logic that calls createZoomMeeting, updates the booking record, and schedules reminder emails with the join link.
```

### Zoom Webhook Handler
```
Implement a Zoom webhook handler for meeting.started and meeting.ended events.
Verify the request signature and update booking status in Supabase.
```

## Common Gotchas

- **Token expiry**: Server-to-Server access tokens expire after 1 hour—fetch per request or cache briefly.  
- **Timezones**: Zoom expects ISO string with timezone or UTC; convert booking times correctly.  
- **Meeting deletion**: When booking cancelled, call `DELETE /meetings/{id}` to avoid clutter.  
- **Recording storage**: Zoom automatic deletion after 30 days—download if you need to keep.  
- **OAuth rate limits**: Avoid creating multiple meetings for same booking (idempotency).

## Next Steps

1. Tie meeting details into reminder emails and calendar invites (**11-email-system.md**, **12-analytics-tracking.md**).  
2. Feed recordings to AI Teaching Assistant (**25-ai-teaching-assistant.md**).  
3. Add Google Meet/Teams integrations for tutors who prefer alternative platforms.  
4. Surface attendance metrics in CRM and analytics dashboards.

## Success Criteria

✅ Every confirmed booking has a meeting link available instantly  
✅ Tutors and students access meeting links from dashboards, emails, and link-in-bio  
✅ Zoom events keep booking statuses in sync and feed lesson notes/AI flows  
✅ Alternative meeting providers supported when Zoom unavailable  
✅ Integration scales for future AI transcription and Studio team workflows

**Estimated Time**: 2-3 hours

