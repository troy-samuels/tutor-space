# TutorLingua Landing Page Redesign — Design Brief
*Created: Feb 13, 2026*
*Source: Gemini 3 Pro + Malcolm analysis*

---

## Strategy: Two-Door Approach

**No audience toggle. No compromised single page.** Two distinct, hyper-focused landing pages on the same domain.

### Why This Approach

- Maximum messaging clarity per audience
- Superior SEO (dedicated pages rank for different intent keywords)
- Tailored conversion funnels
- Zero cognitive load ("am I a tutor or student?")
- Proven pattern (Stripe, Notion, Linear all do this)

---

## Routing & URLs

| Route | Audience | Purpose |
|-------|----------|---------|
| `/` | **Students** | Primary landing — student acquisition is the growth engine |
| `/tutors` | **Tutors** | Tutor landing — refined version of current homepage |
| `/practice` | **Both** (anonymous) | Gamified practice — main student acquisition hook |
| `/c/[username]` | **Students** | Tutor public profiles (existing) |

**Strategic choice:** Root domain becomes student-facing. Students are the demand side — where students go, tutors follow. Current tutor-focused content moves to `/tutors`.

### SEO Considerations
- Update `sitemap.ts` with both `/` and `/tutors` as primary pages
- Each page gets its own canonical URL
- i18n routes follow pattern: `/es`, `/es/tutors`, `/fr`, `/fr/tutors`, etc.
- UTM-aware: tutor campaigns can redirect to `/tutors` via query params

---

## Shared Navigation

Single `GlobalNav` component, content-driven by route:

### Student View (on `/`)
- Logo
- Links: Features, Find a Tutor, Pricing
- Subtle link: "For Tutors" → `/tutors`
- Auth: Login | **Start for Free** (→ `/practice`)

### Tutor View (on `/tutors`)
- Logo
- Links: Features, Pricing, Studio AI
- Subtle link: "For Students" → `/`
- Auth: Login | **Start Free Trial** (→ `/signup?role=tutor`)

---

## Student Landing Page (`/` → `app/page.tsx`)

**Goal:** Convert anonymous visitors into engaged learners.
**Conversion funnel:** See practice hook → Try `/practice` → Sign up to save progress → Discover & book tutor.

### Sections

#### 1. HeroStudent ⭐ NEW
- **Headline:** "Find your voice, one lesson at a time." or "The fun way to fluency."
- **Sub-headline:** "AI-powered practice, real-world tutors. The complete path to mastering a new language."
- **Visual:** Dynamic, optimistic — diverse people communicating
- **CTA Primary:** `Start learning for free` → `/practice`
- **CTA Secondary:** `Find a tutor` → `/student/search`
- **Tone:** Vibrant, aspirational, warm

#### 2. FeaturedTutors ⭐ NEW
- **Headline:** "Learn from the best."
- Horizontal-scrolling carousel of 4-6 vetted tutors
- Each card: photo, name, languages, star rating, one-line specialty
- Creates immediate trust and makes it feel like a real community

#### 3. PracticeHook ⭐ NEW (Critical Component)
- **Headline:** "Test your skills, right now."
- **Interactive embedded mini-practice** — one question from `/practice` flow
- Styled with `.dark` theme for high-contrast against cream background
- On completion: "Continue practicing →" CTA
- **This is the primary acquisition hook** — shows value, doesn't just tell

#### 4. HowItWorksStudent (Reskin existing)
- **Headline:** "Your journey to fluency in 3 steps."
- 1. **Practice Daily** — "Build habits with fun, gamified exercises."
- 2. **Find Your Tutor** — "Connect with experts for guided lessons."
- 3. **Track Your Progress** — "Watch your skills grow from beginner to pro."
- More playful icons, student-centric language

#### 5. StudentPlatformTour ⭐ NEW
- **Headline:** "Your all-in-one language toolkit."
- Tabbed showcase: Live Lessons | AI Drills | Progress Tracking | Messaging
- Each tab reveals a clean animated mock of the student portal feature
- Builds desire for the full authenticated experience

#### 6. TestimonialsSection (Reuse with variant="student")
- **Headline:** "Loved by thousands of learners."
- Student avatars, first names, locations
- More playful tone than tutor testimonials

#### 7. PricingStudent ⭐ NEW
- **Headline:** "Affordable lessons, priceless skills."
- Simple, clear — no complex grids
- Focus on individual lesson affordability ("Lessons from $15/hour")
- Comparison to offline schools / gym membership analogy

