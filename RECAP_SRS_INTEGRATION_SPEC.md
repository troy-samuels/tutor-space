# Recap → SRS Integration Spec

> **Goal:** Close the learning loop. Recap exercises feed into the spaced repetition system, students get adaptive review, tutors see where students actually struggle.

---

## The Problem

Today, recaps and SRS are two disconnected systems:

| System | Knows about student | Adapts over time | Tutor visibility |
|--------|---------------------|------------------|-----------------|
| **Recaps** | Name + fingerprint only | ❌ Every recap starts from zero | Score per attempt, nothing cumulative |
| **SRS (drills)** | Full student profile | ✅ SM-2 scheduling, mastery tracking | Due items, mastery breakdown |

A student could get "subjunctive" wrong in 5 consecutive recaps and the system wouldn't notice. The tutor sees individual scores but no patterns.

### What's missing

1. **Recap → SRS bridge** — recap exercise results don't create or update SRS items
2. **Cross-recap context** — recap generation doesn't know what previous recaps covered or what the student got wrong
3. **Tutor weak-spot dashboard** — no aggregated view of "this student keeps failing X"
4. **Adaptive exercise generation** — no way to say "include 2 review exercises from previous weak spots"

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   RECAP FLOW                         │
│                                                      │
│  Tutor notes → generateRecap() → 5 exercises        │
│                      ↑                               │
│              NEW: inject prior                       │
│              weak spots + due                        │
│              SRS items as context                    │
│                      │                               │
│  Student completes → POST /attempt                   │
│                      │                               │
│              NEW: for each wrong answer,             │
│              create/update SRS item                  │
│                      │                               │
│              NEW: for each right answer,             │
│              record positive review                  │
│                      ↓                               │
│            spaced_repetition_items                    │
│                      │                               │
│              NEW: aggregate into                     │
│              student_weak_spots view                 │
│                      ↓                               │
│            Tutor dashboard card                      │
└─────────────────────────────────────────────────────┘
```

---

## Phase 1: Recap Results → SRS Items

### 1.1 New function: `ingestRecapAttempt()`

**File:** `lib/recap/srs-bridge.ts`

When a student submits a recap attempt, convert each exercise answer into an SRS event:

```typescript
import { createSRItem, recordReview } from "@/lib/spaced-repetition/scheduler";
import { estimateQuality } from "@/lib/spaced-repetition/sm2";
import type { RecapExercise, AttemptAnswer } from "@/lib/recap/types";

interface IngestParams {
  recapId: string;
  tutorId: string;            // from recap.tutor_id
  studentFingerprint: string; // from attempt
  studentId: string | null;   // if authenticated
  exercises: RecapExercise[];
  answers: AttemptAnswer[];
  language: string;
  level: string | null;
}

export async function ingestRecapAttempt(params: IngestParams) {
  const { exercises, answers, tutorId, studentFingerprint, studentId, recapId, language } = params;

  // We need a stable student identifier for SRS.
  // Use studentId (auth'd) if available, else derive a pseudo-ID from fingerprint.
  const srsStudentId = studentId ?? `fp:${studentFingerprint}`;

  for (const answer of answers) {
    const exercise = exercises[answer.exerciseIndex];
    if (!exercise) continue;

    // Build a stable item key from the exercise content
    const itemKey = buildItemKey(exercise, language);

    // Map exercise content to SRS item content
    const itemContent = {
      type: exercise.type,
      question: exercise.question,
      answer: exercise.answer ?? exercise.options?.[exercise.correct ?? 0] ?? exercise.correctSentence,
      explanation: exercise.explanation,
      hint: exercise.hint,
      targetVocab: exercise.targetVocab,
      sourceRecapId: recapId,
    };

    // Determine item type for SM-2 modifiers
    const itemType = exercise.targetVocab ? "vocabulary" : "grammar";

    // Create or find existing SRS item
    const itemId = await createSRItem({
      studentId: srsStudentId,
      tutorId,
      itemType,
      itemContent,
      itemKey,
      sourceLessonId: recapId,  // link back to the recap
    });

    // Record the review
    const quality = estimateQuality(answer.correct, answer.timeMs, 8000);
    await recordReview(itemId, quality, answer.timeMs);
  }
}

