# TutorLingua Colour Analysis — Gemini 3 Pro Preview (Full Context)
*Generated: Feb 14, 2026*
*Fed the complete code: globals.css, all 5 archetypes, practice dark mode, page builder architecture*

---

## Verdict

> "The Warm Cream + Burnt Orange vibe is **excellent** for a language platform. It feels human, organic, and approachable. However, the current orange (#D36135) is slightly muddy, and the green (#3E5641) is too desaturated to act as an effective accent."

### Key Strategic Decisions

1. **Platform brand must NOT leak into tutor sites.** Editor chrome (sidebar, nav) is TutorLingua's. The canvas (preview, public site) is the tutor's. Mixing them dilutes ownership ("The Ikea Effect").

2. **Modernist archetype has a critical accessibility problem.** Peachy primary `#E8B59E` = impossible to read white text on. Needs a complete colour family swap.

3. **Artisan archetype is too close to Platform identity** (both orange/bronze). Creates brand confusion when platform UI frames the tutor site.

4. **Practice mode lacks "dopamine"** — good for reading, but gamification needs higher contrast and punchier success/error states.

---

## Recommended Changes

### A. Platform Globals (globals.css `:root`)

| Variable | Current | Recommended | Why |
|----------|---------|-------------|-----|
| `--background` | `#FDF8F5` | `#FFFCF8` | Cleaner, less yellow cream |
| `--foreground` | `#2D2A26` | `#292524` | Slightly deeper for contrast |
| `--primary` | `#D36135` | `#E05D30` | "Persimmon" — more energy, less muddy |
| `--primary-button` | `#B85129` | `#CC552A` | WCAG AA compliant hover |
| `--accent` | `#3E5641` | `#2E5C48` | True forest green, not grey-green |
| `--muted-foreground` | `#6B6560` | `#78716C` | Warm grey refinement |
| `--border` | `rgba(45,42,38,0.06)` | `#E7E5E4` | Stone 200 — explicit, not alpha |
| `--destructive` | `#A24936` | `#BE123C` | Rose 700 — crisper than rust |

### B. Dark Practice Mode (`.dark`)

| Variable | Current | Recommended | Why |
|----------|---------|-------------|-----|
| `--background` | `#1A1917` | `#1C1917` | Deep Espresso (similar, verified) |
| `--foreground` | `#F5F2EF` | `#F5F5F4` | Clean warm white |
| `--primary` | `#E8784D` | `#FF7B54` | "Coral Neon" — high visibility for gamification |
| `--primary-foreground` | `#1A1917` | `#1C1917` | Dark text on bright button |
| `--card` | `#2D2A26` | `#292524` | Stone 800 |
| `--border` | `rgba(...)` | `#44403C` | Stone 700 — explicit |
| NEW: `--success` | — | `#22C55E` | Green-500 for correct answers |
| NEW: `--error` | — | `#EF4444` | Red-500 for wrong answers |

### C. Page Builder Archetypes

| Archetype | Change | Old Primary | New Primary | Reason |
|-----------|--------|-------------|-------------|--------|
| Executive | ✅ Keep | `#334155` | `#334155` | Works well |
| Editorial | Minor | `#A16207` | `#854D0E` | Darker gold for text legibility |
| Scholar | Minor | `#14532D` → bg | `#1B4D3E` | Darker British Racing Green; bg → `#F2EFE9` |
| **Modernist** | **Major** | `#E8B59E` | `#4338CA` | Indigo 700 — peach was inaccessible. Peach becomes bg accent |
| **Artisan** | **Major** | `#BF9056` | `#9D5C63` | "Antique Rose" — separates from platform's orange family |

---

## Summary Table

| Scope | Variable | Old | New | Note |
|-------|----------|-----|-----|------|
| Global | `--primary` | `#D36135` | **`#E05D30`** | Cleaner Persimmon |
| Global | `--accent` | `#3E5641` | **`#2E5C48`** | True Forest Green |
| Dark | `--primary` | `#E8784D` | **`#FF7B54`** | Brighter Coral for game dopamine |
| Arch. | Modernist primary | `#E8B59E` | **`#4338CA`** | Indigo for contrast fix |
| Arch. | Artisan primary | `#BF9056` | **`#9D5C63`** | Rose to separate from platform |
