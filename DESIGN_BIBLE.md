# TutorLingua Game Design Bible
## The 10x Designer's Process — From Visual Intelligence to Pixel-Perfect Screens

**Created:** February 17, 2026  
**Approach:** AAA game studio methodology (Rockstar / Naughty Dog / Supercell)  
**Platform:** Telegram Mini App (full-screen, mobile-first)  
**Target:** 5 language learning word games that feel native to Telegram and compete visually with the best-performing mini apps on the platform

---

## THE PROCESS

A senior game designer at a studio like Rockstar follows this exact sequence. Each phase produces a deliverable. You cannot skip steps — each one feeds the next.

```
Phase 1 → VISUAL INTELLIGENCE       (Study what exists)
Phase 2 → PLATFORM CONSTRAINTS      (Know your cage before you design)
Phase 3 → PLAYER PSYCHOLOGY MAP     (Design for emotions, not screens)
Phase 4 → DESIGN LANGUAGE SYSTEM    (The DNA — before any screens exist)
Phase 5 → INTERACTION CHOREOGRAPHY  (How it FEELS, not how it looks)
Phase 6 → SCREEN ARCHITECTURE       (Information hierarchy per game)
Phase 7 → VISUAL DESIGN             (Now you open Figma)
Phase 8 → MOTION DESIGN SPEC        (Animation is 50% of the experience)
Phase 9 → SOUND DESIGN BRIEF        (The invisible 20% that makes it addictive)
Phase 10 → SHARE CARD SYSTEM        (The viral artefact — designed as carefully as the game itself)
```

---

# PHASE 1: VISUAL INTELLIGENCE
## What the Hits Actually Look Like (Annotated)

### 1A. The Telegram Game Visual Canon

After studying Hamster Kombat (300M users), Notcoin (35M), Catizen (30M), XEmpire (35M), Pixeltap (15M), and 20+ Dribbble/Figma recreations, here is the **definitive visual pattern** shared by every successful Telegram game:

#### THE DARK CANVAS
Every single hit uses a dark background. Not grey. Not charcoal. **Deep blue-black** (#0A0E1A to #111827 range). This isn't aesthetic preference — it's platform integration. Telegram's native dark mode uses #17212B. Games that use this as their base tone feel like *part of Telegram*, not a foreign embed. Games with white/light backgrounds feel like banner ads that accidentally loaded.

**Specific hex values from the hits:**
| Game | Primary BG | Secondary BG | Card/Surface |
|------|-----------|-------------|-------------|
| Hamster Kombat | #0F1923 | #1A2332 | #1E293B (with radial gradient) |
| Notcoin | #0D0D0D | #1A1A1A | #262626 |
| Catizen | #0A1628 | #132040 | #1A2D52 |
| XEmpire | #0B0F1A | #151B2E | #1E2740 |
| Telegram Dark Mode | #17212B | #1B2836 | #1E2C3A |

**The pattern:** All sit in the **210°-230° hue range** (blue-black), with saturation between 15-40%. This is the "Telegram frequency." Design outside this range and you feel foreign.

#### THE ACCENT SYSTEM
Every hit uses **one dominant warm accent** against the cold dark canvas:
- **Hamster Kombat:** Gold/amber (#F5A623 → #FFD700) — wealth, coins, premium
- **Notcoin:** Electric gold (#FFD700) — literally a gold coin
- **Catizen:** Warm coral/orange (#FF6B35 → #FF8C42) — playful, pet-like
- **XEmpire:** Royal purple + gold (#7C3AED + #F5A623) — empire, power

**The rule:** Warm accent on cold canvas. Never cool-on-cool. The accent is what your eye is drawn to — it IS the game's primary interaction target.

#### THE CENTRE HERO
Every game has a **single massive visual element** dead centre of the screen, taking up 40-60% of the viewport:
- Hamster: The hamster character (tappable)
- Notcoin: The coin (tappable)
- Catizen: The cat (interactive)

This isn't a UI choice. It's a **cognitive architecture** choice. One focal point = zero decision paralysis. The player's thumb knows exactly where to go.

#### THE BOTTOM TAB BAR
Universal pattern across all hits: **5 tabs, fixed bottom, icon + label**

Hamster Kombat tabs: `Exchange | Mine | Friends | Earn | Airdrop`  
Notcoin tabs: `Main | Tasks | Boosters | Friends | Wallet`  
Catizen tabs: `Home | Tasks | Friends | Leaderboard | Wallet`

**The formula:** `Primary Action | Secondary Loop | Social/Referral | Progression | Meta/Reward`

Note: "Friends" (referral) is ALWAYS tab position 3 or 4 — prominent, not hidden. In Hamster Kombat it was responsible for 99% of user acquisition. The tab bar is not navigation — it's the **growth engine's control panel**.

#### TYPOGRAPHY
All hits use **bold, condensed sans-serif** typefaces at large sizes:
- Headers: 24-32px, bold/black weight
- Numbers/scores: 36-48px, often with gradient fills
- Body: 14-16px, medium weight, high contrast (#E2E8F0 on dark)
- Tab labels: 10-12px, medium weight

**The feel:** Confident, not delicate. These aren't literary experiences — they're action interfaces. Type is big, heavy, and unapologetic.

#### VISUAL DEPTH & GLOW
The flat design era is dead in Telegram games. Every hit uses:
- **Radial gradients** behind the hero element (dark → slightly lighter, creating a spotlight)
- **Soft glow/bloom effects** on interactive elements
- **Drop shadows with coloured spread** (not grey — amber, blue, or purple shadows)
- **Particle effects** on interaction (coins flying, stars bursting)
- **Glassmorphism** on cards/panels (blur + semi-transparency)

This creates a **"cinematic" quality** — the screen feels like it has depth and atmosphere, not like a flat form.

### 1B. The NYT Games Visual Canon

Since TutorLingua's games are modelled on NYT Connections/Strands/Spelling Bee, we need to understand THAT visual language too — then fuse it with Telegram's:

#### NYT GAMES DESIGN PRINCIPLES
- **Minimalism as identity:** White space is the primary design element
- **The grid IS the game:** No ornamentation around the playing field
- **Colour is meaning:** Yellow (🟨), green (🟩), blue (🟦), purple (🟪) in Connections = difficulty levels. Colour IS information, not decoration
- **Typography is premium:** NYT uses their own Cheltenham + Franklin typefaces. The typography alone signals "this is a quality experience"
- **Micro-interactions over spectacle:** Tiles flip, slide, and settle with spring physics. Not flashy — satisfying
- **Share cards are designed as art:** The Wordle grid, Connections coloured dots, Strands path maps — these are visual outputs designed to be beautiful in isolation

#### THE FUSION OPPORTUNITY

Here's what nobody has done yet: **NYT word game mechanics + Telegram-native visual language.**

NYT Games are brilliant but they're designed for a *website* audience on *iOS/desktop*. They're light-mode, minimal, editorial. Telegram's audience is **mobile-first, dark-mode, action-oriented, and social-first**.

The opportunity is to take NYT's *mechanical excellence* (the grids, the puzzle formats, the difficulty curves) and wrap them in Telegram's *visual energy* (dark canvas, glow effects, bold type, cinematic depth).

**This is TutorLingua's design thesis:**  
> "NYT Connections, but it looks like it was designed by the team that made Hamster Kombat's UI and powered by Supercell's interaction design team."

---

# PHASE 2: PLATFORM CONSTRAINTS
## Know Your Cage Before You Design

### 2A. Telegram Mini App Technical Boundaries

These are non-negotiable hardware constraints. Design around them, not against them.

#### VIEWPORT
- **Width:** 100% of device width (typically 360-428px on mobile)
- **Height:** Variable. Telegram chrome eats ~56px top (header bar) + ~48px bottom (system nav) in windowed mode
- **Full-screen mode (Bot API 8.0+):** Removes Telegram chrome, gains full viewport. **Must support safe area insets** (notch, dynamic island, rounded corners)
- **Orientation:** Portrait primary. Landscape supported in full-screen but portrait is where 98%+ of sessions happen
- **Safe areas:** `env(safe-area-inset-top)`, `env(safe-area-inset-bottom)` — critical for iPhone notch/dynamic island

#### PERFORMANCE
- **Rendering:** WebView (WKWebView on iOS, Chrome WebView on Android)
- **GPU:** Limited. Heavy CSS animations > Canvas/WebGL for most cases. Avoid >60 simultaneous animated elements
- **Memory:** ~128-256MB practical limit before WebView starts recycling
- **Load time budget:** **Under 2 seconds to first interactive paint.** Hamster Kombat loads in ~1.5s. Anything over 3s and you lose 40% of users.
- **Bundle size:** <500KB initial load. Lazy-load everything else.

#### INPUT
- **Touch only.** No hover states needed (but don't break them for testing)
- **Haptic feedback:** Available via `Telegram.WebApp.HapticFeedback`:
  - `impactOccurred('light' | 'medium' | 'heavy' | 'rigid' | 'soft')`  
  - `notificationOccurred('error' | 'success' | 'warning')`
  - `selectionChanged()`
- **This is critical:** Haptics are free dopamine. Every correct answer, every word found, every streak milestone should have a distinct haptic signature.

#### TELEGRAM-NATIVE FEATURES TO USE
- **Theme params:** `Telegram.WebApp.themeParams` gives you the user's current Telegram theme colours. Match them.
- **User data:** Name, photo, language code — pre-authenticated. No login screen ever.
- **Share to chat:** Native share dialog. One API call to send a message to any chat.
- **Inline keyboards:** Buttons that appear in the chat itself, outside your Mini App.
- **Cloud storage:** Key-value storage per user (up to 1MB). Use for settings, preferences.
- **Device storage (API 9.0+):** Persistent local storage that survives cache clears.
- **Home screen shortcut:** `Telegram.WebApp.addToHomeScreen()` — prompts user to add app icon to phone home screen.
- **Full-screen mode:** `Telegram.WebApp.requestFullscreen()` — removes Telegram chrome for immersive gameplay.
- **Stars payments:** In-app purchases via Telegram Stars. Required for app store featuring.

### 2B. Design Implications of Constraints

| Constraint | Design Implication |
|-----------|-------------------|
| Small viewport | Every pixel counts. No decorative whitespace. Dense but not cluttered. |
| Touch-only | Minimum tap target: 44×44px. Finger-friendly spacing. No tiny buttons. |
| Dark mode dominant | Design dark-first, light as optional override |
| 2s load budget | No heavy assets on first paint. Progressive image loading. CSS animations > GIFs |
| Haptic access | Design a "haptic vocabulary" — different vibes for different events |
| Pre-authenticated | Zero onboarding screens. Game loads → you're playing |
| Share to chat | Share buttons should trigger native Telegram share, not clipboard copy |
| Full-screen mode | Design for both windowed + full-screen. Use safe area insets |

---

# PHASE 3: PLAYER PSYCHOLOGY MAP
## Design for Emotions, Not Screens

A Rockstar designer maps the **emotional journey** before touching layouts. Every screen exists to create or sustain a feeling.

### 3A. The Session Emotional Arc

Every TutorLingua game session should follow this emotional curve:

```
Arousal
  ↑
  │    ╭───╮         ╭──────╮
  │   ╱     ╲       ╱        ╲
  │  ╱       ╲     ╱          ╲
  │ ╱         ╲   ╱            ╲    ╭──╮
  │╱           ╲ ╱              ╲  ╱    ╲
  │             ╳                ╲╱      ╲
  │            ╱ ╲                        ╲
  │───────────╱───╲────────────────────────╲──→ Time
  │
  OPEN   FIRST    STRUGGLE  BREAK-    CLIMAX  RESULT  SHARE
         WIN                THROUGH           SCREEN  MOMENT
```

**Phase-by-phase:**

| Phase | Emotion | Design Response |
|-------|---------|----------------|
| **OPEN** (0-1s) | Curiosity + anticipation | Clean board, today's puzzle number, subtle pulse animation. No tutorial. |
| **FIRST WIN** (5-15s) | Quick dopamine hit | First easy category/word found. Satisfying animation + haptic. "I can do this." |
| **STRUGGLE** (30-90s) | Productive frustration | Deceptive overlaps. False friends. Wrong guesses. Board feels tense. |
| **BREAKTHROUGH** (60-120s) | Aha! moment | Correct group found after struggle. BIG animation + haptic + sound. Relief. |
| **CLIMAX** (90-180s) | Peak tension/flow | Final category. Timer pressure (Speed Clash). Last blank (Decode). |
| **RESULT** (end) | Pride or determination | Score card with performance metrics. CEFR level indication. "You're at B2." |
| **SHARE** (end+5s) | Social validation | Beautiful share card generated. One-tap share to Telegram chat. |

**Critical insight:** The STRUGGLE phase is where most games fail. Players quit during frustration. The solution: **micro-rewards during struggle.** In Connections: tiles shake when you're 3/4 correct (hope signal). In Strands: ghost words give hint energy (progress despite failure). Never let frustration exist without a simultaneous hope signal.

### 3B. The Motivation Stack

Each game taps different psychological motivators. Map them explicitly:

| Motivator | How to Trigger | Which Games |
|-----------|---------------|-------------|
| **Mastery** | Visible skill improvement, CEFR progress | All games |
| **Completion** | "4/4 categories found", streak counters | Connections, Decode |
| **Competition** | Leaderboards, ghost racers, friend challenges | Speed Clash, Spell Cast |
| **Social proof** | "4,231 players solved this today" | All daily games |
| **FOMO** | Daily puzzles, streak penalties, limited chapters | All games |
| **Self-discovery** | "You missed subjunctive verbs" — learning about yourself | Speed Clash, Decode |
| **Narrative** | Monthly mystery story, cultural context | Decode, Strands |
| **Collection** | Words mastered count, languages unlocked, badges | Hub/Profile |

### 3C. The "False Friend" Moment — TutorLingua's Signature Emotion

This is the emotional moment that NO other word game produces. It's TutorLingua's **proprietary feeling.**

**The moment:** A player groups "actual" with words meaning "real/genuine" — then discovers it means "current" in Spanish. Their mental model BREAKS. They feel surprise, then amusement, then genuine insight. This is the "aha!" that they tell people about.

**Design requirement:** This moment needs its own dedicated animation and UX treatment. It's not just "wrong answer." It's:
1. The wrong group attempt (tiles shake, red flash)
2. A brief "False Friend detected" tooltip with a playful icon (🤦‍♂️ or 🪤)
3. After the game: a "False Friends Gallery" showing all the traps you fell for + the real meanings
4. This gallery IS the share card: "I fell for 3 False Friends today. Can you do better?"

**This is the single most important design moment in the entire product.** It's where language learning and game design become inseparable. Every design decision should make this moment louder, funnier, and more shareable.

---

# PHASE 4: DESIGN LANGUAGE SYSTEM
## The DNA — Before Any Screens Exist

### 4A. Colour System

#### Core Palette

**Canvas (backgrounds):**
```
--bg-deep:     #080C14    /* Deepest — behind everything */
--bg-primary:  #0F1520    /* Primary game background */
--bg-surface:  #161D2E    /* Cards, panels, bottom sheet */
--bg-elevated: #1E2740    /* Modals, tooltips, overlays */
--bg-active:   #253050    /* Active/selected state */
```

**Text:**
```
--text-primary:   #F1F5F9   /* Primary text — almost white, not pure #FFF */
--text-secondary: #94A3B8   /* Secondary labels, captions */
--text-muted:     #475569   /* Disabled, placeholder */
--text-accent:    #FCD34D   /* Numbers, scores, highlights */
```

**Game Colours (semantic — these mean something):**
```
/* Connections difficulty levels — matching NYT convention */
--game-yellow:  #FDE047   /* Easy category */
--game-green:   #4ADE80   /* Medium category */
--game-blue:    #60A5FA   /* Hard category */
--game-purple:  #C084FC   /* Expert category */

/* State colours */
--state-correct:  #4ADE80   /* Correct answer */
--state-wrong:    #F87171   /* Wrong answer */
--state-warning:  #FBBF24   /* Close/partial */
--state-streak:   #F97316   /* Streak fire */
```

**Language Accent Colours (per language = per bot identity):**
```
--lang-spanish:  #FF6B35   /* Warm orange — passion, flamenco */
--lang-french:   #3B82F6   /* Royal blue — elegance */
--lang-german:   #FBBF24   /* Gold/amber — precision */
--lang-italian:  #22C55E   /* Verde — life, nature */
--lang-portuguese: #A855F7 /* Purple — saudade, richness */
```

Each language bot has its own accent colour that tints the game UI. Same game mechanics, different emotional frequency per language.

#### Gradient System
```
/* Hero spotlight — behind the main game element */
--glow-primary: radial-gradient(ellipse at 50% 40%, rgba(252,211,77,0.08) 0%, transparent 70%);

/* Card surfaces */
--surface-gradient: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 100%);

/* Score number glow */
--text-glow: 0 0 20px rgba(252,211,77,0.3), 0 0 40px rgba(252,211,77,0.1);
```

### 4B. Typography System

**Font Stack:**
```
--font-display: 'Inter Tight', 'SF Pro Display', system-ui;  /* Headlines, numbers */
--font-body:    'Inter', 'SF Pro Text', system-ui;            /* Body, labels */
--font-game:    'JetBrains Mono', 'SF Mono', monospace;       /* Game tiles, letters */
```

**Why Inter Tight:** Condensed enough for small viewports, geometric enough to feel modern, has true bold/black weights for that "confident" Telegram game feel. Available on Google Fonts — zero licensing cost.

**Why monospace for game tiles:** Every letter needs equal width for grid alignment. JetBrains Mono is legible at small sizes and has distinctive letter shapes (critical for language learning — "l" vs "I" vs "1").

**Scale:**
```
--text-mega:    48px / 1.0  / 900   /* Score numbers, big counters */
--text-hero:    32px / 1.1  / 800   /* Game title, puzzle number */
--text-heading: 24px / 1.2  / 700   /* Section headers */
--text-subhead: 18px / 1.3  / 600   /* Sub-headers */
--text-body:    16px / 1.5  / 400   /* Body text */
--text-caption: 13px / 1.4  / 500   /* Labels, tab bar text */
--text-micro:   11px / 1.3  / 500   /* Timestamps, footnotes */

/* Game tile text */
--tile-text:    16px / 1.0  / 700   /* Letter on tile (Connections) */
--tile-text-sm: 13px / 1.0  / 700   /* Smaller tiles (6×8 Strands grid) */
```

### 4C. Spacing & Layout System

```
--space-xs:   4px
--space-sm:   8px
--space-md:   12px
--space-lg:   16px
--space-xl:   24px
--space-2xl:  32px
--space-3xl:  48px

/* Game grid specific */
--tile-gap:     6px    /* Gap between tiles in grids */
--tile-radius:  8px    /* Tile corner radius */
--card-radius:  16px   /* Card/panel corner radius */
--tab-height:   56px   /* Bottom tab bar height */
--safe-bottom:  env(safe-area-inset-bottom, 0px)
```

**Layout rule:** The game board should occupy **60-70% of the vertical viewport**. The remaining 30-40% is split between: header (puzzle info, timer) at top, and controls (submit, shuffle, share) at bottom. The tab bar sits below everything, fixed.

### 4D. Elevation & Depth System

```
/* Shadows — coloured, not grey */
--shadow-sm:    0 2px 4px rgba(0,0,0,0.3);
--shadow-md:    0 4px 12px rgba(0,0,0,0.4);
--shadow-lg:    0 8px 24px rgba(0,0,0,0.5);
--shadow-glow:  0 0 20px rgba(var(--accent-rgb), 0.2);

/* Glass effect for overlays */
--glass: background: rgba(22, 29, 46, 0.8); backdrop-filter: blur(12px);
```

**Depth hierarchy:**
1. **Canvas** (z=0) — Deep dark background with subtle radial gradient
2. **Game board** (z=1) — Tiles, grids, playing field
3. **Controls** (z=2) — Buttons, tab bar
4. **Feedback** (z=3) — Score popups, animations, toasts
5. **Overlays** (z=4) — Modals, share cards, results

### 4E. Iconography

**Style:** Outlined, 2px stroke, rounded caps, 24×24 grid.  
**Source:** Lucide Icons (MIT license, consistent with Inter's geometry)  
**Custom icons needed:**
- 🔥 Streak flame (animated)
- 🧠 CEFR brain/level indicator
- 🪤 False Friend trap icon
- 🏆 Rank badges (Scholar → Genius → Maestro → Polyglot)
- Flag emojis for language selection (native emoji, not custom)

---

# PHASE 5: INTERACTION CHOREOGRAPHY
## How It FEELS, Not How It Looks

This is what separates a 10x designer from a screen-pusher. Before any layout work, define how every interaction *feels* in the hand.

### 5A. Haptic Vocabulary

| Event | Haptic Type | Feeling |
|-------|------------|---------|
| Tile tap/select | `selectionChanged()` | Light click — acknowledgement |
| Tile deselect | `selectionChanged()` | Same — symmetric feedback |
| Correct group found | `notificationOccurred('success')` | Satisfying thud |
| Wrong guess | `notificationOccurred('error')` | Sharp buzz — "nope" |
| Word found (Strands/Spell Cast) | `impactOccurred('medium')` | Solid pop |
| Pangram / Spangram | `impactOccurred('heavy')` + `notificationOccurred('success')` | BOOM — double hit |
| False Friend detected | `notificationOccurred('warning')` | Ironic wobble |
| Streak milestone | `impactOccurred('heavy')` × 3 (rapid) | Triple pulse — celebration |
| Timer running low (Speed Clash) | `impactOccurred('soft')` at 1Hz | Heartbeat |
| Game complete | `notificationOccurred('success')` × 2 | Double thump — done |
| Share card generated | `impactOccurred('light')` | Gentle — "here you go" |

### 5B. Animation Vocabulary

**Easing curves:**
```css
--ease-spring:  cubic-bezier(0.34, 1.56, 0.64, 1);  /* Bouncy — for celebrations */
--ease-smooth:  cubic-bezier(0.4, 0, 0.2, 1);        /* Smooth — for transitions */
--ease-snap:    cubic-bezier(0.7, 0, 0.3, 1);        /* Snappy — for selections */
--ease-out:     cubic-bezier(0, 0, 0.2, 1);          /* Decelerate — for entries */
```

**Core animations:**

| Animation | Duration | Easing | Description |
|-----------|----------|--------|-------------|
| **Tile select** | 100ms | snap | Scale 1.0 → 0.95 → 1.02 → 1.0 + border glow appears |
| **Tile deselect** | 80ms | snap | Scale 1.02 → 1.0, glow fades |
| **Wrong guess shake** | 400ms | spring | TranslateX: 0 → -8px → 8px → -4px → 4px → 0 |
| **Correct group collapse** | 500ms | smooth | Selected tiles scale down + move to solved row. Colour fills in. Remaining tiles cascade upward. |
| **Word path glow (Strands)** | 300ms stagger | ease-out | Each letter in the found path illuminates sequentially (50ms stagger), then the whole path pulses once. |
| **Score popup** | 600ms | spring | +25 text flies up from interaction point, scales 0→1.2→1.0, fades out at top |
| **Streak fire** | Loop | - | CSS `@keyframes` flame flicker on streak counter. Intensity increases with streak length. |
| **False Friend reveal** | 800ms | spring | Tile flips 180° Y-axis, revealing the real meaning on the back. Cheeky 🪤 icon appears. |
| **Heartbeat pulse (timer)** | 1000ms loop | - | Subtle scale oscillation 1.0→1.02→1.0 on timer when <10s remain |
| **Result card entry** | 400ms | spring | Slides up from bottom with blur-behind. Content staggers in (title → score → stats → share button, 80ms each) |
| **Share card generate** | 300ms | smooth | Card materialises with a shimmer effect (linear gradient sweep left→right) |

### 5C. State Machine (per game)

Every game tile has these states:
```
IDLE → SELECTED → SUBMITTED → CORRECT | WRONG → SOLVED | RESET
                                                 ↓
                                          FALSE_FRIEND (special state for TutorLingua)
```

**Visual treatment per state:**

| State | Background | Border | Text | Effect |
|-------|-----------|--------|------|--------|
| IDLE | `--bg-surface` | 1px `--bg-elevated` | `--text-primary` | None |
| SELECTED | `--bg-active` | 2px `--text-accent` | `--text-primary` | Subtle glow |
| CORRECT | `--game-green` → category colour | None | `--bg-deep` (dark on light) | Scale pulse + glow |
| WRONG | `--state-wrong` flash (200ms) → back to IDLE | Red border flash | No change | Shake animation |
| FALSE_FRIEND | `--state-warning` flash → flip animation → back | Amber border | Reveals real meaning | Flip + 🪤 icon |
| SOLVED | Category colour (yellow/green/blue/purple) | None | `--bg-deep` | Settled, no animation |

---

# PHASE 6: SCREEN ARCHITECTURE
## Information Hierarchy Per Game

### 6A. Universal Shell (shared across all 5 games)

```
┌─────────────────────────────────────────┐
│ ■ Safe Area Top                          │
├─────────────────────────────────────────┤
│ 🇪🇸 Lingua Connections   #47     ⚙️  │  ← Game Header
│ ─────────────────────────────────────── │
│                                         │
│                                         │
│          [ GAME BOARD ]                 │  ← 60-70% of viewport
│       (varies per game type)            │
│                                         │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│  ❌ 3 remaining  │ SHUFFLE │  SUBMIT   │  ← Game Controls
├─────────────────────────────────────────┤
│  🎮  │  🔥  │  ⚔️  │  📚  │  👤      │  ← Bottom Tab Bar
│ Play  Streak Challenge Learn Profile    │
├─────────────────────────────────────────┤
│ ■ Safe Area Bottom                       │
└─────────────────────────────────────────┘
```

**Header:** Minimal. Flag emoji + game name + puzzle number + settings gear. No more. 32px height max.

**Game Board:** The sacred space. No chrome intrudes here. This is where the player's eyes live for 95% of the session.

**Controls:** Contextual per game. Maximum 3 actions visible at once. Primary action (Submit) is always rightmost and largest.

**Tab Bar:** 5 items. Always visible (except in full-screen game mode where it collapses). 56px + safe area.

### 6B. Lingua Connections (4×4 Grid)

```
┌─────────────────────────────────────┐
│ 🇪🇸 Connections    #47        ⚙️  │
├─────────────────────────────────────┤
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │  ← Solved rows
│ │ ACTUAL │ │ CUERPO │ │SENSIBLE│ │ REAL   │ │     (collapse here
│ └────────┘ └────────┘ └────────┘ └────────┘ │      as found)
│                                               │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │
│ │ PLATA  │ │ ROPA   │ │ EMBARAZ│ │ ÉXITO  │ │  ← Active tiles
│ └────────┘ └────────┘ └────────┘ └────────┘ │     (tappable)
│                                               │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │
│ │ LARGO  │ │ BIZARRO│ │ CARPETA│ │ SUCESO │ │
│ └────────┘ └────────┘ └────────┘ └────────┘ │
│                                               │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │
│ │ ARENA  │ │ ONCE   │ │ SOPA   │ │ CAMPO  │ │
│ └────────┘ └────────┘ └────────┘ └────────┘ │
├─────────────────────────────────────┤
│  ❌ ❌ ❌ ○  │  🔀 Shuffle  │  Submit  │
│  Mistakes     │              │  [=====] │
└─────────────────────────────────────┘
```

**Tile sizing:** 
- 4 columns with 6px gap = each tile is ~(viewport width - 48px padding - 18px gaps) / 4
- On 390px viewport: each tile ≈ 81px wide × 50px tall
- Text must be uppercase, centred, 14-16px bold
- Long words (>9 chars) get 12px font or auto-truncate

**Key interaction:** Tap to select (max 4), then submit. Wrong = shake + lose a life. Right = tiles animate to solved row with category colour + label.

### 6C. Lingua Strands (6×8 Letter Grid)

```
┌─────────────────────────────────────┐
│ 🇫🇷 Strands     #22           ⚙️  │
├─────────────────────────────────────┤
│      Today's theme:                  │
│      🍳🥘🍷 "En la cocina"          │
│                                      │
│  ┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐          │
│  │ C ││ A ││ S ││ E ││ R ││ O │    │  ← 6×8 grid
│  └──┘└──┘└──┘└──┘└──┘└──┘          │     Letters are
│  ┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐          │     drag-selectable
│  │ L ││ P ││ O ││ I ││ V ││ R │    │     (path bends)
│  └──┘└──┘└──┘└──┘└──┘└──┘          │
│  ┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐          │
│  │ A ││ T ││ E ││ N ││ E ││ D │    │
│  └──┘└──┘└──┘└──┘└──┘└──┘          │
│  ... (8 rows total)                  │
│                                      │
│  Found: 5/7 theme words              │
│  ░░░░░░░░████████████░░░░           │  ← Progress bar
├─────────────────────────────────────┤
│  💡 Hint (3 ghost words = 1 hint)   │
└─────────────────────────────────────┘
```

**Key interaction:** Drag finger across adjacent letters to form words. Path bends in any direction. Found theme words highlight with the language accent colour, creating glowing paths across the grid. Ghost words (valid but off-theme) fill a hint meter.

**The TikTok moment:** The glowing paths. When all theme words are found, the entire grid lights up with interweaving coloured paths. THIS is the screenshot/screen-record moment.

### 6D. Spell Cast (Honeycomb)

```
┌─────────────────────────────────────┐
│ 🇩🇪 Spell Cast    #31         ⚙️  │
├─────────────────────────────────────┤
│     Scholar → Genius → Maestro      │
│     ████████████░░░░░░░░            │  ← Rank progress
│     142 / 200 points                │
│                                      │
│           ┌───┐                      │
│          / E   \                     │
│     ┌───┐       ┌───┐               │
│    / N   \     / S   \              │  ← Honeycomb
│     ┌───┐ ┌───┐ ┌───┐              │     (centre letter
│    / I   \ │ Ü │ / T   \           │      mandatory)
│     └───┘ └───┘ └───┘              │
│    \ R   /     \ A   /              │
│     └───┘       └───┘               │
│          \ L   /                     │
│           └───┘                      │
│                                      │
│  Current word: [ S C H Ü L E R ]    │  ← Word builder
│  Found: 18 words   🌟 2 pangrams    │
├─────────────────────────────────────┤
│  DELETE  │  SHUFFLE  │  ENTER       │
└─────────────────────────────────────┘
```

**Key interaction:** Tap hexagonal cells to spell words. Centre letter (highlighted in accent colour) must be in every word. Pangram (all 7 letters) triggers celebration.

### 6E. Speed Clash (Head-to-Head)

```
┌─────────────────────────────────────┐
│ ⚔️ Speed Clash                 ⚙️  │
├─────────────────────────────────────┤
│  You: ████████░░░  7/10             │  ← Your progress
│  👻 Ana: ██████░░░░  6/10          │  ← Ghost racer
│                                      │
│  ┌─────────────────────────────────┐│
│  │                                 ││
│  │    🧊 ❄️                       ││  ← Situation image
│  │                                 ││
│  │    [Someone enters a cold room] ││
│  └─────────────────────────────────┘│
│                                      │
│  ┌───────────────────────────────┐  │
│  │  "¡Qué frío hace aquí!"      │  │  ← Option A
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  "Estoy frío"                 │  │  ← Option B
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  "Hace mucho fresco"          │  │  ← Option C
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  "Tengo frío"                 │  │  ← Option D
│  └───────────────────────────────┘  │
│                                      │
│  ⏱️ ██████████░░░░░  42s           │  ← Timer bar
└─────────────────────────────────────┘
```

**Key interaction:** Tap the most natural response. Speed matters — ghost racer shows competitor's pace. Final 10 seconds: timer turns red, haptic heartbeat.

### 6F. Daily Decode (Fill-in-the-Blank)

```
┌─────────────────────────────────────┐
│ 📖 Daily Decode   Ch.12  🇪🇸  ⚙️  │
├─────────────────────────────────────┤
│  Chapter 12: "La Casa Misteriosa"   │
│                                      │
│  "Cuando Elena _______ a la puerta, │
│  nadie _______ . Pero ella podía    │
│  escuchar una _______ melodía que   │
│  venía del _______. Con cuidado,    │
│  empujó la puerta y _______ un      │
│  largo pasillo oscuro."             │
│                                      │
│  ┌─────────────────────────────┐    │
│  │ Type word for blank 1:  [_]│    │  ← Text input
│  └─────────────────────────────┘    │
│                                      │
│  Decoded: ██░░░░░░  2/5  B2 level   │
│                                      │
│  📊 67% of players got blank 3      │
│     wrong today                      │
├─────────────────────────────────────┤
│  ← PREV BLANK │ SUBMIT │ NEXT → │  │
└─────────────────────────────────────┘
```

**Key interaction:** Read the story paragraph, type missing words. No multiple choice — pure recall. Community stats appear when most players fail a blank. Monthly story arc creates narrative FOMO.

### 6G. Game Hub (The Arcade)

```
┌─────────────────────────────────────┐
│ TutorLingua Games        🔥 12 day  │
├─────────────────────────────────────┤
│                                      │
│  TODAY'S PUZZLES                     │
│                                      │
│  ┌─────────┐ ┌─────────┐           │
│  │🟨🟩🟦🟪│ │ ░░░░░░░ │           │
│  │Connect- │ │ Strands  │           │
│  │ions #47 │ │ #22      │           │
│  │ ✅ Done │ │ ▶ Play   │           │
│  └─────────┘ └─────────┘           │
│                                      │
│  ┌─────────┐ ┌─────────┐           │
│  │ ⬡ ⬡ ⬡  │ │ ⚔️      │           │
│  │ Spell   │ │ Speed    │           │
│  │ Cast #31│ │ Clash    │           │
│  │ ▶ Play  │ │ ▶ Play   │           │
│  └─────────┘ └─────────┘           │
│                                      │
│  ┌─────────────────────┐            │
│  │ 📖 Daily Decode Ch.12│           │
│  │ New chapter today!    │           │
│  │ ▶ Play               │           │
│  └─────────────────────┘            │
│                                      │
│  YOUR STATS                          │
│  🧠 B2 Level │ 📚 847 Words │🔥 12 │
│                                      │
├─────────────────────────────────────┤
│  🎮  │  🔥  │  ⚔️  │  📚  │  👤  │
│ Play  Streak Challenge Learn Profile │
└─────────────────────────────────────┘
```

**Key design decision:** The hub is a vertical scroll of game cards, not a grid. Each card shows: game icon, today's puzzle number, completion status. Completed games show the share card thumbnail as the card background. Unplayed games pulse gently.

---

# PHASE 7: VISUAL DESIGN
## Now You Open Figma

### 7A. Design Deliverables List

After all the above phases are locked, the visual design phase produces these specific screens for **each game** (5 games × screens = full deliverable set):

**Per game:**
1. Empty state (fresh puzzle, no moves)
2. Mid-game state (some progress, some solved)
3. Struggle state (wrong guess, shake, error)
4. False Friend moment (TutorLingua-specific)
5. Game complete — Perfect score
6. Game complete — With mistakes
7. Share card (static image output)
8. Share card (animated/video output for Stories)

**Hub & Meta screens:**
9. Game Hub (arcade view)
10. Streak dashboard
11. Challenge flow (send to friend)
12. Challenge received (friend's perspective)
13. Profile / Stats
14. CEFR Level assessment result
15. "Explain my mistakes" AI coaching screen
16. Tutor booking CTA (from game context)

**System states:**
17. Loading state (skeleton + progress)
18. Error state
19. Offline state
20. First launch (no onboarding modal — just the game with subtle hint overlays)

**Total: ~60 unique screen designs across all games + meta flows.**

### 7B. Visual Design Principles

1. **Dark canvas is sacred.** The background never competes with the game board. It recedes.

2. **Colour is earned.** Start desaturated. Colour appears when the player does something right. A solved Connections row fills with colour. A found Strands word glows. Colour = achievement.

3. **The game board is the hero.** 60-70% of the viewport. No decorative elements around it. The grid/honeycomb/text IS the visual design.

4. **Typography does the heavy lifting.** With a dark background, the type IS the visual identity. Big, bold, confident. Numbers glow. Letters are crisp.

5. **Animation > illustration.** Don't make pretty pictures. Make satisfying movements. A perfect spring-bounce on a correct answer is worth more than a custom illustration.

6. **Asymmetric information density.** The game board is dense. Everything else (header, controls) is minimal. Don't distribute complexity evenly — concentrate it where it matters.

7. **Screenshot-native design.** Every game state should look good in a 1080×1920 screenshot. No ugly scroll positions. No half-rendered states.

---

# PHASE 8: MOTION DESIGN SPEC
## Animation Is 50% of the Experience

### 8A. The "Juice" Hierarchy

Borrowed from game design terminology: "juice" is the visceral feedback that makes interactions feel alive.

**Tier 1 — ALWAYS animate (these define the feel):**
- Tile selection/deselection
- Correct answer celebration
- Wrong answer rejection
- Score incrementing
- Streak counter updating
- Timer progression

**Tier 2 — SHOULD animate (these enhance the feel):**
- Screen transitions
- Tab bar switching
- Share card generation
- Progress bar filling
- Leaderboard position changes
- Ghost racer movement (Speed Clash)

**Tier 3 — NICE TO HAVE (polish layer):**
- Ambient background particles
- Idle state micro-animations
- Loading skeleton pulse
- Button hover/press states
- Confetti/particle bursts on milestones

### 8B. The "Connections Solve" Animation (Signature Moment)

This is the most important animation in the entire product. When a player correctly groups 4 words:

```
T=0ms:     Player taps "Submit"
T=0-100:   Selected tiles briefly scale to 1.05 (anticipation)
T=100:     Haptic: success
T=100-300: Tiles smoothly translate to the solved row position
           Simultaneously: tile background crossfades from selected to category colour
T=300-400: Remaining tiles slide upward to fill the gap (spring easing)
T=400-500: Category label fades in below the solved row
T=500:     Brief glow pulse on the entire solved row
T=500+:    Board settles. Ready for next move.

Total: 500ms — fast enough to not interrupt flow, slow enough to feel satisfying
```

**For the FINAL group (last one remaining — auto-solved):**
```
T=0-500:   Same as above, but...
T=500-800: All 4 solved rows pulse sequentially (stagger: 100ms each)
T=800:     Score card flies up from bottom
T=800-1200: Score card content staggers in:
            - Puzzle number (T=800)
            - Colour dots showing solve order (T=880)
            - Time taken (T=960)
            - Mistakes count (T=1040)
            - Share button (T=1120) with shimmer
```

### 8C. The "False Friend Flip" Animation (Brand-Defining Moment)

```
T=0ms:     Wrong guess submitted (includes a false friend word)
T=0-400:   Standard wrong shake animation
T=400:     The false friend tile stays highlighted (amber border)
T=400-600: Small tooltip slides up: "🪤 False Friend!"
T=600-1000: Tile performs 3D Y-axis flip (card flip):
            - Front: the word as the player saw it (e.g., "ACTUAL")
            - Back: the real meaning + the meaning they assumed
              "ACTUAL = current ≠ actual"
T=1000-1200: Tooltip updates: "In Spanish, 'actual' means 'current'"
T=1200+:   Tile flips back to normal. Player continues.

Total: 1200ms — deliberately longer than other feedback.
This moment should feel like a mini-revelation, not a punishment.
```

---

# PHASE 9: SOUND DESIGN BRIEF
## The Invisible 20% That Makes It Addictive

### 9A. Sound Philosophy

TutorLingua games should be **100% playable with sound off** (Telegram culture = phone on silent). But WITH sound, the experience should be meaningfully richer.

Sound should be:
- **Organic, not electronic.** Wood taps, soft chimes, muted brass — not 8-bit bleeps
- **Spatial.** Sounds should feel like they come from the tile you tapped, not from a speaker
- **Musical.** Correct answers should build toward a chord. The last correct answer in a game should resolve the chord. Music theory = satisfaction theory.
- **Language-flavoured.** Spanish games: Spanish guitar plucks. French: soft accordion notes. German: clean piano. Italian: mandolin touches. Subtle, not stereotype.

### 9B. Sound Palette

| Event | Sound | Duration | Character |
|-------|-------|----------|-----------|
| Tile tap | Soft wood knock | 60ms | Warm, tactile |
| Tile select | Higher-pitched wood tap + subtle harmonic | 80ms | Confirmatory |
| Wrong guess | Muted bass thud + soft dissonance | 200ms | Not punishing — just "not quite" |
| Correct group | Ascending 4-note chord (builds per group) | 400ms | Group 1: root. Group 2: +3rd. Group 3: +5th. Group 4: full resolution |
| False Friend | Playful "boing" + descending chromatic | 300ms | Comedic, not shaming |
| Word found (Strands) | Crystalline chime + sustain | 300ms | Ethereal, glowing |
| Pangram/Spangram | Full chord stab + shimmer trail | 600ms | Triumphant |
| Streak milestone | Short brass fanfare + crowd murmur | 800ms | Achievement |
| Timer warning | Heartbeat-like bass drum | 1000ms loop | Primal tension |
| Game complete | Full chord resolution + gentle applause | 1200ms | Satisfaction |
| Share card | Camera shutter + subtle whoosh | 200ms | "Captured" |

### 9C. Music Theory in Game Audio

**The chord-building system for Connections:**
- Category 1 solved: Root note (e.g., C)
- Category 2 solved: Add 3rd (C + E)
- Category 3 solved: Add 5th (C + E + G)
- Category 4 solved: Full resolution (C + E + G + octave C)

This means: **the game literally sounds better the more you play.** The first solve feels incomplete (musically). The last solve feels like arriving home. This is subliminal — players won't consciously notice, but they'll feel the satisfaction is deepening.

**Per-language key signatures:**
- Spanish: A minor (passionate, flamenco-adjacent)
- French: Bb major (warm, romantic)
- German: C major (clean, precise)
- Italian: D major (bright, operatic)
- Portuguese: E minor (melancholic, saudade)

---

# PHASE 10: SHARE CARD SYSTEM
## The Viral Artefact

### 10A. Share Card Design Philosophy

The share card is not an afterthought. It's the **most important design deliverable in the entire project.** Here's why:

- It's the ONLY part of your game that non-players see
- It needs to be instantly readable in a Telegram chat bubble
- It needs to create envy/curiosity in 2 seconds flat
- It needs to contain enough info to flex, but not enough to spoil
- It IS your acquisition channel

**The Wordle standard:** Wordle's emoji grid is arguably the most viral share card ever designed. 1.2 million shares on Twitter in 13 days. It worked because:
1. Spoiler-free (no answer revealed)
2. Visually distinctive (emoji blocks)
3. Platform-native (just text — works everywhere)
4. Performance-revealing (shows your path to the answer)
5. Puzzle-numbered (creates shared experience: "Did you get #196?")

### 10B. Share Card Specs Per Game

#### Lingua Connections Share Card
```
🟨🟩🟦🟪   Lingua Connections 🇪🇸 #47
🟨🟨🟨🟨   ████████████████
🟩🟩🟩🟩   Solved in 3:42
🟦🟦🟦🟦   1 mistake · 🪤 2 False Friends
🟪🟪🟪🟪   tutorlingua.co/play
```
- **Format:** Text-emoji (works in any chat, even without rendering)
- **Grid colours show solve ORDER** (not which category is which)
- **False Friend counter** is unique to TutorLingua — creates curiosity
- **Deep link** goes to today's puzzle

#### Lingua Strands Share Card
```
Lingua Strands 🇫🇷 #22
🍳 En la cocina

[Grid image with glowing paths on dark background]

7/7 theme words · 2 hints used
👻 3 ghost words found
tutorlingua.co/play
```
- **Format:** Image (the glowing grid paths are visually stunning)
- **The image IS the share mechanic** — people share it because it looks cool, not just to brag
- Generated client-side using Canvas API

#### Spell Cast Share Card
```
Spell Cast 🇩🇪 #31
🏆 Maestro · 187 points
Found 23 words (3 rare!)
🌟 SCHÜLER (pangram!)
tutorlingua.co/play
```
- **Format:** Text-emoji
- **Pangram highlight** creates "can you find it?" curiosity

#### Speed Clash Share Card
```
⚔️ Speed Clash 🇪🇸
┃████████████████┃ Troy: 9/10 · 47s
┃███████████░░░░░┃ Ana:  7/10 · 52s

🏆 Troy wins!
Lost time on: Subjunctive Verbs 😅
tutorlingua.co/challenge/abc123
```
- **Format:** Text (the progress bars are just block chars)
- **"Lost time on" creates a learning hook** — friends see what you're weak at
- **Challenge link** lets the recipient play the same set

#### Daily Decode Share Card
```
📖 Daily Decode 🇪🇸 Ch.12
"La Casa Misteriosa"

████ decoded ████
███░ decoded ░███

4/5 · B2 Level · 🔥 12-day streak
tutorlingua.co/play
```
- **Format:** Text with visual "glitch" effect (filled vs empty blocks)
- **CEFR level** is the flex — "I'm B2, what are you?"
- **Streak** compounds the flex

### 10C. Share Card Technical Implementation

```typescript
// Share via Telegram native API
function shareResult(gameType: string, result: GameResult) {
  const card = generateShareCard(gameType, result);
  
  // Use Telegram native share (not clipboard)
  Telegram.WebApp.switchInlineQuery(card.text, ['users', 'groups', 'channels']);
  
  // Haptic feedback
  Telegram.WebApp.HapticFeedback.impactOccurred('light');
}

// For image-based share cards (Strands)
async function shareImageResult(gameType: string, result: GameResult) {
  const canvas = await renderShareImage(result);
  const blob = await canvas.toBlob('image/png');
  
  // Use Telegram's shareMessage API (Bot API 8.0+)
  // Requires server-side PreparedInlineMessage
  await api.shareStrandsResult(result, blob);
}
```

### 10D. Share Triggers

Don't just put a "Share" button at the end. Create **multiple natural share moments:**

| Trigger | When | What Gets Shared |
|---------|------|-----------------|
| Game complete | Always | Full score card |
| False Friend moment | During game | "I just fell for [word]! 🪤" — mini share |
| Streak milestone | 7, 14, 30, 100 days | Streak badge image |
| CEFR level up | On assessment | "I just reached B2 in Spanish!" |
| Challenge sent | Speed Clash | Direct challenge link to specific friend |
| Challenge won | Speed Clash | Victory card comparing scores |
| Pangram found | Spell Cast | "I found the pangram!" — instant brag |
| Perfect game | Any | Special "Perfect" share card variant (rare, prestigious) |

---

# IMPLEMENTATION PRIORITY

## What to Build First

**Week 1-2: Design System + Connections**
Connections is the anchor game. It has the highest viral potential (daily shared experience, NYT Connections familiarity), the False Friend mechanic (TutorLingua's signature), and the simplest technical implementation (grid of tiles). Ship this first.

**Week 3: Game Hub + Spell Cast**
Spell Cast is the second-most accessible game and exercises different skills (breadth vs. grouping). The honeycomb is visually distinctive.

**Week 4: Strands**
The visual showpiece. The glowing paths are the TikTok content. But the drag-to-select interaction is more complex — needs polish time.

**Week 5: Speed Clash + Daily Decode**
These require opponent matching (even if async) and content generation (story arcs). Ship last because they're the deepest retention plays, not the acquisition plays.

---

# APPENDIX: COMPETITIVE POSITIONING

## Where TutorLingua Sits in the Market

```
                    CRYPTO INCENTIVE
                         ↑
    Hamster Kombat ●     │     ● Notcoin
                         │
    XEmpire ●            │         ● Catizen
                         │
    ─────────────────────┼─────────────────── GAME DEPTH →
                         │
    Simple bots ●        │         ● TutorLingua
                         │              (HERE)
    Grammar bots ●       │     
                         │         ● NYT Games
                    NO INCENTIVE       (inspiration, not
                                        competitor — diff
                                        platform)
```

**TutorLingua's unique position:** Deep game mechanics (NYT-level) WITHOUT crypto incentives, ON Telegram. Nobody is here. The crypto games are shallow (tap-to-earn). The word games are on other platforms (NYT, Wordle). TutorLingua brings NYT-quality word games to Telegram's distribution engine.

**The bet:** Language learning provides enough intrinsic motivation (self-improvement + social competition) to replace crypto incentives as the viral driver. The share cards, streaks, and CEFR levels ARE the incentive layer.

---

*This document is the foundation. Every screen, every interaction, every pixel should be traceable back to a decision made here. If a design choice can't be justified by this bible, it shouldn't exist.*

**Next step:** Take this to Figma. Start with Lingua Connections. Dark canvas, 4×4 grid, the False Friend flip. Make it feel like it belongs on Telegram and plays like it was made by Supercell.*