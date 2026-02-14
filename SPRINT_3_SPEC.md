# Sprint 3: AI Cost Optimisation

## Business Context

Sprints 1-2 unlocked the revenue model and viral growth loops. Now we need to make the unit economics work. Every practice session currently makes a real-time GPT-4o-mini call per message — that's the single biggest variable cost. At scale (1,000 concurrent students), this burns money fast.

Sprint 3 cuts AI cost-per-session by ~60-80% through four strategies:
1. **Tiered inference routing** — use the cheapest model that satisfies each task
2. **Semantic cache** — identical or near-identical queries hit cache instead of LLM
3. **Pre-generated exercise banks** — build exercises ahead of time from lesson transcripts
4. **Remove real-time AI from the hot path** — practice sessions serve pre-built content where possible

## Current State (What We're Optimising)

### AI Calls Per Practice Session (today)
| Call | File | Model | max_tokens | When |
|------|------|-------|------------|------|
| Greeting | `lib/practice/greeting.ts` | gpt-4o-mini | 150 | Session start |
| Chat (each message) | `api/practice/chat/route.ts` | gpt-4o-mini | 200 | Every student message |
| Chat stream | `api/practice/chat/stream/route.ts` | gpt-4o-mini | 200 | Every student message (stream mode) |
| End-session feedback | `api/practice/end-session/route.ts` | gpt-4o-mini | 300 | Session end |

### AI Calls Outside Practice (lesson analysis — NOT in hot path)
| Call | File | Model | max_tokens | When |
|------|------|-------|------------|------|
| Lesson insights | `lib/analysis/lesson-insights.ts` | gpt-4o-mini | 1500 | After lesson ends |
| Student speech analysis | `lib/analysis/student-speech-analyzer.ts` | gpt-4o-mini | 2500 | After lesson ends |
| Tutor speech analysis | `lib/analysis/tutor-speech-analyzer.ts` | gpt-4o-mini | — | After lesson ends |
| Copilot activity suggest | `lib/copilot/activity-suggester.ts` | gpt-4o-mini | 500 | Dashboard load |
| Profile analyser | `api/ai/profile-analyser/route.ts` | gpt-4o-mini | — | On demand |
| Deepgram webhook | `api/webhooks/deepgram/route.ts` | gpt-4o-mini | — | Audio transcription |

### Cost Estimate (current)
A typical 20-turn practice session:
- 1 greeting call (~150 tokens out)
- 20 chat calls (~200 tokens out each = 4,000 tokens out)
- 1 end-session call (~300 tokens out)
- Plus input tokens (system prompt + history grows per turn)
- **Estimated total: ~15,000-25,000 tokens per session**
- At GPT-4o-mini pricing ($0.15/1M input, $0.60/1M output): **~$0.003-0.005 per session**
- At 10,000 sessions/day: **$30-50/day = ~$1,000-1,500/month**

## Deliverables

### 1. Model Router (`lib/ai/model-router.ts`)

Create a centralised model routing layer that all AI calls go through. This replaces direct `createPracticeChatCompletion` calls.

```typescript
export type InferenceTask =
  | "practice_chat"        // Real-time conversation (latency-sensitive)
  | "practice_greeting"    // Session opener
  | "session_feedback"     // End-of-session analysis
  | "lesson_analysis"      // Post-lesson insights (can be slow)
  | "speech_analysis"      // Post-lesson speech review (can be slow)
  | "exercise_generation"  // Pre-generating exercise banks (batch, overnight)
  | "grammar_explanation"  // Explaining a grammar rule (highly cacheable)
  | "copilot_suggestion"   // Dashboard activity suggestions
  | "profile_analysis";    // AI profile analyser

export type ModelTier = "fast" | "standard" | "quality";

export interface ModelRouterConfig {
  task: InferenceTask;
  /** Override the default tier for this task */
  tierOverride?: ModelTier;
  /** If true, check semantic cache before calling LLM */
  cacheable?: boolean;
  /** Cache TTL in seconds (default: 86400 = 24h) */
  cacheTtlSeconds?: number;
}

export function getModelForTask(task: InferenceTask): {
  model: string;
  tier: ModelTier;
  maxTokens: number;
  temperature: number;
} {
  // Route each task to the optimal model
}

export async function routedChatCompletion(
  config: ModelRouterConfig,
  params: Omit<ChatCompletionParams, "model">
): Promise<ChatCompletion> {
  // 1. Check semantic cache if cacheable
  // 2. Route to correct model
  // 3. Call OpenAI
  // 4. Store in cache if cacheable
  // 5. Return result
}

export async function routedChatStream(
  config: ModelRouterConfig,
  params: Omit<ChatCompletionStreamParams, "model" | "stream">
): Promise<Stream<ChatCompletionChunk>> {
  // Streaming doesn't use cache (real-time conversation)
  // But still routes to correct model
}
```

