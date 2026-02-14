# Sprint 1: Revenue Model Rearchitecture — Option C (Hybrid)

## Business Context

TutorLingua is pivoting from a Studio-gated practice model to a hybrid model where:
- ALL students can access AI practice (no tutor plan gating)
- Tutor-linked students get basic practice included (10 sessions/month)
- Students upgrade to Unlimited for $4.99/mo (paid directly by student)
- Solo students (no tutor) pay $9.99/mo for practice
- Tutor SaaS tiers remain: Free / Pro ($29) / Studio ($79)
- NO commission on tutor-brought students. Ever.

## Deliverables

### 1. New Practice Constants (`lib/practice/constants.ts`)

Replace the current Studio-gated freemium model with:

```typescript
// === STUDENT PRACTICE TIERS ===

// FREE TIER (any student, tutor-linked or solo)
export const FREE_SESSIONS_PER_MONTH = 3;
export const FREE_TEXT_TURNS_PER_SESSION = 20;
export const FREE_AUDIO_ENABLED = false;

// BASIC TIER (tutor-linked students on Pro/Studio tutor plans)
export const BASIC_SESSIONS_PER_MONTH = 10;
export const BASIC_TEXT_TURNS_PER_SESSION = 40;
export const BASIC_AUDIO_ENABLED = false; // text only

// UNLIMITED TIER ($4.99/mo - student pays directly)
export const UNLIMITED_PRICE_CENTS = 499;
export const UNLIMITED_SESSIONS_PER_MONTH = -1; // unlimited
export const UNLIMITED_TEXT_TURNS_PER_SESSION = -1; // unlimited
export const UNLIMITED_AUDIO_ENABLED = true;
export const UNLIMITED_ADAPTIVE_ENABLED = true;
export const UNLIMITED_VOICE_INPUT_ENABLED = true;

// SOLO TIER ($9.99/mo - students with no tutor)
export const SOLO_PRICE_CENTS = 999;
// Same features as Unlimited
export const SOLO_SESSIONS_PER_MONTH = -1;
export const SOLO_TEXT_TURNS_PER_SESSION = -1;
export const SOLO_AUDIO_ENABLED = true;

// LEGACY (keep for backwards compat, map to new tiers)
export const AI_PRACTICE_BLOCK_PRICE_CENTS = 500; // deprecated
export const FREE_AUDIO_SECONDS = 2700; // deprecated
export const FREE_TEXT_TURNS = 600; // deprecated
```

### 2. New Practice Access Gate (`lib/practice/access.ts`)

Completely rewrite `getStudentPracticeAccess` to implement the new model:

```typescript
export type StudentPracticeTier = 'free' | 'basic' | 'unlimited' | 'solo';

export type StudentPracticeAccessResult = {
  hasAccess: true;
  tier: StudentPracticeTier;
  sessionsPerMonth: number; // -1 = unlimited
  textTurnsPerSession: number; // -1 = unlimited
  audioEnabled: boolean;
  adaptiveEnabled: boolean;
  voiceInputEnabled: boolean;
  tutorName?: string;
  tutorId?: string;
  showUpgradePrompt: boolean;
  upgradePrice: number | null; // cents
};
```

Access logic:
- Student has `practice_subscription = 'unlimited'` → Unlimited tier
- Student has `practice_subscription = 'solo'` → Solo tier  
- Student has tutor on Pro/Studio → Basic tier (10 sessions, text only)
- Student has tutor on Free → Free tier (3 sessions)
- Student has no tutor → Free tier (3 sessions), show upgrade to Solo ($9.99)

Key change: REMOVE the `hasStudioAccess` check. Practice is available to ALL students. The tier determines limits, not a binary gate.

### 3. Student Practice Subscription Types (`lib/types/payments.ts`)

Add new types:

```typescript
export type StudentPracticeSubscription = 
  | null          // free tier
  | 'unlimited'   // $4.99/mo (tutor-linked student upgrade)
  | 'solo';       // $9.99/mo (solo student, no tutor)
```

### 4. New Subscription Checkout (`app/api/practice/subscribe/route.ts`)

Complete rewrite. Current endpoint returns 410 (disabled). New flow:

