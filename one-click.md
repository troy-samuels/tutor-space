# One-Click Launch Concepts

## Overview
Quick-to-build boosters that make TutorLingua feel magical with minimal engineering effort. Each item reuses existing profile/booking data plus a light AI prompt or template, so they’re low-risk experiments.

---

## 1. Launch Kit Generator
- **Trigger**: Tutor completes the profile wizard or clicks “Generate Launch Kit”.
- **Input**: Tutor bio, languages, specialties, audience focus.
- **Output** (JSON + PDF):
  - Landing page copy (headline, subheadline, CTA, 3 SEO paragraphs, keyword list)
  - 3 lesson-plan outlines (warm-up, core activity, homework)
  - 7-day promo email sequence (subject + body)
- **Delivery**: Store in `launch_kits` table with `expires_at`. Show a countdown (e.g., “Available for 14 days”). Upsell ongoing access on paid plans.

**How**: One server action (`generateTutorAssets`) → fetch profile → call LLM → persist structured content + PDF link in Supabase Storage.

---

## 2. Template Library Carousel
- **UI**: Dashboard card “Ready-made assets” with carousel of Canva/Notion/Google Docs links.
- **Action**: Clicking opens template (or duplicates into tutor’s account).
- **Data**: Static JSON for now; swap to CMS later.

**How**: Add `templates.json` + simple card component pulling from it.

---

## 3. Lead Magnet Generator
- **Trigger**: Tutor enters a topic (“Spanish for Travel”).
- **Output**: 1-page cheat sheet (glossary + conversation starters) as PDF + share link.
- **Use**: Auto-add to Link-in-Bio as a gated resource.

**How**: Server action → LLM prompt → render HTML → convert to PDF (e.g., `@react-pdf/renderer`) → store in Supabase Storage.

---

## 4. Lesson Recap SMS Preview
- **Location**: Student detail > Lesson notes.
- **Action**: Click “Generate SMS recap”.
- **Output**: 2-sentence WhatsApp/SMS script + CTA (“Reply YES to confirm next lesson”).

**How**: Reuse parent-update prompt, but limit to 280 characters and strip markdown.

---

## 5. Availability Preview Embed
- **Goal**: Tutors can show “Next openings” on personal sites.
- **Implementation**:
  - New lightweight widget route `/api/embed/availability?username=` returning HTML/JS snippet or image.
  - Uses existing availability + buffer logic.
  - Provide copy-paste code in settings.

**How**: Serverless route queries Supabase, renders minimal card (1 upcoming slot + CTA link).

---

## Delivery Checklist
1. Pick 2 experiments (Launch Kit + Lead Magnet). Ship behind Growth plan toggle.
2. Add telemetry (`launch_kit_generated`, `lead_magnet_downloaded`).
3. Collect tutor feedback before GA.

