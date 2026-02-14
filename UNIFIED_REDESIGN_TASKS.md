# TutorLingua Unified Redesign — Task List
*Created: Feb 13, 2026*
*Last updated: Feb 13, 2026 — All phases complete*

---

## Phase 1: Foundation ✅ COMPLETE

### 1.1 Shared Navigation Config ✅
- [x] Create `lib/navigation/config.ts` — single source of truth for all nav items by role (student, tutor, guest)
- [x] Student tabs: Home | Schedule | 🔥 Practice (centre) | Messages | More
- [x] Tutor tabs: Home | Calendar | Students | Services | More
- [x] Guest: no nav items (header-only handled by landing components)

### 1.2 Unified Bottom Nav Component ✅
- [x] Create `components/navigation/BottomNav.tsx` — shared bottom nav that reads from config
- [x] Practice tab gets centre position, elevated icon, primary colour
- [x] Badge support (unread messages, homework count)
- [x] Active state with spring animation + animated indicator
- [x] More menu with Sheet slide-up
- [x] Replace `components/dashboard/bottom-nav.tsx` usage — old component deleted
- [x] Replace `components/student-auth/StudentBottomNav.tsx` usage — old component deleted

### 1.3 Unified Top Nav (Desktop) ✅
- [x] Create `components/navigation/TopNav.tsx` — horizontal nav for desktop (>1024px)
- [x] Same config as bottom nav, rendered horizontally
- [x] rightSlot prop for profile dropdown, notifications

### 1.4 Practice Context Header ✅ (Previously completed)
- [x] Create `components/practice/PracticeHeader.tsx`
- [x] Back arrow (context-aware routing)
- [x] Progress bar (exercise progress)
- [x] XP counter
- [x] Logo fallback for anonymous users

### 1.5 Scope Dark Theme to Practice ✅ (Previously completed)
- [x] Modify `app/(practice)/layout.tsx` — full-screen immersive mobile, centred 480px desktop
- [x] `.dark` scoped class on practice container
- [x] Desktop: centred max-w-[480px] with rounded-3xl, ring, shadow

---

## Phase 2: User Journey Connections ✅ COMPLETE

### 2.1 Results Page Overhaul ✅
- [x] Modify `app/(practice)/practice/result/[sessionId]/page.tsx`
- [x] Anonymous path: Score + Level + "Save progress" (soft signup) + Tutor recommendation cards + Challenge CTA
- [x] Authenticated path: Score + "Tutor notified" + "Book next lesson" + Share + Back to dashboard
- [x] Both paths: beautiful shareable Language Card (score ring, colour-coded, percentile, branding)

### 2.2 Tutor Recommendation Widget ✅
- [x] Create `components/practice/TutorRecommendation.tsx`
- [x] Shows 2-3 tutor cards filtered by language just practised
- [x] Social proof: ratings, lesson count, price
- [x] CTA: "Book a free trial" → tutor public profile
- [x] Appears on results page for anonymous users
- [x] Replaced hardcoded hsl() with design tokens

### 2.3 Student Dashboard — Practice Card ✅
- [x] Create `components/student-auth/QuickPracticeCard.tsx`
- [x] Added to student home/search page
- [x] Shows: current streak 🔥, daily drill status, "Continue"/"Start" button
- [x] Dark mini-preview inside light dashboard card (bridge element)

### 2.4 Tutor Dashboard — Student Activity Feed ✅
- [x] Create `components/dashboard/StudentActivityFeed.tsx`
- [x] Shows: recent practice completions, scores, streaks
- [x] Activity types: practice_complete, streak_milestone, assignment_complete
- [x] Empty state with helpful CTA

### 2.5 Post-Lesson → Assignment Flow ✅
- [x] Added `postLesson`, `lessonLanguage`, `lessonLevel` props to `AssignPracticeButton.tsx`
- [x] Post-lesson variant shows full-width primary CTA: "Assign {language} practice"
- [x] Pre-fills language and level from the completed lesson

---

## Phase 3: Daily Practice & Retention ✅ COMPLETE

### 3.1 Daily Practice System ✅
- [x] API: `/api/practice/daily` — returns today's drill or generates one
- [x] Auto-generates based on student's most recent practice language/level
- [x] Race-condition safe (handles concurrent requests)
- [x] DB: `daily_practice_queue` table — migrated to production

### 3.2 Streak System (Cross-App) ✅
- [x] Create `lib/practice/streaks.ts` — streak calculation from practice history
- [x] `getStudentStreak()` — calculates current, longest, todayComplete
- [x] `isStreakAtRisk()` — for push notification triggers
- [x] Percentile-based streak logic (handles gaps, same-day dedup)
- [x] Push notifications — deferred (needs push infrastructure, not part of redesign)
- [x] Streak freeze — deferred (premium feature, not part of redesign)

### 3.3 Landing Page "Test Your Level" CTA ✅
- [x] Added prominent CTA to Hero: "🎯 Test your level in 3 minutes — no signup required"
- [x] Routes to `/practice` (anonymous, no signup)
- [x] Styled as a pill with hover animation

---

