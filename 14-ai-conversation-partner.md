# 14 - AI Conversation Partner

## Objective

Deliver a 24/7 conversational AI that students can practice with between sessions, configurable by tutors. Supports Goal 2 (stickiness) by providing ongoing engagement, while reinforcing Goal 1 trust with safe, trackable interactions.

## Prerequisites

- ✅ **09-student-crm.md** — Students/users identified for conversation logging  
- ✅ **13-lesson-notes.md** — Lesson context and progress metrics feed prompts  
- ✅ AI provider credentials (OpenAI GPT-4/GPT-4o or Azure OpenAI, optional speech APIs)  
- Optional: Voice integration (Azure Speech, ElevenLabs) for audio mode

## Deliverables

- AI conversation UI (web chat + optional voice mode)  
- Tutor configuration (scenarios, language level, goals, guardrails)  
- Logging + analysis of AI chats (feeding progress tracking)  
- Safety filters (profanity, off-topic detection, termination on misuse)  
- Usage analytics + billing considerations (token tracking)  
- Security and privacy safeguards (data minimization, opt-in)

## Implementation Steps

### Step 1: UX Overview

- Entry points:
  - Student portal widget (“Practice with AI Partner”).  
  - Tutor dashboard quick launch for demo/testing.  
- Modes:
  - **Text chat** (MVP).  
  - **Voice chat** (upgrade; requires WebRTC/streaming).  
- Display conversation context (scenario name, target skills).  
- Provide “End session” summary with mistakes, vocabulary, CEFR feedback.

### Step 2: Conversation Settings

- In tutor dashboard, add configuration form:
  - Language being practiced, level (CEFR), persona (travel, exam prep, business).  
  - Goals (fluency, pronunciation, vocabulary).  
  - Allowed topics / banned topics.  
  - Tone (friendly, formal).  
- Store settings in `ai_conversation_settings` table keyed by tutor/student.

### Step 3: Backend Conversation Flow

- Use serverless endpoint `/app/api/ai/conversation` handling chat messages:
  1. Authenticate student via Supabase session.  
  2. Load tutor configuration + relevant lesson notes (optional).  
  3. Construct prompt with system instructions (persona, guardrails).  
  4. Call AI provider (OpenAI `chat.completions`).  
  5. Stream response to client (Server-Sent Events or WebSockets).  
  6. Log conversation turn in `ai_conversations` table (storing sanitized input/output, tokens, feedback).

- For streaming:
  - Use Next.js route handlers with `ReadableStream` to forward tokens.  
  - On client, accumulate tokens to show typing indicator.

### Step 4: Feedback & Analysis

- After each exchange, run optional evaluation function:
  - Identify grammar mistakes, vocabulary suggestions.  
  - Rate proficiency (0-100) for tutor analytics.  
  - Store in `ai_detected_errors` / `ai_feedback` table.  
- Provide student summary at end with key corrections and practice tips.  
- Add “Send to tutor” toggle to push summary into lesson notes/CRM.

### Step 5: Voice Mode (Optional Upgrade)

- Use WebRTC or browser audio capture + streaming to speech-to-text (Azure Speech) and re-synthesize AI response (Text-to-Speech).  
- Manage latency via streaming gRPC or HTTP chunked responses.  
- Provide fallback to text if microphone access denied.  
- Store audio transcripts similarly to text conversations.

### Step 6: Safety & Guardrails

- Pre-check messages with moderation API (OpenAI moderation, custom filters).  
- Block or redirect on inappropriate content; notify tutor if persistent.  
- Limit session length/time to avoid runaway costs.  
- Allow tutors to disable AI conversation for specific students.

### Step 7: Analytics & Billing

- Capture `ai_conversation_started`, `ai_conversation_turn`, `ai_conversation_completed` events with token usage.  
- Display usage insights in tutor dashboard (minutes practiced, frequency).  
- If offering paid add-on, compute cost per session and reflect in billing (tie into Stripe).  
- For retention metrics, include in WAU/DAU counts.

## UI Components

- `AIChatPanel`: chat history, message composer, typing indicator, end session button.  
- `ScenarioSelector`: choose conversation scenario / level.  
- `FeedbackSummary`: displays mistakes, vocabulary, next actions.  
- `UsageStats`: shows practice streak, minutes, corrections.

## Security & Privacy Considerations

- Do not store raw sensitive topics; sanitize or categorize conversation content.  
- Use token limits and redaction to avoid sending personal details to AI provider.  
- Honor student opt-in; ability to delete conversation history.  
- Ensure conversations are private to the tutor/student; restrict access via RLS.  
- Log AI usage for auditing; flag suspicious behavior.  
- Document data retention policy (e.g., auto-delete conversations after 90 days).

## Testing Checklist

- [ ] Tutor can configure AI scenarios with required fields.  
- [ ] Student launches AI chat; messages stream without errors.  
- [ ] Guardrails block prohibited content or escalate to tutor.  
- [ ] Conversation logs stored with sanitized content and token counts.  
- [ ] Feedback summary generates mistakes/vocabulary suggestions.  
- [ ] AI usage metrics appear in analytics dashboard.  
- [ ] Voice mode (if enabled) streams audio correctly with fallback to text.  
- [ ] Privacy controls (delete conversation, opt-out) function as expected.

## AI Tool Prompts

### Conversation Handler
```
Create a Next.js route handler that streams responses from OpenAI Chat Completions.
Inputs: tutorId, studentId, message history, scenario settings.
Include moderation check and logging to Supabase.
```

### Tutor Configuration Form
```
Build a form for tutors to define AI conversation scenarios (language, level, persona, goals).
Store settings via server action and surface in student chat UI.
```

### Feedback Summarizer
```
Write a function that analyzes a conversation transcript and extracts grammar corrections and vocabulary suggestions using OpenAI.
Return structured JSON for UI display.
```

## Next Steps

1. Feed conversation summaries into lesson notes (`13-lesson-notes.md`) and CRM progress metrics.  
2. Enable parent-facing recap via messaging system (`11-email-system.md`).  
3. Explore adaptive difficulty (AI adjusts based on student performance).  
4. Consider compliance/regional restrictions for AI usage (GDPR, COPPA if minors).

## Success Criteria

✅ Students practice with AI partner aligned to tutor-configured goals  
✅ Conversations enhance CRM/progress insights and parent updates  
✅ Safety guardrails prevent misuse and protect privacy  
✅ Usage analytics prove stickiness and support monetization

**Estimated Time**: 5-6 hours

