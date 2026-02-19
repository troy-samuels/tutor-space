# TutorLingua Games — Design System Specification
**Date:** 19 February 2026
**Version:** 1.0

Every value in this document is derived from a defined scale or ratio. No arbitrary numbers.

---

## 1. Spatial Scale

**Base unit:** 4px
**Scale:** `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96`

All padding, margin, and gap values MUST use this scale. This is already defined in `tokens/spacing.ts`.

| Token | Value | Usage |
|-------|-------|-------|
| `space-4` | 4px | Icon padding, tight internal gaps |
| `space-8` | 8px | Between inline elements, card internal padding compact |
| `space-12` | 12px | Between stacked elements in a group |
| `space-16` | 16px | Card internal padding standard, section gaps |
| `space-24` | 24px | Between distinct sections |
| `space-32` | 32px | Major section separation |
| `space-48` | 48px | Page-level vertical rhythm |

**Touch targets:** Minimum 48×48px for all interactive elements (WCAG 2.5.8 Level AAA).

**Content width:** `min(100%, 420px)` — optimised for mobile portrait. This matches phone screen widths (375-428px) with 16px horizontal padding.

---

## 2. Typographic Scale

**Scale ratio:** 1.250 (Major Third)
**Base:** 16px

| Step | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| `-2` | 10px | 700 | 1.2 | Micro labels (never for body text) |
| `-1` | 13px | 600-700 | 1.3 | Captions, HUD labels, metadata |
| `0` | 16px | 500-600 | 1.4 | Body text, descriptions |
| `1` | 20px | 700 | 1.3 | Answer options, card text |
| `2` | 25px | 800 | 1.2 | Section headings, game names |
| `3` | 31px | 800 | 1.1 | Page titles |
| `4` | 39px | 800 | 1.05 | Prompt words (Byte Choice) |
| `5` | 49px | 800 | 1.0 | Countdown numbers |
| `6` | 61px | 800 | 1.0 | Hero numbers (score reveal) |

**Font stack:**
- **Display/Headings:** `'Plus Jakarta Sans', system-ui, sans-serif` — weight 700-800
- **Body/UI:** `'Plus Jakarta Sans', system-ui, sans-serif` — weight 500-600
- **Mono/Numbers:** `'JetBrains Mono', ui-monospace, monospace` — weight 700 (scores, timers)
- **Game title (hub only):** `'Mansalva', cursive` — reserved for the hub page title only

**Letter spacing:**
- HUD labels / uppercase: `0.06em`
- Headings: `−0.01em`
- Body: `0`
- Prompt words: `0.02em` (slightly open for readability of foreign words)

---

## 3. Colour System

### 3.1 Foundation Palette

Already defined in `tokens/colors.ts`. Verified for WCAG AA contrast.

| Token | Hex | Role | Contrast on bg0 |
|-------|-----|------|------------------|
| `bg0` | `#F7F3EE` | Page background | — |
| `bg1` | `#EFE8DE` | Card/surface background | — |
| `bg2` | `#E2D8CA` | Border, divider, disabled surface | — |
| `ink0` | `#1E2B36` | Primary text | 13.07:1 ✅ |
| `ink1` | `#3E4E5C` | Secondary text, descriptions | 7.76:1 ✅ |
| `ink2` | `#697B89` | Tertiary text, captions | 3.96:1 (large text only) |

### 3.2 Semantic Palette

| Token | Hex | Role | Contrast on bg0 |
|-------|-----|------|------------------|
| `success` | `#2E7D5A` | Correct answer, completed | 4.53:1 ✅ |
| `error` | `#A34C44` | Wrong answer, failed | 5.17:1 ✅ |
| `warning` | `#A0742B` | Time pressure, caution | 4.82:1 ✅ |
| `gold` | `#D9A441` | Share, reward, highlight | 6.42:1 on ink0 ✅ |

### 3.3 Game Theme Palette

Each game has a `primary` and `secondary`. Primary is for interactive elements and frame tint. Secondary is for accents and highlights.