/**
 * Build a stable, deduplicatable key for an exercise.
 * Same concept tested across recaps should map to the same SRS item.
 */
function buildItemKey(exercise: RecapExercise, language: string): string {
  // Use targetVocab if available (most stable identifier)
  if (exercise.targetVocab) {
    return `recap:${language}:vocab:${exercise.targetVocab.toLowerCase().trim()}`;
  }

  // For grammar/structural exercises, hash the answer
  const answer = exercise.answer
    ?? exercise.correctSentence
    ?? exercise.options?.[exercise.correct ?? 0]
    ?? exercise.question;

  return `recap:${language}:exercise:${answer.toLowerCase().trim().slice(0, 80)}`;
}
```

### 1.2 Hook into attempt submission

**File:** `app/api/recap/[shortId]/attempt/route.ts`

After the existing insert, call the bridge:

```typescript
// After successful attempt insert...

// Fetch the parent recap for exercise data + tutor info
const { data: parentRecap } = await adminClient
  .from("recaps")
  .select("id, tutor_id, tutor_fingerprint, exercises, summary")
  .eq("id", recap.id)
  .single();

if (parentRecap?.exercises && answers.length > 0) {
  // Fire and forget — don't block the response
  ingestRecapAttempt({
    recapId: parentRecap.id,
    tutorId: parentRecap.tutor_id ?? parentRecap.tutor_fingerprint,
    studentFingerprint: studentFingerprint ?? "anonymous",
    studentId: null,  // Recap students aren't auth'd yet
    exercises: parentRecap.exercises as RecapExercise[],
    answers,
    language: (parentRecap.summary as any)?.language ?? "Unknown",
    level: (parentRecap.summary as any)?.level ?? null,
  }).catch((err) => {
    console.error("[Recap SRS Bridge] Ingestion failed:", err);
  });
}
```

### 1.3 Student identity challenge

Recap students are identified by `student_fingerprint` (a random UUID in localStorage), not by Supabase auth. This means:

- **Same device, same browser** → same fingerprint → SRS items accumulate correctly
- **Different device** → new fingerprint → items don't link

**Solution for now:** Use `fp:{fingerprint}` as the SRS student ID. This works for the common case (student uses the same phone each time).

**Future upgrade:** When a student signs up for practice sessions (authenticated), migrate their fingerprint-based SRS items to their real user ID:

```sql
-- Migration: link fingerprint items to authenticated student
UPDATE spaced_repetition_items
SET student_id = $auth_student_id
WHERE student_id = 'fp:' || $fingerprint
  AND student_id LIKE 'fp:%';
```

---

## Phase 2: Context-Aware Recap Generation

### 2.1 Fetch prior weak spots before generating

**File:** `lib/recap/generate.ts`

Before calling the LLM, query the student's SRS history to find weak items:

```typescript
interface RecapContext {
  weakItems: Array<{
    itemKey: string;
    itemType: string;
    content: Record<string, unknown>;
    correctRate: number;    // 0-1
    totalReviews: number;
    lastReviewAt: string;
  }>;
  recentRecapTopics: string[];  // "covered" arrays from last 3 recaps
  studentLevel: string | null;
}

