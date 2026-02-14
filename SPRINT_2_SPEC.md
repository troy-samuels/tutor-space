# Sprint 2: Friction Removal + Virality Engine

## Business Context

TutorLingua must create frictionless viral loops at every touchpoint:
- Tutor → Student: one-tap practice assignments with deep links
- Student → Student: shareable results with challenge mechanics
- Tutor → Tutor: referral programme with real incentive
- Solo students: 0-friction entry (practice first, signup after)

The current homework and practice flows are disconnected. Students context-switch between homework page and practice page. These must become ONE seamless experience.

## Deliverables

### 1. Homework → Practice Unification (`lib/practice/unified-assignment.ts`)

Create a unified assignment resolver that merges homework and practice into one flow:

```typescript
export type UnifiedAssignment = {
  id: string;
  type: 'homework' | 'practice' | 'drill';
  title: string;
  instructions?: string;
  source: 'tutor_assigned' | 'ai_generated' | 'self_initiated';
  // Pre-loaded exercise context from tutor's lesson
  exerciseContext?: {
    language: string;
    level: string;
    topic: string;
    vocabularyFocus: string[];
    grammarFocus: string[];
    lessonDate?: string;
    tutorNotes?: string;
  };
  dueDate?: string;
  completedAt?: string;
};
```

When a tutor assigns homework with a practice scenario attached (`homework_assignments.practice_assignment_id`), the student should land DIRECTLY in the practice UI pre-loaded with that scenario's context. No intermediate "homework details" page.

### 2. Tutor "Assign Practice" One-Tap Flow

#### A. Dashboard Button (`components/dashboard/AssignPracticeButton.tsx`)
Add a prominent "Assign Practice" button on the tutor's student detail page (`app/(dashboard)/students/[studentId]/page.tsx`).

On tap:
1. Show a quick glassmorphic modal with:
   - Topic field (pre-filled from last lesson if available)
   - Grammar focus (multi-select from lesson analysis)
   - Vocabulary focus (from lesson vocabulary)
   - Optional due date
   - Optional message to student
2. On submit: creates a practice assignment AND sends the student a deep link

#### B. Deep Link Generator (`lib/practice/deep-links.ts`)
```typescript
export function generatePracticeDeepLink(params: {
  assignmentId: string;
  tutorUsername: string;
  studentName?: string;
}): string {
  // Returns: https://tutorlingua.com/practice/start/{assignmentId}?ref={tutorUsername}
}

export function generateShareableResultLink(params: {
  sessionId: string;
  language: string;
  score: number;
  level: string;
}): string {
  // Returns: https://tutorlingua.com/practice/result/{sessionId}
}

export function generateChallengeLink(params: {
  challengerId: string;
  language: string;
  level: string;
  score: number;
}): string {
  // Returns: https://tutorlingua.com/practice/challenge/{challengerId}?lang={language}&level={level}
}

export function generateTutorReferralLink(params: {
  tutorId: string;
  tutorUsername: string;
}): string {
  // Returns: https://tutorlingua.com/join/tutor-ref/{tutorUsername}
}
```

#### C. Student Notification
When practice is assigned:
- Send email via existing email system: "Marco wants you to practice Past Tense. Tap to start →"
- Email contains the deep link to the practice session
- If student has push notifications: send push too

### 3. Practice Entry Points (New Routes)

#### A. `/practice/start/[assignmentId]` — Assigned Practice Entry
- Loads the assignment context (topic, grammar, vocabulary from tutor)
- If user is authenticated: drops them straight into PracticeApp with pre-loaded context
- If user is NOT authenticated: starts practice anyway (0-friction), captures email after session via ghost profile on ResultsCard
- Shows: "Marco wants you to practice [topic]. Let's go." with tutor avatar

#### B. `/practice/result/[sessionId]` — Shareable Result Page
- Public page showing the practice results (score, radar chart, level, language)
- CTA: "Think you can beat this? Try the assessment →" linking to `/practice`
- Glassmorphic card optimised for social sharing (og:image with dynamic score)

#### C. `/practice/challenge/[challengerId]` — Challenge Entry
- Shows: "Sarah scored 78 in Spanish. Can you beat her?"
- Drops into the same assessment (same language, same level)
- After completing: shows comparison ("You scored 82 vs Sarah's 78!")
- CTA: "Challenge another friend" or "Get a tutor to improve faster"