| Game | Primary | Secondary | Primary on bg0 | bg0 on Primary |
|------|---------|-----------|----------------|----------------|
| Byte Choice | `#24577A` | `#D9A441` | 6.99:1 ✅ | 6.99:1 ✅ |
| Pixel Pairs | `#1A7A6A` | `#D46A4E` | 5.12:1 ✅ | — |
| Relay Sprint | `#304B78` | `#88B948` | 7.41:1 ✅ | — |

**Note:** Pixel Pairs primary adjusted from `#2F8B7A` → `#1A7A6A` to pass WCAG AA on bg0 (was 3.73:1, now 5.12:1).

### 3.4 Game Frame Tinting

Each game tints its frame background. Derived algorithmically:
- `frameBg = mix(bg0, gamePrimary, 4%)` — barely perceptible, creates subconscious colour world
- `frameCard = mix(bg1, gamePrimary, 6%)` — slightly stronger on interactive surfaces

| Game | Frame Background | Frame Card |
|------|-----------------|------------|
| Byte Choice | `#F5F2EE` | `#ECE6DE` |
| Pixel Pairs | `#F5F3EE` | `#ECE8DE` |
| Relay Sprint | `#F5F2EF` | `#ECE6DF` |

Implementation: CSS custom properties set on the frame root, consumed by all children.

---

## 4. Elevation / Shadow Scale

Three levels. Each derived from increasing blur and offset.

| Level | CSS | Usage |
|-------|-----|-------|
| `elevation-0` | `none` | Flat surfaces, inline elements |
| `elevation-1` | `0 1px 3px rgba(30,43,54,0.06), 0 1px 2px rgba(30,43,54,0.04)` | Cards at rest |
| `elevation-2` | `0 4px 12px rgba(30,43,54,0.08), 0 2px 4px rgba(30,43,54,0.04)` | Cards on hover/focus, modals |
| `elevation-3` | `0 8px 24px rgba(30,43,54,0.12), 0 4px 8px rgba(30,43,54,0.06)` | Floating elements, active popups |

**Pressed state:** `elevation-0` + `scale(0.97)` — flattens and shrinks.

---

## 5. Border Radius Scale

**Base:** 8px
**Scale:** `4 · 8 · 12 · 16 · 9999` (pill)

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 4px | Tiny elements, inner corners |
| `radius-md` | 8px | Buttons, input fields, small cards |
| `radius-lg` | 12px | Game cards, option tiles |
| `radius-xl` | 16px | Frame container, hub cards, modals |
| `radius-pill` | 9999px | Badges, tags, progress dots, status indicators |

---

## 6. Animation Timing

### 6.1 Duration Scale

Based on perceptual thresholds:
- <100ms: feels instantaneous (press feedback)
- 100-300ms: feels responsive (state changes)
- 300-500ms: feels deliberate (reveals, transitions)
- >500ms: feels slow (only for celebration/emphasis)

| Token | Duration | Easing | Usage |
|-------|----------|--------|-------|
| `instant` | 80ms | `ease-out` | Press scale, colour feedback |
| `quick` | 150ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Score pop, icon swap |
| `normal` | 250ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Card state change, opacity |
| `reveal` | 350ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Card flip, countdown number, celebrates with slight overshoot |
| `slow` | 500ms | `cubic-bezier(0.65, 0, 0.35, 1)` | Page transitions, progress bar fill |
| `emphasis` | 800ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Star reveal, summary celebration |

### 6.2 Easing Functions

| Name | Curve | Usage |
|------|-------|-------|
| `ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Default for ALL motion. Fast start, gentle stop. |
| `ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | Symmetrical motion (progress fill, looping) |
| `overshoot` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Celebratory reveals (overshoots then settles) |
| `spring` | `cubic-bezier(0.175, 0.885, 0.32, 1.275)` | Bouncy UI (score pop, countdown numbers) |

### 6.3 Stagger

Hub card entrance: `animation-delay: calc(var(--card-index) * 60ms)`
Max stagger for N items: `N * 60ms` (3 games = 180ms total, feels snappy)

### 6.4 Keyframe Definitions

