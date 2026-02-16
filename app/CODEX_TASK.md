# Codex Build Task — Recap System

Build a complete "Recap" feature for TutorLingua. A tutor types a lesson summary, AI generates an interactive study experience, students access it via a shareable link.

## Stack
- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS 4, Framer Motion 12
- @dnd-kit/core 6 + @dnd-kit/sortable 10
- OpenAI SDK (openai package, GPT-4o-mini)
- Supabase (via lib/supabase/admin.ts for service role, lib/supabase/server.ts for server)
- OPENAI_API_KEY is in .env.local

## Database (already created)
Tables: `public.recaps`, `public.recap_attempts`, `public.recap_students`
- recaps: id (uuid), short_id (text, auto-generated), tutor_fingerprint (text), tutor_display_name, student_name, language, level, raw_input, summary (jsonb), exercises (jsonb), generation_model, generation_time_ms, created_at, updated_at
- recap_attempts: id, recap_id (fk), student_fingerprint, score, total, time_spent_seconds, answers (jsonb), completed_at
- recap_students: id, tutor_fingerprint, student_name, language, level, recap_count, total_exercises_completed, average_score, weak_topics (text[]), strong_topics (text[]), last_recap_at, last_practice_at

## Design System
- Dark mode ONLY for recap pages (class="dark" on body/html)
- Background: #1A1917, Cards: #2D2A26, Text: #F5F2EF, Primary: #E8784D, Muted: #9A9590
- Border: rgba(245, 242, 239, 0.08)
- Font: font-sans (Manrope), font-heading (Mansalva)
- Radius: 1rem for cards, 0.625rem for inputs
- Use existing Tailwind theme variables where possible (bg-background, text-foreground, bg-card, etc.)
- All pages force dark mode: add className="dark" to outermost wrapper

## What to Build

### 1. Types file: `lib/recap/types.ts`

```typescript
export interface RecapVocabWord {
  word: string;
  translation: string;
  example: string;
  phonetic: string;
}

export interface RecapExercise {
  type: 'multipleChoice' | 'fillBlank' | 'wordOrder';
  question: string;
  // For multipleChoice:
  options?: string[];
  correct?: number; // index
  // For fillBlank:
  answer?: string;
  hint?: string;
  // For wordOrder:
  words?: string[];
  correctOrder?: number[];
  correctSentence?: string;
  // Shared:
  explanation: string;
  targetVocab?: string;
}

export interface RecapSummary {
  studentName: string | null;
  tutorName: string | null;
  language: string;
  level: string | null;
  encouragement: string;
  covered: string[];
  vocabulary: RecapVocabWord[];
  weakSpots: string[];
  homework: string;
  bonusWord: { word: string; translation: string };
}

export interface RecapData {
  id: string;
  shortId: string;
  summary: RecapSummary;
  exercises: RecapExercise[];
  createdAt: string;
}

export interface AttemptAnswer {
  exerciseIndex: number;
  answer: string | number;
  correct: boolean;
  timeMs: number;
}
```

### 2. LLM Generation: `lib/recap/generate.ts`

Function `generateRecap(input: string)` that:
1. Calls OpenAI GPT-4o-mini with a system prompt to extract structured data
2. The prompt should instruct the model to return JSON matching RecapSummary + exercises
3. Use response_format: { type: "json_object" } for reliable JSON
4. Return the parsed result
5. Handle errors gracefully

The system prompt should say:
"You are a language teaching assistant. A tutor just finished a lesson and provided a brief summary. Extract structured data and generate engaging learning content. Return valid JSON with these fields: studentName (string|null), tutorName (string|null), language (string), level (string|null, e.g. A1-C2), encouragement (warm 2-sentence message), covered (array of topic strings), vocabulary (array of {word, translation, example, phonetic}), weakSpots (array of strings), homework (string), bonusWord ({word, translation}), exercises (array of exactly 5 exercises mixing types)."

