# TutorLingua FAQ Strategy - Complete 5-Phase Roadmap

> **Reference Document**: This outlines the complete FAQ implementation strategy for TutorLingua's SEO and user experience optimization.

---

## Status Overview

| Phase | Description | SEO Impact | Status |
|-------|-------------|------------|--------|
| **Phase 1** | Dedicated `/faq` page with 50 FAQs | Featured snippets, FAQ schema | ✅ **COMPLETED** |
| **Phase 2** | Add FAQs to top 20 blog posts | PAA boxes, time-on-page | 🎯 **NEXT** |
| **Phase 3** | Expand landing page FAQs | Conversion optimization | ⏳ Pending |
| **Phase 4** | Help center FAQ integration | Support deflection | ⏳ Pending |
| **Phase 5** | Tutor site FAQ templates | Tutor SEO boost | ⏳ Pending |

---

## Phase 1: Dedicated FAQ Page ✅ COMPLETED

**Delivered**: `/faq` page with 50 FAQs across 6 categories

### Files Created
- `app/(public)/faq/page.tsx` - Main FAQ page
- `app/(public)/faq/faq-data.ts` - 50 FAQs in 6 categories
- `components/faq/faq-accordion.tsx` - Accordion component
- `components/faq/faq-search.tsx` - Search component

### Files Modified
- `app/sitemap.ts` - Added /faq route

### FAQ Categories (50 total)
1. **For Tutors - Getting Started** (10 FAQs)
2. **For Tutors - Growing Your Business** (10 FAQs)
3. **For Tutors - Operations & Tools** (10 FAQs)
4. **For Tutors - Money & Legal** (10 FAQs)
5. **For Students - Finding a Tutor** (5 FAQs)
6. **For Students - What to Expect** (5 FAQs)

**Git Commit**: `94f7829`

---

## Phase 2: Blog Post FAQs 🎯 NEXT

### Goal
Add contextual FAQ sections to the top 20 highest-traffic blog posts to capture "People Also Ask" featured snippets.

### SEO Benefits
- Capture "People Also Ask" (PAA) featured snippets
- Improve time-on-page and engagement
- Add FAQPage schema per blog post
- Cross-link between blog FAQs and main FAQ page

### Implementation Plan
1. Research blog post rendering structure
2. Identify top 20 priority blog posts by traffic/potential
3. Create reusable blog FAQ component
4. Write 3-5 contextual FAQs per article topic
5. Add FAQPage schema to each enhanced post

### Estimated Output
- 3-5 FAQs per blog post × 20 posts = **60-100 additional FAQs**

### Priority Blog Posts (To Be Identified)
- High-traffic articles from Google Search Console
- Articles targeting competitive keywords
- Articles already ranking on page 1-2

---

## Phase 3: Landing Page FAQs ⏳ Pending

### Goal
Add FAQ sections to high-converting landing pages to answer objections before signup.

### Target Pages
| Page | FAQ Focus |
|------|-----------|
| Homepage (`/`) | General platform FAQs |
| Niche pages (`/for/[slug]`) | Niche-specific FAQs |
| Pricing page (`/pricing`) | Pricing & billing FAQs |
| Features page | Feature comparison FAQs |

### SEO Benefits
- Increased dwell time on conversion pages
- Answer objections before signup (reduce bounce)
- Capture long-tail queries on landing pages
- Improve Quality Score for paid traffic

### Estimated Output
- 5-10 FAQs per landing page = **30-50 additional FAQs**

---

## Phase 4: Help Center FAQ Integration ⏳ Pending

### Goal
Connect FAQ content with help center for a unified knowledge base experience.

### Features
- Cross-reference FAQs from `/help` articles
- "Related FAQs" section on help article pages
- Unified search across FAQ and help content
- Structured data combining FAQ + HowTo schemas

### Technical Implementation
| Task | File |
|------|------|
| Add FAQ references to help utilities | `lib/help.ts` |
| FAQ sidebar on help article pages | `app/(public)/help/[slug]/page.tsx` |
| Unified search component | `components/help/unified-search.tsx` |

### Benefits
- Reduced support tickets (self-service deflection)
- Better content discoverability
- Richer structured data for search engines

---

## Phase 5: Tutor Site FAQ Templates ⏳ Pending

### Goal
Enable tutors to add FAQs to their public tutor sites, boosting individual tutor SEO.

### Pre-Built FAQ Templates
Common questions tutors can enable with one click:
- "What's your cancellation policy?"
- "How do lessons work?"
- "What materials do I need?"
- "Do you offer trial lessons?"
- "What's your teaching approach?"
- "How do I reschedule a lesson?"
- "What payment methods do you accept?"

### Features
- Custom FAQ editor in Page Builder wizard
- FAQPage schema on all tutor sites
- Default FAQ suggestions based on tutor services
- Category-specific templates (exam prep, conversation, kids)

### Technical Implementation
| Task | Details |
|------|---------|
| Database | Add `tutor_site_faqs` table |
| Page Builder | New FAQ section in wizard (`/components/page-builder/`) |
| Templates | FAQ templates in `lib/marketing/faq-templates.ts` |
| Rendering | FAQ accordion on tutor site pages (`/app/(public)/[username]/`) |

### Benefits
- Individual tutor pages rank for long-tail queries
- Consistent professional appearance
- Reduces support burden on tutors

---

## Content Guidelines (All Phases)

1. **No competitor names** - Say "tutoring platforms" not specific names
2. **Use numbers** - "$25-80/hour" not "varies"
3. **Be concise** - 2-4 sentences per answer
4. **Include CTAs** - Link to signup/booking where relevant
5. **Stay current** - Include 2025/2026 context where helpful
6. **Match user intent** - Different FAQs for tutors vs students

---

## Schema Implementation

All FAQ implementations use `generateFAQSchema()` from `lib/utils/structured-data.ts`:

```typescript
import { generateFAQSchema } from "@/lib/utils/structured-data";

const faqSchema = generateFAQSchema([
  { question: "...", answer: "..." },
  // ...
]);

// In page component:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
/>
```

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| FAQ page impressions | 5,000/month | Google Search Console |
| Featured snippets captured | 10+ | GSC Performance report |
| PAA appearances | 20+ queries | Rank tracking tools |
| Time on FAQ page | >2 minutes | Analytics |
| Support ticket reduction | 15% decrease | Support dashboard |

---

*Last Updated: 21 January 2026*