async function getStudentRecapContext(
  studentFingerprint: string,
  tutorFingerprint: string,
  limit: number = 10
): Promise<RecapContext> {
  const supabase = createServiceRoleClient();
  const srsStudentId = `fp:${studentFingerprint}`;

  // 1. Get weak SRS items (low correct rate, high review count)
  const { data: weakItems } = await supabase
    .from("spaced_repetition_items")
    .select("item_key, item_type, item_content, correct_count, incorrect_count, total_reviews, last_review_at")
    .eq("student_id", srsStudentId)
    .gt("total_reviews", 0)
    .order("ease_factor", { ascending: true })  // Hardest items first
    .limit(limit);

  // 2. Get recent recap topics (last 3 recaps from this tutor for this student)
  const { data: recentRecaps } = await supabase
    .from("recaps")
    .select("summary")
    .eq("tutor_fingerprint", tutorFingerprint)
    .order("created_at", { ascending: false })
    .limit(3);

  const recentTopics = (recentRecaps ?? [])
    .flatMap((r) => (r.summary as any)?.covered ?? []);

  return {
    weakItems: (weakItems ?? []).map((item) => ({
      itemKey: item.item_key,
      itemType: item.item_type,
      content: item.item_content,
      correctRate: item.total_reviews > 0
        ? item.correct_count / item.total_reviews
        : 0,
      totalReviews: item.total_reviews,
      lastReviewAt: item.last_review_at,
    })),
    recentRecapTopics: recentTopics,
    studentLevel: null, // Set from recap_students if available
  };
}
```

### 2.2 Updated system prompt injection

Add a context block to the LLM prompt when prior data exists:

```typescript
// In generateRecap(), before the LLM call:
let contextBlock = "";

if (recapContext && recapContext.weakItems.length > 0) {
  const weakSummary = recapContext.weakItems
    .filter((w) => w.correctRate < 0.6)  // Items they get wrong >40% of the time
    .slice(0, 5)
    .map((w) => {
      const content = w.content as any;
      return `- "${content.question}" (correct ${Math.round(w.correctRate * 100)}% of the time, type: ${w.itemType})`;
    })
    .join("\n");

  if (weakSummary) {
    contextBlock = `

STUDENT HISTORY (from previous recaps):
This student has struggled with these items in past lessons:
${weakSummary}

Recent topics already covered: ${recapContext.recentRecapTopics.join(", ")}

INSTRUCTIONS FOR REVIEW:
- Include 1-2 exercises that revisit the weak spots above (rephrased, not identical)
- The remaining 3-4 exercises should cover NEW material from today's lesson
- Do NOT repeat the exact same questions — test the same concept differently
- Mark review exercises with "targetVocab" matching the weak item if applicable`;
  }
}
```

### 2.3 Exercise mix: new vs review

With context, the 5 exercises become:

| Exercises | Source | Purpose |
|-----------|--------|---------|
| 1-2 | Prior weak spots (SRS items with low correctRate) | **Review** — spaced repetition via recaps |
| 3-5 | Today's lesson notes | **New** — fresh material from this lesson |

If no prior data exists (first recap), all 5 are new material as today.

---

## Phase 3: Tutor Weak-Spot Dashboard

### 3.1 Database view: `student_weak_spots`

```sql
CREATE OR REPLACE VIEW student_weak_spots AS
SELECT
  sri.student_id,
  sri.tutor_id,
  sri.item_type,
  sri.item_key,
  sri.item_content,
  sri.ease_factor,
  sri.interval_days,
  sri.repetition_count,
  sri.total_reviews,
  sri.correct_count,
  sri.incorrect_count,
  CASE
    WHEN sri.total_reviews > 0
    THEN ROUND(sri.correct_count::numeric / sri.total_reviews, 2)
    ELSE 0
  END AS correct_rate,
  sri.last_review_at,
  sri.next_review_at,
  -- Mastery bucket
  CASE
    WHEN sri.repetition_count = 0 THEN 'new'
    WHEN sri.interval_days < 7 THEN 'learning'
    WHEN sri.interval_days >= 30 THEN 'mastered'
    ELSE 'reviewing'
  END AS mastery_status
FROM spaced_repetition_items sri
WHERE sri.student_id LIKE 'fp:%'  -- Recap-sourced items
   OR sri.student_id IN (SELECT id FROM auth.users)
ORDER BY sri.ease_factor ASC;  -- Hardest items first
```

### 3.2 API: `GET /api/tutor/students/[fingerprint]/weak-spots`

```typescript
// Returns aggregated weak spots for a student, grouped by category