For exercises, the prompt should specify the 3 types (multipleChoice with options array + correct index, fillBlank with answer + hint, wordOrder with words array + correctOrder array + correctSentence) and say to generate exactly 5, mixing types, focused on the student's weak spots.

### 3. API Routes

#### `app/api/recap/generate/route.ts`
POST endpoint. Body: { input: string, tutorFingerprint: string, tutorName?: string }
- Validate input exists and is < 5000 chars
- Call generateRecap(input)
- Insert into recaps table using service role client (from lib/supabase/admin.ts — use `createServiceRoleClient()`)
- Update or insert into recap_students table
- Return { success: true, recap: { id, shortId, url, summary, exercises, createdAt } }

#### `app/api/recap/[shortId]/route.ts`
GET endpoint. Fetch recap by short_id from recaps table using service role client.
Return the full recap data. Return 404 if not found.

#### `app/api/recap/[shortId]/attempt/route.ts`
POST endpoint. Body: { score, total, timeSpentSeconds, answers, studentFingerprint }
Insert into recap_attempts table. Return success.

### 4. Tutor Input Page: `app/recap/page.tsx` + `app/recap/RecapGenerator.tsx`

page.tsx is a simple server component that renders RecapGenerator.

RecapGenerator.tsx is a client component ("use client") with states: idle | generating | success | error.

**Layout:** Full viewport, dark mode forced, centred content max-w-md mx-auto px-6.

**Idle state:**
- Small "⚡ TutorLingua" text at top, muted
- Heading (font-heading text-3xl): "Turn your lesson into student homework in 10 seconds."
- Subheading (text-muted-foreground text-sm): "Describe what you covered. We'll create an interactive study experience."
- Textarea: bg-card border border-border rounded-2xl p-4 min-h-[140px] text-foreground placeholder-muted-foreground resize-none w-full. Placeholder: "e.g. Sarah, Spanish B1. We covered past tense today – she's mixing up fue and era. Homework: listen to Dakiti by Bad Bunny..."
- Button: w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-lg. Text: "✨ Generate Recap". Disabled when input is empty (opacity-50 cursor-not-allowed).
- Footer: text-xs text-muted-foreground text-center mt-4: "Free · No signup required · Takes 10 seconds"

**Generating state:**
- Pulsing animation on the button area
- Text: "Creating magic..." with a spinner

**Success state (animated transition):**
- Animated checkmark (Framer Motion scale spring)
- "Your recap is ready!" heading
- Card showing: student name + language + topic preview
- URL display: text-sm bg-card rounded-xl p-3 flex items-center justify-between. Shows the /r/[shortId] url.
- "📋 Copy Link" button (primary). On click, copies full URL to clipboard, shows "Copied!" for 2 seconds.
- "👁 Preview" button (ghost/outline). Opens /r/[shortId] in new tab.
- "Generate another" text link below.

**Error state:**
- Error message in red
- "Try again" button

Generate a tutorFingerprint client-side using crypto.randomUUID() stored in localStorage (check for existing first).

### 5. Student Experience Page: `app/r/[shortId]/page.tsx` + `app/r/[shortId]/RecapExperience.tsx`

page.tsx: Server component. Fetches recap data from API or directly from Supabase. If not found, show notFound(). Passes data to RecapExperience.

Also create `app/r/[shortId]/not-found.tsx` with a simple "Recap not found" message.

RecapExperience.tsx: Client component ("use client"). This is the main student experience.

**State:** currentStep (number), answers (array), startTime (Date).

**Steps:**
0 = Welcome card
1 = Vocabulary cards
2-6 = Exercises (5 exercises)
7 = Results card

Use Framer Motion AnimatePresence with fade+slide transitions between steps. Each step slides in from right, exits to left. Use mode="wait".

**Progress bar:** Fixed at top of screen. Thin (3px) bar showing progress. bg-primary. Width = (currentStep / totalSteps) * 100%. Animated width transition.

#### Step 0: WelcomeCard component (`components/recap/WelcomeCard.tsx`)

Props: summary (RecapSummary), onContinue ()

Full viewport height, flex column, justify-center, items-center, px-6.

