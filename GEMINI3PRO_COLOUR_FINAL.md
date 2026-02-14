# TutorLingua Colour Analysis — Gemini 3 Pro Preview (Code-Fed Final)
*Generated: Feb 14, 2026*
*Fed actual source: globals.css, wizard-context.tsx archetypes, step-style.tsx, site-preview.tsx*

---

## Gemini's Verdict: "The Etsy-fication Problem"

> "The current palette screams 'homemade pottery shop' or 'autumn wedding invite.' It lacks the authority and 'tech-enabled' trust required for a platform handling payments, scheduling, and video infrastructure."

> "A page builder tool should NOT look like one of the templates it offers."

> "The dark mode with Muted Orange is a sleep aid."

---

## Strategic Shift: "Cozy Cottage" → "Modern Studio"

### Core Principle
The platform is a **frame**, not a painting. Neutral, authoritative chrome that lets the tutor's chosen archetype be the star. Kill the cream-everywhere approach.

---

## A. Platform Globals (globals.css)

| Variable | Current | Recommended | Rationale |
|----------|---------|-------------|-----------|
| `--background` | `#FDF8F5` (cream) | `#FFFFFF` | Clean optical white |
| `--background-alt` | `#F5EDE8` | `#F8FAFC` (Slate 50) | Cool, technical |
| `--foreground` | `#2D2A26` | `#0F172A` (Slate 900) | Higher authority |
| `--primary` | `#D36135` | `#FF5A1F` (Electric Tangerine) | High energy, digital-first |
| `--primary-button` | `#B85129` | `#E04812` | Hover state |
| `--sidebar` | `#FDF8F5` | `#0F172A` (Dark Slate) | Recedes visually, frames content |
| `--sidebar-foreground` | `#2D2A26` | `#F8FAFC` | Light on dark |
| `--destructive` | `#A24936` | `#EF4444` (Red) | Crisper, standard |
| NEW: `--success` | — | `#10B981` (Emerald) | Status colour |
| NEW: `--warning` | — | `#F59E0B` (Amber) | Status colour |

**Kill:** The forest green accent `#3E5641`. Platform doesn't need green — that's a Scholar archetype colour.

## B. Page Builder Archetypes (wizard-context.tsx)

### 1. The Executive (Professional)
| | Current | Recommended |
|--|---------|-------------|
| primary | `#334155` (Slate — "looks like disabled button") | `#0F172A` (Rich Midnight Navy) |
| background | `#F8FAFC` | `#F8FAFC` ✅ |
| text | `#0F172A` | `#020617` |

### 2. The Editorial (Immersion)
| | Current | Recommended |
|--|---------|-------------|
| primary | `#A16207` (Muted Gold) | `#9A3412` (Deep Rust — WCAG compliant with white) |
| background | `#FBFBF9` | `#FFFCF0` (Newsprint — keep warmth HERE) |
| text | `#44403C` | `#292524` |

### 3. The Scholar (Academic)
| | Current | Recommended |
|--|---------|-------------|
| primary | `#14532D` (Hunter Green) | `#1B4D3E` (Oxford/British Racing Green) |
| background | `#FFFCF5` | `#F5F7F5` (Mist) |

### 4. The Modernist (Polyglot) ⚠️ CRITICAL FIX
| | Current | Recommended |
|--|---------|-------------|
| primary | `#E8B59E` (Peach — **1.8:1 contrast, invisible**) | `#7C3AED` (Electric Violet) |
| background | `#FAFAFA` | `#FAFAFA` ✅ |
| text | `#2C2C2C` | `#18181B` (Zinc) |

### 5. The Artisan ⚠️ FIX
| | Current | Recommended |
|--|---------|-------------|
| primary | `#BF9056` ("muddy, looks dirty on warm bg") | `#A67C52` (Clay — with DARK text on buttons) |
| background | `#F4F1F0` | `#FAF9F6` |
| button text | white | `#2A2018` (dark — needs dynamic primary-foreground) |

## C. Dark Mode — Gamification

> "Brown-black absorbs light; Cool-black projects it."

| Variable | Current | Recommended | Rationale |
|----------|---------|-------------|-----------|
| `--background` | `#1A1917` (warm brown-black) | `#09090B` (Zinc 950 — pure dark) | Cool-black projects colour |
| `--card` | `#2D2A26` | `#18181B` (Zinc 900) | Cleaner surface |
| `--primary` | `#E8784D` ("sleep aid") | `#FF5A1F` (Brand Orange — glows) | Dopamine hit |
| NEW: XP/Streaks | — | `#FACC15` (Gold) | Reward colour |
| NEW: Success | — | `#34D399` (Neon Emerald) | Correct answers |

## Implementation Note
Add dynamic `primary-foreground` logic — The Artisan needs dark text on its primary button while The Executive needs white. Currently hardcoded.

---

## Implementation Order
1. Update `globals.css` → clean/technical platform palette
2. Update `wizard-context.tsx` → accessible archetype hex codes
3. Add dynamic button text colour logic to site-preview/wizard-context