#### Model Routing Table

| Task | Model | Tier | Rationale |
|------|-------|------|-----------|
| `practice_chat` | gpt-4o-mini | fast | Latency-critical, already cheap |
| `practice_greeting` | gpt-4o-mini | fast | Short output, needs to feel quick |
| `session_feedback` | gpt-4o-mini | standard | Can tolerate 1-2s extra latency |
| `lesson_analysis` | gpt-4o-mini | standard | Background job, not user-facing |
| `speech_analysis` | gpt-4o-mini | standard | Background job |
| `exercise_generation` | gpt-4o | quality | Batch job, quality matters for pre-built exercises |
| `grammar_explanation` | gpt-4o-mini | fast | Highly cacheable — most calls hit cache |
| `copilot_suggestion` | gpt-4o-mini | standard | Dashboard, can tolerate latency |
| `profile_analysis` | gpt-4o-mini | standard | On-demand, not latency-critical |

**Note:** The immediate win isn't switching models (everything is already on mini). The win is **caching** and **pre-generation** to eliminate calls entirely.

### 2. Semantic Cache Layer (`lib/ai/semantic-cache.ts`)

Use Upstash Redis (already in the stack for rate limiting) to cache AI responses for repeatable queries.

```typescript
import { Redis } from "@upstash/redis";

export interface SemanticCacheConfig {
  /** Namespace to partition cache keys */
  namespace: string;
  /** TTL in seconds */
  ttlSeconds: number;
  /** Similarity threshold for cache hits (0-1). 1.0 = exact match only */
  similarityThreshold?: number;
}

export interface CacheResult<T> {
  hit: boolean;
  data: T | null;
  cacheKey?: string;
}

/**
 * Generates a deterministic cache key from the input parameters.
 * For exact-match caching (grammar explanations, exercise templates).
 */
export function buildCacheKey(params: {
  namespace: string;
  language: string;
  level?: string;
  topic?: string;
  /** Additional discriminators */
  extra?: Record<string, string>;
}): string;

/**
 * Checks cache for a matching response.
 */
export async function getCached<T>(
  redis: Redis,
  key: string
): Promise<CacheResult<T>>;

/**
 * Stores a response in cache.
 */
export async function setCache<T>(
  redis: Redis,
  key: string,
  data: T,
  ttlSeconds: number
): Promise<void>;

/**
 * Wraps an LLM call with cache check.
 * Pattern: check cache → hit? return cached → miss? call LLM → store → return
 */
export async function withCache<T>(
  redis: Redis,
  config: SemanticCacheConfig,
  key: string,
  generator: () => Promise<T>
): Promise<{ data: T; cached: boolean }>;
```

#### What Gets Cached

| Content | Cache Key Pattern | TTL | Hit Rate Est. |
|---------|------------------|-----|---------------|
| Grammar explanations | `grammar:{lang}:{level}:{category}:{slug}` | 7 days | ~80% |
| Practice greetings | `greeting:{lang}:{level}:{topic_hash}` | 24h | ~60% |
| Exercise templates | `exercise:{lang}:{level}:{topic}:{type}` | 7 days | ~90% |
| Session feedback templates | `feedback:{lang}:{level}:{score_bucket}` | 24h | ~40% |
| Copilot suggestions | `copilot:{tutor_id}:{student_count_bucket}` | 4h | ~50% |

#### What Does NOT Get Cached
- Practice chat messages (conversational, context-dependent)
- Lesson analysis (unique transcript per lesson)
- Speech analysis (unique audio per lesson)
- Profile analysis (unique per tutor)

