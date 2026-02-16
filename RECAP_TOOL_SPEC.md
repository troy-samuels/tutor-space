# 🎯 Magic Recap — Product Spec

*The Trojan Horse that builds a tutor CRM through homework.*

---

## The One-Liner

Tutor sends a 30-second voice note or text → student gets a beautiful study page with auto-generated exercises → TutorLingua silently builds a student database.

---

## V1 Scope (Ship This Week)

### What the tutor does

1. Goes to `tutorlingua.com/recap` (or `/drop`) — no signup needed
2. Types or voice-records a lesson summary:
   > "Sarah, Spanish, B1. We covered past tense — preterite vs imperfect. She keeps mixing fue/era. Homework: listen to Dakiti by Bad Bunny, find 3 preterite verbs."
3. Gets a shareable link in 10 seconds: `tutorlingua.com/r/abc123`
4. Copies link into Preply/iTalki chat. Done.

**Total effort: 30 seconds. No signup. No payment. No onboarding.**

### What the student sees (at the link)

**No signup required. Mobile-first. Dark mode.**

#### Card 1 — The Recap
- Tutor's name (auto-extracted from input)
- Lesson date
- "What we covered" — AI-expanded summary
- "Key vocabulary" — extracted words with definitions + audio pronunciation
- "Your mission" — the homework, written warmly

#### Card 2 — Practice (tap to start)
- 5 auto-generated exercises targeting the specific weak spots mentioned
- Multiple choice → fill-in-blank → sentence building (progressive difficulty)
- Score at the end with encouragement
- "You scored 4/5 on preterite vs imperfect 🔥"

#### Card 3 — The Soft Lock (after completing practice)
- "Save your progress — sign in with Google (one tap)"
- "See all your lessons with [Tutor Name]"
- First 3 recaps: fully open, no account needed
- From recap 4: account required to see history
- Account creation = email captured = student in database

#### Card 4 — The Calendar (only after account)
- "[Tutor Name]'s availability"
- "Book directly — no platform fees"
- This appears ONLY on the tutor's TutorLingua profile, linked from the recap
- Never visible on the Preply-shared link itself (ToS safe)

---

## The Secret CRM

Every recap the tutor generates silently captures:

| Data Point | Source | Value |
|------------|--------|-------|
| Student name | Extracted from tutor's note | Contact |
| Language + level | Extracted from tutor's note | Segmentation |
| Topics covered | AI extraction | Learning profile |
| Weak spots | AI extraction | Personalisation |
| Practice scores | Student activity | Progress tracking |
| Email (after signup) | Google OAuth | Direct contact |
| Lesson frequency | Recap timestamps | Engagement signal |
| Tutor-student relationship | Implicit from recaps | Network map |

After 10 recaps, TutorLingua knows more about the student's learning journey than Preply does.

---

## Technical Architecture

### New Routes

```
/recap                    — Tutor input page (public, no auth)
/r/[id]                   — Student recap page (public, no auth)
/r/[id]/practice          — Exercise flow (public, no auth)
/api/recap/generate       — POST: process tutor input → generate recap
/api/recap/[id]           — GET: fetch recap data
/api/recap/[id]/exercises — GET: fetch generated exercises
```

### Database Schema (new tables)

```sql
-- The core recap
CREATE TABLE recaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_id TEXT UNIQUE NOT NULL,           -- 8-char URL slug
  tutor_id UUID REFERENCES auth.users(id), -- NULL if tutor hasn't signed up yet
  tutor_fingerprint TEXT,                   -- browser fingerprint for anonymous tutors
  tutor_name TEXT,                          -- extracted or provided
  student_name TEXT,                        -- extracted from input
  language TEXT NOT NULL,
  level TEXT,                               -- A1-C2 or beginner/intermediate/advanced
  raw_input TEXT NOT NULL,                  -- original voice/text
  summary JSONB NOT NULL,                   -- { covered: [], vocabulary: [], weakSpots: [], homework: "" }
  exercises JSONB,                          -- generated exercise bank
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- CRM fields (populated over time)
  student_email TEXT,                       -- captured on account creation
  student_id UUID REFERENCES auth.users(id)
);

-- Track student practice on recaps
CREATE TABLE recap_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recap_id UUID REFERENCES recaps(id) ON DELETE CASCADE,
  student_fingerprint TEXT,                 -- before signup
  student_id UUID REFERENCES auth.users(id), -- after signup
  score INTEGER,
  total INTEGER,
  answers JSONB,
  completed_at TIMESTAMPTZ DEFAULT now()
);

-- Aggregate student profile (the secret CRM)
CREATE TABLE recap_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_fingerprint TEXT,                   -- links to tutor before they signup
  tutor_id UUID REFERENCES auth.users(id),
  student_name TEXT NOT NULL,
  student_email TEXT,
  student_id UUID REFERENCES auth.users(id),
  language TEXT,
  level TEXT,
  recap_count INTEGER DEFAULT 0,
  last_recap_at TIMESTAMPTZ,
  avg_score NUMERIC,
  weak_topics TEXT[],                       -- aggregated across recaps
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tutor_fingerprint, student_name),
  UNIQUE(tutor_id, student_name)
);

-- Indexes
CREATE INDEX idx_recaps_short_id ON recaps(short_id);
CREATE INDEX idx_recaps_tutor ON recaps(tutor_fingerprint);
CREATE INDEX idx_recaps_tutor_id ON recaps(tutor_id);
CREATE INDEX idx_recap_students_tutor ON recap_students(tutor_fingerprint);
```