### 4. Shareable Results with Deep Links (`components/practice/ResultsCard.tsx`)

Update the existing ResultsCard:

#### A. Fix the Share flow
Current `handleShare` shares `window.location.href` — this is wrong for the public practice flow. Replace with the generated shareable result link.

#### B. Add "Challenge a Friend" button
After the share button, add:
- "Challenge a Friend" button (orange glow, spring animation)
- On tap: generates a challenge link and opens native share sheet
- Share text: "I scored {score}/100 in {language}! Can you beat me? {challengeLink}"

#### C. Dynamic OG Image Route (`app/api/og/practice-result/[sessionId]/route.tsx`)
Generate a dynamic Open Graph image for shared results using Next.js ImageResponse:
- Dark background matching Kinetic Slate aesthetic
- Score prominently displayed with glow
- Language flag + level badge
- TutorLingua branding
- Dimensions: 1200x630 for social, 1080x1920 for Stories

### 5. 0-Friction Anonymous Practice Flow

The `/practice` route (PracticeApp) must work WITHOUT authentication:

#### Current state:
- `app/(practice)/practice/page.tsx` loads PracticeApp which uses mock data
- No auth requirement for the public practice flow (good)

#### Required changes:
- When an anonymous user completes a practice session, store their results in localStorage + generate a temporary session token
- The ResultsCard ghost profile email capture must actually work:
  - On email submit: create a student record in Supabase
  - Link the anonymous session results to the new student record
  - If a tutor attribution cookie exists (from `/practice/start/[assignmentId]` or `/join/[token]`), link student to that tutor
- After email capture: show "Your progress is saved! Continue practising or find a tutor"

### 6. Attribution Cookie System (`lib/practice/attribution.ts`)

```typescript
const ATTRIBUTION_COOKIE_NAME = 'tl_ref';
const ATTRIBUTION_COOKIE_DAYS = 30;

export function setAttributionCookie(params: {
  tutorId: string;
  tutorUsername: string;
  source: 'invite_link' | 'practice_assignment' | 'referral' | 'directory';
}): void;

export function getAttributionCookie(): {
  tutorId: string;
  tutorUsername: string;
  source: string;
  timestamp: number;
} | null;

export function clearAttributionCookie(): void;
```

Set the attribution cookie when:
- Student hits `/practice/start/[assignmentId]` (tutor assigned practice)
- Student hits `/join/[token]` (existing invite link flow)
- Student hits any URL with `?ref={tutorUsername}` query param

Read the attribution cookie when:
- Student signs up (link student to tutor)
- Anonymous user captures email on ResultsCard (link to tutor)

### 7. Tutor Referral Programme

#### A. Referral Link (`app/(dashboard)/marketing/referrals/page.tsx`)
New page in tutor dashboard:
- Shows unique referral link: `tutorlingua.com/join/tutor-ref/{username}`
- Stats: "You've referred 3 tutors. 2 are active."
- Incentive copy: "Refer a tutor → Get 1 month of Pro free when they upgrade"
- Share buttons (copy link, WhatsApp, email)

#### B. Referral Tracking (`lib/actions/referrals.ts`)
```typescript
export async function recordTutorReferral(params: {
  referrerTutorId: string;
  referredTutorId: string;
}): Promise<void>;

export async function getTutorReferralStats(tutorId: string): Promise<{
  totalReferred: number;
  activeReferred: number;
  rewardsEarned: number;
}>;

export async function processReferralReward(params: {
  referrerTutorId: string;
  referredTutorId: string;
  rewardType: 'free_month_pro';
}): Promise<void>;
```

#### C. Referral Landing Page (`app/join/tutor-ref/[username]/page.tsx`)
- Shows: "Join {TutorName} on TutorLingua — the platform built for language tutors"
- Tutor's avatar, name, languages they teach
- CTA: "Start your free account" → signup with referral attribution

### 8. Student → Student Viral Mechanics

#### A. "Study Streak" Social Component (`components/practice/StreakShare.tsx`)
After completing a practice session when streak >= 3:
- Show: "You're on a {streak}-day streak! 🔥"
- "Share your streak" button → native share with text: "I'm on a {streak}-day learning streak on TutorLingua! {practiceLink}"