### 3. Pre-Generated Exercise Banks (`lib/practice/exercise-bank.ts`)

Instead of generating exercises in real-time during practice sessions, pre-generate exercise banks from lesson transcripts. This is the biggest cost saver — removes AI calls from the practice session hot path entirely for structured exercises.

```typescript
export type ExerciseType =
  | "fill_in_blank"
  | "multiple_choice"
  | "sentence_reorder"
  | "translation"
  | "error_correction"
  | "conjugation"
  | "vocabulary_match";

export interface Exercise {
  id: string;
  type: ExerciseType;
  language: string;
  level: string;
  topic: string;
  grammarFocus?: string;
  vocabularyFocus?: string[];
  prompt: string;
  options?: string[];        // For multiple choice
  correctAnswer: string;
  explanation: string;
  difficulty: 1 | 2 | 3;     // Within the level
  /** Source lesson that generated this exercise */
  sourceSessionId?: string;
  generatedAt: string;
}

export interface ExerciseBank {
  id: string;
  language: string;
  level: string;
  topic: string;
  exercises: Exercise[];
  /** Number of times this bank has been served */
  servedCount: number;
  createdAt: string;
}

/**
 * Generates an exercise bank from a lesson transcript.
 * Uses gpt-4o (quality tier) because this runs as a batch job, not real-time.
 * Each bank contains 15-25 exercises of mixed types.
 */
export async function generateExerciseBank(params: {
  language: string;
  level: string;
  topic: string;
  grammarFocus: string[];
  vocabularyFocus: string[];
  /** Optional lesson transcript for contextual exercises */
  lessonTranscript?: string;
}): Promise<ExerciseBank>;

/**
 * Fetches a suitable exercise bank for a practice session.
 * Prefers banks the student hasn't seen; falls back to least-served.
 */
export async function getExerciseBankForSession(
  client: SupabaseClient,
  params: {
    studentId: string;
    language: string;
    level: string;
    topic?: string;
  }
): Promise<ExerciseBank | null>;

/**
 * Scores a student's exercise attempt without an AI call.
 * Uses deterministic matching (exact, fuzzy, synonym) for most exercise types.
 */
export function scoreExerciseAttempt(
  exercise: Exercise,
  studentAnswer: string
): {
  correct: boolean;
  score: number;     // 0-1
  feedback: string;  // Pre-generated explanation from the exercise
};
```

#### Database Schema

```sql
-- Exercise banks generated from lesson analysis
CREATE TABLE IF NOT EXISTS exercise_banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language TEXT NOT NULL,
  level TEXT NOT NULL,
  topic TEXT NOT NULL,
  grammar_focus TEXT[] DEFAULT '{}',
  vocabulary_focus TEXT[] DEFAULT '{}',
  exercises JSONB NOT NULL DEFAULT '[]',
  exercise_count INTEGER NOT NULL DEFAULT 0,
  source_session_id UUID REFERENCES student_practice_sessions(id) ON DELETE SET NULL,
  source_lesson_id UUID DEFAULT NULL,
  served_count INTEGER NOT NULL DEFAULT 0,
  quality_score REAL DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE exercise_banks ENABLE ROW LEVEL SECURITY;

-- Anyone can read exercise banks (served during practice)
CREATE POLICY "Anyone can view exercise banks"
  ON exercise_banks FOR SELECT
  USING (true);

-- Only service role inserts (batch generation)
-- No INSERT/UPDATE RLS policy = only service role can write

CREATE INDEX idx_exercise_banks_lookup
  ON exercise_banks(language, level, topic);

CREATE INDEX idx_exercise_banks_served
  ON exercise_banks(served_count ASC, created_at DESC);

-- Track which banks each student has seen
CREATE TABLE IF NOT EXISTS student_exercise_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  exercise_bank_id UUID NOT NULL REFERENCES exercise_banks(id) ON DELETE CASCADE,
  score REAL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, exercise_bank_id)
);

ALTER TABLE student_exercise_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own history"
  ON student_exercise_history FOR SELECT
  USING (auth.uid()::text IN (
    SELECT user_id::text FROM students WHERE id = student_id
  ));

CREATE POLICY "Authenticated users can insert history"
  ON student_exercise_history FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX idx_student_exercise_history_student
  ON student_exercise_history(student_id, completed_at DESC);
```

