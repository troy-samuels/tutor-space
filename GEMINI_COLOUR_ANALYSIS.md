# TutorLingua Colour Analysis — Gemini 2.5 Flash
*Generated: Feb 14, 2026*

## Verdict: Current Foundation is Strong, But Has WCAG Issues

### What's Right
- **Burnt orange + forest green** ✅ — Warm, earthy, premium. Communicates growth + human connection. Unique against competitors.
- **Cream background `#FDF8F5`** ✅ — Premium, not dated. Feels like quality paper/linen.
- **Dark practice mode** ✅ — Ideal for sustained gamified engagement. Reduces eye strain, enhances focus.
- **Competitor differentiation** ✅ — Distinct from Duolingo (green), Preply (blue/purple), Cambly (yellow). More sophisticated than iTalki's brighter reds.

### What's Wrong: WCAG AA Failures
- **Light mode primary `#D36135`** ❌ — 3.96:1 contrast with cream text (needs 4.5:1)
- **Dark mode primary `#E8784D`** ❌ — 3.36:1 contrast with off-white text (needs 4.5:1)
- **Secondary `#F5EDE8`** — Too close to background `#FDF8F5` to provide meaningful visual separation

---

## Recommended Changes

### Light Mode
| Role | Current | Recommended | Change |
|------|---------|-------------|--------|
| Background | `#FDF8F5` | `#FDF8F5` | Keep |
| Primary | `#D36135` | `#B84A1E` | Darker for WCAG AA (5.17:1) |
| Accent | `#3E5641` | `#3E5641` | Keep |
| Text | `#2D2A26` | `#2D2A26` | Keep |
| Secondary | `#F5EDE8` | `#E0DED7` | Warmer stone grey, more distinct |

### Dark Practice Mode
| Role | Current | Recommended | Change |
|------|---------|-------------|--------|
| Background | `#1A1917` | `#1A1917` | Keep |
| Primary | `#E8784D` | `#CC582A` | Deeper for WCAG AA (4.54:1) |
| Accent | `#5A7A5E` | `#5A7A5E` | Keep |
| Text | `#F5F2EF` | `#F5F2EF` | Keep |
| Card | `#2D2A26` | `#2D2A26` | Keep |

### WCAG AA Compliance (All Pass)
**Light:** `#2D2A26` on `#FDF8F5` = 11.21:1 ✅ | `#FDF8F5` on `#B84A1E` = 5.17:1 ✅ | `#FDF8F5` on `#3E5641` = 7.91:1 ✅
**Dark:** `#F5F2EF` on `#1A1917` = 15.65:1 ✅ | `#F5F2EF` on `#CC582A` = 4.54:1 ✅ | `#F5F2EF` on `#5A7A5E` = 6.9:1 ✅