- Animated emoji 📚 (Framer Motion: initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} with spring transition, delay 0.1)
- "Your Lesson Recap" (font-heading text-2xl mt-4, Framer: fade in + slideY, delay 0.2)
- Encouragement card: bg-card rounded-2xl p-5 mt-6 max-w-sm. Text in text-foreground/80 text-sm italic. (Framer: fade in, delay 0.4)
- Metadata line: "{language} · {level} · {date}" in text-muted-foreground text-xs mt-4
- "What we covered:" heading (text-sm font-semibold mt-6)
- List of covered topics as pills: flex flex-wrap gap-2. Each pill: bg-card px-3 py-1 rounded-full text-xs text-foreground/70 border border-border. (Staggered fade in, 80ms apart, delay 0.6)
- "Continue →" button at bottom: bg-primary text-primary-foreground w-full max-w-sm py-3 rounded-xl font-semibold mt-8. (Framer: fade in, delay 0.9)
- "⚡ tutorlingua.com" footer text, text-xs text-muted-foreground mt-4

#### Step 1: VocabCards component (`components/recap/VocabCards.tsx`)

Props: vocabulary (RecapVocabWord[]), onContinue ()

A horizontal swipeable card display.

- Header: "🔤 Key Vocabulary" + "1/N" counter, flex justify-between
- Central card: bg-card rounded-2xl p-8 min-h-[200px] flex flex-col items-center justify-center. Shows word in large text (text-2xl font-bold), phonetic below (text-muted-foreground text-sm), tap instruction below.
- State: currentIndex, flipped (boolean per card)
- Tap the card → flipped = true, shows translation, example sentence
- The card flip: use Framer Motion rotateY. Front face shows word+phonetic. Back face shows translation+example.
- 🔊 button on the back face: uses window.speechSynthesis to speak the word. Set lang based on the recap language (e.g., 'es' for Spanish).
- Dot indicators below: flex gap-2. Filled dot for current, empty for others.
- Left/right navigation: either swipe (use Framer Motion drag) or arrow buttons.
- "I know these →" button at bottom to advance. Only show after viewing at least 2 cards.

#### Steps 2-6: Exercise components

Create a wrapper: `components/recap/ExerciseStep.tsx`
Props: exercise (RecapExercise), exerciseNumber (1-5), totalExercises (5), onAnswer (correct: boolean)

Shows progress: "Question {n} of {total}" + emoji based on type + progress bar

Then renders the appropriate exercise type component.

##### `components/recap/MultipleChoiceExercise.tsx`
Props: exercise, onAnswer

- Question text in text-foreground text-lg font-medium
- 4 option buttons, stacked vertically, gap-3. Each: bg-card border border-border rounded-xl p-4 text-left text-foreground hover:border-primary/50 transition-colors. Active/pressed: scale(0.98).
- On tap an option:
  - If correct: option turns green (border-green-500 bg-green-500/10), show ✅ icon. Show explanation card below (bg-green-500/10 rounded-xl p-4 text-sm).
  - If wrong: selected turns red (border-red-500 bg-red-500/10), correct option turns green. Show explanation card.
  - Disable all options after answering.
  - Show "Next →" button after answering (fade in).
- Call onAnswer(correct) when "Next" is tapped.

##### `components/recap/FillBlankExercise.tsx`
Props: exercise, onAnswer

- Question text with "___" styled differently (border-b-2 border-primary/50)
- Text input: bg-card border border-border rounded-xl p-4 text-foreground text-center text-lg mt-6. Auto-focus.
- Hint: show after 8 seconds or on "💡 Hint" button tap. text-muted-foreground text-sm.
- "Check →" button. On tap:
  - Compare input (lowercased, trimmed) to answer. Also strip accents for comparison (normalize NFD, remove combining marks).
  - Correct: input border turns green, show explanation.
  - Wrong: input border turns red, show correct answer + explanation.
- Call onAnswer(correct) when "Next" is tapped.

##### `components/recap/WordOrderExercise.tsx`
Props: exercise, onAnswer

