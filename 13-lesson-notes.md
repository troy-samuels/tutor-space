# 13 - Lesson Notes & Resource Library

## Objective

Provide tutors with structured lesson notes, resource attachments, AI-assisted summaries, and progress tracking that feeds parent updates and CRM. Supports Goal 1 trust (parent credibility) and Goal 2 stickiness (AI workflows, performance insights).

## Prerequisites

- ✅ **08-booking-system.md** — Bookings drive note creation  
- ✅ **09-student-crm.md** — Student profiles consume notes/progress data  
- ✅ **12-analytics-tracking.md** — Events logged for usage metrics  
- ✅ Supabase storage bucket for resources configured
- Optional: AI providers (OpenAI/Azure) for summaries

## Deliverables

- Lesson note editor (rich text + structured fields) linked to booking  
- Attachments/resource linking (Supabase storage + external links)  
- Progress metrics (skills, CEFR level, homework status)  
- AI-generated summary + homework suggestion (Growth plan)  
- Parent update export (email/WhatsApp)  
- Security controls for sensitive student information

## Implementation Steps

### Step 1: Data Model Recap

`lesson_notes` table fields include: `booking_id`, `tutor_id`, `student_id`, `summary`, `skills_practiced`, `homework`, `visibility`, timestamps. Ensure RLS policy allows only tutors to manage their notes.

### Step 2: Lesson Notes UI

- Route: `/app/(dashboard)/notes` or embedded in booking detail drawer.  
- Create editor component using `Tiptap` or `react-quill` with toolbar (bold, bullet lists, highlights).  
- Structured fields:
  - Skills practised (vocabulary, grammar, listening, speaking).  
  - Homework assigned (rich text, due date).  
  - Student mood / engagement rating.  
  - Next lesson focus.  
- Include “Seen by parent/student” toggle; default private.

### Step 3: Resource Attachments

- Provide panel to attach resources from library (`resources` table) or upload new files (PDFs, audio).  
- Upload path: `resources/{tutorId}/{uuid}`; enforce MIME allowlist, size limits.  
- Display resource cards with preview, tags, share toggles.

### Step 4: Autosave & Versioning

- Implement autosave via client state with debounce to server action `upsertLessonNote`.  
- Keep version history (optional) by storing diff or full copy in `lesson_note_versions` table.  
- Show “Last updated” timestamp.

### Step 5: Integration with Booking Flow

- After booking completion (Zoom webhook), create empty note automatically.  
- Link note to student detail timeline.  
- When note saved, mark booking `status = completed` if not already and update progress metrics.

### Step 6: Progress Metrics

- Aggregate per student: total lessons, hours, skills practised, CEFR level changes.  
- Display progress chart in CRM and parent credibility page.  
- Include quick “Mark CEFR level” dropdown and store in `students.cefr_level`.

### Step 7: AI Assistance (Growth Plan)

- Button “Generate AI Summary” that sends note + booking metadata to AI model (OpenAI GPT-4, Azure).  
- Sanitize input (remove PII not needed) before sending.  
- Store generated summary in `lesson_notes.ai_summary` with metadata (model, tokens).  
- Additional AI features:
  - Homework generator: given topic, create 3 tasks.  
  - Parent update script: craft friendly message summarizing progress.  
- Log events (`ai_summary_generated`) for analytics.

### Step 8: Parent Update Export

- Provide share modal with:
  - Email preview (hooks into `11-email-system.md`).  
  - WhatsApp/DM message text (linking to contact templates).  
  - PDF export of note summary + attachments list.  
- Respect visibility toggle: only share note fields flagged as “shareable.”

### Step 9: Security Considerations

- Lesson notes may contain sensitive student data:
  - Ensure RLS restricts access to tutor (and optionally assigned team members).  
  - If AI used, redact names or replace with pseudonyms before sending to external API.  
  - Encrypt particularly sensitive fields (optional future).  
  - Log parent exports for audit (who shared what, when).  
- Supabase storage: private buckets with signed URLs when sharing resources with students.

### Step 10: UI Enhancements

- Quick filters: show notes by status (draft/shared), student, date range.  
- Search across notes (full-text search on `summary`/`homework`).  
- Keyboard shortcuts for common actions (save, AI summary).  
- Accessibility: ensure editor toolbar accessible, provide plaintext fallback for screen readers.

## Testing Checklist

- [ ] Lesson notes autosave, persist, and link to bookings/students.  
- [ ] Attachments upload to restricted bucket; signed URLs expire appropriately.  
- [ ] Progress metrics update in student profile and analytics dashboards.  
- [ ] AI summary/homework generator works for Growth plan and sanitizes input.  
- [ ] Parent export emails/WhatsApp messages omit marked private fields.  
- [ ] Version history (if enabled) allows restoring previous note.  
- [ ] RLS prevents other tutors/students from accessing notes.  
- [ ] Accessibility checks pass (editor navigation, color contrast).

## AI Tool Prompts

### Lesson Note Editor
```
Build a React component with Tiptap for lesson notes.
Include autosave via server action, structured fields (skills, homework, mood), and resource attachments.
```

### AI Summary Generator
```
Write a server action that takes lesson notes and generates a parent-friendly summary using OpenAI.
Redact student name before sending and log token usage.
```

### Parent Update Export
```
Create a modal that formats lesson notes into an email preview and WhatsApp message.
Integrate with messaging system to send immediately or copy to clipboard.
```

## Security Considerations

- Apply guidance from `SECURITY.md` on data classification and AI usage.  
- Store attachments in private buckets; generate signed URLs only when sharing.  
- Maintain audit trail for note edits and parent exports.  
- Provide per-note retention settings (allow tutors to delete on parent request).  
- Limit AI requests to sanitized, minimum necessary data.

## Next Steps

1. Feed progress metrics into analytics dashboards (`12-analytics-tracking.md`).  
2. Link AI-generated summaries to messaging workflows (`11-email-system.md`).  
3. Use lesson notes to trigger homework assignments and AI practice (`16-vocabulary-system.md`).  
4. Expose parent portal view (read-only) in future iterations.

## Success Criteria

✅ Tutors capture structured lesson notes quickly and attach resources  
✅ Parents receive clear updates that boost trust  
✅ AI assistance saves time while respecting privacy/security  
✅ Lesson data fuels CRM analytics and future AI experiences

**Estimated Time**: 4-5 hours