#### 8. FAQSection (Reuse with studentFaqs content)

#### 9. FinalCTA (Reskin existing)
- **Headline:** "Ready to start your journey?"
- Remove revenue calculator
- Single clear CTA: `Start Learning For Free`

#### 10. Footer (Shared)

---

## Tutor Landing Page (`/tutors` → `app/(public)/tutors/page.tsx`)

**Goal:** Convert professional tutors into active platform users.
**Conversion funnel:** See value prop → Understand features → Calculate savings → Sign up for free trial.

### Sections (evolution of current homepage)

| # | Section | Status |
|---|---------|--------|
| 1 | **HeroTutor** — "Built for tutors." | Keep as-is, move from old `page.tsx` |
| 2 | **ProblemSection** — Tutor pain points | Keep as-is |
| 3 | **PhoneMockupSection** — Branded booking site preview | Keep as-is |
| 4 | **SolutionSection** — Features + calendar demo | Keep as-is |
| 5 | **StudentMarketplace** ⭐ NEW — "We bring the students to you." | Bridges both sides of platform |
| 6 | **HowItWorks** — 3 steps for tutors | Keep as-is |
| 7 | **StudioIntelligence** — AI lesson transcript/homework | Keep as-is |
| 8 | **PricingSection** — Tutor subscription tiers | Keep as-is |
| 9 | **ComparisonSection** — vs marketplaces | Keep as-is |
| 10 | **TestimonialsSection** (variant="tutor") | Keep professional tone |
| 11 | **ValueStackSection** — Cost comparison | Keep as-is |
| 12 | **FAQSection** (tutorFaqs content) | Keep as-is |
| 13 | **FinalCTASection** — Revenue calculator | Keep as-is |
| 14 | **Footer** (Shared) | Keep as-is |

### New Section: StudentMarketplace
- **Title:** "We bring the students to you."
- Elegant section acknowledging the student marketplace
- Showcases student discovery features
- Key differentiator vs generic site builders (Calendly, Wix, etc.)

---

## Component Reuse Strategy

| Component | Student Page | Tutor Page | Changes Needed |
|-----------|-------------|------------|----------------|
| `GlobalNav` | ✅ student variant | ✅ tutor variant | New component replacing `Navigation` |
| `Footer` | ✅ | ✅ | None — identical |
| `FAQSection` | ✅ studentFaqs | ✅ tutorFaqs | Add content prop |
| `TestimonialsSection` | ✅ variant="student" | ✅ variant="tutor" | Add variant prop |
| `HowItWorks` | ✅ reskinned | ✅ as-is | Add variant/content props |
| `FinalCTASection` | ✅ simplified | ✅ as-is | Add variant prop (hide calculator) |
| `HeroStudent` | ✅ | ❌ | New component |
| `FeaturedTutors` | ✅ | ❌ | New component |
| `PracticeHook` | ✅ | ❌ | New component (critical) |
| `StudentPlatformTour` | ✅ | ❌ | New component |
| `PricingStudent` | ✅ | ❌ | New component |
| `StudentMarketplace` | ❌ | ✅ | New component |

---

## Design Consistency Rules

1. **Same brand palette** — warm stone/cream, terracotta primary, green accent
2. **Same typography** — clean sans-serif, same scale
3. **Same card patterns** — rounded-2xl, shadow-soft, hover lift
4. **Same spacing rhythm** — py-16 sm:py-20 lg:py-24 sections
5. **Practice hook uses `.dark` scoped class** — creates intentional contrast, not jarring
6. **Both pages use `landing-copy.ts` pattern** — full i18n support from day one

---

## Implementation Order

### Phase 1: Restructure (move, don't break)
1. Create `/app/(public)/tutors/page.tsx` with all existing landing sections
2. Verify tutor landing works at `/tutors`
3. Create `GlobalNav` with audience-aware nav links

### Phase 2: Build Student Page
4. Create `HeroStudent` component
5. Create `PracticeHook` (embedded mini-practice with dark theme)
6. Create `FeaturedTutors` carousel
7. Create `StudentPlatformTour` tabbed showcase
8. Create `PricingStudent` section
9. Assemble new student `page.tsx` at `/`

### Phase 3: Bridge & Polish
10. Create `StudentMarketplace` section for tutor page
11. Add variant props to `TestimonialsSection`, `HowItWorks`, `FinalCTA`
12. Update `landing-copy.ts` with student copy + all i18n translations
13. Update sitemap, meta tags, OG images for both pages
14. Cross-link: "For Tutors" / "For Students" in nav