- Instruction text: "Arrange the words to form a correct sentence"
- Answer zone: flex flex-wrap gap-2 min-h-[60px] bg-card/50 rounded-xl p-4 border-2 border-dashed border-border. Shows placed word tiles.
- Word pool: flex flex-wrap gap-2 mt-4. Each word: bg-card px-4 py-2 rounded-lg border border-border text-foreground font-medium cursor-pointer.
- Tap a word in the pool → it moves to the answer zone (with Framer Motion layoutId animation for smooth position transition).
- Tap a word in the answer zone → it moves back to the pool.
- "Check →" button. Compares order to correctOrder array.
  - Correct: all tiles turn green with stagger animation. Show correctSentence.
  - Wrong: show correct sentence, highlight misplaced words in red.
- Call onAnswer(correct) when "Next" is tapped.

#### Step 7: ResultsCard (`components/recap/ResultsCard.tsx`)

Props: score (number), total (number), answers (AttemptAnswer[]), summary (RecapSummary), exercises (RecapExercise[])

- Header: emoji (🎉 if score >= 4, 👏 if score >= 2, 💪 otherwise)
- "Amazing work, {studentName}!" (or "Amazing work!" if no name) (font-heading text-2xl)
- Score ring: SVG circle, 120px diameter. Animated stroke-dashoffset from 0 to percentage. Inside: "{score}/{total}" in text-2xl font-bold + percentage below.
- Exercise breakdown: list each exercise with ✅ or ❌ + brief label (the exercise type). text-sm.
- Time: "⏱️ X min Y sec" (calculated from startTime)
- Bonus word card: bg-card rounded-xl p-4 mt-4. "🎁 Bonus word: {word} = {translation}"
- Soft CTA card: bg-card rounded-xl p-4 mt-4. "Want to track your progress over time? Sign in to save your learning journey." With "Maybe later" dismiss.
- Footer: "⚡ Powered by TutorLingua" in text-xs text-muted-foreground

On mount, POST the attempt to /api/recap/[shortId]/attempt with the answers and score.

### 6. Layout concerns

The recap pages (/recap and /r/[shortId]) should NOT use the dashboard layout or the public layout. They are standalone pages.

Create `app/recap/layout.tsx`:
```tsx
export default function RecapLayout({ children }: { children: React.ReactNode }) {
  return <div className="dark min-h-screen bg-background text-foreground">{children}</div>;
}
```

Create `app/r/layout.tsx`:
```tsx
export default function StudentRecapLayout({ children }: { children: React.ReactNode }) {
  return <div className="dark min-h-screen bg-background text-foreground">{children}</div>;
}
```

## Important Notes
- Use "use client" for all interactive components
- All imports from lib/supabase/admin.ts are server-only (use in API routes and server components only)
- Use service role client for all database operations (these pages have no auth)
- The OpenAI key is available as process.env.OPENAI_API_KEY (server-side only)
- Test with: npm run dev
- Verify at: http://localhost:3000/recap (tutor), http://localhost:3000/r/[shortId] (student)

## File List to Create
```
lib/recap/types.ts
lib/recap/generate.ts
app/api/recap/generate/route.ts
app/api/recap/[shortId]/route.ts
app/api/recap/[shortId]/attempt/route.ts
app/recap/layout.tsx
app/recap/page.tsx
app/recap/RecapGenerator.tsx
app/r/layout.tsx
app/r/[shortId]/page.tsx
app/r/[shortId]/RecapExperience.tsx
app/r/[shortId]/not-found.tsx
components/recap/WelcomeCard.tsx
components/recap/VocabCards.tsx
components/recap/ExerciseStep.tsx
components/recap/MultipleChoiceExercise.tsx
components/recap/FillBlankExercise.tsx
components/recap/WordOrderExercise.tsx
components/recap/ResultsCard.tsx
```

When completely finished, run this command to notify me:
clawdbot gateway wake --text "Done: Built recap system - tutor input page, API endpoints, and full student experience with exercises" --mode now
