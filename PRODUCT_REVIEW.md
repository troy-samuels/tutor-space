# TutorLingua — Product & Architecture Review
**Date:** 2026-02-15  
**Reviewer:** Malcolm (code audit)  
**Scope:** Full-stack product coherence, monetisation logic, growth loops, technical debt

---

## Executive Summary

TutorLingua is an ambitious two-sided marketplace connecting language tutors with students, wrapped around an AI practice engine. The codebase is substantial (~138 migrations, hundreds of components) and shows clear signs of rapid iteration. The core product works, but there are **coherence gaps** between what the marketing promises, what the code enforces, and what users actually experience. The biggest risks are: confusing student UX from route fragmentation, pricing copy that contradicts tier logic, and a subscription webhook handler that's become a maintenance liability.

**Verdict:** Solid foundation, needs tightening before scaling.

---

## 1. Student UX — Route Fragmentation & Dead Ends

### 🔴 `/student/practice` redirects to `/student/homework` (dead concept merge)
**File:** `app/student/practice/page.tsx` (lines 1–9)

The student practice page is a hard `redirect("/student/homework")`, yet:
- Active sub-routes still exist: `/student/practice/subscribe`, `/student/practice/buy-credits`, `/student/practice/[assignmentId]`, `/student/practice/credits-success`
- The `QuickPracticeCard` component links to `/student/practice` (which bounces to homework)
- `AIPracticeCard` links into practice assignment routes under `/student/practice/[id]`

**Impact:** Students clicking "Practice" get bounced to homework, then must navigate *back* to practice sub-routes for actual AI sessions. The IA tells two conflicting stories.

**Fix:** Either commit to the merge (move all practice sub-routes under homework) or restore `/student/practice` as a proper page.

### 🔴 Two separate practice route groups
- `app/(practice)/practice/` — the public-facing anonymous/challenge practice app (PracticeApp.tsx)
- `app/student/practice/` — the authenticated student practice portal

These share no layout, no navigation, and have different auth models. A student who discovers practice via `/practice` (public) then logs in gets redirected to a completely different UX at `/student/practice` → `/student/homework`.

**Impact:** The anonymous → authenticated conversion path is jarring. Two codebases doing similar things.

### 🟡 `/student/assignments` exists alongside `/student/homework`
`AssignmentsPageClient.tsx` is a unified view of homework + practice assignments, but the nav config (`lib/navigation/config.ts`) routes to `/student/homework` for the "Homework" tab — not `/student/assignments`.

**Impact:** Feature exists but isn't discoverable via primary navigation.

### 🟡 No `/student/practice/history` route
Practice sessions are tracked in the DB but there's no student-facing history page. Students can't review past practice sessions or scores. The only history is via homework completion badges.

---

## 2. Pricing & Copy vs Reality

### 🔴 Landing page claims "Unlimited AI practice drills" on free tier
**File:** `components/landing/PricingStudent.tsx` (line 15)

```
"Unlimited AI practice drills, level assessments, streak tracking, and full access to the tutor directory. No credit card needed."
```

**Reality** (`lib/practice/constants.ts` lines 6–9):
- Free tier: **3 sessions/month**, 20 text turns/session, **no audio**
- Basic tier (tutor-linked): 10 sessions/month, 40 turns
- Unlimited ($4.99/mo): actually unlimited

This is a compliance risk. The FAQ explicitly says "unlimited" for free users, but the access layer enforces hard limits.

**Fix:** Update landing copy to say "Free AI practice sessions every month" or similar. Remove "unlimited" from free tier descriptions.

### 🟡 Three pricing models coexist in the codebase
1. **Legacy model** — `$8/mo` full subscription with base + blocks (subscription handler lines 776–894, logged as "legacy model")
2. **Freemium model** — Free tier with `$5` block add-ons (migration `20251228100000`)
3. **Tier model** — Free / Basic / Unlimited($4.99) / Solo($9.99) (current `constants.ts`)

The webhook handler (`subscription.ts`, 1,150 lines) maintains all three paths simultaneously. Each `customer.subscription.updated` event must branch through metadata.type checks to determine which handler applies.

**Impact:** A single pricing bug could silently affect one cohort but not another. Test coverage exists but only for the freemium tier logic.

### 🟡 Tutor pricing hardcoded in component
**File:** `components/pricing/SignupPlanSelector.tsx` (lines 17–21)

```typescript
const PRICING = {
  pro: { monthly: { price: "$29" }, annual: { price: "$199" } },
  studio: { monthly: { price: "$49" }, annual: { price: "$349" } },
};
```

These are hardcoded strings, not derived from Stripe price IDs. If prices change in Stripe, the UI won't reflect it until manually updated.

---

## 3. Growth Loops — Wired but Incomplete

### ✅ What works
- **Challenge system:** `POST /api/practice/challenges` creates a challenge, generates a deep link, opponent completes via `PUT /api/practice/challenges/[challengeId]`. Full loop.
- **Share button:** `ResultsCard.tsx` generates shareable result links via `generateShareableResultLink()`, uses Web Share API with clipboard fallback.
- **Tutor referrals:** `/join/tutor-ref/[username]` sets attribution cookie, `tutor_referrals` table tracks status. Dashboard at `/marketing/referrals`.
- **Anonymous sessions:** `POST /api/practice/anonymous/session` creates tracked anonymous practice sessions with tutor attribution.

### 🟡 Email capture → account gap
`GhostEmailCapture` in `ResultsCard.tsx` (line 252) collects email + sessionToken and POSTs to `/api/practice/anonymous/claim`. The claim endpoint links the anonymous session to an existing student record by email — but there's **no account creation flow**. If the email doesn't match an existing student, the claim silently fails.

