# TutorLingua Studio: Technical Specification (2026 Vision)

## 1. Executive Summary
This document outlines the architecture for the "Studio Tier," a high-value subscription ($79/mo) that upgrades TutorLingua from a booking tool to an "AI-Native Classroom."

**Core Philosophy:**
- **Capture:** Replace Zoom with a native LiveKit implementation to own the audio/video stream.
- **Process:** Use async queues to mine the stream for data (transcripts, mistakes, highlights).
- **Deliver:** Auto-generate interactive artifacts (Games, Marketing Clips, Roadmaps) without tutor effort.

---

## 2. Technical Architecture

### 2.1 The Stack Extensions
- **Video:** LiveKit (Cloud or Self-Hosted).
- **Queue/Async:** Upstash QStash or Supabase Edge Functions Background Tasks (for robust AI processing).
- **Storage:** Supabase Storage (Buckets: `recordings` [private], `marketing-clips` [public]).
- **AI:** OpenAI GPT-4o (Logic/JSON extraction), Deepgram (High-fidelity transcription/Diarization).

### 2.2 Data Pipeline Flow
1.  **Lesson Start:** Tutor/Student join `/[booking_id]/room` (LiveKit).
2.  **Lesson End:** Webhook triggers `api/webhooks/livekit`.
3.  **Async Job:** Webhook pushes `process_lesson_job` to Queue (do NOT process in-route).
4.  **Processing:**
    *   Fetch Recording -> Transcribe (Deepgram).
    *   Extract Mistakes -> Generate JSON Drills (OpenAI).
    *   Identify Highlights -> Clip Video (FFmpeg/Remotion).
    *   Update Vector Store -> RAG Context.
5.  **Completion:** Update DB status -> Notify Users via Realtime/Email.

---

## 3. Database Schema Updates (Supabase)

### 3.1 Tier Management
Update `profiles` table:
- `tier`: enum ('standard', 'studio') default 'standard'.
- `ai_credits_used`: integer (minutes used this month).
- `custom_domain`: text (nullable).
- `brand_color`: text (default '#primary').

### 3.2 The "Intelligence" Tables
```sql
-- The raw asset
create table lesson_recordings (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id),
  storage_path text not null,
  duration_seconds int,
  transcript_json jsonb, -- Full Deepgram output with timestamps
  status text default 'processing', -- 'processing', 'completed', 'failed'
  created_at timestamptz default now()
);

-- The "Duolingo" content
create table lesson_drills (
  id uuid primary key default gen_random_uuid(),
  recording_id uuid references lesson_recordings(id),
  student_id uuid references students(id),
  
  -- The game payload
  -- Schema: { type: 'scramble'|'match'|'fix', prompt: string, data: any }
  content jsonb not null, 
  
  is_completed boolean default false,
  completed_at timestamptz
);

-- The Marketing Assets
create table marketing_clips (
  id uuid primary key default gen_random_uuid(),
  recording_id uuid references lesson_recordings(id),
  storage_path text not null, -- Public URL
  transcript_snippet text,
  viral_score float, -- 0.0 to 1.0 based on sentiment
  tutor_approved boolean default false
);

-- The Game Map
create table learning_roadmaps (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id),
  title text, -- "Zero to A1"
  nodes jsonb -- [{ id: 1, topic: "Greetings", status: "locked" | "active" | "completed" }]
);