# 🔧 Overnight Build Plan — Recap Tool + Student Experience
*Malcolm — 15 Feb 2026, 00:00 GMT*
*Target: 08:00 GMT completion*

---

## Pre-Flight Checklist

### Environment ✅
- [x] Next.js 16.0.10 with React 19
- [x] Tailwind CSS 4
- [x] Framer Motion 12.x
- [x] @dnd-kit/core 6.x + @dnd-kit/sortable 10.x
- [x] OpenAI SDK 6.x
- [x] Supabase JS 2.x + SSR 0.7.x
- [x] OpenAI API key available (system env)
- [x] Supabase service role key available
- [x] Existing design system: dark mode (#1A1917 bg, #E8784D primary, #F5F2EF text)
- [x] Font: Manrope (body), Mansalva (headings)

### What Doesn't Exist Yet
- [ ] No `.env.local` in `app/` dir — env is in parent `tutor-space/.env.local`
- [ ] No recap database tables
- [ ] No recap API endpoints
- [ ] No recap/student experience pages
- [ ] No OPENAI_API_KEY in project env (need to add or use system env)

### Existing Components to Reuse
- `components/practice/ChatBubble.tsx` — message bubbles
- `components/practice/CorrectionChip.tsx` — error corrections
- `components/practice/WordTile.tsx` — word tiles for exercises
- `components/practice/ResultsCard.tsx` — score display
- `components/practice/SplashScreen.tsx` — animated entry
- `components/practice/speech-utils.ts` — speech synthesis helpers
- `components/practice/TypingIndicator.tsx` — loading states
- `lib/practice/exercise-generator.ts` — existing exercise generation
- `lib/practice/exercise-bank.ts` — exercise storage
- `lib/supabase/admin.ts` — service role client
- `lib/supabase/server.ts` — server-side client

---

## Phase 1: Database (00:15 - 00:45)

### Migration: `20260215000000_recap_system.sql`

```sql
-- ============================================
-- RECAP SYSTEM
-- Stores tutor lesson recaps and generated episodes
-- ============================================

-- Main recaps table
CREATE TABLE public.recaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_id TEXT UNIQUE NOT NULL,
  
  -- Tutor identity (anonymous until they sign up)
  tutor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tutor_fingerprint TEXT NOT NULL,
  tutor_display_name TEXT,
  
  -- Student identity (captured from recap content)
  student_name TEXT,
  student_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  student_email TEXT,
  
  -- Lesson content
  language TEXT NOT NULL,
  level TEXT,
  raw_input TEXT NOT NULL,
  
  -- AI-generated content (stored as JSONB)
  summary JSONB NOT NULL DEFAULT '{}',
  -- Structure:
  -- {
  --   encouragement: string,
  --   covered: string[],
  --   vocabulary: [{ word, translation, example, phonetic }],
  --   weakSpots: string[],
  --   homework: string,
  --   bonusWord: { word, translation }
  -- }
  
  exercises JSONB NOT NULL DEFAULT '[]',
  -- Structure: array of exercise objects
  -- [
  --   {
  --     type: "multipleChoice" | "fillBlank" | "wordOrder" | "listening",
  --     question: string,
  --     options?: string[],
  --     correct: number | string,
  --     explanation: string,
  --     targetVocab?: string
  --   }
  -- ]
  
  -- Metadata
  scene_template TEXT DEFAULT 'default',
  generation_model TEXT DEFAULT 'gpt-4o-mini',
  generation_time_ms INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Student practice attempts
CREATE TABLE public.recap_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recap_id UUID NOT NULL REFERENCES public.recaps(id) ON DELETE CASCADE,
  
  -- Student identity
  student_fingerprint TEXT,
  student_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Results
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  time_spent_seconds INTEGER,
  answers JSONB NOT NULL DEFAULT '[]',
  -- Structure:
  -- [{ exerciseIndex: number, answer: string|number, correct: boolean, timeMs: number }]
  
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Aggregated student profiles (the CRM)
CREATE TABLE public.recap_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Links to tutor
  tutor_fingerprint TEXT NOT NULL,
  tutor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Student info
  student_name TEXT NOT NULL,
  student_email TEXT,
  student_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Learning profile
  language TEXT,
  level TEXT,
  recap_count INTEGER NOT NULL DEFAULT 0,
  total_exercises_completed INTEGER NOT NULL DEFAULT 0,
  average_score NUMERIC(5,2),
  weak_topics TEXT[] DEFAULT '{}',
  strong_topics TEXT[] DEFAULT '{}',
  
  last_recap_at TIMESTAMPTZ,
  last_practice_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Unique per tutor-student pair
  UNIQUE(tutor_fingerprint, student_name)
);

-- Indexes for performance
CREATE INDEX idx_recaps_short_id ON public.recaps(short_id);
CREATE INDEX idx_recaps_tutor_fp ON public.recaps(tutor_fingerprint);
CREATE INDEX idx_recaps_tutor_id ON public.recaps(tutor_id) WHERE tutor_id IS NOT NULL;
CREATE INDEX idx_recaps_student_name ON public.recaps(student_name);
CREATE INDEX idx_recaps_created ON public.recaps(created_at DESC);
CREATE INDEX idx_recap_attempts_recap ON public.recap_attempts(recap_id);
CREATE INDEX idx_recap_students_tutor ON public.recap_students(tutor_fingerprint);

-- RLS policies
ALTER TABLE public.recaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recap_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recap_students ENABLE ROW LEVEL SECURITY;

-- Recaps: anyone can read by short_id (public links), tutors can read their own
CREATE POLICY "recaps_public_read" ON public.recaps
  FOR SELECT USING (true);

CREATE POLICY "recaps_service_insert" ON public.recaps
  FOR INSERT WITH CHECK (true);

CREATE POLICY "recaps_service_update" ON public.recaps
  FOR UPDATE USING (true);

-- Attempts: anyone can insert (students practice without auth), service can read
CREATE POLICY "attempts_public_insert" ON public.recap_attempts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "attempts_public_read" ON public.recap_attempts
  FOR SELECT USING (true);

-- Students: service role manages
CREATE POLICY "students_service_all" ON public.recap_students
  FOR ALL USING (true);

-- Short ID generation function
CREATE OR REPLACE FUNCTION generate_short_id(length INTEGER DEFAULT 8)
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijkmnpqrstuvwxyz23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate short_id on insert
CREATE OR REPLACE FUNCTION set_recap_short_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.short_id IS NULL THEN
    NEW.short_id := generate_short_id(8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recap_short_id_trigger
  BEFORE INSERT ON public.recaps
  FOR EACH ROW
  EXECUTE FUNCTION set_recap_short_id();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recaps_updated_at
  BEFORE UPDATE ON public.recaps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER recap_students_updated_at
  BEFORE UPDATE ON public.recap_students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### Verification Steps
1. Run migration via Supabase CLI or direct SQL
2. Verify tables exist: `SELECT * FROM public.recaps LIMIT 0;`
3. Verify short_id trigger: `INSERT INTO public.recaps (tutor_fingerprint, language, raw_input, summary) VALUES ('test', 'Spanish', 'test', '{}') RETURNING short_id;`
4. Verify RLS: ensure public read works
5. Clean up test row

---

## Phase 2: API Endpoint (00:45 - 01:45)

### File: `app/api/recap/generate/route.ts`

**Request:**
```typescript
POST /api/recap/generate
Content-Type: application/json

{
  "input": "Sarah, Spanish B1. We covered past tense today - preterite vs imperfect. She keeps mixing up fue and era. Homework: listen to Dakiti by Bad Bunny and find 3 preterite verbs.",
  "tutorFingerprint": "fp_abc123",  // Generated client-side
  "tutorName": "Natalia"             // Optional, extracted from input if missing
}
```

**Processing Steps:**
1. Validate input (non-empty, < 5000 chars)
2. Call OpenAI GPT-4o-mini with structured output prompt
3. Store recap in database
4. Return recap data + short_id

**LLM Prompt (exact):**
```
You are a language teaching assistant. A tutor has just finished a lesson and provided a brief summary. Your job is to extract structured data and generate engaging learning content.

TUTOR'S NOTE:
"""
{input}
"""

Extract and generate the following JSON. Be warm, encouraging, and specific to what was taught:

{
  "studentName": "extracted student name or null",
  "language": "the language being taught",
  "level": "A1/A2/B1/B2/C1/C2 or null if unclear",
  "tutorName": "extracted tutor name or null",
  "encouragement": "A warm, personal 2-sentence encouragement message about today's lesson progress. Reference specific things they did well.",
  "covered": ["topic 1", "topic 2"],
  "vocabulary": [
    {
      "word": "target language word",
      "translation": "English translation",
      "example": "Example sentence using the word",
      "phonetic": "approximate pronunciation guide"
    }
  ],
  "weakSpots": ["specific struggle areas mentioned"],
  "homework": "homework description if mentioned, or a suggested activity",
  "bonusWord": {
    "word": "one extra useful word related to the lesson",
    "translation": "translation"
  },
  "exercises": [
    {
      "type": "multipleChoice",
      "question": "A clear question testing the lesson content",
      "options": ["option A", "option B", "option C", "option D"],
      "correct": 0,
      "explanation": "Why this is correct, referencing the grammar/vocab rule"
    },
    {
      "type": "fillBlank",
      "question": "Sentence with ___ for the student to complete",
      "answer": "correct word",
      "hint": "optional hint",
      "explanation": "Why this word fits here"
    },
    {
      "type": "wordOrder",
      "instruction": "Arrange these words to form a correct sentence",
      "words": ["scrambled", "words", "here"],
      "correctOrder": [2, 0, 1],
      "correctSentence": "The correct sentence",
      "explanation": "Note on word order rules"
    },
    {
      "type": "multipleChoice",
      "question": "Another question on a different aspect",
      "options": ["option A", "option B", "option C", "option D"],
      "correct": 2,
      "explanation": "Explanation"
    },
    {
      "type": "fillBlank",
      "question": "Another fill-the-blank exercise",
      "answer": "correct word",
      "hint": "optional hint",
      "explanation": "Explanation"
    }
  ]
}

Generate exactly 5 exercises. Mix the types. Make them specifically about what was taught in this lesson - not generic. The exercises should feel personalised to this student's weak spots.

Important:
- Vocabulary should have 4-8 words
- Exercises should progress in difficulty
- Use the target language in questions where appropriate
- Explanations should be concise but educational
- If the tutor mentioned specific struggles, focus exercises there
```

**Response:**
```typescript
{
  "success": true,
  "recap": {
    "id": "uuid",
    "shortId": "abc12345",
    "url": "/r/abc12345",
    "studentName": "Sarah",
    "language": "Spanish",
    "level": "B1",
    "summary": { ... },
    "exercises": [ ... ],
    "createdAt": "2026-02-15T00:30:00Z"
  }
}
```

### File: `app/api/recap/[shortId]/route.ts`

**Request:**
```typescript
GET /api/recap/abc12345
```

**Response:** Full recap data for the student-facing page.

### File: `app/api/recap/[shortId]/attempt/route.ts`

**Request:**
```typescript
POST /api/recap/abc12345/attempt
Content-Type: application/json

{
  "score": 4,
  "total": 5,
  "timeSpentSeconds": 180,
  "answers": [
    { "exerciseIndex": 0, "answer": 0, "correct": true, "timeMs": 8000 },
    { "exerciseIndex": 1, "answer": "fue", "correct": true, "timeMs": 12000 },
    ...
  ],
  "studentFingerprint": "fp_xyz789"
}
```

### Verification Steps
1. Start dev server: `npm run dev`
2. Test generate endpoint with curl:
   ```
   curl -X POST http://localhost:3000/api/recap/generate \
     -H "Content-Type: application/json" \
     -d '{"input":"Sarah, Spanish B1, past tense fue vs era","tutorFingerprint":"test123"}'
   ```
3. Verify response has all fields populated
4. Verify database row created with short_id
5. Test GET endpoint with returned short_id
6. Test attempt submission endpoint

---

## Phase 3: Tutor Input Page (01:45 - 02:30)

### Route: `app/recap/page.tsx`

**Note:** This is OUTSIDE the (dashboard) and (public) route groups — it's a standalone page with no nav, no sidebar, no header. Full-screen, focused.

### Design Spec

**Layout:** Full viewport height, centred content, dark mode forced.

**Background:** `#1A1917` (dark mode bg) with subtle radial gradient from `#E8784D` at 4% opacity in centre.

**Content (centred, max-width 480px):**

```
[TutorLingua logo — small, top centre, muted]

[Heading]
"Turn your lesson into
student homework in 
10 seconds."

[Subheading — muted]  
"Describe what you covered. We'll create
an interactive study experience for your student."

[Text area]
- Large, rounded corners (radius-card: 1rem)  
- Dark card background (#2D2A26)
- Placeholder: "e.g. Sarah, Spanish B1. We covered past tense today..."
- Min height: 120px, expands with content
- Subtle border: rgba(245, 242, 239, 0.08)
- Focus ring: #E8784D

[Generate button]
- Full width
- Background: #E8784D
- Text: "✨ Generate Recap"
- Hover: slight scale + brightness
- Loading state: spinner + "Creating magic..."
- Disabled when empty

[Footer text — very muted]
"Free · No signup required · Takes 10 seconds"
```

**After generation success:**

Smooth transition to a "success" state:

```
[Animated checkmark]

"Your recap is ready!"

[Preview card showing student name + lesson topic]

[Link display with copy button]
study.tutorlingua.com/r/abc12345

[Copy link button — primary]
"📋 Copy Link"

[Open preview button — secondary/ghost]
"👁️ Preview"

[Generate another — text link]
"Generate another recap"
```

### Component: `app/recap/RecapGenerator.tsx`

Client component. State machine:
- `idle` → shows input form
- `generating` → shows loading state with animation
- `success` → shows result with link + preview
- `error` → shows error with retry

### Verification Steps
1. Navigate to `localhost:3000/recap`
2. Verify dark mode, centred layout, responsive on mobile (375px width)
3. Type a recap, press generate
4. Verify loading state animation
5. Verify success state shows link
6. Click "Copy Link" — verify clipboard
7. Click "Preview" — verify opens /r/[id] in new tab
8. Click "Generate another" — verify returns to idle state
9. Test error state: disconnect network, try generate
10. Test empty input: verify button disabled
11. Test very long input (5000+ chars): verify truncation/error

---

## Phase 4: Student Experience Page (02:30 - 05:30) ⭐ MAIN EFFORT

### Route: `app/r/[shortId]/page.tsx`

Server component that fetches recap data, passes to client component.

### Design Philosophy
- Dark mode only (forced, not system-preference)
- Full-screen, no navigation, no header
- Card-based swipeable flow
- Each screen is a "step" the student progresses through
- Transitions between steps are smooth (Framer Motion AnimatePresence)
- Mobile-first (designed at 375px, scales up)
- Premium feel: generous spacing, beautiful typography, considered animations

### Component: `app/r/[shortId]/RecapExperience.tsx`

Master client component. Manages step progression.

### Step 1: Welcome Card

```
┌─────────────────────────────────┐
│                                 │
│         [Animated emoji]        │
│            📚                   │
│                                 │
│      Your Lesson Recap          │
│                                 │
│    ┌───────────────────────┐    │
│    │                       │    │
│    │  "Great work today,   │    │
│    │   Sarah! You tackled  │    │
│    │   one of the tricki-  │    │
│    │   est parts of        │    │
│    │   Spanish..."         │    │
│    │                       │    │
│    └───────────────────────┘    │
│                                 │
│    Spanish · B1 · 15 Feb        │
│                                 │
│    What we covered:             │
│    • Preterite vs imperfect     │
│    • Regular -ar conjugation    │
│                                 │
│                                 │
│   [ Continue → ]                │
│                                 │
│   ⚡ tutorlingua.com             │
└─────────────────────────────────┘
```

**Animations:**
- Emoji floats in with spring animation (staggered, 200ms delay)
- Heading fades in + slides up (300ms)
- Encouragement card fades in (500ms)
- Topics fade in staggered (100ms each)
- Continue button fades in last (800ms)

**Component:** `components/recap/WelcomeCard.tsx`

---

### Step 2: Vocabulary Cards

Interactive flashcard-style display. Each word is a card the student can tap to flip.

```
┌─────────────────────────────────┐
│                                 │
│   🔤 Key Vocabulary        2/6  │
│                                 │
│   ┌───────────────────────────┐ │
│   │                           │ │
│   │          fue              │ │
│   │                           │ │
│   │    /fweh/                 │ │
│   │                           │ │
│   │    [ Tap to reveal ]      │ │
│   │                           │ │
│   └───────────────────────────┘ │
│                                 │
│   ← swipe →                    │
│                                 │
│   "Ella fue al mercado ayer"    │
│                                 │
│   ● ● ○ ○ ○ ○                  │
│                                 │
│   [ I know these → ]           │
│                                 │
│   ⚡ tutorlingua.com             │
└─────────────────────────────────┘
```

**After tap (flipped):**
```
│   ┌───────────────────────────┐ │
│   │                           │ │
│   │   was / went              │ │
│   │   (preterite)             │ │
│   │                           │ │
│   │   🔊 Listen               │ │
│   │                           │ │
│   └───────────────────────────┘ │
```

**Interactions:**
- Swipe left/right between vocabulary cards
- Tap card to flip (3D CSS transform, rotateY)
- 🔊 button uses Web Speech API `speechSynthesis` to pronounce the word
- Dot indicators show position
- "I know these" advances to exercises

**Component:** `components/recap/VocabCards.tsx`

---

### Step 3-7: Exercises (5 exercises, one per step)

Each exercise is a full-screen step with its own interaction type.

#### Exercise Type A: Multiple Choice

```
┌─────────────────────────────────┐
│                                 │
│   Question 1 of 5          🧠  │
│   ━━━━━━━━━━━░░░░░░░░░░░░░░░   │
│                                 │
│   Complete the sentence:        │
│                                 │
│   "Cuando yo ___ pequeño,       │
│    ___ al parque todos          │
│    los días."                   │
│                                 │
│   ┌───────────────────────────┐ │
│   │  A) fui / iba             │ │
│   └───────────────────────────┘ │
│   ┌───────────────────────────┐ │
│   │  B) era / iba        ✓   │ │
│   └───────────────────────────┘ │
│   ┌───────────────────────────┐ │
│   │  C) fue / fui             │ │
│   └───────────────────────────┘ │
│   ┌───────────────────────────┐ │
│   │  D) era / fue             │ │
│   └───────────────────────────┘ │
│                                 │
│   ⚡ tutorlingua.com             │
└─────────────────────────────────┘
```

**After answering (correct):**
```
│   ┌─── ✅ ────────────────────┐ │
│   │  B) era / iba             │ │
│   └───────────────────────────┘ │
│                                 │
│   ┌───────────────────────────┐ │
│   │ ✨ Correct!                │ │
│   │                           │ │
│   │ Both describe ongoing     │ │
│   │ past states/habits, so    │ │
│   │ imperfect is needed.      │ │
│   └───────────────────────────┘ │
│                                 │
│   [ Next → ]                    │
```

**After answering (wrong):**
```
│   ┌─── ❌ ────────────────────┐ │
│   │  A) fui / iba             │ │
│   └───────────────────────────┘ │
│   ┌─── ✅ ────────────────────┐ │
│   │  B) era / iba             │ │
│   └───────────────────────────┘ │
│                                 │
│   ┌───────────────────────────┐ │
│   │ Not quite!                │ │
│   │                           │ │
│   │ "Cuando yo era pequeño"   │ │
│   │ uses imperfect because    │ │
│   │ it's a state that lasted  │ │
│   │ over time.                │ │
│   └───────────────────────────┘ │
│                                 │
│   [ Next → ]                    │
```

**Animations:**
- Correct: selected option flashes green, brief confetti burst (3-4 particles), explanation slides up
- Wrong: selected option flashes red, correct option highlights green, explanation slides up
- Option tap: subtle scale press (0.97) + release

**Component:** `components/recap/MultipleChoiceExercise.tsx`

---

#### Exercise Type B: Fill in the Blank

```
┌─────────────────────────────────┐
│                                 │
│   Question 2 of 5          ✏️   │
│   ━━━━━━━━━━━━━━░░░░░░░░░░░░   │
│                                 │
│   Fill in the blank:            │
│                                 │
│   "Ayer ella _______ al         │
│    mercado para comprar         │
│    frutas."                     │
│                                 │
│   ┌───────────────────────────┐ │
│   │ Type your answer...       │ │
│   └───────────────────────────┘ │
│                                 │
│   💡 Hint: preterite of ir      │
│                                 │
│   [ Check → ]                   │
│                                 │
│   ⚡ tutorlingua.com             │
└─────────────────────────────────┘
```

**Interactions:**
- Text input with auto-focus
- Submit on Enter or button tap
- Case-insensitive comparison
- Accept accented and non-accented variants (fue = fué)
- Hint appears after 10 seconds or on tap

**Component:** `components/recap/FillBlankExercise.tsx`

---

#### Exercise Type C: Word Order

```
┌─────────────────────────────────┐
│                                 │
│   Question 3 of 5          🔀  │
│   ━━━━━━━━━━━━━━━━━━░░░░░░░░   │
│                                 │
│   Arrange the words:            │
│                                 │
│   ┌─────────────────────────┐   │
│   │ ___ ___ ___ ___ ___ ___ │   │
│   └─────────────────────────┘   │
│                                 │
│   ┌──────┐ ┌──────┐ ┌──────┐   │
│   │mercado│ │ al   │ │ Ella │   │
│   └──────┘ └──────┘ └──────┘   │
│   ┌──────┐ ┌──────┐ ┌──────┐   │
│   │ fue  │ │ ayer  │ │  .   │   │
│   └──────┘ └──────┘ └──────┘   │
│                                 │
│   [ Check → ]                   │
│                                 │
│   ⚡ tutorlingua.com             │
└─────────────────────────────────┘
```

**Interactions:**
- Tap a word tile → it moves to the answer slots (with spring animation)
- Tap a placed word → it returns to the pool
- Can also drag-and-drop (using @dnd-kit)
- Check validates the full sentence
- Correct order animates tiles to green with stagger

**Component:** `components/recap/WordOrderExercise.tsx`

---

### Step 8: Results Card

```
┌─────────────────────────────────┐
│                                 │
│            🎉                   │
│                                 │
│      Amazing work,              │
│      Sarah!                     │
│                                 │
│   ┌───────────────────────────┐ │
│   │                           │ │
│   │       ╭────────╮          │ │
│   │       │  4/5   │          │ │
│   │       │  80%   │          │ │
│   │       ╰────────╯          │ │
│   │                           │ │
│   │  ✅ Multiple choice   2/2 │ │
│   │  ✅ Fill in blank     1/1 │ │
│   │  ❌ Word order        1/2 │ │
│   │                           │ │
│   │  ⏱️ 3 min 24 sec          │ │
│   │                           │ │
│   └───────────────────────────┘ │
│                                 │
│   🎁 Bonus word:                │
│   libertad = freedom            │
│                                 │
│   ┌───────────────────────────┐ │
│   │  Want to save your        │ │
│   │  progress? Sign in to     │ │
│   │  track improvement        │ │
│   │  over time.               │ │
│   │                           │ │
│   │  [ Maybe later ]          │ │
│   └───────────────────────────┘ │
│                                 │
│   ⚡ Powered by TutorLingua     │
└─────────────────────────────────┘
```

**Animations:**
- Score ring: animated SVG circle that fills to the percentage (1.5s ease-out)
- Score number: counts up from 0 to final score
- Exercise breakdown: stagger fade-in (100ms each)
- Bonus word: fade in after 1s delay
- CTA: fade in after 2s delay
- If score is 5/5: 🎊 confetti burst animation

**Component:** `components/recap/ResultsCard.tsx` (new, separate from practice ResultsCard)

---

## Phase 5: Integration & Polish (05:30 - 06:30)

### Symlink / copy env
```bash
# Ensure app can find env vars
cp ~/Desktop/tutor-space/.env.local ~/Desktop/tutor-space/app/.env.local
# Add OPENAI_API_KEY if not present
```

### Progress indicator
- Thin progress bar at top of student experience page
- Shows current step / total steps
- Animated width transition

### Mobile testing
- Test at 375px width (iPhone SE)
- Test at 390px width (iPhone 14)
- Test at 414px width (iPhone 14 Plus)
- Verify touch targets ≥ 44px
- Verify no horizontal scroll
- Verify text readable without zoom

### Animation polish
- Verify all transitions feel smooth (60fps)
- No layout shift during step transitions
- Loading states for async operations
- Error boundaries for each step

### Edge cases
- Recap not found → 404 page
- Empty exercises array → skip to results
- Very long vocabulary (10+ words) → scroll within card
- Network error during generation → retry UI
- Very long student name → truncation

---

## Phase 6: End-to-End Testing (06:30 - 07:30)

### Test Script (manual, in browser)

**Test 1: Full tutor flow**
1. Open `localhost:3000/recap`
2. Enter: "Maria, French A2. Today we learned food vocabulary - pain, fromage, pomme, boulangerie. She struggled with pronunciation of 'r' sounds. Homework: go to a French bakery video on YouTube and list 5 items."
3. Click Generate
4. Verify loading animation
5. Verify success screen with link
6. Copy link
7. Open link in new tab

**Test 2: Full student flow**
1. Open the generated link
2. Verify welcome card loads with correct data (Maria, French, A2)
3. Read encouragement — verify it's personalised
4. Tap Continue
5. Swipe through vocabulary cards — verify all words present
6. Tap to flip — verify translation shows
7. Tap audio — verify pronunciation plays
8. Tap "I know these"
9. Complete exercise 1 (multiple choice) — get correct
10. Complete exercise 2 (fill blank) — get wrong, verify feedback
11. Complete exercise 3 (word order) — test drag and tap
12. Complete exercises 4-5
13. Verify results card with correct score
14. Verify bonus word displays
15. Verify time tracking is accurate

**Test 3: Different languages**
1. Generate recap for: Japanese, German, Portuguese
2. Verify exercises are appropriate for each language
3. Verify speech synthesis works for each language

**Test 4: Mobile**
1. Open Chrome DevTools → responsive mode → 375px
2. Run through full student flow
3. Verify all touch targets work
4. Verify no overflow/scroll issues

**Test 5: Edge cases**
1. Generate with minimal input: "Tom, Spanish"
2. Generate with very detailed input (500+ words)
3. Open invalid short_id → verify 404
4. Submit attempt with all correct → verify 5/5 celebration
5. Submit attempt with all wrong → verify encouraging messaging

---

## Phase 7: Documentation & Commit (07:30 - 08:00)

### Files to commit
```
supabase/migrations/20260215000000_recap_system.sql
app/recap/page.tsx
app/recap/RecapGenerator.tsx
app/r/[shortId]/page.tsx
app/r/[shortId]/RecapExperience.tsx
app/r/[shortId]/not-found.tsx
app/api/recap/generate/route.ts
app/api/recap/[shortId]/route.ts
app/api/recap/[shortId]/attempt/route.ts
components/recap/WelcomeCard.tsx
components/recap/VocabCards.tsx
components/recap/MultipleChoiceExercise.tsx
components/recap/FillBlankExercise.tsx
components/recap/WordOrderExercise.tsx
components/recap/ResultsCard.tsx
components/recap/ExerciseProgress.tsx
components/recap/StepTransition.tsx
lib/recap/generate.ts        (LLM prompt + processing)
lib/recap/types.ts            (TypeScript types)
lib/recap/fingerprint.ts      (browser fingerprint util)
```

### Commit message
```
feat: add recap system — tutor input → AI-generated interactive student experience

- Database: recaps, recap_attempts, recap_students tables with RLS
- API: generate, fetch, and record attempt endpoints
- Tutor page: /recap with text input, generation, and link sharing
- Student page: /r/[id] with animated card-based learning flow
- Exercises: multiple choice, fill-in-blank, word ordering
- Design: dark mode, mobile-first, Framer Motion animations
- CRM: silently builds tutor-student relationship data
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| OpenAI API fails | Catch errors, show retry UI, log failures |
| Supabase migration fails | Test SQL in Supabase dashboard first |
| Session drops overnight | Codex runs in --full-auto with wake triggers; commit after each phase |
| Animation performance | Test on mobile viewport, use `will-change`, avoid layout thrash |
| LLM generates bad exercises | Validate JSON structure, fallback to template exercises |
| Web Speech API unavailable | Feature-detect, hide audio buttons if not supported |

---

## Time Budget

| Phase | Time | Duration |
|-------|------|----------|
| 1. Database | 00:15 - 00:45 | 30 min |
| 2. API | 00:45 - 01:45 | 60 min |
| 3. Tutor input page | 01:45 - 02:30 | 45 min |
| 4. Student experience | 02:30 - 05:30 | 180 min |
| 5. Integration & polish | 05:30 - 06:30 | 60 min |
| 6. Testing | 06:30 - 07:30 | 60 min |
| 7. Docs & commit | 07:30 - 08:00 | 30 min |
| **Total** | | **7h 45m** |
| **Buffer** | | **15 min** |