### 4. Exercise Bank Generation Pipeline (`lib/practice/exercise-generator.ts`)

A batch job that generates exercise banks after lessons end. Hooks into the existing post-lesson analysis pipeline.

```typescript
/**
 * Triggered after lesson analysis completes.
 * Generates 1-3 exercise banks from the lesson insights.
 */
export async function generateExerciseBanksFromLesson(params: {
  lessonId: string;
  language: string;
  level: string;
  topics: string[];
  grammarFocus: string[];
  vocabularyFocus: string[];
  transcript?: string;
}): Promise<{ banksCreated: number; exerciseCount: number }>;

/**
 * Backfill job: generate exercise banks for common language/level/topic combos
 * that don't yet have banks. Run via cron or manual trigger.
 */
export async function backfillExerciseBanks(params: {
  language: string;
  level: string;
  /** Maximum banks to generate in this run */
  maxBanks?: number;
}): Promise<{ banksCreated: number }>;
```

#### Integration Point

In `api/practice/end-session/route.ts`, after the existing `generateSessionFeedback` call, trigger exercise bank generation:

```typescript
// After session feedback is generated...
// Fire-and-forget: generate exercise banks from this session's context
void generateExerciseBanksFromLesson({
  lessonId: session.id,
  language: session.language,
  level: session.level || "intermediate",
  topics: [session.topic].filter(Boolean),
  grammarFocus: normalizeFocusList(scenario?.grammar_focus),
  vocabularyFocus: normalizeFocusList(scenario?.vocabulary_focus),
}).catch(err => console.error("[Exercise Gen] Background generation failed:", err));
```

### 5. Hybrid Practice Session Mode (`lib/practice/hybrid-session.ts`)

The key architectural change: practice sessions can now serve a **mix** of pre-built exercises and real-time AI conversation. This dramatically reduces AI calls.

```typescript
export type SessionBlock =
  | { type: "exercise"; exercise: Exercise }
  | { type: "conversation"; aiGenerated: true };

/**
 * Plans the session structure: a sequence of exercise blocks
 * interspersed with conversation blocks.
 *
 * Example for a 20-turn session:
 * - Turns 1-2: AI greeting + warm-up conversation
 * - Turns 3-6: Pre-built exercises (NO AI call)
 * - Turns 7-10: AI conversation practice
 * - Turns 11-14: Pre-built exercises (NO AI call)
 * - Turns 15-18: AI conversation practice
 * - Turns 19-20: AI wrap-up
 *
 * This turns 20 AI calls into ~12 AI calls (40% reduction).
 */
export async function planSessionBlocks(params: {
  studentId: string;
  language: string;
  level: string;
  topic?: string;
  totalTurns: number;
}): Promise<SessionBlock[]>;
```

#### How It Works in the Chat Route

Update `api/practice/chat/route.ts` and `api/practice/chat/stream/route.ts`:

```typescript
// Before making the AI call, check if this turn is an exercise block
const sessionPlan = await getOrCreateSessionPlan(adminClient, sessionIdValue);
const currentTurn = Math.floor((session.message_count ?? 0) / 2);
const currentBlock = sessionPlan[currentTurn];

if (currentBlock?.type === "exercise") {
  // Score the student's answer locally — NO AI call
  const result = scoreExerciseAttempt(currentBlock.exercise, trimmedMessage);

  // Build the response from the pre-generated exercise data
  const response = formatExerciseResponse(currentBlock.exercise, result);

  // Save as assistant message
  await adminClient.from("student_practice_messages").insert({
    session_id: sessionIdValue,
    role: "assistant",
    content: response,
  });

  // Return immediately — no OpenAI call needed
  return NextResponse.json({ ... });
}

// Otherwise, proceed with normal AI conversation call
```

### 6. Grammar Explanation Cache (`lib/practice/grammar-cache.ts`)

Grammar corrections in practice chat responses often explain the same rules repeatedly. Cache these explanations.

