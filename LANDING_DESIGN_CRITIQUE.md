# Landing Page Design Critique & Premium Redesign Plan
*Source: Gemini 3 Pro design review — Feb 14, 2026*

## Core Diagnosis
The pages suffer from the "SaaS template" problem:
- Same icon-title-description card pattern repeated 5+ times
- Generic copy that every language platform uses
- No visual demonstrations of the actual product
- Stats that feel B2B, not aspirational
- Timid spacing — everything's too cramped

## Design Philosophy
- **Show, don't tell** — every feature section DEMONSTRATES, not describes
- **One pattern per page max** — never repeat the same card grid
- **Premium = generous whitespace** — py-24/py-32 minimum
- **Typography hierarchy** — text-5xl/6xl headlines, massive contrast
- **Terracotta reserved for CTAs only** — makes its appearance an event
- **Motion = personality** — scroll-triggered reveals, parallax, morphing

## Global Animation System
```tsx
// Standard scroll reveal
duration: 0.6
ease: [0.22, 1, 0.36, 1]
// Stagger children in lists/grids
staggerChildren: 0.1
```

---

## STUDENT PAGE REDESIGN

### 1. Hero — "Stop the scroll"
**Problem:** Data-dump with generic stats. Not aspirational.
**New copy:**
- Headline: "Finally. Speak like you've always wanted to."
- Sub: "Connect with world-class tutors for private lessons that actually work."
**Visual:** Full-bleed looping video background (student breakthrough moment)
**Animation:** Stagger-fade-in on headline text. CTA gentle pulse.
**Spacing:** Massive vertical padding, centered text.

### 2. FeaturedTutors — "Quality over quantity"
**Problem:** Grid of gradient circles = cheap template.
**New copy:**
- Headline: "Tutors you'll actually connect with."
- Sub: "Hand-picked for their expertise, personality, and passion."
**Visual:** Asymmetrical layout — large portrait left, smaller card right with video intro on hover.
**Animation:** Portraits slide in from opposite sides on scroll.

### 3. PracticeHook — "Full-width immersion"
**Problem:** Dark card feels like a third-party widget.
**New copy:**
- Headline: "Don't just learn. Practice."
- Sub: "Our AI drills adapt to you. Try a real exercise — no signup required."
**Visual:** Full-width dark section (stone-900), single beautiful interactive card.
**Animation:** Parallax on scroll. Shimmer on correct, shake on incorrect.

### 4. HowItWorks → "Sticky scroll narrative"
**Problem:** Numbered circles with icons = most overused SaaS pattern.
**New copy:**
- Headline: "Your path to fluency."
- Steps: Find your match / Book with a click / Start learning
**Visual:** Sticky scroll — text fades left, UI demo cross-fades right.
**Animation:** Scroll-linked step transitions. UI morphs between states.

### 5. PlatformTour → "3 cinematic feature reveals"
**Problem:** Tabbed interface with "screenshots coming soon" = incomplete product.
**New copy:**
- Headline: "A platform designed for learning."
- The Classroom / AI Practice / Progress Tracking
**Visual:** Three full-width sections, each with animated product demo.
**Animation:** Text fades first, then demo appears.
**Spacing:** Each feature = its own mini-hero section with huge padding.

### 6+7. Pricing + FAQ → MERGED
**Problem:** Both generic and separate.
**New copy:**
- Headline: "Simple, transparent pricing."
- Sub: "Unlimited platform access. Pay only for tutor hours."
**Visual:** Two-column — price model left, styled accordion right.
**Animation:** Smooth accordion open/close.

### 8. Final CTA — "Full-stop"
**Problem:** Card with badges = weak closer.
**New copy:**
- Headline: "Ready to start talking?"
- Sub: "Find your perfect tutor in the next 5 minutes."
**Visual:** Full-width terracotta background. Centered headline + single button.
**Animation:** Subtle gradient shimmer across background.

---

## TUTOR PAGE REDESIGN

### 1. Hero — "Sell the dream"
**New copy:**
- Headline: "Your Studio. Your Students. Your Schedule."
- Sub: "We handle marketing, billing, and scheduling so you can focus on teaching."
**Visual:** Full-bleed looping video (tutor's ideal life montage).

### 2+4. Problem + Solution → MERGED "Zig-zag"
**Problem:** Icon grids x2 = cognitive overload.
**New copy:**
- Section: "A better way to build your business."
- Item 1: "Stop hunting for students." + marketplace animation
- Item 2: "End scheduling headaches." + calendar demo
- Item 3: "Get paid on time, every time." + payment notification
**Animation:** Scroll-triggered alternating slide-in from left/right.

### 7. StudioIntelligence → ELEVATED to centerpiece
**New copy:**
- Headline: "Your AI-powered teaching assistant."
**Visual:** Two-panel — transcript left, generated content right with buttons.
**Animation:** AnimatePresence for panel states. Word-by-word text reveal.

### 12. FinalCTA → "Earning potential calculator"
**Move:** Make this penultimate, not final.
**New copy:**
- Headline: "See your earning potential."
**Visual:** Large slider with animated result number.
**Animation:** Number animates up as slider moves.
**Followed by:** Simple full-width CTA section to close.

---

## Implementation Priority
1. Global: spacing + typography + animation system
2. Student Hero (the first impression)
3. PracticeHook (the killer demo)
4. Merge HowItWorks into sticky scroll
5. Platform features as cinematic reveals
6. Tutor zig-zag problem/solution
7. Studio Intelligence elevation
8. Everything else