**Impact:** The primary anonymous → registered conversion hook is leaky. Most anonymous users won't already have accounts.

### 🟡 Leaderboard is mocked
**File:** `components/practice/Leaderboard.tsx` (lines 10–14)

```typescript
const LEADERBOARD_MOCK = [
  { name: "Sarah M.", minutes: 216 },
  { name: "Marco T.", minutes: 198 },
  { name: "Nadia R.", minutes: 187 },
];
```

Static mock data, no DB query. The competitive loop this implies doesn't exist yet.

### 🟡 Streak sharing produces generic links
`StreakShare.tsx` generates share messages with `window.location.origin + "/practice"` — no personalisation, no tutor attribution, no challenge context. It's a share button that links to the generic practice page rather than a personalised entry point.

---

## 4. Subscription Webhook Handler — The 1,150-Line Problem

**File:** `app/api/stripe/webhook/handlers/subscription.ts`

This single file handles:
- Tutor platform subscriptions (Pro/Studio/Lifetime)
- Student AI practice subscriptions (legacy model)
- Student AI practice subscriptions (freemium model)  
- Student lesson subscriptions (per-tutor recurring)
- Student practice payment failures
- Stripe Connect deauthorisation

**Specific risks:**

1. **Lines 28–42:** Metadata.type branching — if a subscription arrives without `type` metadata, it falls through to the tutor handler by default. A student practice subscription with malformed metadata would incorrectly update a tutor profile.

2. **Lines 776–894:** Legacy model handler still active. If any legacy subscribers remain, this code runs. If none remain, it's dead code in a critical payment path.

3. **Lines 548–560:** `parseStudentPracticeTier()` accepts only "unlimited" or "solo" — any future tier requires handler modification.

4. **No integration tests for the full webhook dispatch.** Unit tests exist for individual helpers (checkout plans, deep links) but the dispatch logic in `handleSubscriptionCreatedOrUpdated` isn't tested end-to-end.

**Recommendation:** Split into separate handler files by subscription type. Add a metadata.type exhaustiveness check with explicit error logging for unknown types.

---

## 5. Technical Debt Hotspots

### 🔴 Giant API route files
| File | Lines | Concern |
|------|-------|---------|
| `api/stripe/webhook/handlers/subscription.ts` | 1,150 | 4 subscription models in one file |
| `api/practice/audio/route.ts` | 864 | Mixed legacy + freemium billing inline |
| `lib/actions/auth/registration.ts` | 752 | Registration + profile creation + Stripe customer |
| `api/practice/chat/route.ts` | 707 | AI chat + tier enforcement + message counting |

### 🟡 138 migrations, no squash
The migrations directory has 138 files. Some are incremental column additions (`ADD COLUMN IF NOT EXISTS` pattern) that could be squashed. This makes local dev setup slow and migration debugging painful.

### 🟡 Archived but not deleted
`app/_archived_practice/` contains old practice code that still references `practice_usage_periods`. It's excluded from routing by the underscore prefix, but IDE tooling and grep results include it, creating confusion.

### 🟡 `isTableMissing` defensive checks
**File:** `lib/actions/students/connections.ts`, `lib/actions/students/lessons/bookings.ts`

Code like `isTableMissing(connectionError, "student_tutor_connections")` suggests the app runs in environments where migrations haven't been applied. This is reasonable for early development but should be removed before production — it masks real errors.

### 🟡 Recording consent added but not gated
Migration `20260309090000_add_tutor_recording_consent.sql` and `signup-form.tsx` add a recording consent checkbox, but there's no enforcement layer checking consent before recording-related features. The consent is collected but not verified downstream.

---

## 6. What's Working Well

- **Onboarding flow:** 7-step timeline (StepProfileBasics → StepPayments) is well-structured with progress persistence and skip-and-return capability.
- **Practice AI engine:** The `usePracticeMachine` hook provides a clean state machine (splash → language-picker → level-assessment → practice → results). Well-abstracted.
- **Tier-based access control:** `getStudentPracticeAccess()` is centralised and returns a typed access object. All API routes defer to it.
- **Attribution system:** Cookie-based attribution with server-side resolution handles username vs UUID gracefully.
- **Signup checkout guard:** The `SignupCheckoutGuard` component elegantly gates the onboarding flow behind Stripe checkout completion without blocking the entire app.
- **Test structure:** Node.js native test runner with clean fixtures. Good coverage of payment logic and deep link generation.
- **Type safety:** Consistent use of TypeScript throughout. Zod validation on all API inputs.

---

## 7. Recommended Priority Actions

### Immediate (before next deploy)
1. **Fix landing page "unlimited" claim** — legal/trust risk
2. **Decide on `/student/practice` vs `/student/homework`** — pick one canonical path

### This sprint
3. **Split subscription webhook handler** into tutor/student-practice/lesson-subscription sub-handlers
4. **Add anonymous → account creation** in the email claim flow (create account if no match)
5. **Remove or gate legacy pricing paths** — audit whether any legacy subscribers exist, if not, delete the handler

### Next sprint
6. **Wire leaderboard to real data** or remove the mock
7. **Add practice session history** page for students
8. **Squash old migrations** into a baseline
9. **Remove `_archived_practice/`** directory
10. **Add metadata.type exhaustiveness check** in webhook dispatch

---

*Review based on static analysis of the full codebase. Production behaviour may differ based on environment configuration and Stripe webhook state.*