```typescript
/**
 * Builds or retrieves a cached grammar explanation.
 * The practice chat route calls this instead of including grammar
 * instruction in every system prompt.
 */
export async function getGrammarExplanation(params: {
  language: string;
  level: string;
  category: GrammarCategorySlug;
  originalText: string;
  correctedText: string;
}): Promise<string>;
```

The existing `GRAMMAR_CATEGORY_SLUGS` in `lib/practice/grammar-categories.ts` provides the taxonomy. There are a finite number of grammar categories per language — these are highly cacheable.

### 7. Migrate All AI Calls to Model Router

Replace all direct `createPracticeChatCompletion` calls with `routedChatCompletion`:

| File | Current | After |
|------|---------|-------|
| `lib/practice/greeting.ts` | `createPracticeChatCompletion({ model: "gpt-4o-mini" })` | `routedChatCompletion({ task: "practice_greeting", cacheable: true })` |
| `api/practice/chat/route.ts` | `createPracticeChatCompletion({ model: "gpt-4o-mini" })` | `routedChatCompletion({ task: "practice_chat" })` |
| `api/practice/chat/stream/route.ts` | `createPracticeChatStream(...)` | `routedChatStream({ task: "practice_chat" })` |
| `api/practice/end-session/route.ts` | `createPracticeChatCompletion({ model: "gpt-4o-mini" })` | `routedChatCompletion({ task: "session_feedback", cacheable: true })` |
| `lib/analysis/lesson-insights.ts` | `createPracticeChatCompletion({ model: "gpt-4o-mini" })` | `routedChatCompletion({ task: "lesson_analysis" })` |
| `lib/analysis/student-speech-analyzer.ts` | `createPracticeChatCompletion({ model: "gpt-4o-mini" })` | `routedChatCompletion({ task: "speech_analysis" })` |
| `lib/copilot/activity-suggester.ts` | `createPracticeChatCompletion({ model: "gpt-4o-mini" })` | `routedChatCompletion({ task: "copilot_suggestion", cacheable: true })` |
| `api/webhooks/deepgram/route.ts` | Direct OpenAI call | `routedChatCompletion({ task: "speech_analysis" })` |

### 8. Cost Monitoring Dashboard (`api/ai/usage/route.ts`)

Add an internal endpoint that tracks AI spend:

```typescript
export interface AIUsageStats {
  period: string;           // "2026-02-13" or "2026-02-W07"
  totalCalls: number;
  cacheHits: number;
  cacheMisses: number;
  cacheHitRate: number;     // 0-1
  totalTokensInput: number;
  totalTokensOutput: number;
  estimatedCostUsd: number;
  byTask: Record<InferenceTask, {
    calls: number;
    cacheHits: number;
    tokensInput: number;
    tokensOutput: number;
    estimatedCostUsd: number;
  }>;
  exerciseBanks: {
    totalBanks: number;
    totalExercises: number;
    sessionsServedFromBank: number;
    aiCallsAvoided: number; // Estimated AI calls saved by exercise banks
  };
}
```

Track in Redis (lightweight, already available):
- Increment counters per task per day
- Increment cache hit/miss counters
- Sum token usage from OpenAI response `usage` field

### 9. Migration

```sql
-- Sprint 3: AI Cost Optimisation — exercise banks + usage tracking

-- See Deliverable 3 for exercise_banks and student_exercise_history tables

-- Session plan storage (hybrid exercise + conversation blocks)
ALTER TABLE student_practice_sessions
  ADD COLUMN IF NOT EXISTS session_plan JSONB DEFAULT NULL;

-- Track which exercises were served in a session
ALTER TABLE student_practice_messages
  ADD COLUMN IF NOT EXISTS exercise_id TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS exercise_score REAL DEFAULT NULL;

-- AI usage tracking (aggregated daily, stored for cost analysis)
CREATE TABLE IF NOT EXISTS ai_usage_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  task TEXT NOT NULL,
  total_calls INTEGER NOT NULL DEFAULT 0,
  cache_hits INTEGER NOT NULL DEFAULT 0,
  tokens_input BIGINT NOT NULL DEFAULT 0,
  tokens_output BIGINT NOT NULL DEFAULT 0,
  estimated_cost_usd REAL NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(date, task)
);

ALTER TABLE ai_usage_daily ENABLE ROW LEVEL SECURITY;
-- No RLS policies = service role only (internal tracking)

CREATE INDEX idx_ai_usage_daily_date ON ai_usage_daily(date DESC);
```