POST creates a Stripe Checkout session for the student:
- If student has a tutor → $4.99/mo Unlimited plan
- If student has no tutor → $9.99/mo Solo plan
- Payment goes directly to TutorLingua (NOT through tutor's Stripe Connect)
- No application fees, no destination charges — this is platform revenue

GET returns current subscription status with tier info.

### 5. Usage Tracking Update (`app/api/practice/usage/route.ts`)

Update to return tier-based allowances instead of block-based:

```typescript
export interface PracticeUsageStats {
  tier: StudentPracticeTier;
  sessionsUsedThisMonth: number;
  sessionsAllowance: number; // -1 = unlimited
  textTurnsUsedThisSession: number;
  textTurnsAllowance: number; // -1 = unlimited
  audioEnabled: boolean;
  adaptiveEnabled: boolean;
  voiceInputEnabled: boolean;
  canUpgrade: boolean;
  upgradePriceCents: number | null;
  periodStart: string;
  periodEnd: string;
}
```

### 6. Practice Session Gate Update (`app/api/practice/session/route.ts`)

Update session creation to:
- Check student's practice tier (not Studio gate)
- Enforce session limits per tier
- Return tier info in response so client knows what features to enable/disable
- If session limit reached, return 402 with upgrade prompt data

### 7. Freemium Gate UI Component (`components/practice/UpgradeGate.tsx`)

New glassmorphic upgrade prompt shown when student hits their session limit:

For tutor-linked students (Free → Unlimited):
- "You've used your 3 free sessions this month"
- "Upgrade to Unlimited Practice — $4.99/mo"
- Features list: Unlimited sessions, Voice input, Adaptive difficulty, Full progress tracking
- CTA: "Upgrade Now" → Stripe Checkout
- Secondary: "Continue next month for free"

For solo students (Free → Solo):  
- "You've used your 3 free sessions"
- "Unlock Unlimited Practice — $9.99/mo"
- Same features list
- CTA: "Start Practising Unlimited"
- Below CTA: "Have a tutor? Ask them to invite you for a lower price"

Style: Kinetic Slate aesthetic (glassmorphism, spring animations, orange accents on true-black)

### 8. Feature Gating in Practice UI

Update PracticeChat and LevelAssessment to check tier for feature access:
- Voice input toggle: only show if `tier === 'unlimited' || tier === 'solo'`
- Adaptive difficulty badge: only show if `adaptiveEnabled`
- Listen button: available on all tiers (SpeechSynthesis is free, costs nothing)
- If a locked feature is tapped, show a mini upgrade prompt (not a full gate)

### 9. Test Updates

Update `tests/practice-freemium-smoke.test.ts`:
- Test free tier: 3 sessions allowed, 4th blocked with upgrade prompt
- Test basic tier: 10 sessions allowed for tutor-linked students on Pro/Studio
- Test unlimited tier: no session limits
- Test solo tier: no session limits
- Test feature gating: voice/adaptive locked on free/basic
- Test Stripe checkout creation for both $4.99 and $9.99 plans
- Test that practice access works WITHOUT Studio gate

Update `e2e/practice/ai-practice-session.spec.ts`:
- Remove Studio access check
- Add tier-based flow tests

### 10. Database Schema

Add to students table (Supabase migration):
```sql
ALTER TABLE students 
  ADD COLUMN IF NOT EXISTS practice_tier TEXT DEFAULT NULL 
    CHECK (practice_tier IN ('unlimited', 'solo')),
  ADD COLUMN IF NOT EXISTS practice_subscription_id TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS practice_sessions_used INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS practice_period_start TIMESTAMPTZ DEFAULT NULL;
```

## Architecture Laws

1. **Zero breaking changes to tutor flows** — booking, classroom, copilot, drills all remain untouched
2. **Backwards compatible** — existing students with legacy block subscriptions continue working (map to unlimited tier)
3. **All new constants are typed** — no magic numbers, no `any` types
4. **Every API endpoint validates tier** — no client-side-only gating (security)
5. **Stripe webhooks handle subscription lifecycle** — created, updated, cancelled, payment_failed
6. **All prices in cents** — consistent with existing codebase convention
7. **Error responses include upgrade data** — so the client can render the gate without an extra API call

## Files to Modify
- `lib/practice/constants.ts` — new tier constants
- `lib/practice/access.ts` — new access logic (complete rewrite)
- `lib/types/payments.ts` — add StudentPracticeSubscription type
- `app/api/practice/subscribe/route.ts` — new checkout flow (complete rewrite)
- `app/api/practice/usage/route.ts` — tier-based usage stats
- `app/api/practice/session/route.ts` — tier-based session gating
- `app/api/practice/chat/route.ts` — tier-based feature gating for voice/adaptive
- `app/api/stripe/webhook/route.ts` — handle new subscription types
- `components/practice/UpgradeGate.tsx` — new component
- `components/practice/PracticeChat.tsx` — feature gating
- `components/practice/LevelAssessment.tsx` — feature gating
- `tests/practice-freemium-smoke.test.ts` — updated tests
- `e2e/practice/ai-practice-session.spec.ts` — updated e2e tests

## Do NOT Touch
- Tutor subscription flows (Pro/Studio pricing)
- Booking system
- Stripe Connect (tutor payouts)
- Classroom/LiveKit
- Copilot briefings
- Drills/homework system (Sprint 2)
- The Kinetic Slate UI components (already built)