interface WeakSpotResponse {
  student: {
    name: string;
    language: string;
    level: string | null;
    totalRecaps: number;
    totalExercises: number;
    overallCorrectRate: number;
  };
  weakSpots: Array<{
    category: string;        // "vocabulary" | "grammar" | "word_order"
    items: Array<{
      concept: string;       // e.g. "subjuntivo" or "ser vs estar"
      correctRate: number;   // 0-1
      totalAttempts: number;
      lastAttempt: string;   // ISO date
      masteryStatus: "new" | "learning" | "reviewing" | "mastered";
      trend: "improving" | "stable" | "declining";
    }>;
    averageCorrectRate: number;
  }>;
  recommendations: string[];  // AI-generated suggestions for next lesson focus
}
```

### 3.3 Tutor dashboard component: `StudentInsightsCard`

**Location:** `components/dashboard/StudentInsightsCard.tsx`

Shows on the tutor dashboard per student:

```
┌─────────────────────────────────────────┐
│  Maria — Spanish (B1)                    │
│  3 recaps · 15 exercises · 73% correct   │
│                                          │
│  ⚠️ Struggling with:                     │
│  ├── Subjunctive mood (2/5 correct)      │
│  ├── Ser vs estar (3/6 correct)          │
│  └── Object pronouns (1/4 correct)       │
│                                          │
│  ✅ Strong on:                            │
│  ├── Greetings vocabulary (5/5)           │
│  └── Present tense conjugation (4/5)     │
│                                          │
│  📈 Trend: Improving (was 60% → now 73%) │
│                                          │
│  💡 Suggested focus: Subjunctive mood     │
│     exercises with regular -ar verbs      │
└─────────────────────────────────────────┘
```

### 3.4 Linking students across recaps

The `recap_students` table already tracks `tutor_fingerprint` + `student_name` + `recap_count`. We use this as the bridge:

1. When generating a recap, the LLM extracts `studentName`
2. We look up that student in `recap_students`
3. We use their fingerprint to query their SRS items
4. Tutor dashboard groups by `recap_students` entries

**Edge case:** Student name changes or is misspelt across recaps. For MVP, exact string match. Later, fuzzy matching.

---

## Phase 4: Student-Facing Progress (Post-Recap)

### 4.1 Enhanced ResultsCard

After completing exercises, show the student:

```
┌─────────────────────────────────────────┐
│  🎉 Amazing work! 4/5 correct           │
│                                          │
│  📊 Your progress over time:             │
│  ├── Vocabulary: ████████░░ 80%          │
│  ├── Grammar:    █████░░░░░ 50%          │
│  └── Word order: ██████████ 100%         │
│                                          │
│  🔄 Coming back in your next recap:      │
│  └── "Ser vs estar" (you've seen this    │
│      2 times — keep practising!)         │
│                                          │
│  🔥 3-recap streak! Keep it up.          │
└─────────────────────────────────────────┘
```

This requires fetching the student's SRS stats at results time (by fingerprint).

### 4.2 API: `GET /api/recap/student-progress?fp={fingerprint}`

Returns the student's cumulative stats across all recaps:

```typescript
interface StudentRecapProgress {
  totalRecaps: number;
  totalExercises: number;
  overallCorrectRate: number;
  streakDays: number;
  masteryByType: Record<string, { correct: number; total: number; rate: number }>;
  dueForReview: number;  // Items that will appear in next recap
  improvingItems: string[];  // Concepts getting better
  strugglingItems: string[];  // Concepts still weak
}
```

---

## Migration Plan

### Step 1: Schema changes

```sql
-- Allow non-UUID student IDs in spaced_repetition_items (for fp: prefix)
-- Check current constraint on student_id column
-- May need: ALTER TABLE spaced_repetition_items ALTER COLUMN student_id TYPE text;

-- Add source_type to distinguish recap-sourced vs drill-sourced items
ALTER TABLE spaced_repetition_items
  ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'drill'
  CHECK (source_type IN ('drill', 'recap', 'manual'));