### 10. Tests

Create `tests/sprint3-cost-optimisation.test.ts`:
- Model router returns correct model per task
- Semantic cache set/get/miss/hit flows
- Cache key generation is deterministic
- Exercise bank generation produces valid exercises
- Exercise scoring works for all exercise types (exact match, fuzzy, synonym)
- Hybrid session planner creates correct block sequence
- Grammar explanation caching works
- AI usage counter increments correctly

Create `e2e/practice/exercise-bank.spec.ts`:
- Student starts session → receives mix of exercises and AI conversation
- Exercise responses are scored without AI call (fast)
- Conversation turns still use AI (streamed)
- End-session triggers exercise bank generation in background

## Expected Cost Impact

### Per-Session Savings

| Optimisation | AI Calls Saved | Estimated Saving |
|-------------|---------------|-----------------|
| Exercise banks (40% of turns) | 8 of 20 turns | 40% |
| Greeting cache (60% hit rate) | 0.6 calls/session | 3% |
| Feedback cache (40% hit rate) | 0.4 calls/session | 2% |
| Grammar cache (inline) | Reduced tokens per call | 5% |
| **Combined** | | **~50% reduction** |

### At Scale (10,000 sessions/day)

| Metric | Before | After |
|--------|--------|-------|
| AI calls/day | ~210,000 | ~110,000 |
| Tokens/day | ~200M | ~100M |
| Cost/day | ~$40 | ~$20 |
| Cost/month | ~$1,200 | ~$600 |

## Architecture Laws

1. **Never block the user** — cache misses fall through to real-time AI. The cache is an optimisation, not a gate.
2. **Exercise quality > quantity** — use GPT-4o (not mini) for exercise generation because these are served many times. Higher upfront cost, lower amortised cost.
3. **Graceful degradation** — if Redis is down, skip caching and call the LLM directly. If exercise bank is empty, fall back to full AI conversation.
4. **Observable** — every AI call gets logged with task type, cache hit/miss, tokens, and estimated cost. This data drives future optimisation.
5. **No UX regression** — students should not notice the switch to hybrid mode. Exercise blocks should feel natural within the conversation flow.
6. **Existing patterns** — use the existing `lib/practice/openai.ts` retry/error handling. Extend, don't replace.

## Files to Create
- `lib/ai/model-router.ts`
- `lib/ai/semantic-cache.ts`
- `lib/ai/usage-tracker.ts`
- `lib/practice/exercise-bank.ts`
- `lib/practice/exercise-generator.ts`
- `lib/practice/exercise-scoring.ts`
- `lib/practice/hybrid-session.ts`
- `lib/practice/grammar-cache.ts`
- `api/ai/usage/route.ts`
- `supabase/migrations/20260214_add_exercise_banks.sql`
- `tests/sprint3-cost-optimisation.test.ts`
- `e2e/practice/exercise-bank.spec.ts`

## Files to Modify
- `lib/practice/openai.ts` — add `routedChatCompletion` / `routedChatStream` exports
- `lib/practice/greeting.ts` — use model router + cache
- `api/practice/chat/route.ts` — hybrid mode: check session plan, serve exercises or AI
- `api/practice/chat/stream/route.ts` — same hybrid mode for streaming
- `api/practice/end-session/route.ts` — trigger exercise generation, use cached feedback
- `api/practice/session/route.ts` — create session plan on session start
- `lib/analysis/lesson-insights.ts` — use model router
- `lib/analysis/student-speech-analyzer.ts` — use model router
- `lib/analysis/tutor-speech-analyzer.ts` — use model router
- `lib/copilot/activity-suggester.ts` — use model router + cache
- `api/webhooks/deepgram/route.ts` — use model router
- `api/ai/profile-analyser/route.ts` — use model router

## Do NOT Touch
- Student subscription/billing flows (Sprint 1)
- Virality engine (Sprint 2)
- Booking system
- Classroom/LiveKit
- Auth/registration
- RLS policies on existing tables