## Phase 4: Viral Mechanics ✅ COMPLETE

### 4.1 Language Card Generator ✅
- [x] Create `lib/sharing/language-card.ts`
- [x] `buildLanguageCard()` — generates full card data payload
- [x] Score-based tagline generator with personality copy
- [x] Percentile estimation from score
- [x] Language flags, date formatting, branding
- [x] React component in ResultsCard (ScoreRing + LanguageCard)

### 4.2 Challenge Landing Page ✅
- [x] Overhauled `app/(practice)/practice/challenge/[challengerId]/page.tsx`
- [x] Challenger's card with avatar, score, level badge
- [x] "Challenge Mode" badge with visual hierarchy
- [x] OG metadata for social sharing
- [x] "Accept Challenge" → instant play (no signup)

### 4.3 Centralised Share Logic ✅
- [x] `lib/sharing/index.ts` — all share URLs, messages, Web Share API
- [x] `generateChallengeUrl()`, `generateResultUrl()`, `generateTutorReferralUrl()`
- [x] `share()` — Web Share API + clipboard fallback
- [x] `whatsappShareUrl()`, `emailShareUrl()` — deep link helpers
- [x] `buildShareMessage()` — context-aware share text for all types

### 4.4 Tutor Referral Network ✅
- [x] Create `components/dashboard/ReferralNetwork.tsx`
- [x] Shows: tutors referred, network students
- [x] Empty state with "Start referring" CTA
- [x] Active state with stats grid + sharing tools

---

## Phase 5: Design Token Migration ✅ COMPLETE

### 5.1 globals.css Updates ✅
- [x] `.dark` scoping on practice layout container
- [x] `shadow-warm-sm` and `shadow-warm-glow` CSS variables
- [x] `--spring-bounce` deferred (using JS spring constants in `lib/animations.ts`)

### 5.2 UI Primitive Updates ✅
- [x] `button.tsx` — added `immersive` variant (primary bg + glow shadow), increased lg size to h-12
- [x] `progress.tsx` — added `duration-500 ease-out` transition animation to indicator
- [x] `badge.tsx` — increased padding to px-3.5 py-1.5 for touch friendliness

### 5.3 Practice Components — Hardcoded Hex Migration (19 files) ✅ ALL DONE
- [x] All 19 practice components migrated to design tokens

### 5.4 Leaked Colour Cleanup (7 files) ✅ ALL DONE
- [x] All 7 dashboard/student files cleaned up

### 5.5 Landing Page Token Cleanup ✅ DONE
- [x] Replace `text-gray-*` → `text-muted-foreground` (11 files)
- [x] Replace `bg-brand-white` → `bg-background` (8 files)
- [x] All landing components use design tokens

---

## Phase 6: Animation & Polish ✅ COMPLETE

### 6.1 Shared Animation Library ✅
- [x] `lib/animations.ts` — spring transitions, page variants, card hover, fade in, stagger

### 6.2 Dashboard Micro-Interactions ✅
- [x] Create `components/ui/animate-in.tsx` — `AnimateIn` wrapper with fade, slide, hover lift
- [x] Create `StaggerIn` container for list animations
- [x] Wrapped tutor dashboard cards with staggered `AnimateIn` + `hoverLift`
- [x] Wrapped student search page sections with staggered `AnimateIn`

### 6.3 Page Transitions ✅
- [x] Create `components/ui/page-transition.tsx` — `PageTransition` wrapper
- [x] Fade + subtle slide up, uses AnimatePresence with pathname key
- [x] Added to `DashboardShell` — all tutor dashboard pages get transitions
- [x] Added to `StudentPortalLayout` — all student pages get transitions

---

## Build Status

- **TypeScript:** 0 errors
- **Next.js build:** 3 pre-existing errors (parallel route conflicts + server import in client chain) — none from this redesign
- **Pre-existing bugs fixed:** `withCache` missing export, `resolveUnifiedAssignment` broken import, `requireTutor` missing export

## Execution Summary

| Phase | Status | Files Created | Files Modified |
|-------|--------|---------------|----------------|
| 1. Foundation | ✅ | 3 | 0 |
| 2. User Journey | ✅ | 3 | 3 |
| 3. Daily Practice | ✅ | 2 | 1 |
| 4. Viral Mechanics | ✅ | 2 | 1 |
| 5. Design Tokens | ✅ | 0 | 11 |
| 6. Animation | ✅ | 2 | 0 |
| **Total** | **✅** | **12** | **16** |

### Completion Notes
- Old `bottom-nav.tsx` and `StudentBottomNav.tsx` deleted — all routes use unified `BottomNav`
- `AnimateIn` with staggered delays and `hoverLift` applied to tutor dashboard grid cards
- `PageTransition` wired into both `DashboardShell` and `StudentPortalLayout`
- `QuickPracticeCard` wired with real streak/daily data via `getStudentPracticeDashboard()`
- `StudentActivityFeed` wired with real data via `getTutorStudentActivity()` on tutor dashboard
- `daily_practice_queue` table created in production Supabase
- Server action `lib/actions/practice-dashboard.ts` created for all practice dashboard queries