-- Add recap_id reference
ALTER TABLE spaced_repetition_items
  ADD COLUMN IF NOT EXISTS source_recap_id uuid REFERENCES recaps(id) ON DELETE SET NULL;

-- Index for fast lookups by fingerprint-based student ID
CREATE INDEX IF NOT EXISTS idx_sri_student_id_prefix
  ON spaced_repetition_items (student_id)
  WHERE student_id LIKE 'fp:%';

-- View for tutor dashboard
CREATE OR REPLACE VIEW student_weak_spots AS
SELECT
  sri.student_id,
  sri.tutor_id,
  sri.item_type,
  sri.item_key,
  sri.item_content ->> 'question' AS question,
  sri.item_content ->> 'answer' AS answer,
  sri.item_content ->> 'targetVocab' AS target_vocab,
  sri.ease_factor,
  sri.total_reviews,
  sri.correct_count,
  sri.incorrect_count,
  CASE
    WHEN sri.total_reviews > 0
    THEN ROUND(sri.correct_count::numeric / sri.total_reviews, 2)
    ELSE 0
  END AS correct_rate,
  sri.last_review_at,
  sri.next_review_at
FROM spaced_repetition_items sri
WHERE sri.total_reviews > 0
ORDER BY correct_rate ASC, sri.total_reviews DESC;
```

### Step 2: Implementation order

| Order | Task | Effort | Impact |
|-------|------|--------|--------|
| 1 | `lib/recap/srs-bridge.ts` — ingest function | S | Foundation for everything else |
| 2 | Hook into `attempt/route.ts` | XS | Connects the bridge |
| 3 | Schema migration | S | Enables fingerprint-based SRS |
| 4 | `getStudentRecapContext()` | M | Enables adaptive generation |
| 5 | Update `generateRecap()` prompt | S | Makes exercises adaptive |
| 6 | Tutor weak-spot API | M | Enables dashboard |
| 7 | `StudentInsightsCard` component | M | Tutor sees patterns |
| 8 | Enhanced `ResultsCard` with progress | M | Student sees their journey |
| 9 | Student progress API | S | Powers the enhanced results |

**Total estimate:** ~3–4 days of focused work.

### Step 3: Backfill existing data

For recaps that already have attempts, run a one-time backfill:

```typescript
// Cron job: /api/cron/recap-srs-backfill
// Iterate all recap_attempts, call ingestRecapAttempt() for each
// Mark processed with a flag to avoid re-processing
```

---

## What Changes for the Student

### Before (today)
1. Tutor sends recap link
2. Student does 5 exercises (all new, from today's lesson)
3. Sees score: "4/5 — Great effort!"
4. Done. No continuity.

### After
1. Tutor sends recap link
2. Student does 5 exercises:
   - **3 new** from today's lesson
   - **2 review** from previous weak spots (rephrased)
3. Sees score + cumulative progress:
   - "Your vocabulary is improving! 60% → 80% over 3 recaps"
   - "Subjunctive still needs work — we'll keep practising"
4. Wrong answers automatically scheduled for future review
5. Next recap will include those weak spots again

### What Changes for the Tutor

### Before (today)
- Sees individual recap scores (3/5, 4/5, etc.)
- No cross-recap patterns
- No idea what to focus next lesson on

### After
- **Dashboard card per student** showing:
  - Cumulative correct rate across all recaps
  - Specific weak spots with attempt counts
  - Improvement trends
  - AI-suggested focus areas for next lesson
- Can click into a student to see full exercise history
- Knows exactly what to teach before the lesson starts

---

## Open Questions

1. **Exercise count:** Stay at 5, or increase to 7 (2 review + 5 new) when prior data exists?
2. **Student identity:** Is fingerprint-only good enough for MVP, or should we push students to create accounts earlier in the flow?
3. **Tutor notifications:** Should we email/notify the tutor when a student completes a recap? ("Maria scored 3/5 — she's struggling with subjunctive")
4. **Recap frequency awareness:** Should the system know how often a student receives recaps? (weekly vs after every lesson affects SRS intervals)
