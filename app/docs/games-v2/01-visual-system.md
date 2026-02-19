# Games V2 Visual System

## Purpose
Design baseline for full-engine games while preserving TutorLingua brand identity.

## Framework Alignment
- MDA (Aesthetic target): confidence, momentum, clarity, mastery.
- JTBD: first-time users must identify the next action in under 1 second.
- Gestalt: active objects grouped by glow and depth, non-interactive objects desaturated.

## Color Tokens (Use Existing Globals)
- Surface base: `--game-bg-deep`
- Surface card: `--game-bg-surface`
- Surface elevated: `--game-bg-elevated`
- Primary text: `--game-text-primary`
- Secondary text: `--game-text-secondary`
- Muted text: `--game-text-muted`
- Correct: `--game-correct`
- Wrong: `--game-wrong`
- Warning: `--game-warning`
- Streak/accent: `--game-streak`
- Neon action accents: `--neon-cyan`, `--neon-lime`, `--neon-pink`

## Typography
- Display: `Mansalva` for celebratory moments only.
- Body/UI: `Plus Jakarta Sans` for all instructional and interaction text.
- Numeric/HUD: `JetBrains Mono` for timers/scores/precision values.

## Spacing Grid
- Base scale: 4px.
- Primary spacing set: 4/8/12/16/24/32/40/56.
- Minimum touch target: 48x48.
- Preferred touch target for core interactions: 52x52.

## Shape System
- Small interactive elements: 12px radius.
- Cards/sheets: 16px radius.
- Primary container shell: 24px radius.

## Contrast + Readability
- WCAG AA minimum: 4.5:1 for text-bearing controls.
- High-speed zones (gameplay arena): never use low-contrast text overlays.
- Motion-heavy overlays must preserve readability at 80% animation progress.

## Styling Rules
- No hardcoded gameplay hex colors in component files.
- Style decisions map to tokens in `app/app/globals.css`.
- One visual hierarchy per screen: primary CTA > active gameplay > secondary actions.