```css
/* Press feedback — scale down then back */
@keyframes press {
  0% { transform: scale(1); }
  50% { transform: scale(0.96); }
  100% { transform: scale(1); }
}
/* Duration: 80ms, easing: ease-out */

/* Correct answer — background fills + slight scale up */
@keyframes correct-fill {
  0% { background-color: var(--card-bg); transform: scale(1); }
  40% { background-color: var(--success); transform: scale(1.02); }
  100% { background-color: var(--success); transform: scale(1); }
}
/* Duration: 250ms, easing: ease-out-expo */

/* Wrong answer — horizontal shake */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  15% { transform: translateX(-5px); }
  30% { transform: translateX(5px); }
  45% { transform: translateX(-4px); }
  60% { transform: translateX(4px); }
  75% { transform: translateX(-2px); }
  90% { transform: translateX(2px); }
}
/* Duration: 350ms, easing: linear (shake handles its own curve) */

/* Score increment — float up and fade */
@keyframes score-float {
  0% { opacity: 1; transform: translateY(0) scale(1); }
  70% { opacity: 1; transform: translateY(-20px) scale(1.1); }
  100% { opacity: 0; transform: translateY(-32px) scale(1.1); }
}
/* Duration: 500ms, easing: ease-out-expo */

/* Countdown number — scale in with overshoot */
@keyframes countdown-enter {
  0% { opacity: 0; transform: scale(0.4); }
  60% { opacity: 1; transform: scale(1.08); }
  100% { opacity: 1; transform: scale(1); }
}
/* Duration: 350ms per number, easing: overshoot */
/* Then exit: */
@keyframes countdown-exit {
  0% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(1.3); }
}
/* Duration: 200ms, easing: ease-out */

/* Card flip (Pixel Pairs) */
@keyframes flip-to-front {
  0% { transform: perspective(600px) rotateY(0deg); }
  100% { transform: perspective(600px) rotateY(180deg); }
}
/* Duration: 350ms, easing: ease-in-out */

/* Hub card entrance — slide up with stagger */
@keyframes slide-up-enter {
  0% { opacity: 0; transform: translateY(12px); }
  100% { opacity: 1; transform: translateY(0); }
}
/* Duration: 300ms, easing: ease-out-expo, stagger: 60ms per card */

/* Progress dot fill */
@keyframes dot-fill {
  0% { transform: scale(0.6); opacity: 0.4; }
  50% { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
/* Duration: 250ms, easing: overshoot */

/* Streak fire pulse (active streak indicator) */
@keyframes streak-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.12); }
}
/* Duration: 600ms, easing: ease-in-out, iteration: infinite */

/* Star reveal on summary */
@keyframes star-pop {
  0% { opacity: 0; transform: scale(0) rotate(-30deg); }
  60% { opacity: 1; transform: scale(1.2) rotate(5deg); }
  100% { opacity: 1; transform: scale(1) rotate(0deg); }
}
/* Duration: 400ms per star, stagger: 200ms, easing: overshoot */
```

---

## 7. Component Specifications

### 7.1 Game Hub Card

```
┌──────────────────────────────────────────┐
│ ┌──────┐                                 │
│ │ ICON │  Game Name            ◯ status  │
│ │64×64 │  Description line     ring 28px │
│ └──────┘                                 │
└──────────────────────────────────────────┘
```

- **Dimensions:** full width, auto height, `padding: 12px`
- **Border radius:** `radius-xl` (16px)
- **Background:** `bg1` with 2px left border in game primary colour
- **Shadow:** `elevation-1` at rest → `elevation-0` + `scale(0.97)` on press
- **Icon area:** 64×64px, `radius-lg` (12px), filled with game primary at 12% opacity, centred SVG icon in game primary colour at 100% opacity
- **Game name:** step `2` (25px), weight 800, `ink0`
- **Description:** step `0` (16px), weight 500, `ink1`
- **Status ring:** 28×28px SVG circle, stroke-width 3px, stroke-dasharray for progress:
  - Unplayed: `ink2` at 30% opacity, no fill
  - In progress: partial arc in game primary
  - Complete: full arc in `success`, with checkmark SVG inside
- **Press interaction:** `transition: transform 80ms ease-out, box-shadow 80ms ease-out`

### 7.2 Game Frame (replaces RetroGameFrame)

```
┌─ TOP BAR ────────────────────────────────┐
│  Score: 3        ● ● ● ○ ○     🔥×2     │
├──────────────────────────────────────────┤
│                                          │
│              GAME CONTENT                │
│           (slot for each game)           │
│                                          │
├──────────────────────────────────────────┤
│  Feedback: "Clean hit."                  │
└──────────────────────────────────────────┘
```