#### B. Practice Leaderboard Seed (`components/practice/Leaderboard.tsx`)
Glassmorphic mini-leaderboard shown on the practice home screen:
- "Most Active This Week" — shows anonymised learners ("Sarah M.", "Marco T.")
- "Your Rank: #47 of 312 Spanish learners"
- Drives competition and daily returns
- For MVP: can use mock data with a note "Live data coming soon"

### 9. Database Schema Changes

```sql
-- Tutor referrals
CREATE TABLE IF NOT EXISTS tutor_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_tutor_id UUID NOT NULL REFERENCES profiles(id),
  referred_tutor_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rewarded')),
  reward_type TEXT DEFAULT NULL,
  reward_applied_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(referrer_tutor_id, referred_tutor_id)
);

-- Practice challenges
CREATE TABLE IF NOT EXISTS practice_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id UUID REFERENCES students(id),
  challenger_name TEXT,
  language TEXT NOT NULL,
  level TEXT NOT NULL,
  challenger_score INTEGER NOT NULL,
  respondent_id UUID REFERENCES students(id),
  respondent_score INTEGER,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'completed', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ DEFAULT NULL
);

-- Anonymous practice sessions (for 0-friction flow)
CREATE TABLE IF NOT EXISTS anonymous_practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT NOT NULL UNIQUE,
  language TEXT NOT NULL,
  level TEXT,
  score INTEGER,
  results JSONB DEFAULT '{}',
  attribution_tutor_id UUID REFERENCES profiles(id),
  attribution_source TEXT,
  claimed_by_student_id UUID REFERENCES students(id),
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add referral tracking to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referred_by_tutor_id UUID REFERENCES profiles(id);
```

### 10. Tests

Create `tests/sprint2-virality.test.ts`:
- Test deep link generation for all 4 link types
- Test attribution cookie set/get/clear
- Test checkout plan resolver with attribution
- Test anonymous session creation and claiming
- Test tutor referral recording and stats
- Test challenge creation and completion

Create `e2e/practice/viral-flows.spec.ts`:
- Anonymous user completes practice → captures email → student created with attribution
- Tutor assigns practice → student receives deep link → lands in pre-loaded practice
- Student shares result → friend opens challenge link → completes challenge → comparison shown

## Architecture Laws

1. **Zero friction** — anonymous users practice immediately, no signup walls
2. **Attribution is invisible** — cookies are set silently, linked on conversion
3. **Deep links are the distribution** — every shareable moment produces a link that drops someone into an experience
4. **Native share first** — use `navigator.share()` with fallback to copy-to-clipboard
5. **Existing patterns** — follow the codebase's server action patterns, repository layer, email system
6. **No breaking changes** — all existing practice/homework flows continue working
7. **Kinetic Slate aesthetic** — all new UI uses glassmorphism, spring physics, orange accents on true-black

## Files to Create
- `lib/practice/unified-assignment.ts`
- `lib/practice/deep-links.ts`
- `lib/practice/attribution.ts`
- `lib/actions/referrals.ts`
- `components/dashboard/AssignPracticeButton.tsx`
- `components/practice/StreakShare.tsx`
- `components/practice/ChallengeComparison.tsx`
- `components/practice/Leaderboard.tsx`
- `app/practice/start/[assignmentId]/page.tsx`
- `app/practice/result/[sessionId]/page.tsx`
- `app/practice/challenge/[challengerId]/page.tsx`
- `app/join/tutor-ref/[username]/page.tsx`
- `app/(dashboard)/marketing/referrals/page.tsx`
- `app/api/og/practice-result/[sessionId]/route.tsx`
- `supabase/migrations/20260213155000_add_virality_tables.sql`
- `tests/sprint2-virality.test.ts`

## Files to Modify
- `components/practice/ResultsCard.tsx` — add challenge button, fix share links, add streak share
- `app/(practice)/practice/PracticeApp.tsx` — accept pre-loaded exercise context from assignments
- `app/(practice)/practice/page.tsx` — handle assignment query params
- `app/(dashboard)/students/[studentId]/page.tsx` — add Assign Practice button
- `app/join/[token]/page.tsx` — set attribution cookie on invite link
- `lib/hooks/use-practice.ts` — accept initial exercise context

## Do NOT Touch
- Tutor subscription/billing flows
- Sprint 1 tier/access changes
- Booking system
- Classroom/LiveKit
- Copilot briefings
