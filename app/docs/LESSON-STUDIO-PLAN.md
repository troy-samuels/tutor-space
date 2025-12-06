# Lesson Studio - Feature Implementation Plan

## Overview

**Lesson Studio** is a feature for TutorLingua that enables tutors to plan lessons and create interactive activities for students. It consists of two main modules under one umbrella:

1. **AI Lesson Planner** - Generate personalized lesson outlines based on student data
2. **Activity Builder** - Create flashcards, quizzes, and interactive exercises

---

## ⚠️ CRITICAL: Mobile-First Design

**Students and tutors will primarily use Lesson Studio from mobile devices.** All UI must be designed mobile-first, then enhanced for desktop.

### Mobile UI Patterns to Follow

| Pattern | Implementation | Reference File |
|---------|----------------|----------------|
| **Bottom Navigation** | Fixed tab bar `h-16`, hidden on `lg:` screens | `components/dashboard/bottom-nav.tsx` |
| **Sheet Modals** | Slide-up from bottom for forms/details | `components/ui/sheet.tsx` |
| **Touch Targets** | Minimum 44px (h-10/h-11) for all interactive elements | `components/ui/button.tsx` |
| **Full-Width Inputs** | 100% width on mobile, constrained on desktop | `components/booking/StudentInfoForm.tsx` |
| **Content Padding** | `pb-20` to clear fixed bottom nav | `components/student-auth/StudentPortalLayout.tsx` |
| **Responsive Text** | Hide labels on mobile, show icons only | `components/student-auth/StudentBottomNav.tsx` |

### Mobile-Specific Activity Considerations

| Activity Type | Mobile UX |
|---------------|-----------|
| **Flashcards** | Swipe left/right to flip, swipe up for "knew it", down for "study again" |
| **Quizzes** | Large tap targets for options, one question per screen |
| **Fill-in-blank** | Auto-focus input, show keyboard immediately |
| **Matching** | Tap-to-select pairs (not drag-drop on mobile) |
| **Video** | Full-width player, questions below video |

---

## Phased Implementation

### Phase 1: MVP - Core Infrastructure (First)

**Database Tables** (migration: `2025XXXX_lesson_studio.sql`):
- `lesson_plans` - Tutor-created lesson templates with sections (JSONB)
- `lesson_plan_assignments` - Assign plans to students/bookings
- `activities` - Polymorphic activity storage (flashcards, quizzes, etc.)
- `activity_assignments` - Track student assignments and scores
- `flashcard_decks` + `flashcard_items` - Dedicated flashcard storage
- `student_flashcard_progress` - Spaced repetition tracking (SM-2 algorithm)
- `video_resources` - YouTube/Vimeo video library

**Activity Types Supported**:
- Flashcards (with spaced repetition)
- Multiple choice quizzes
- Fill-in-the-blank exercises
- Matching pairs
- Drag-and-drop ordering (desktop only)
- Speaking prompts (integrates with AI Practice audio)
- Video exercises with timestamps

**Key Files to Create**:
```
/supabase/migrations/2025XXXX_lesson_studio.sql
/app/lib/actions/lesson-studio.ts
/app/lib/lesson-studio/constants.ts
/app/lib/lesson-studio/access.ts
/app/lib/types/lesson-studio.ts
/app/lib/validators/lesson-studio.ts
```

### Phase 2: AI Integration

**AI Lesson Generation** (`/api/lesson-studio/generate`):
- Fetches student context: proficiency assessments, learning goals, lesson notes, grammar issues
- Generates structured 45-60 min lesson plan with sections
- Suggests vocabulary/grammar focus based on weak areas
- Avoids repetition of recent topics

**AI Activity Generation**:
- Generate flashcard decks from topic + level
- Create quiz questions with plausible distractors
- Fill-in-blank exercises from vocabulary lists

### Phase 3: Video Integration & Polish

**Video Resources**:
- YouTube/Vimeo URL parsing and embedding
- Timestamp markers for segmented exercises
- Listening comprehension questions tied to video segments
- `video_resources` table with topics/level tagging

---

## UI Architecture (Mobile-First)

### Tutor Pages (Mobile: Bottom Nav + Sheet Modals)
```
/app/(dashboard)/lesson-studio/
├── page.tsx                    # Dashboard with activity cards
├── plans/
│   ├── page.tsx                # List lesson plans (card grid)
│   ├── new/page.tsx            # Create flow (step-by-step wizard)
│   └── [planId]/page.tsx       # Edit with section editor
├── activities/
│   ├── page.tsx                # Activity library (filterable list)
│   ├── flashcards/[deckId]/    # Flashcard deck editor
│   └── [activityId]/page.tsx   # Edit any activity type
└── videos/page.tsx             # Video resource library
```

### Student Portal Pages (Mobile-Optimized)
```
/app/student-auth/activities/
├── page.tsx                    # Assigned activities (card list)
├── [assignmentId]/page.tsx     # Full-screen activity player
└── flashcards/[deckId]/page.tsx # Swipe-based flashcard practice
```