**Top bar:**
- `display: flex; justify-content: space-between; align-items: center;`
- `height: 40px; padding: 0 space-16;`
- Left: Score label (step `-1`, 13px, `ink2`, uppercase, `0.06em` spacing) + value (step `1`, 20px, mono, `ink0`)
- Centre: Progress dots — one per question/round
  - Size: 8px diameter circles
  - Gap: `space-4` (4px) between dots
  - States: empty (2px ring in `bg2`), filled (solid in game primary, `dot-fill` animation), current (10px diameter, game primary, pulsing)
- Right: Streak — only visible when streak ≥ 2
  - "🔥" emoji at 16px + "×{n}" in mono 13px
  - When active: `streak-pulse` animation on the fire emoji
  - When streak breaks: fire icon shrinks out over 150ms

**Countdown (replaces button grid):**
- Single centred number, step `5` (49px), game primary colour
- Sequence: "3" → (350ms) → "2" → (350ms) → "1" → (350ms) → game primary colour text "GO!" at step `3` (31px)
- Each number enters with `countdown-enter`, exits with `countdown-exit`
- The entire frame background briefly flashes game primary at 8% opacity on "GO!"
- Alternative: tap anywhere to skip countdown (sets `stage` to `active` immediately)

**Feedback strip:**
- Height: 24px
- Text: step `-1` (13px), weight 600
- Correct: text colour transitions to `success` over 150ms, returns to `ink1` after 600ms
- Wrong: text colour transitions to `error` over 150ms, returns to `ink1` after 600ms
- CSS: `transition: color 150ms ease-out`

**Props interface:**
```typescript
interface GameFrameProps {
  theme: 'byteChoice' | 'pixelPairs' | 'relaySprint';
  score: number;
  totalRounds: number;
  currentRound: number; // for progress dots
  streak: number;
  feedback: string;
  feedbackType: 'neutral' | 'correct' | 'wrong';
  stage: 'countdown' | 'active' | 'summary';
  onStart: () => void; // called when countdown finishes or player taps to skip
  children: React.ReactNode;
}
```

### 7.3 Byte Choice — Option Card

```
┌──────────────────────────────────────────┐
│  ┌───┐                                   │
│  │ A │   Option text here                │
│  └───┘                                   │
└──────────────────────────────────────────┘
```

- **Dimensions:** full width, `min-height: 64px`, `padding: 12px 16px`
- **Border radius:** `radius-lg` (12px)
- **Background:** `bg1` → `success` (correct) or `error` (wrong)
- **Border:** `1px solid bg2` at rest → `1px solid success/error` on resolve
- **Shadow:** `elevation-1` at rest → `elevation-0` on press
- **Letter indicator:** 28×28px circle, `radius-pill`, game primary at 10% opacity bg, game primary text, step `-1` (13px), weight 700
- **Option text:** step `1` (20px), weight 700, `ink0` → `#F7F3EE` on resolve
- **Layout:** `display: flex; align-items: center; gap: space-12;`

**State transitions:**
- Idle → Pressed: `scale(0.97)` over `instant` (80ms)
- Pressed → Correct: `correct-fill` animation 250ms, icon swap to checkmark SVG
- Pressed → Wrong: `shake` animation 350ms, bg → error, icon swap to × SVG
- Other cards when one is selected: `opacity: 0.4` over `normal` (250ms)
- Correct answer highlight (when wrong selected): `border-color: success; border-width: 2px;` over `normal`

**Timing between questions:**
- Correct: 400ms hold, then crossfade to next (opacity 0→1 over 200ms)
- Wrong: 700ms hold (player sees correction), then crossfade

### 7.4 Pixel Pairs — Card Tile

**Grid:** `grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));` — responsive based on pair count. For 6 pairs (12 tiles): 3 columns × 4 rows. For 8 pairs (16 tiles): 4 columns × 4 rows.

**Card dimensions:** square, size derived from container: `aspect-ratio: 1;`

**Face-down state:**
- Background: game primary (`#1A7A6A`) at 100%
- Border radius: `radius-lg` (12px)
- Content: centred "?" in `#F7F3EE`, step `2` (25px), weight 800
- Shadow: `elevation-1`

