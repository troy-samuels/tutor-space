# Feature Wiring Audit — Cross-Feature Integration

**Date:** 2026-02-15
**Auditor:** Malcolm (main session)

## The Three Features

1. **Tutor Onboarding** — `/onboarding` → 7-step wizard → `/dashboard`
2. **Magic Recap** — `/recap` (tutor) → `/r/[shortId]` (student)
3. **Student Portal** — `/student/*` (homework, practice, vocabulary, drills)

---

## 🔴 Critical: Features Are Completely Siloed

The three features share ZERO cross-references. They exist as isolated islands with no user flow connecting them.

### Finding 1: Nothing in the app links to `/recap`

**Evidence:**
- `grep -rn "href.*\/recap"` across all `app/` and `components/` = **zero results**
- Not in tutor navigation (`lib/navigation/config.ts`)
- Not in the dashboard page
- Not in the onboarding flow
- Not on the landing page
- Not in the "More" menu

**Impact:** Tutors have no way to discover the recap tool unless they know the URL.

**Fix:** Add `/recap` to the tutor navigation. Options:
- Add to `TUTOR_MORE_ITEMS` in `lib/navigation/config.ts`
- Add a CTA card on the dashboard ("Create a lesson recap")
- Add as final step in onboarding ("Try creating your first recap")

### Finding 2: Recap page has no link back to tutor profile

**Evidence:**
- `grep -rn "username\|profile\|tutor_id"` across `components/recap/` and `app/r/` = **zero results**
- The `recaps` table has `tutor_id` and `tutor_display_name` but the student page doesn't use them
- No "Book another lesson" or "View tutor profile" CTA

**Impact:** The recap spec (Section: Card 4 — The Calendar) explicitly designed this as the conversion path: student sees recap → finds tutor → books directly. This path is completely unbuilt.

**Fix:**
- Store tutor `username` in the recap (if tutor is signed up)
- Add a footer CTA on the student recap page: "[Tutor Name]'s profile" → links to `/{username}`
- This is the entire growth flywheel — recap → student → tutor profile → direct booking

### Finding 3: Student portal doesn't know about recaps

**Evidence:**
- `grep -rn "recap\|/r/"` across `app/student/` = **zero results**
- `/student/homework` shows homework assigned through the platform, not recaps
- Vocabulary bank is independent — doesn't pull vocab from recaps
- Student assignments page has no recap integration

**Impact:** Students who receive recap links and later sign up have no way to see their recap history in the portal.

**Fix (v2):**
- After student account creation, link `recap_attempts` to their `student_id`
- Show recap history in `/student/homework` or `/student/assignments`
- Import recap vocabulary into the vocabulary bank

### Finding 4: Onboarding doesn't mention the recap tool

**Evidence:**
- `grep -rn "recap"` across `components/onboarding/` = **zero results**

**Impact:** New tutors complete onboarding without knowing the most valuable free tool exists.

**Fix:** Add a post-onboarding prompt or dashboard card: "Create your first lesson recap in 30 seconds"

---

## 🟡 Important: Navigation & Flow Issues

### Finding 5: `/student/practice` redirects to `/student/progress`

The centre nav button (🔥 Practice) in the student bottom nav links to `/student/practice`, which just does `redirect("/student/progress")`. The "Practice" brand promise leads to a generic progress page, not actual practice.

**Fix:** Either:
- Make `/student/practice` show real practice content (conversation AI, exercises)
- Or change the nav to link directly to where practice actually lives

### Finding 6: `/student/drills` redirects to `/student/homework`

Same pattern — the drills page is a redirect stub, not a real destination.

### Finding 7: Tutor dashboard has no recap metrics

No way for tutors to see:
- How many recaps they've generated
- Which students have completed practice
- Score trends across students

This data exists in the DB (`recap_attempts`, `recap_students`) but isn't surfaced anywhere.

---

## ✅ Working Correctly

### Onboarding Flow
- All 7 step components exist and load correctly
- `completeOnboarding()` properly sets `onboarding_completed = true`
- Signup → email verify → onboarding → dashboard redirect chain is intact
- Stripe checkout gate in auth callback works

### Recap Pipeline (Technical)
- Tutor input → AI generation → Zod validation → DB insert → short_id trigger → all working
- Student page → server component fetches recap → client hydration → exercises → attempt submission → all wired
- Error handling: generic messages, no leaked internals
- Schema matches code: all column names align between migration and API routes
- Multilingual support properly integrated with English fallbacks

### Student Portal (Technical)
- Auth flow: login → session check → redirect if unauthenticated
- Homework page fetches real data from `getStudentProgress()`
- Vocabulary bank component exists and loads
- Bottom nav configuration is consistent
- Assignment page aggregates homework + practice data

### Build Health
- TypeScript: zero errors
- Next.js build: clean, all routes compile
- No missing imports (verified by successful build)
