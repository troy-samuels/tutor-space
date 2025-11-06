# 09 - Student CRM

## Objective

Give tutors a lightweight CRM to manage leads, students, and parents without leaving TutorLingua. It should cover the Goal 1 focus (lead inbox, fast conversion, parent credibility) while laying groundwork for Goal 2 stickiness (tags, performance notes, AI summaries, NPS tracking).

## Prerequisites

- ✅ **08-booking-system.md** — Bookings generate student data to surface here  
- ✅ **05-link-in-bio.md** — Lead capture links funnel contacts into CRM  
- ✅ **07-stripe-integration.md** — Payments/invoices feed status indicators  
- ✅ **01-database-schema.md** — `students`, `leads`, `lead_events`, `lesson_notes`, `reviews` tables  
- Optional: seed sample leads/students for UI testing

## Deliverables

- `/app/(dashboard)/students/page.tsx` — student list with filters, tags, pipeline stages  
- `/app/(dashboard)/leads/page.tsx` — inbox for new inquiries with quick actions (email/WhatsApp templates)  
- Student profile view with timeline (bookings, notes, payments, AI summaries)  
- Parent/guardian info entry + feedback buttons  
- Tagging and segmentation (level, goals, status)  
- Lead→Student conversion flow with automation (assign package, send onboarding email)  
- Growth/Studio upsells: automated nurture sequences, AI summaries, team access

## UX Narrative

1. Tutor opens **Students** tab → sees segmented view: Active, Trial, Alumni.  
2. Quick filters highlight students without upcoming lessons, unpaid invoices, or missing parent updates.  
3. **Leads** tab acts as inbox: each entry with source (IG, WhatsApp, link-in-bio) and status (new, contacted, booked).  
4. Tutor can message via WhatsApp/DM templates, schedule trial lesson, or convert to student record in one click.  
5. Student detail page shows timeline (bookings, payments, lesson notes, feedback), progress chart, and AI-generated parent update (Growth plan).  
6. Parent feedback button triggers review & testimonial capture for credibility page.

## Implementation Steps

### Step 1: Routing & Layout

- Add `/students` and `/leads` routes under dashboard navigation (Professional core).  
- Ensure new pages use `ProtectedRoute` and rely on `useAuth` entitlements for Growth features.  
- Consider nested layout for Students with sidebar (List) and content pane (Detail) using `@radix-ui/react-tabs`.

### Step 2: Data Fetching

- For server components (`page.tsx`), query Supabase:  
  - Students: `profiles` join? No, there is `students` table keyed by tutor. Include `lesson_notes`, `bookings`, `session_package_purchases`, `reviews`.  
  - Leads: `leads` table with `lead_events`.  
- Use row-level security (already defined) ensuring tutor only sees own records.  
- Provide pagination/infinite scroll for large datasets.

### Step 3: Student List Component

```tsx
// components/students/student-table.tsx
'use client'

import { DataTable } from '@/components/ui/data-table'
import { columns } from './columns'

export function StudentTable({ data }: { data: StudentWithStats[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      initialState={{
        sorting: [{ id: 'lastLesson', desc: true }],
        columnVisibility: { email: false },
      }}
      filterableColumns={[
        { id: 'status', title: 'Status', options: STATUS_OPTIONS },
        { id: 'tags', title: 'Tags', options: TAG_OPTIONS },
      ]}
    />
  )
}
```

- Columns: Name, Status (Active/Trial/Paused), Level, Last Lesson, Next Lesson, Outstanding Balance, Tags.  
- Add badge for “Needs attention” if no booking in 14 days or invoice overdue.  
- Row click opens drawer (`StudentDrawer`) with detail view.

### Step 4: Lead Inbox

- Use Kanban-like pipeline (New, Contacted, Nurturing, Booked, Lost) with drag-and-drop (dnd-kit).  
- Each card shows name, source (Instagram DM, WhatsApp, Landing Page), notes, last contacted.  
- Actions: quick message (WhatsApp/email), schedule trial (opens booking pre-filled), convert to student.  
- Growth plan: enable automated follow-up sequence button (“Send 3-day nurture”).  
- Log interactions as `lead_events` (note, email sent, booking created). Display timeline per lead.

### Step 5: Student Detail Drawer/Page

- Sections:
  - **Overview**: contact info, parent/guardian, timezone, plan, tags.  
  - **Timeline**: bookings, payments, packages, notes, lead events.  
  - **Progress**: charts from `lesson_notes` / `progress_tracking` (CEFR, vocabulary).  
  - **Resources**: assigned lesson plans, homework, shared files.  
  - **Parent Updates**: button to generate AI summary (Growth plan) + send via email/WhatsApp.  
- Provide “Add note” form (rich text, attachments) stored in `lesson_notes`.  
- Show upcoming bookings with edit/reschedule links.

### Step 6: Tagging & Segmentation

- Use `students.tags` (array) & `lead_sources` to categorize.  
- UI: multi-select combobox with suggestions (Beginner, Test Prep, Conversation, Child, Adult).  
- Growth plan: allow saved segments (e.g., “Trial students without booking”), used for broadcasts later.