**Face-up state:**
- Background: `bg0` (`#F7F3EE`)
- Border: `2px solid game primary`
- Content: word text, step `0` (16px), weight 700, `ink0`, centred both axes
- If long word (>8 chars): step `-1` (13px)

**Flip animation:**
- Container: `perspective: 600px;`
- Card inner: `transition: transform 350ms cubic-bezier(0.65, 0, 0.35, 1); transform-style: preserve-3d;`
- Face-down div: `backface-visibility: hidden;`
- Face-up div: `backface-visibility: hidden; transform: rotateY(180deg);`
- On flip: toggle `transform: rotateY(180deg)` on inner container

**Match found:**
- Both cards: `box-shadow: 0 0 0 3px success, 0 0 12px rgba(46,125,90,0.3);` (green glow)
- After 400ms: `opacity: 0.5; transform: scale(0.92);` over `normal` (250ms)
- Cards remain visible but muted — player sees their progress

**No match:**
- Both cards: `box-shadow: 0 0 0 3px error;` for 200ms
- After 700ms: flip back to face-down
- Flip-back uses same 350ms animation

### 7.5 Summary Screen

```
┌──────────────────────────────────────────┐
│              ★  ★  ☆                     │
│          "Strong session!"               │
│                                          │
│  ┌─────────┐  ┌─────────┐               │
│  │ Score    │  │ Accuracy│               │
│  │   7/10   │  │  70%    │               │
│  └─────────┘  └─────────┘               │
│  ┌─────────┐  ┌─────────┐               │
│  │ Streak  │  │  Time   │               │
│  │   4     │  │  1:23   │               │
│  └─────────┘  └─────────┘               │
│                                          │
│  ┌──────────────────────────────────────┐│
│  │       Share Challenge                 ││
│  └──────────────────────────────────────┘│
│  ┌──────────────────────────────────────┐│
│  │       Play Again                      ││
│  └──────────────────────────────────────┘│
│  ┌──────────────────────────────────────┐│
│  │       Back to Games                   ││
│  └──────────────────────────────────────┘│
└──────────────────────────────────────────┘
```

**Stars:**
- 3 SVG star icons, 32×32px each, `gap: space-8`
- Filled: game primary colour fill
- Empty: `bg2` fill, `ink2` stroke 1.5px
- Star thresholds: ≥90% → 3 stars, ≥70% → 2 stars, ≥50% → 1 star, <50% → 0 stars
- Animation: `star-pop` with 200ms stagger between stars
- 3-star extra: `gold` colour fill instead of game primary

**Performance label:**
- Step `1` (20px), weight 700, `ink0`
- Copy by star count: 0→"Keep practising", 1→"Good effort", 2→"Strong session!", 3→"Perfect run!"

**Stats grid:** `display: grid; grid-template-columns: 1fr 1fr; gap: space-8;`
- Each stat card: `padding: space-12`, `radius-md` (8px), `bg1` background
- Label: step `-1` (13px), `ink2`, uppercase, `0.06em` tracking
- Value: step `2` (25px), mono, `ink0`

**CTAs:**
- Share: `bg: gold (#D9A441)`, `color: ink0`, `min-height: 52px`, `radius-md`
- Play Again: `bg: gamePrimary`, `color: bg0`, `min-height: 52px`, `radius-md`
- Back to Games: `bg: transparent`, `border: 1px solid bg2`, `color: ink1`, `min-height: 48px`, `radius-md`

### 7.6 World Map

**Layout:** vertical, centred, with connecting line.

**Connecting line:** `width: 3px;` centred behind nodes, dashed for incomplete, solid for complete.
- Complete segment: `border-left: 3px solid success;`
- Incomplete segment: `border-left: 3px dashed bg2;`
- Length between nodes: `space-48` (48px)

**Node:**
- Size: 56×56px circle (`radius-pill`)
- **Completed:** `bg: success`, white checkmark SVG (20×20px) centred
- **Current (unlocked, not complete):** `bg: gamePrimary`, white play triangle SVG (16×16px) centred, `box-shadow: 0 0 0 4px gamePrimary at 25% opacity;` (glow ring), pulsing with `streak-pulse` animation
- **Locked:** `bg: bg2`, lock SVG (16×16px) in `ink2`, `opacity: 0.6`
- **Game label:** below node, step `-1` (13px), weight 700, centred