### Key Components (Mobile-First)
```
/app/components/lesson-studio/
├── LessonStudioNav.tsx         # Bottom tab bar for Lesson Studio
├── LessonPlanBuilder.tsx       # Mobile: step wizard, Desktop: drag-drop
├── ActivityPicker.tsx          # Sheet modal on mobile
├── activities/
│   ├── FlashcardDeckEditor.tsx # Swipeable card preview
│   ├── MultipleChoiceEditor.tsx
│   ├── FillBlankEditor.tsx
│   ├── MatchingEditor.tsx
│   └── VideoExerciseEditor.tsx
├── student/
│   ├── ActivityPlayer.tsx      # Full-screen activity renderer
│   ├── FlashcardPractice.tsx   # Swipe gestures (framer-motion)
│   ├── QuizPlayer.tsx          # One question per screen
│   └── MatchingPlayer.tsx      # Tap-to-select pairs
└── shared/
    ├── ActivityCard.tsx        # Consistent activity preview card
    └── ProgressIndicator.tsx   # Visual progress (dots/bar)
```

### Mobile Navigation Structure
```
Lesson Studio Bottom Nav (Tutor):
┌─────────────────────────────────────┐
│  Plans  │ Activities │ Videos │ More │
└─────────────────────────────────────┘

Student Activities Bottom Nav:
┌─────────────────────────────────────┐
│  To Do  │  Completed  │  Progress   │
└─────────────────────────────────────┘
```

---

## API Routes

```
/api/lesson-studio/
├── generate/           # AI generation (lesson/activity)
├── plans/              # CRUD for lesson plans
├── plans/[id]/assign/  # Assign to student
├── activities/         # CRUD for activities
├── flashcards/         # Deck management
├── flashcards/review/  # Record spaced repetition result
├── videos/             # Video resource management
└── student/
    ├── assignments/    # Get assigned activities
    └── submit/         # Submit activity results
```

---

## Integration Points

| Existing Feature | Integration |
|------------------|-------------|
| **Homework** | Activities can be linked to homework assignments |
| **AI Practice** | Speaking prompts use existing audio/pronunciation infrastructure |
| **Lesson Notes** | Completed lesson plans can convert to post-lesson notes |
| **Progress Tracking** | Activity scores update learning_stats |
| **Proficiency Assessments** | AI uses assessments to personalize lessons |
| **Grammar Issues** | AI targets frequent grammar errors in generated content |

---

## MVP Scope (Build First)

### MVP Phase 1: Flashcards (Mobile-First)
1. Database migration with core tables
2. Flashcard deck creation (tutor)
3. Flashcard card editor with swipe preview
4. **Student flashcard practice with swipe gestures**
5. Spaced repetition tracking (SM-2 algorithm)

### MVP Phase 2: Quizzes & Exercises
1. Multiple choice quiz builder
2. Fill-in-the-blank editor
3. Student quiz player (one question per screen)
4. Score tracking and results

### MVP Phase 3: Lesson Plans + AI
1. Lesson plan creation (step-by-step wizard on mobile)
2. Section-based structure (warm-up, main, practice, cool-down)
3. AI lesson generation based on student data
4. Assign lesson plans to students/bookings

### Phase 4: Video & Polish
- YouTube video embedding
- Timestamp-based exercises
- Advanced analytics
- Drag-and-drop on desktop

---

## Database Schema

### Core Tables