### AI Pipeline (one API call)

**Input:** Raw text/transcribed voice note
**Model:** GPT-4o-mini (cheap, fast)
**Output:** Structured JSON

```json
{
  "studentName": "Sarah",
  "language": "Spanish",
  "level": "B1",
  "covered": ["Preterite vs imperfect tense", "Regular -ar verb conjugation"],
  "vocabulary": [
    { "word": "fue", "translation": "was/went (preterite)", "example": "Ella fue al mercado" },
    { "word": "era", "translation": "was (imperfect)", "example": "Cuando era niña..." }
  ],
  "weakSpots": ["Confusing preterite and imperfect in context"],
  "homework": "Listen to 'Dakiti' by Bad Bunny and identify 3 preterite verbs",
  "encouragement": "You're making great progress with past tenses! The fue/era distinction trips up everyone at B1 — you'll nail it with practice.",
  "exercises": [
    {
      "type": "multipleChoice",
      "question": "Complete: Cuando yo ___ pequeño, ___ al parque todos los días.",
      "options": ["fui / iba", "era / iba", "fue / fui", "era / fue"],
      "correct": 1,
      "explanation": "Both describe ongoing past states/habits, so imperfect is needed."
    }
    // ... 4 more exercises
  ]
}
```

### Voice Input

- Web Speech API for real-time transcription (free, browser-native)
- Fallback: OpenAI Whisper API for uploaded audio
- No need for a separate bot in V1 — web input is simpler and works on mobile

---

## UI Design

### Tutor Input Page (`/recap`)

```
┌─────────────────────────────┐
│                             │
│    ⚡ Magic Recap           │
│                             │
│  Turn your lesson into      │
│  student homework in        │
│  10 seconds.                │
│                             │
│  ┌───────────────────────┐  │
│  │ 🎙️                    │  │
│  │                       │  │
│  │  Tap to speak or      │  │
│  │  type your recap...   │  │
│  │                       │  │
│  │                       │  │
│  │                       │  │
│  └───────────────────────┘  │
│                             │
│  [ Generate Recap → ]       │
│                             │
│  Free · No signup · 10 sec  │
│                             │
└─────────────────────────────┘
```

### Student Recap Page (`/r/abc123`)

```
┌─────────────────────────────┐
│  📚 Lesson Recap            │
│  with Natalia · 14 Feb      │
│                             │
│  ┌───────────────────────┐  │
│  │ 🧠 What we covered    │  │
│  │                       │  │
│  │ Past tense: preterite │  │
│  │ vs imperfect          │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ 🔤 Key vocabulary     │  │
│  │                       │  │
│  │ fue → was/went 🔊     │  │
│  │ era → was (habitual)🔊│  │
│  │ estuvo → was (temp) 🔊│  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ 🎯 Your mission       │  │
│  │                       │  │
│  │ Listen to Dakiti and  │  │
│  │ find 3 preterite verbs│  │
│  └───────────────────────┘  │
│                             │
│  [ Start Practice (5 min) ] │
│                             │
│  ⚡ Generated by TutorLingua│
└─────────────────────────────┘
```

---

## Growth Mechanics

### V1 Launch (Week 1)
- Free for everyone. No limits.
- Tutor enters text/voice → gets link → shares with student
- No signup required for either side
- Watermark on every recap: "⚡ Generated by TutorLingua"

### V2 Soft Limits (Week 3-4, after traction)
- Free for 5 students. Unlimited if tutor creates account.
- "Refer 1 tutor → unlimited forever" (Dropbox model)
- Tutor account = we now have their email + can show them the dashboard

### V3 The Dashboard Reveal (Month 2)
- "You have 12 students and 47 recaps. See your student dashboard?"
- Show the CRM they've been building without knowing
- Student progress over time, weak spots, lesson frequency
- "Want students to book you directly? Enable your calendar."

### V4 Payments (Month 3+)
- "You have 8 active students. Want to handle billing through TutorLingua?"
- Stripe Connect — 5% platform fee (vs Preply's 18-33%)
- Tutor is already locked in. Students are already on the platform.

---

## What NOT to Build in V1

- ❌ Tutor signup/login (anonymous fingerprint is enough)
- ❌ Payment/billing
- ❌ Tutor dashboard (comes in V3)
- ❌ Mobile app / PWA (responsive web is fine)
- ❌ Telegram/WhatsApp bot (V2 — web input is simpler for V1)
- ❌ Tutor profile pages (already built, connect later)
- ❌ Student-to-student sharing (organic, don't force it)

---

## Build Order

### Day 1: Core pipeline
1. Database migration (recaps, recap_attempts, recap_students)
2. `/api/recap/generate` — process input → AI extraction → store
3. `/api/recap/[id]` — fetch recap data

### Day 2: UI
4. `/recap` — tutor input page (text + voice)
5. `/r/[id]` — student recap card page
6. `/r/[id]/practice` — exercise flow (reuse existing practice components)

### Day 3: Polish + Ship
7. Mobile optimisation
8. Voice input (Web Speech API)
9. Short link generation
10. Watermark + sharing mechanics
11. Deploy to production

---

## Success Metrics

| Metric | Target (Month 1) |
|--------|-------------------|
| Recaps generated | 500+ |
| Unique tutors | 50+ |
| Unique students (viewed) | 200+ |
| Practice completion rate | 40%+ |
| Student accounts created | 50+ |
| Tutor referrals | 10+ |
