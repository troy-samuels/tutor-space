# TutorLingua: Agent-Native Implementation Plan

> **Context:** Y Combinator's Peter Steinberger (OpenClaw creator) predicts 80% of apps will disappear as personal AI agents replace data-management tools. This plan ensures TutorLingua is in the 20% that survives — by becoming the infrastructure layer agents plug into, not the UI they replace.
>
> **Core thesis:** Apps that manage data die. Apps with sensors, payment rails, and two-sided network effects survive — if they become agent-accessible.

---

## Table of Contents

1. [Survival Analysis](#1-survival-analysis)
2. [Strategic Pillars](#2-strategic-pillars)
3. [Phase 1: Agent API Layer](#3-phase-1-agent-api-layer-weeks-1-4)
4. [Phase 2: Agent Discovery Protocol](#4-phase-2-agent-discovery-protocol-weeks-3-6)
5. [Phase 3: Sensor Layer Expansion](#5-phase-3-sensor-layer-expansion-weeks-5-8)
6. [Phase 4: Student Knowledge Graph](#6-phase-4-student-knowledge-graph-weeks-7-10)
7. [Phase 5: Agent-to-Agent Marketplace](#7-phase-5-agent-to-agent-marketplace-weeks-10-14)
8. [Technical Architecture](#8-technical-architecture)
9. [Migration Strategy](#9-migration-strategy)
10. [Success Metrics](#10-success-metrics)

---

## 1. Survival Analysis

### What dies (agent-replaceable)

| Feature | Why it dies | Agent equivalent |
|---------|------------|-----------------|
| Calendar management | "Block Tuesday 3-5pm" | Agent manages calendar natively |
| Booking creation | "Book Maria for Thursday" | Agent negotiates directly |
| Student notes/CRM | "Remember Maria struggles with subjunctive" | memory.md / knowledge files |
| Reminders & notifications | "Remind me 1hr before lessons" | Agent cron jobs |
| Tutor site builder | Agents don't browse websites | Agent-to-agent discovery |
| Analytics dashboard | "How did I do this month?" | Agent queries data directly |
| Message centre | "Tell Maria I'm running 5 min late" | Agent sends messages natively |

### What survives (irreplaceable)

| Feature | Why it survives | Moat type |
|---------|----------------|-----------|
| LiveKit video classroom | Real-time WebRTC sensor — agents can't sit in video calls | **Sensor** |
| Deepgram transcription + diarization | Live speech-to-text with speaker separation | **Sensor** |
| AI pronunciation analysis | Real-time audio processing during lessons | **Sensor** |
| L1 interference detection | Domain-specific ML that agents don't have | **Sensor** |
| Drill generation from recordings | Transforms raw audio into structured exercises | **Intelligence** |
| Stripe Connect payment routing | Compliance, tax reporting, refunds between two parties | **Infrastructure** |
| Two-sided booking protocol | Student ↔ Tutor negotiation requires a shared protocol | **Network** |
| Student progress data (structured) | Richer than markdown — proficiency scores, grammar matrices | **Data gravity** |

### The strategic pivot

```
BEFORE: TutorLingua = UI that tutors click
AFTER:  TutorLingua = Infrastructure that agents operate on
                    + Sensors that agents can't replicate
                    + Protocol that connects tutor agents to student agents
```

---

## 2. Strategic Pillars

### Pillar 1: Agent API (let agents control TutorLingua)
Make every action in TutorLingua callable by an AI agent via REST API and MCP server. A tutor's OpenClaw/personal agent becomes the primary interface; the dashboard becomes secondary.

### Pillar 2: Agent Discovery (let agents find tutors)
Build a protocol so a student's agent can discover tutors, check availability, negotiate pricing, and book — without ever opening a browser.

### Pillar 3: Sensor Supremacy (double down on irreplaceable tech)
Expand the classroom intelligence layer. More real-time analysis, better pronunciation feedback, automatic curriculum adaptation. This is what agents can't do.

### Pillar 4: Knowledge Graph (own the learning data)
Transform flat student notes into a structured, queryable knowledge graph that agents depend on. Make TutorLingua the authoritative source of "how is this student progressing?"

### Pillar 5: Agent-to-Agent Protocol (become the marketplace for agent transactions)
Build the negotiation layer where a student's agent and a tutor's agent can transact — discovery, availability, booking, payment — all programmatically.

---

## 3. Phase 1: Agent API Layer (Weeks 1-4)

### Goal
Every action a tutor performs in the dashboard is available via authenticated REST API, so their personal AI agent can operate TutorLingua on their behalf.

### 3.1 API Authentication

**New file:** `app/app/api/v1/auth/token/route.ts`

```
POST /api/v1/auth/token
Body: { email, password } or { api_key }
Returns: { access_token, refresh_token, expires_at }
```

- Issue JWT tokens scoped to tutor's profile
- Support API key authentication (generate from Settings)
- Rate limit: 10 requests/minute on token endpoint
- Tokens expire in 1 hour, refresh tokens in 30 days

**New file:** `app/app/(dashboard)/settings/api-keys/page.tsx`
- UI to generate/revoke API keys
- Show usage stats per key
- Scope permissions (read-only, read-write, admin)

**New file:** `app/lib/middleware/api-auth.ts`
- Middleware to validate Bearer tokens on /api/v1/* routes
- Extract tutor_id from token
- Enforce RLS through service role + tutor_id filter

### 3.2 Core API Endpoints

**Directory:** `app/app/api/v1/`

#### Bookings
```
GET    /api/v1/bookings                    # List bookings (filter: upcoming, past, date range)
GET    /api/v1/bookings/:id                # Get booking details
POST   /api/v1/bookings                    # Create booking (student_id, service_id, scheduled_at)
PATCH  /api/v1/bookings/:id                # Update (reschedule, add notes)
DELETE /api/v1/bookings/:id                # Cancel booking
POST   /api/v1/bookings/:id/complete       # Mark as completed
POST   /api/v1/bookings/:id/paid           # Mark as paid (manual payment)
```

#### Students
```
GET    /api/v1/students                    # List students (filter: active, label, search)
GET    /api/v1/students/:id                # Get student detail + progress
POST   /api/v1/students                    # Add student
PATCH  /api/v1/students/:id                # Update student info
GET    /api/v1/students/:id/history        # Lesson history
GET    /api/v1/students/:id/progress       # Learning goals, assessments, grammar matrix
POST   /api/v1/students/:id/notes          # Add lesson note
```

#### Availability
```
GET    /api/v1/availability                # Get weekly slots
PUT    /api/v1/availability                # Set weekly slots
GET    /api/v1/availability/slots          # Get bookable slots (date range, duration)
POST   /api/v1/availability/block          # Block specific time
DELETE /api/v1/availability/block/:id      # Unblock time
```

#### Services
```
GET    /api/v1/services                    # List services
POST   /api/v1/services                    # Create service
PATCH  /api/v1/services/:id               # Update service
DELETE /api/v1/services/:id               # Archive service
```

#### Messages
```
GET    /api/v1/messages/threads            # List conversation threads
GET    /api/v1/messages/threads/:id        # Get messages in thread
POST   /api/v1/messages/threads/:id        # Send message
POST   /api/v1/messages/threads/:id/audio  # Send voice message
```

#### Analytics
```
GET    /api/v1/analytics/revenue           # Revenue stats (period, breakdown)
GET    /api/v1/analytics/bookings          # Booking stats
GET    /api/v1/analytics/students          # Student acquisition stats
GET    /api/v1/analytics/summary           # Dashboard KPI summary
```

#### Classroom (Studio)
```
GET    /api/v1/classroom/:bookingId/token  # Get LiveKit join token
GET    /api/v1/classroom/:bookingId/recording  # Get recording + transcript
GET    /api/v1/classroom/:bookingId/analysis   # Get AI analysis results
GET    /api/v1/classroom/:bookingId/drills     # Get generated drills
```

### 3.3 MCP Server

**New package:** `packages/tutorlingua-mcp/`

Build an MCP (Model Context Protocol) server that wraps the REST API. This lets agents like Claude Code, OpenClaw, Codex, etc. use TutorLingua as a tool natively.

```typescript
// MCP tool definitions
tools: [
  {
    name: "tutorlingua_list_bookings",
    description: "List upcoming or past bookings for the tutor",
    parameters: { status: "upcoming|past|all", limit: number, from_date: string }
  },
  {
    name: "tutorlingua_create_booking",
    description: "Book a lesson with a student",
    parameters: { student_id: string, service_id: string, scheduled_at: string, notes?: string }
  },
  {
    name: "tutorlingua_get_student_progress",
    description: "Get a student's learning progress, grammar issues, and proficiency",
    parameters: { student_id: string }
  },
  {
    name: "tutorlingua_check_availability",
    description: "Check available booking slots for a date range",
    parameters: { from_date: string, to_date: string, duration_minutes: number }
  },
  {
    name: "tutorlingua_send_message",
    description: "Send a message to a student",
    parameters: { student_id: string, message: string }
  },
  {
    name: "tutorlingua_get_lesson_analysis",
    description: "Get AI analysis from a recorded lesson (pronunciation, grammar, vocabulary)",
    parameters: { booking_id: string }
  },
  // ... 15-20 more tools covering all API endpoints
]
```

**Distribution:**
- npm package: `@tutorlingua/mcp`
- Also available as CLI: `npx @tutorlingua/mcp --api-key=xxx`
- Compatible with OpenClaw skills, Claude Code MCP config, Codex

### 3.4 Webhook System (Agent ← TutorLingua)

Agents need to receive events, not just poll. Add outbound webhooks.

**New file:** `app/app/api/v1/webhooks/register/route.ts`

```
POST   /api/v1/webhooks                    # Register webhook URL
GET    /api/v1/webhooks                    # List registered webhooks
DELETE /api/v1/webhooks/:id               # Remove webhook
```

**Events emitted:**
```
booking.created          # New booking confirmed
booking.cancelled        # Booking cancelled
booking.reminder         # Upcoming lesson (configurable: 1hr, 24hr)
student.new              # New student added
student.access_request   # Student requested access
message.received         # New message from student
payment.received         # Payment completed
lesson.completed         # Lesson marked complete
lesson.recording_ready   # Recording + transcript available
lesson.analysis_ready    # AI analysis completed
practice.session_ended   # Student finished AI practice
```

**Delivery:** POST to registered URL with HMAC signature, retry with exponential backoff (3 attempts).

### 3.5 Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `app/app/api/v1/auth/token/route.ts` | Create | API key/token auth |
| `app/app/api/v1/bookings/route.ts` | Create | Booking CRUD |
| `app/app/api/v1/bookings/[id]/route.ts` | Create | Single booking ops |
| `app/app/api/v1/students/route.ts` | Create | Student CRUD |
| `app/app/api/v1/students/[id]/route.ts` | Create | Student detail |
| `app/app/api/v1/students/[id]/progress/route.ts` | Create | Student progress |
| `app/app/api/v1/availability/route.ts` | Create | Availability CRUD |
| `app/app/api/v1/availability/slots/route.ts` | Create | Bookable slots query |
| `app/app/api/v1/services/route.ts` | Create | Service CRUD |
| `app/app/api/v1/messages/route.ts` | Create | Messaging |
| `app/app/api/v1/analytics/route.ts` | Create | Analytics queries |
| `app/app/api/v1/classroom/[bookingId]/route.ts` | Create | Classroom data |
| `app/app/api/v1/webhooks/route.ts` | Create | Webhook management |
| `app/lib/middleware/api-auth.ts` | Create | API auth middleware |
| `app/lib/api/rate-limiter.ts` | Create | Per-key rate limiting |
| `app/lib/api/webhook-dispatcher.ts` | Create | Outbound webhook delivery |
| `app/app/(dashboard)/settings/api-keys/page.tsx` | Create | API key management UI |
| `packages/tutorlingua-mcp/` | Create | MCP server package |
| `supabase/migrations/xxx_api_keys.sql` | Create | API keys table |
| `supabase/migrations/xxx_webhooks.sql` | Create | Webhooks table |

### 3.6 Database Changes

```sql
-- API keys table
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                    -- "My OpenClaw Agent"
  key_hash TEXT NOT NULL,                -- bcrypt hash of the key
  key_prefix TEXT NOT NULL,              -- "tl_live_abc..." (for display)
  scopes TEXT[] DEFAULT '{read,write}',  -- permission scopes
  last_used_at TIMESTAMPTZ,
  request_count BIGINT DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

-- Webhook registrations
CREATE TABLE webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,                -- which events to receive
  secret TEXT NOT NULL,                  -- HMAC signing secret
  is_active BOOLEAN DEFAULT true,
  failure_count INT DEFAULT 0,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Webhook delivery log
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID REFERENCES webhook_endpoints(id),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INT,
  response_body TEXT,
  attempt INT DEFAULT 1,
  delivered_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tutors manage own API keys" ON api_keys
  FOR ALL USING (tutor_id = auth.uid());

ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tutors manage own webhooks" ON webhook_endpoints
  FOR ALL USING (tutor_id = auth.uid());
```

---

## 4. Phase 2: Agent Discovery Protocol (Weeks 3-6)

### Goal
Enable a student's AI agent to discover tutors, check real-time availability, and initiate bookings — without a browser. Transform the current llms.txt from a static info page into a live, queryable discovery protocol.

### 4.1 Enhanced llms.txt → Agent Discovery API

**Modify:** `app/app/llms.txt/route.ts`

Upgrade from static text to include machine-actionable endpoints:

```
## AGENT API

### Discovery (No Auth Required)
GET /api/v1/public/tutors                     # Search tutors
GET /api/v1/public/tutors/:username           # Tutor profile + services
GET /api/v1/public/tutors/:username/slots     # Real-time availability
GET /api/v1/public/tutors/:username/reviews   # Student reviews

### Booking (Student Auth Required)
POST /api/v1/public/book                      # Create booking
POST /api/v1/public/book/request              # Request booking (tutor approval)

### Schema
All responses follow JSON:API format.
OpenAPI spec: /api/v1/openapi.json
```

### 4.2 Public Discovery API

**Directory:** `app/app/api/v1/public/`

These endpoints require NO authentication — they're for student agents to discover tutors.

```
GET /api/v1/public/tutors
  ?language=spanish
  &min_price=20&max_price=50
  &currency=USD
  &timezone=Europe/London        # prefer tutors in similar timezone
  &available_after=2026-02-10
  &specialization=ielts
  &sort=rating|price|relevance
  &limit=20

Response:
{
  "tutors": [
    {
      "username": "alba-garcia",
      "name": "Alba García",
      "languages": ["Spanish", "English"],
      "rating": 4.9,
      "total_reviews": 47,
      "years_teaching": 8,
      "timezone": "Europe/Madrid",
      "services": [
        { "name": "Conversation", "duration": 55, "price": 3500, "currency": "USD" },
        { "name": "DELE Prep", "duration": 55, "price": 4500, "currency": "USD" }
      ],
      "next_available": "2026-02-10T10:00:00Z",
      "booking_url": "https://tutorlingua.co/book/alba-garcia",
      "api_book": "/api/v1/public/book?tutor=alba-garcia"
    }
  ]
}
```

```
GET /api/v1/public/tutors/:username/slots
  ?from=2026-02-10
  &to=2026-02-14
  &duration=55
  &timezone=America/New_York     # return slots in student's timezone

Response:
{
  "tutor": "alba-garcia",
  "slots": [
    { "start": "2026-02-10T10:00:00-05:00", "end": "2026-02-10T10:55:00-05:00" },
    { "start": "2026-02-10T14:00:00-05:00", "end": "2026-02-10T14:55:00-05:00" },
    ...
  ]
}
```

### 4.3 OpenAPI Specification

**New file:** `app/app/api/v1/openapi.json/route.ts`

Generate a full OpenAPI 3.1 spec for all v1 endpoints. This allows any agent framework to auto-generate client code.

### 4.4 Agent Booking Protocol

For agent-to-agent booking (student agent → TutorLingua → tutor agent):

```
# Student's agent discovers tutor
GET /api/v1/public/tutors?language=spanish&available_after=tomorrow

# Student's agent checks slots
GET /api/v1/public/tutors/alba-garcia/slots?from=2026-02-10&duration=55

# Student's agent initiates booking
POST /api/v1/public/book
{
  "tutor_username": "alba-garcia",
  "service_id": "svc_xxx",
  "scheduled_at": "2026-02-10T10:00:00Z",
  "student": {
    "name": "John Smith",
    "email": "john@example.com",
    "timezone": "America/New_York",
    "notes": "Interested in DELE B2 preparation"
  },
  "payment_method": "stripe",      # or "request" for tutor approval
  "return_url": "https://..."      # Stripe checkout redirect
}

Response:
{
  "booking_id": "bk_xxx",
  "status": "pending_payment",     # or "confirmed" if free/$0
  "checkout_url": "https://checkout.stripe.com/...",
  "confirmation_webhook": "/api/v1/public/book/bk_xxx/status"
}
```

### 4.5 Well-Known Agent Manifest

**New file:** `app/public/.well-known/agent.json`

A standardised manifest file (like robots.txt but for agents):

```json
{
  "name": "TutorLingua",
  "description": "Language tutor marketplace with 0% commission. Find tutors, book lessons, track progress.",
  "api_version": "1.0",
  "base_url": "https://tutorlingua.co/api/v1",
  "auth": {
    "tutor": { "type": "bearer", "token_url": "/auth/token" },
    "student": { "type": "bearer", "token_url": "/auth/student-token" },
    "public": { "type": "none", "endpoints": "/public/*" }
  },
  "capabilities": [
    "tutor_discovery",
    "real_time_availability",
    "programmatic_booking",
    "payment_processing",
    "lesson_recording",
    "ai_analysis",
    "student_progress_tracking"
  ],
  "openapi": "https://tutorlingua.co/api/v1/openapi.json",
  "mcp_package": "@tutorlingua/mcp",
  "webhook_events": [
    "booking.created", "booking.cancelled", "lesson.completed",
    "lesson.analysis_ready", "payment.received", "message.received"
  ],
  "contact": "api@tutorlingua.co"
}
```

---

## 5. Phase 3: Sensor Layer Expansion (Weeks 5-8)

### Goal
Double down on what agents can't replicate: real-time audio/video analysis during live lessons. Make the classroom the most valuable part of TutorLingua — not a premium upsell, but the core differentiator.

### 5.1 Real-Time Pronunciation Coaching

**Current state:** Post-lesson analysis only.
**Target state:** Live, in-lesson feedback.

**New component:** `app/components/classroom/live-pronunciation-coach.tsx`

During a LiveKit session:
1. Stream student audio through Deepgram in real-time
2. Run pronunciation assessment on detected target-language utterances
3. Surface subtle UI indicators to the tutor (not the student) showing:
   - Words the student is struggling with
   - Phoneme-level accuracy scores
   - L1 interference patterns (e.g., Japanese speaker → R/L confusion)
4. Tutor can tap a word to queue it for post-lesson drill generation

**Technical approach:**
- Use Deepgram's live streaming API (already have SDK)
- Speaker diarization to isolate student audio
- Run pronunciation scoring on student utterances only
- WebSocket from LiveKit room → analysis service → tutor UI overlay

### 5.2 Automatic Lesson Segmentation

**New file:** `app/lib/ai/lesson-segmenter.ts`

After transcription, automatically segment the lesson into:
- **Conversation practice** (free-flowing dialogue)
- **Grammar explanation** (tutor teaching a concept)
- **Error correction** (tutor correcting student)
- **Vocabulary introduction** (new words introduced)
- **Review** (practising previously learned material)

This structured data feeds into the knowledge graph (Phase 4) and tells the student's agent exactly what was covered.

### 5.3 Cross-Lesson Trend Analysis

**New file:** `app/lib/ai/trend-analyzer.ts`

Across multiple recorded lessons for a student:
- Track pronunciation improvement over time (quantified)
- Identify persistent grammar weaknesses
- Detect vocabulary acquisition rate
- Generate "learning velocity" metrics
- Produce adaptive recommendations for next lesson focus

**New API endpoint:**
```
GET /api/v1/students/:id/trends
  ?metric=pronunciation|grammar|vocabulary|overall
  &period=30d|90d|all

Response:
{
  "student_id": "...",
  "period": "90d",
  "pronunciation": {
    "overall_score": 72,
    "trend": "+8 points over 90 days",
    "persistent_issues": ["th sounds", "word stress patterns"],
    "improved": ["vowel length", "intonation"]
  },
  "grammar": {
    "accuracy_rate": 0.81,
    "trend": "+0.06 over 90 days",
    "persistent_issues": ["subjunctive mood", "ser vs estar"],
    "mastered": ["present tense regular", "basic prepositions"]
  },
  "vocabulary": {
    "active_words": 847,
    "acquisition_rate": "~12 words/lesson",
    "retention_rate": 0.73
  },
  "recommended_focus": ["subjunctive mood drills", "th pronunciation exercises"]
}
```

### 5.4 Pricing Strategy: Studio as Default

Consider restructuring tiers:

```
CURRENT:
  Pro ($29/mo)    = Dashboard + bookings + CRM + site
  Studio ($79/mo) = Pro + Video + AI

PROPOSED:
  Free            = Booking link + basic CRM (agent-accessible)
  Pro ($29/mo)    = Full API access + webhooks + MCP + analytics
  Studio ($49/mo) = Pro + Classroom + Recording + AI analysis + Knowledge graph

  Why:
  - Free tier drives adoption (tutors share booking links)
  - Pro tier is about API/agent access (the new primary interface)
  - Studio tier is the sensor layer (what agents can't replicate)
  - Studio price drops from $79 → $49 to drive adoption of the moat
```

### 5.5 Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `app/components/classroom/live-pronunciation-coach.tsx` | Create | Real-time pronunciation UI |
| `app/lib/ai/lesson-segmenter.ts` | Create | Auto-segment lesson transcripts |
| `app/lib/ai/trend-analyzer.ts` | Create | Cross-lesson trend analysis |
| `app/app/api/v1/students/[id]/trends/route.ts` | Create | Trends API endpoint |
| `app/lib/services/live-analysis.ts` | Create | Real-time audio analysis service |
| `app/components/classroom/tutor-insight-overlay.tsx` | Create | In-lesson tutor insights UI |

---

## 6. Phase 4: Student Knowledge Graph (Weeks 7-10)

### Goal
Transform flat student records into a structured, queryable knowledge graph that agents depend on as the authoritative source of learning progress. Make this data so rich that no agent's markdown memory can replicate it.

### 6.1 Knowledge Graph Schema

**New tables:**

```sql
-- Skill nodes in the knowledge graph
CREATE TABLE student_skill_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES profiles(id),
  language TEXT NOT NULL,                    -- target language
  category TEXT NOT NULL,                    -- grammar, vocabulary, pronunciation, fluency, comprehension
  skill TEXT NOT NULL,                       -- e.g., "subjunctive_mood", "ser_vs_estar"
  level TEXT NOT NULL DEFAULT 'unknown',     -- unknown, introduced, practising, acquired, mastered
  confidence FLOAT DEFAULT 0,               -- 0.0 to 1.0
  first_seen_at TIMESTAMPTZ,
  last_practised_at TIMESTAMPTZ,
  practice_count INT DEFAULT 0,
  error_count INT DEFAULT 0,
  success_count INT DEFAULT 0,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, language, category, skill)
);

-- Skill progression events
CREATE TABLE student_skill_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_node_id UUID NOT NULL REFERENCES student_skill_nodes(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id),
  event_type TEXT NOT NULL,                  -- introduced, practised, error, correction, mastery_test
  context TEXT,                              -- sentence or utterance where it occurred
  score FLOAT,                              -- accuracy score if applicable
  source TEXT NOT NULL,                      -- lesson_recording, ai_practice, homework, manual
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Vocabulary items
CREATE TABLE student_vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES profiles(id),
  language TEXT NOT NULL,
  word TEXT NOT NULL,
  translation TEXT,
  context_sentence TEXT,                     -- where it was first encountered
  pronunciation_score FLOAT,
  review_count INT DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,               -- spaced repetition
  srs_interval_days INT DEFAULT 1,          -- current SRS interval
  status TEXT DEFAULT 'new',                -- new, learning, known, mastered
  source TEXT NOT NULL,                      -- lesson, ai_practice, homework
  booking_id UUID REFERENCES bookings(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, language, word)
);

-- Learning milestones
CREATE TABLE student_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES profiles(id),
  language TEXT NOT NULL,
  milestone_type TEXT NOT NULL,              -- cefr_level, words_learned, hours_completed, skill_mastered
  title TEXT NOT NULL,                       -- "Reached B1 level"
  description TEXT,
  achieved_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX idx_skill_nodes_student ON student_skill_nodes(student_id, language);
CREATE INDEX idx_skill_events_node ON student_skill_events(skill_node_id, created_at);
CREATE INDEX idx_vocabulary_student ON student_vocabulary(student_id, language, status);
CREATE INDEX idx_vocabulary_review ON student_vocabulary(student_id, next_review_at)
  WHERE status IN ('new', 'learning');
CREATE INDEX idx_milestones_student ON student_milestones(student_id, language);
```

### 6.2 Knowledge Graph API

```
GET /api/v1/students/:id/knowledge
  ?language=spanish
  &category=grammar|vocabulary|pronunciation|all

Response:
{
  "student_id": "...",
  "language": "Spanish",
  "cefr_estimate": "B1",
  "total_lessons": 34,
  "total_hours": 31.2,
  "skills": {
    "grammar": [
      { "skill": "present_tense_regular", "level": "mastered", "confidence": 0.95 },
      { "skill": "subjunctive_mood", "level": "practising", "confidence": 0.42, "error_rate": 0.38 },
      { "skill": "ser_vs_estar", "level": "practising", "confidence": 0.61 }
    ],
    "pronunciation": [
      { "skill": "rolled_r", "level": "introduced", "confidence": 0.25 },
      { "skill": "vowel_sounds", "level": "acquired", "confidence": 0.82 }
    ],
    "vocabulary": {
      "total_words": 847,
      "active": 612,
      "learning": 180,
      "new": 55,
      "mastered": 420,
      "due_for_review": 23
    }
  },
  "recent_milestones": [
    { "type": "words_learned", "title": "800 words learned!", "achieved_at": "2026-02-05" }
  ],
  "recommended_next": [
    "Focus on subjunctive mood (38% error rate)",
    "Review 23 vocabulary items due for spaced repetition",
    "Introduce conditional tense (prerequisite skills mastered)"
  ]
}
```

### 6.3 Automatic Graph Population

After each lesson recording is analysed:
1. **Lesson segmenter** identifies grammar points, vocabulary, corrections
2. **Skill mapper** creates/updates skill nodes based on what was practised
3. **Error tracker** logs errors and corrections as skill events
4. **Vocabulary extractor** adds new words to the vocabulary table
5. **SRS scheduler** updates spaced repetition intervals for vocabulary
6. **Milestone checker** triggers milestone events (e.g., "Reached 500 words")

After each AI practice session:
1. Grammar issues feed directly into skill nodes
2. Vocabulary from conversations added to vocabulary table
3. Practice counts and scores update skill confidence

### 6.4 Agent-Queryable Knowledge

A tutor's agent can ask:
```
"What should I focus on with Maria next lesson?"
→ GET /api/v1/students/maria-id/knowledge?language=spanish

Agent receives structured data and can generate a lesson plan:
"Maria has been struggling with subjunctive mood (38% error rate over 5 lessons).
 She has 23 vocabulary items due for review. Her pronunciation of rolled R
 is still at 'introduced' level. Suggest focusing on subjunctive exercises
 with her known vocabulary, plus 5 minutes of R pronunciation drills."
```

A student's agent can ask:
```
"How am I progressing in Spanish?"
→ GET /api/v1/students/me/knowledge?language=spanish

"You're estimated at B1 level. You've learned 847 words (612 active).
 Your grammar is strong in present tense but subjunctive mood needs work.
 You have 23 words due for review today."
```

---

## 7. Phase 5: Agent-to-Agent Marketplace (Weeks 10-14)

### Goal
Build the protocol layer where student agents and tutor agents transact directly. TutorLingua becomes the trusted intermediary — handling identity verification, payment escrow, scheduling conflict resolution, and dispute arbitration.

### 7.1 Agent Registration

```
POST /api/v1/agents/register
{
  "agent_type": "tutor_agent" | "student_agent",
  "owner_id": "user_xxx",                    # TutorLingua user ID
  "agent_name": "Malcolm",                   # Agent's name
  "agent_platform": "openclaw|clawdbot|custom",
  "webhook_url": "https://...",              # Where to send events
  "capabilities": ["booking", "messaging", "payment"],
  "public_key": "..."                        # For signed requests
}

Response:
{
  "agent_id": "ag_xxx",
  "agent_token": "at_xxx",                   # Long-lived agent token
  "webhook_secret": "whs_xxx"
}
```

### 7.2 Agent-to-Agent Booking Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Student's Agent  │     │   TutorLingua    │     │  Tutor's Agent  │
│   (OpenClaw)     │     │   (Protocol)     │     │   (Malcolm)     │
└────────┬────────┘     └────────┬─────────┘     └────────┬────────┘
         │                        │                        │
         │  1. Search tutors      │                        │
         │───────────────────────>│                        │
         │                        │                        │
         │  2. Results            │                        │
         │<───────────────────────│                        │
         │                        │                        │
         │  3. Check slots        │                        │
         │───────────────────────>│                        │
         │                        │  4. Query availability │
         │                        │───────────────────────>│
         │                        │                        │
         │                        │  5. Confirm/suggest    │
         │                        │<───────────────────────│
         │  6. Available slots    │                        │
         │<───────────────────────│                        │
         │                        │                        │
         │  7. Request booking    │                        │
         │───────────────────────>│                        │
         │                        │  8. Booking request    │
         │                        │───────────────────────>│
         │                        │                        │
         │                        │  9. Accept + price     │
         │                        │<───────────────────────│
         │  10. Payment required  │                        │
         │<───────────────────────│                        │
         │                        │                        │
         │  11. Payment token     │                        │
         │───────────────────────>│                        │
         │                        │  12. Confirmed         │
         │  13. Booking confirmed │───────────────────────>│
         │<───────────────────────│                        │
         │                        │                        │
```

### 7.3 Negotiation Protocol

For tutors who enable it, agents can negotiate:

```
POST /api/v1/agents/negotiate
{
  "tutor_username": "alba-garcia",
  "student_agent_id": "ag_xxx",
  "proposal": {
    "service_id": "svc_xxx",
    "preferred_times": [
      "2026-02-10T10:00:00Z",
      "2026-02-10T14:00:00Z",
      "2026-02-11T10:00:00Z"
    ],
    "package_interest": true,              # interested in bulk discount
    "student_context": {
      "level": "B1",
      "goals": ["DELE B2 preparation"],
      "availability": "mornings EU timezone"
    }
  }
}

# Tutor's agent responds via webhook:
{
  "action": "counter_offer",
  "selected_time": "2026-02-10T14:00:00Z",
  "package_offer": {
    "sessions": 10,
    "price_per_session": 3200,             # discounted from 3500
    "validity_days": 90
  },
  "message": "I'd love to help with DELE B2 prep. I suggest we start with a trial lesson on Monday at 2pm. If it's a good fit, I offer a 10-lesson package at a 10% discount."
}
```

### 7.4 Trust & Verification Layer

TutorLingua's unique value in agent-to-agent transactions:

- **Identity verification:** Both parties are verified TutorLingua users
- **Payment escrow:** Stripe holds funds until lesson is confirmed complete
- **Dispute resolution:** If either party reports an issue, TutorLingua arbitrates
- **Rating integrity:** Reviews are tied to verified completed lessons
- **Fraud prevention:** Rate limiting, pattern detection on agent requests

### 7.5 Revenue Model for Agent Transactions

```
Agent-to-agent bookings:
  - Booking via public API (student agent → TutorLingua):
    Same as human booking — 0% commission, Stripe processing fee only
  - Negotiated bookings (agent-to-agent with package deals):
    0% commission — this drives adoption
  - Premium agent features (future):
    Priority matching, advanced analytics API: included in Pro tier

Why 0% commission still works:
  - Tutors pay $29-49/mo subscription regardless of booking source
  - Agent API drives MORE bookings → higher retention → longer subscriptions
  - Agent-native tutors are stickier (migration cost is high once agents are configured)
```

---

## 8. Technical Architecture

### 8.1 API Layer Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Clients                           │
├────────────┬────────────┬────────────┬──────────────┤
│ Dashboard  │ Student    │ Tutor's    │ Student's    │
│   (Web)    │ Portal     │ AI Agent   │ AI Agent     │
└─────┬──────┴─────┬──────┴─────┬──────┴──────┬───────┘
      │            │            │             │
      ▼            ▼            ▼             ▼
┌─────────────────────────────────────────────────────┐
│              Next.js API Routes                      │
├─────────────────────────────────────────────────────┤
│  /app/*          │  /api/v1/*        │  /api/v1/    │
│  Server Actions  │  Authed API       │  public/*    │
│  (Session Auth)  │  (Bearer Token)   │  (No Auth)   │
└────────┬─────────┴────────┬──────────┴──────┬───────┘
         │                  │                 │
         ▼                  ▼                 ▼
┌─────────────────────────────────────────────────────┐
│            Shared Service Layer                      │
│  /lib/repositories/* (data access)                  │
│  /lib/services/*     (business logic)               │
│  /lib/ai/*           (analysis, generation)         │
└────────────────────────┬────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
   ┌──────────┐   ┌───────────┐   ┌───────────┐
   │ Supabase │   │  Stripe   │   │  LiveKit  │
   │ Postgres │   │  Connect  │   │  + Deepgram│
   │ + RLS    │   │           │   │           │
   └──────────┘   └───────────┘   └───────────┘
```

### 8.2 Event Flow Architecture

```
Lesson occurs in LiveKit classroom
        │
        ▼
Recording saved to S3 (OGG)
        │
        ▼
Deepgram transcription + diarization
        │
        ├──→ Lesson Segmenter → Knowledge Graph update
        ├──→ Pronunciation Analyzer → Skill node scores
        ├──→ Vocabulary Extractor → SRS vocabulary table
        ├──→ Drill Generator → Student drill queue
        └──→ Trend Analyzer → Cross-lesson metrics
                │
                ▼
        Webhook dispatched to tutor's agent:
        "lesson.analysis_ready" with summary
                │
                ▼
        Tutor's agent uses data for next lesson prep
```

### 8.3 Security Model

| Layer | Auth | Rate Limit |
|-------|------|------------|
| Dashboard (Server Actions) | Supabase session (httpOnly cookie) | Per-user via Upstash |
| API v1 (Authed) | Bearer token (API key or JWT) | Per-key: 100 req/min |
| API v1 (Public) | None | Per-IP: 30 req/min |
| Agent Protocol | Agent token + HMAC signed requests | Per-agent: 60 req/min |
| Webhooks (Outbound) | HMAC-SHA256 signature | 3 retries, exponential backoff |
| MCP Server | API key passed at config time | Inherits API key limits |

---

## 9. Migration Strategy

### How existing tutors transition to agent-native

**Phase 1 — Invisible to users**
- Ship API endpoints alongside existing dashboard
- Dashboard continues to work exactly as before
- Add "API Keys" section to Settings (opt-in)
- No existing feature changes

**Phase 2 — Agent-curious tutors**
- Ship MCP package to npm
- Blog post: "Connect your AI agent to TutorLingua"
- YouTube tutorial: "Use OpenClaw/Claude to manage your tutoring business"
- Early adopters get featured on landing page

**Phase 3 — Agent-first features**
- Knowledge graph replaces flat student notes
- Trend analysis visible in both dashboard AND API
- Public discovery API means students can find tutors via their AI agents
- "Agent-managed" badge on tutor profiles

**Phase 4 — Agent-native positioning**
- Landing page messaging shifts:
  - FROM: "The all-in-one platform for language tutors"
  - TO: "The infrastructure for AI-powered language teaching"
- Agent-to-agent booking becomes a headline feature
- Case studies: "How Alba's AI agent books 30% more lessons"

### Backward compatibility
- Dashboard never goes away — it becomes a visual layer on top of the API
- Every new feature ships with both UI and API simultaneously
- Existing tutors who never use an agent see zero changes
- No forced migration — agent features are additive

---

## 10. Success Metrics

### Phase 1 (Agent API) — Week 4
- [ ] 100% of dashboard actions available via API
- [ ] MCP package published to npm
- [ ] 10 beta tutors connected their AI agents
- [ ] API documentation at /api/v1/docs
- [ ] <200ms p95 latency on API endpoints

### Phase 2 (Discovery) — Week 6
- [ ] Public discovery API serving real-time tutor data
- [ ] OpenAPI spec auto-generated and validated
- [ ] `.well-known/agent.json` manifest live
- [ ] First student booking via API (not browser)

### Phase 3 (Sensors) — Week 8
- [ ] Real-time pronunciation feedback in classroom
- [ ] Lesson auto-segmentation accuracy >85%
- [ ] Cross-lesson trends for students with 5+ recorded lessons
- [ ] Studio adoption up 20% (price reduction + value increase)

### Phase 4 (Knowledge Graph) — Week 10
- [ ] Skill nodes auto-populated from lesson recordings
- [ ] Vocabulary SRS system active for Studio students
- [ ] Knowledge graph API returns structured progress data
- [ ] Tutor agents using knowledge data for lesson prep

### Phase 5 (Agent Marketplace) — Week 14
- [ ] Agent-to-agent booking flow end-to-end
- [ ] Negotiation protocol live (opt-in for tutors)
- [ ] 5% of bookings coming through agent API
- [ ] Trust/verification layer preventing fraud

### North Star Metric
**Percentage of bookings created via API (agent) vs dashboard (human)**
- Month 1: 2%
- Month 3: 10%
- Month 6: 25%
- Month 12: 50%

When 50% of bookings come through agents, TutorLingua has successfully become infrastructure rather than an app — and is firmly in the 20% that survives.

---

## Implementation Priority

```
NOW (Weeks 1-4):    Agent API + MCP Server
                    → Unlocks tutor agents immediately
                    → Highest leverage, reuses existing business logic

NEXT (Weeks 3-6):   Agent Discovery Protocol
                    → Unlocks student agents finding tutors
                    → Drives new bookings from agent-native students

THEN (Weeks 5-8):   Sensor Layer Expansion
                    → Widens the moat
                    → Makes Studio tier irresistible

AFTER (Weeks 7-10): Knowledge Graph
                    → Creates data gravity
                    → Makes migration away from TutorLingua painful

LAST (Weeks 10-14): Agent-to-Agent Protocol
                    → Full vision realised
                    → TutorLingua is the protocol, not the product
```

---

*This plan was developed on 2026-02-08 in response to Peter Steinberger's thesis that 80% of apps will be replaced by personal AI agents. TutorLingua's strategy: become the infrastructure that agents depend on, not the interface they replace.*