```sql
-- Lesson Plans (templates created by tutors)
CREATE TABLE lesson_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  language TEXT NOT NULL,
  level TEXT CHECK (level IN ('beginner', 'elementary', 'intermediate', 'upper_intermediate', 'advanced', 'proficient')),
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Each section: { id, title, type, content, duration_minutes, activities: [] }
  estimated_duration_minutes INTEGER,
  ai_generated BOOLEAN DEFAULT FALSE,
  generation_context JSONB,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_template BOOLEAN DEFAULT FALSE,
  times_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activities (polymorphic via activity_type)
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'flashcards', 'matching', 'fill_blank', 'multiple_choice',
    'drag_order', 'speaking_prompt', 'video_exercise'
  )),
  language TEXT NOT NULL,
  level TEXT,
  content JSONB NOT NULL,
  instructions TEXT,
  estimated_duration_minutes INTEGER,
  is_template BOOLEAN DEFAULT FALSE,
  times_assigned INTEGER DEFAULT 0,
  avg_score DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flashcard Decks
CREATE TABLE flashcard_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  language TEXT NOT NULL,
  level TEXT,
  enable_spaced_repetition BOOLEAN DEFAULT TRUE,
  shuffle_on_practice BOOLEAN DEFAULT TRUE,
  card_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flashcard Items
CREATE TABLE flashcard_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID NOT NULL REFERENCES flashcard_decks(id) ON DELETE CASCADE,
  front_text TEXT NOT NULL,
  back_text TEXT NOT NULL,
  front_audio_url TEXT,
  back_audio_url TEXT,
  image_url TEXT,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student Flashcard Progress (spaced repetition)
CREATE TABLE student_flashcard_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  flashcard_item_id UUID NOT NULL REFERENCES flashcard_items(id) ON DELETE CASCADE,
  deck_id UUID NOT NULL REFERENCES flashcard_decks(id) ON DELETE CASCADE,
  ease_factor DECIMAL(4,2) DEFAULT 2.5,
  interval_days INTEGER DEFAULT 1,
  repetitions INTEGER DEFAULT 0,
  next_review_at TIMESTAMPTZ,
  times_correct INTEGER DEFAULT 0,
  times_incorrect INTEGER DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ,
  UNIQUE(student_id, flashcard_item_id)
);

-- Activity Assignments
CREATE TABLE activity_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  homework_id UUID REFERENCES homework_assignments(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'skipped')),
  score DECIMAL(5,2),
  time_spent_seconds INTEGER,
  attempts INTEGER DEFAULT 0,
  results JSONB,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Resources
CREATE TABLE video_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  video_type TEXT DEFAULT 'youtube' CHECK (video_type IN ('youtube', 'vimeo', 'loom', 'external')),
  video_id TEXT,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  language TEXT,
  level TEXT,
  topics TEXT[],
  timestamps JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Reference Patterns from Existing Code

| Pattern | Reference File |
|---------|---------------|
| Server Actions | `/app/lib/actions/progress.ts` |
| Bottom Navigation | `/app/components/dashboard/bottom-nav.tsx` |
| Sheet Modals | `/app/components/ui/sheet.tsx` |
| Mobile Forms | `/app/components/booking/StudentInfoForm.tsx` |
| AI Chat Interface | `/app/components/student/AIPracticeChat.tsx` |
| Student Portal Layout | `/app/components/student-auth/StudentPortalLayout.tsx` |
| Drag-and-Drop | `/app/components/marketing/link-manager.tsx` (@dnd-kit) |
| Complex Form State | `/app/components/page-builder/wizard-context.tsx` |
| Activity Types | `/app/components/students/HomeworkPlanner.tsx` |
| Swipe Gestures | Use `framer-motion` (already installed) for swipe animations |

### Mobile-First CSS Pattern
```tsx
// Always start with mobile, scale up
<div className="p-4 sm:p-6 lg:p-8">           {/* Padding */}
<div className="text-sm sm:text-base">         {/* Typography */}
<div className="w-full sm:max-w-md">           {/* Width */}
<div className="pb-20 lg:pb-0">                {/* Bottom nav clearance */}
<span className="hidden sm:inline">Label</span> {/* Hide text on mobile */}
```

---

## Activity Content Schema Examples

### Flashcards
```json
{
  "cards": [
    { "front": "Hello", "back": "Hola", "audio_url": null },
    { "front": "Goodbye", "back": "Adiós", "audio_url": null }
  ],
  "settings": { "shuffle": true, "spaced_repetition": true }
}
```

### Multiple Choice
```json
{
  "questions": [
    {
      "question": "What is the past tense of 'go'?",
      "options": ["goed", "went", "gone", "going"],
      "correct_index": 1,
      "explanation": "'Went' is the irregular past tense of 'go'."
    }
  ]
}
```

### Fill-in-the-Blank
```json
{
  "text": "I ___ to the store yesterday.",
  "blanks": [
    { "position": 0, "answer": "went", "hints": ["past tense of go"] }
  ]
}
```

### Matching
```json
{
  "pairs": [
    { "left": "Hello", "right": "Hola" },
    { "left": "Thank you", "right": "Gracias" },
    { "left": "Please", "right": "Por favor" }
  ],
  "time_limit": 120
}
```

### Video Exercise
```json
{
  "video_url": "https://youtube.com/watch?v=abc123",
  "video_type": "youtube",
  "video_id": "abc123",
  "exercises": [
    {
      "timestamp_start": 0,
      "timestamp_end": 60,
      "type": "comprehension",
      "question": "What does the speaker say about learning languages?",
      "options": ["It's difficult", "It's fun", "It takes time", "All of the above"],
      "correct_index": 3
    }
  ]
}
```

---

## AI Generation Prompts

### Lesson Plan Generation
```
You are an expert language tutor creating personalized lesson plans.

Given the student's context, generate a structured 45-60 minute lesson plan that:
1. Builds on their current proficiency level
2. Addresses their weak areas (especially grammar errors from practice)
3. Works toward their active learning goals
4. Avoids topics covered in recent lessons
5. Includes a mix of activities: warm-up, vocabulary, grammar, practice, cool-down

Output a JSON object with sections array containing:
- id, title, type, content, duration_minutes, suggested_activities
```

### Flashcard Generation
```
Generate flashcard content for language learning.
Given the topic, language, and level, create flashcard pairs with:
- Clear, concise front (term or phrase)
- Accurate back (translation or definition)
- Example sentences where appropriate
```

### Quiz Generation
```
Generate multiple choice questions for language practice.
Create questions that test comprehension, not just memorization.
Include plausible distractors and brief explanations for correct answers.
```

---

*Last Updated: December 2024*