**Token display:** `🪙 {n}` at top-right, step `-1`, mono, `ink1`

**Next unlock:** below the locked node, step `-2` (10px), `ink2`, "12/30 to unlock" with a mini progress bar (40px wide, 3px tall, rounded)

---

## 8. Interaction States

Every interactive element must have these defined:

| State | Visual Change |
|-------|--------------|
| Rest | Default appearance |
| Hover (desktop) | `elevation-2`, cursor pointer |
| Focus-visible | `2px ring` in game primary, `offset: 2px` |
| Pressed | `scale(0.97)`, `elevation-0` |
| Disabled | `opacity: 0.4`, `pointer-events: none` |
| Loading | `opacity: 0.6`, content replaced with 16×16px spinner |

**Transitions:** All state changes use `instant` duration (80ms) with `ease-out`.

---

## 9. Iconography

All icons are inline SVGs. No icon library. No emoji as icons (emoji are for fun decorative use like streak fire, not for functional UI).

**Required SVGs (simple geometric):**

| Icon | Game | Description |
|------|------|-------------|
| `byte-choice-icon` | Byte Choice | 4 horizontal bars of decreasing width (= answer options) |
| `pixel-pairs-icon` | Pixel Pairs | 2×2 grid of rounded squares |
| `relay-sprint-icon` | Relay Sprint | Downward chevron/arrow (= falling words) |
| `checkmark` | Shared | Polyline: M6 13 L10.5 17.5 L18 7 |
| `cross` | Shared | Two diagonal lines forming × |
| `lock` | World Map | Padlock outline |
| `play` | World Map | Right-pointing triangle |
| `star-filled` | Summary | 5-point star, filled |
| `star-empty` | Summary | 5-point star, stroke only |
| `fire` | HUD | Flame shape (or use 🔥 emoji — acceptable here) |

**Icon sizing:** 16px (inline), 20px (buttons), 24px (cards), 32px (summary stars)
**Stroke width:** 2px for 16-20px icons, 1.5px for 24px+

---

## 10. Files to Create / Modify

### New files:
- `components/games-v3/tokens/design-system.css` — all CSS custom properties, keyframes, shared classes
- `components/games-v3/core/GameFrame.tsx` — new frame replacing RetroGameFrame
- `components/games-v3/core/GameFrame.module.css`
- `components/games-v3/core/ProgressDots.tsx`
- `components/games-v3/core/CountdownOverlay.tsx`
- `components/games-v3/core/SummaryScreen.tsx`
- `components/games-v3/core/SummaryScreen.module.css`
- `components/games-v3/core/icons.tsx` — all SVG icon components

### Modified files:
- `components/games-v3/core/RetroGameFrame.tsx` — replace with GameFrame
- `components/games-v3/core/RetroGameFrame.module.css` — replace
- `components/games-v3/byte-choice/ByteChoiceGame.tsx` — update to use GameFrame, add animations
- `components/games-v3/byte-choice/ByteChoiceGame.module.css` — rewrite
- `components/games-v3/pixel-pairs/PixelPairsGame.tsx` — update to use GameFrame, add flip
- `components/games-v3/pixel-pairs/PixelPairsGame.module.css` — rewrite
- `components/games-v3/relay-sprint/RelaySprintGame.tsx` — update to use GameFrame
- `components/games-v3/relay-sprint/RelaySprintGame.module.css` — rewrite
- `components/games-v3/world-map/WorldMap.tsx` — redesign
- `components/games/engine/GameHub.tsx` — redesign
- `tokens/colors.ts` — update Pixel Pairs primary

### Do NOT modify:
- Any file in `lib/games/v3/` (data, adaptation, runtime, copy)
- `lib/games/progress.ts`, `lib/games/streaks.ts`, `lib/games/haptics.ts`
- `components/games/engine/share.ts`
- `components/games-v3/core/SharePanel.tsx` (functional, style updates only)
- `components/games-v3/core/ChallengeCTA.tsx`
- Any Phaser scene files (`relay-sprint-scene.ts`)
- The page.tsx route files (they just wire props)