### Step 7: Conversion Flow (Lead → Student)

- Action button “Convert to Student” that:  
  1. Creates `students` record with shared details.  
  2. Creates login invite (optional) via Supabase Auth magic link.  
  3. Schedules trial lesson or sends booking link.  
  4. Moves lead to `status = booked`.  
- After conversion, prompt to assign package/service and send onboarding email (ties into **11-email-system.md**).

### Step 8: Parent Feedback & Testimonials

- Provide “Request parent feedback” button that triggers email/SMS (Growth plan auto-sends).  
- Store responses in `reviews` table and display on profile parent page + link-in-bio.  
- Show metrics (NPS, satisfaction) per student/parent.  
- Encourage tutors to add feedback to parent credibility CTA in `04-user-profiles.md`.

### Step 9: Task & Reminder Integration

- Minimal task list for each student (e.g., “Send homework”, “Follow up on payment”).  
- Link tasks to upcoming bookings; mark completed.  
- Growth plan: auto-generate tasks based on inactivity (no booking 10 days).  
- Send daily digest email summarizing outstanding tasks (ties into **11-email-system.md**).

### Step 10: AI Enhancements (Growth Plan)

- AI button “Summarize progress” → use lesson notes + bookings to generate update script for parents (for Goal 2).  
- Provide AI-generated homework ideas or next steps using `15-lesson-plan-generator.md`.  
- For leads, AI quick-reply suggestions (IG DM, WhatsApp) leveraging `24-ai-content-marketing.md`.

### Step 11: Studio Plan Hooks

- Add “Assign tutor” field for teams; enable shared notes and task assignments.  
- Allow exporting student list, tasks, and performance metrics for administrators.  
- Support internal comments visible only to team members.

### Step 12: Analytics & Reporting

- Metrics: conversion rate (lead → student), LTV (total payments), lesson streaks, last active.  
- Feed data into `12-analytics-tracking.md` and `28-ceo-dashboard.md`.  
- Provide filters to identify at-risk students (no lesson >14 days) and parent satisfaction (NPS < 7).

### Step 13: Accessibility & Responsiveness

- Ensure tables support horizontal scroll on mobile and provide card layout fallback.  
- Use `aria-live` announcements for lead stage changes.  
- Keyboard support for pipeline drag-and-drop (provide alternative actions).  
- Screen-reader friendly labeling for progress charts (use descriptive text fallback).

## Testing Checklist

- [ ] Leads created via link-in-bio or manual entry appear in inbox with source attribution.  
- [ ] Dragging cards updates lead status and logs `lead_events`.  
- [ ] “Convert to Student” creates student record, moves lead to booked, and pre-fills booking flow.  
- [ ] Student list filters by tags/status; needs-attention badge appears when appropriate.  
- [ ] Parent feedback requests send through email/SMS pipeline (verify in **11-email-system.md**).  
- [ ] AI summary buttons gated to Growth plan and return content.  
- [ ] Team assignment fields visible only on Studio plan.  
- [ ] Performance metrics (lessons, invoices) match data from bookings/invoices tables.  
- [ ] Page passes accessibility audit (keyboard navigation, landmarks).

## AI Tool Prompts

### Lead Pipeline
```
Create a kanban-style lead pipeline component with columns (New, Contacted, Nurturing, Booked, Lost).
Use @dnd-kit for drag and drop, shadcn/ui cards, and call a server action to update status.
```

### Student Detail Drawer
```
Build a student detail drawer showing timeline events (bookings, payments, notes), progress chart, and quick actions (send update, add note).
Fetch data via Supabase and render in a scrollable panel.
```

### Lead-to-Student Conversion
```
Write a server action that converts a lead into a student record.
Steps: insert into students, update lead status, optionally invite via Supabase Auth magic link, and schedule a trial booking if provided.
```

## Common Gotchas

- **Duplicate contacts**: Deduplicate leads/students by email/phone; offer merge feature.  
- **Timezone mismatches**: Ensure student timezone is captured so booking reminders reflect correct time.  
- **Privacy**: Sensitive notes (e.g., learning challenges) should be stored securely; consider role-based access.  
- **WhatsApp throttling**: Provide manual fallback when WhatsApp API fails (open native link).  
- **Performance**: Timeline queries can become heavy—paginate events and use skeleton loaders.

## Next Steps

1. Integrate automated reminders and follow-ups in **11-email-system.md**.  
2. Feed CRM metrics into analytics dashboards (**12-analytics-tracking.md**).  
3. Connect AI tools for lesson/homework generation (**15-lesson-plan-generator.md**, **16-vocabulary-system.md**).  
4. Extend to group classes and shared student records in **26-group-sessions.md** and Studio plan features.

## Success Criteria

✅ Tutors can manage leads and students from a single dashboard  
✅ Lead-to-booking conversion tracked and actionable (Goal 1)  
✅ Parent credibility enhanced via testimonials, progress metrics, and quick contact options  
✅ Tags, notes, and AI summaries make TutorLingua stickier than Linktree (Goal 2)  
✅ CRM data powers analytics, automation, and future team collaboration

**Estimated Time**: 4-5 hours

