# TutorLingua Games — Complete Design & Build Specification

> **Purpose:** This document describes every game, system, screen, and mechanic in the TutorLingua games suite in enough detail for a game designer to replicate the build exactly as-is.

---

## Table of Contents

1. [Platform & Architecture Overview](#1-platform--architecture-overview)
2. [Games Hub (Home Screen)](#2-games-hub-home-screen)
3. [Shared Engine & Systems](#3-shared-engine--systems)
4. [V3 Games (Primary — Free)](#4-v3-games-primary--free)
   - 4.1 Byte Choice
   - 4.2 Pixel Pairs
   - 4.3 Relay Sprint
5. [V1 Games (Unlockable)](#5-v1-games-unlockable)
   - 5.1 Connections
   - 5.2 Daily Decode
   - 5.3 Word Ladder
   - 5.4 Synonym Spiral
   - 5.5 Missing Piece
   - 5.6 Odd One Out
   - 5.7 Neon Intercept
6. [Coming Soon (Placeholder)](#6-coming-soon-placeholder)
7. [Token Economy & Unlock System](#7-token-economy--unlock-system)
8. [Streak System](#8-streak-system)
9. [Adaptive Difficulty Engine](#9-adaptive-difficulty-engine)
10. [Cognitive Governor](#10-cognitive-governor)
11. [Smart Question Picker (Spaced Repetition)](#11-smart-question-picker-spaced-repetition)
12. [Haptics & Juice](#12-haptics--juice)
13. [Sharing & Challenges](#13-sharing--challenges)
14. [Telemetry & API](#14-telemetry--api)
15. [Design System & Visual Language](#15-design-system--visual-language)
16. [Supported Languages](#16-supported-languages)
17. [Telegram Mini App Integration](#17-telegram-mini-app-integration)

---

## 1. Platform & Architecture Overview

| Attribute | Value |
|-----------|-------|
| **Framework** | Next.js 14+ (App Router) |
| **Rendering** | Client-side (`"use client"`) — all game components are interactive React |
| **Animations** | Framer Motion (v1 games), GSAP (GameShell entrance), CSS Modules (v3 games) |
| **Physics Engine** | Phaser 3 (Relay Sprint only — used for the falling-word scene) |
| **State Management** | React hooks (useState/useRef/useEffect) — no external state library |
| **Persistence** | localStorage (tokens, streaks, progress, word tracker) — anonymous by default |
| **Backend** | Next.js API routes → Supabase (game runs, challenges, leaderboard) |
| **Deployment** | Vercel |
| **Hosting** | `tutorlingua.co/games` |

### File Structure

```
app/(public)/games/
├── page.tsx                    → Games Hub
├── layout.tsx                  → Shared layout (fonts, metadata)
├── byte-choice/page.tsx        → Byte Choice game page
├── pixel-pairs/page.tsx        → Pixel Pairs game page
├── relay-sprint/page.tsx       → Relay Sprint game page
├── connections/page.tsx        → Connections game page
├── daily-decode/page.tsx       → Daily Decode game page
├── word-ladder/page.tsx        → Word Ladder game page
├── synonym-spiral/page.tsx     → Synonym Spiral game page
├── missing-piece/page.tsx      → Missing Piece game page
├── odd-one-out/page.tsx        → Odd One Out game page
└── neon-intercept/page.tsx     → Neon Intercept game page

components/
├── games/engine/               → Shared UI components (GameHub, GameShell, etc.)
├── games/[game-name]/          → V1 game-specific components
└── games-v3/                   → V3 game-specific components + core shared pieces

lib/games/
├── tokens.ts                   → Token economy
├── streaks.ts                  → Streak tracking
├── progress.ts                 → Daily progress tracking
├── haptics.ts                  → Haptic feedback
├── juice.ts                    → Confetti and visual juice
├── scoring.ts                  → Universal scoring + weakness diagnosis
├── springs.ts                  → Animation spring configurations
├── language-utils.ts           → Language labels, flags, RTL detection
├── v3/adaptation/              → Adaptive difficulty engine + cognitive governor
├── v3/data/                    → Word pools, puzzle generators
├── v3/progress/                → Smart picker (spaced repetition), word tracker
├── v3/share/                   → Challenge link creation
└── runtime/                    → Game run lifecycle (start/complete API calls)
```

---

## 2. Games Hub (Home Screen)

**Route:** `/games`  
**Component:** `GameHub.tsx`

### Layout

Full-screen scrollable page. Background: `#F7F3EE` (warm off-white). Max width `760px`, centred.

### Sections (top to bottom)

#### 2.1 Header
- **Title:** "Language Games" in Mansalva cursive font, 32px, `#1E2B36`
- **Streak fire icon** top-right — shows current streak count with flame SVG. Glows (text-shadow pulse) at streak ≥ 3
- **Subtext:** "Play daily. Build vocabulary. Track your streak." — 14px, `#3E4E5C`
- **Progress bar:** "Today's progress X/Y" where Y = number of live games. Blue-to-green gradient fill. 6px height, fully rounded

#### 2.2 Token Balance Bar
Dark card (`#1E2B36` → `#2A3A48` gradient). Contains:
- Gold coin SVG icon (pulsing animation, 2s loop)
- Balance in gold `#F5D76E`, JetBrains Mono font, 22px
- "+15 per share" badge (amber pill, top-right)
- **Next unlock progress bar:** shows closest locked game name + cost ratio (e.g. "32/60") with amber fill bar
- **Earn hints row:** 4 inline items — Play +10, Master +20, Share +15, Email +50

#### 2.3 Email Signup Banner
- Rounded card with gradient border. Prompt: "Add your email for +50 tokens"
- Email input field + "Claim" gold button
- After submission → green success card: "+50 tokens earned!"
- One-time bonus (persisted in localStorage)

#### 2.4 Game Grid
- CSS Grid: `repeat(auto-fill, minmax(160px, 1fr))`, gap 12px
- Each card is exactly **200px tall**, 16px border radius

**Card states:**

| State | Appearance |
|-------|-----------|
| **Free/Unlocked** | White background, full opacity, game icon, name, description, shimmer overlay animation |
| **Locked (can afford)** | `#F5F0EA` background, 75% opacity, desaturated. Gold "Unlock for X" button with coin icon |
| **Locked (can't afford)** | Same as above but dashed border, lock icon, "X more" text |
| **Coming Soon** | `#F2EDE7` background, 55% opacity, heavy desaturation, "COMING SOON" label |

Each card shows:
- **Icon:** 48×48 custom SVG per game (from `GameIcons.tsx`)
- **Name:** 15px, Plus Jakarta Sans, font-weight 800
- **Description:** 11px, font-weight 500
- **Status dot:** green (mastered), game colour (played), outline (unplayed) — only shown when unlocked and played

Card press effect: scale(0.97) on pointer down.

#### 2.5 Prizes & Rewards Section
White card with all 4 prize tiers listed vertically:
- 🌱 Word Wanderer (50 tokens) — "Unlock your first bonus game"
- 🧭 Phrase Pioneer (150 tokens) — "Exclusive word pack + avatar badge"
- 🚀 Vocab Voyager (300 tokens) — "Early access to new games"
- 👑 Lingua Legend (500 tokens) — "Custom challenge creator + leaderboard crown"

Each tier shows: emoji, name, description, progress bar (for next tier), "✓ Unlocked" badge (for reached tiers)

### Game Definitions (all 14)

| # | Slug | Name | Description | Colour | Status |
|---|------|------|-------------|--------|--------|
| 1 | `byte-choice` | Byte Choice | Translate words against the clock | `#24577A` | **Free** |
| 2 | `pixel-pairs` | Pixel Pairs | Flip cards and match word pairs | `#1A7A6A` | **Free** |
| 3 | `relay-sprint` | Relay Sprint | Pick the right translation before it drops | `#304B78` | **Free** |
| 4 | `connections` | Connections | Group four words that share a hidden link | `#D4A843` | Unlock: 30 |
| 5 | `daily-decode` | Daily Decode | Crack the cipher to reveal a quote | `#D36135` | Unlock: 30 |
| 6 | `word-ladder` | Word Ladder | Change one letter at a time to reach the target | `#3E5641` | Unlock: 60 |
| 7 | `synonym-spiral` | Synonym Spiral | Climb the tower by finding synonyms | `#8B5CB5` | Unlock: 60 |
| 8 | `missing-piece` | Missing Piece | Fill the gap in the sentence | `#5A8AB5` | Unlock: 100 |
| 9 | `odd-one-out` | Odd One Out | Find the word that doesn't belong | `#D36135` | Unlock: 100 |
| 10 | `neon-intercept` | Neon Intercept | Intercept translations in neon lanes | `#D36135` | Unlock: 150 |
| 11 | `grammar-rush` | Grammar Rush | Race through grammar challenges | `#B0A99F` | Coming Soon |
| 12 | `accent-match` | Accent Match | Match words to their correct pronunciation | `#B0A99F` | Coming Soon |
| 13 | `idiom-hunt` | Idiom Hunt | Discover hidden idioms in the word grid | `#B0A99F` | Coming Soon |
| 14 | `tense-twist` | Tense Twist | Transform sentences between tenses | `#B0A99F` | Coming Soon |

---

## 3. Shared Engine & Systems

### 3.1 GameShell (Wrapper for every game)

Every game page is wrapped in `<GameShell>`. It provides:

- **Top nav bar** (web): back arrow "← Games" link to hub. Hidden in Telegram (replaced by Telegram BackButton)
- **Game header:** Game name (Mansalva cursive, 2xl for v3; lg for v1) + metadata row: `#puzzleNumber · Language · M:SS timer`
- **Timer:** Counts up from 0. Stops when `isComplete=true`
- **Content area:** `<main>` with bottom safe-area padding for mobile
- **GSAP entrance animation:** header slides down from -20px, content slides up from +30px
- **RTL support:** `dir="rtl"` when language is RTL
- **Telegram integration:** shows Telegram BackButton, enables/disables closing confirmation during active gameplay

**Fonts:**
- V3 theme (Neon Intercept): Fraunces (serif display), Manrope (UI)
- V3 Mansalva theme (Byte Choice, Pixel Pairs, Relay Sprint): Mansalva cursive header
- V1 games: Mansalva cursive header, Plus Jakarta Sans body

**Background:**
- V3 games: radial gradient `(120% 80% at 50% -10%, rgba(77,120,151,0.14), transparent 55%), #f7f3ee`
- V1 games: default (controlled by game CSS variables)

### 3.2 GameResultCard

Shared end-of-game card used by all v1 games:
- Spring entrance animation (scale 0.92 → 1, y 20 → 0, 150ms delay)
- Large emoji at top (4xl)
- Heading in Mansalva cursive (2xl)
- Subtext (score summary)
- Optional time display (M:SS)
- Slot for children (emoji grids, round breakdowns)

### 3.3 GameButton

Shared styled button component used throughout. Consistent touch targets, press feedback.

### 3.4 GameProgressBar

Segmented progress indicator showing current position in a multi-round game (e.g. 3/10 sentences completed).

### 3.5 LanguageSelector

- **Telegram:** Renders as a Telegram-native segmented control
- **Web:** Pill buttons in a rounded container (`#F5EDE8` background)
- Minimum touch target: 44px height
- Shows flag + language name per option

### 3.6 HowToPlay

Expandable instructions component shown at the start of each game.

---

## 4. V3 Games (Primary — Free)

These are the flagship games with the full v3 engine: adaptive difficulty, cognitive governor, spaced repetition, CEFR placement, challenge links, and telemetry.

### 4.1 Byte Choice

**Slug:** `byte-choice`  
**Mechanic:** Speed-based multiple-choice translation quiz  
**URL Params:** `?lang=en|es|fr|de|it|pt`, `?mode=daily|practice`, `?cefr=A1|A2|B1|B2`, `?challenge=CODE`, `?seed=N`, `?di=N`

#### Flow (Stages)

1. **Language Select** → Full-screen language picker (6 options with flags). Skipped if `?lang=` is set or a stored preference exists
2. **Placement Test** → 5 quick questions spanning A1→B2 to calibrate difficulty. Shows "Let's find your level!" intro, animated testing phase, then result card ("Your level: B1 — Intermediate"). Skipped on repeat visits (stored level)
3. **Email Capture** → Optional email input for progress saving. "Enter to save progress" with skip option. Skipped if already provided
4. **Countdown** → 3-2-1 animated countdown (scale + opacity). 700ms per step
5. **Active Gameplay** → The actual quiz
6. **Summary** → Results screen with share card

#### Gameplay Mechanics

- **10 questions per round**
- **8-second timer per question** — amber progress bar that shrinks. Turns red in final 3 seconds
- **3 options per question** — one correct translation, two distractors
- Distractors are chosen from the same word pool (visually/phonetically similar words to increase difficulty)
- **Feedback:** Correct = green highlight, 400ms delay. Wrong = red highlight on chosen + green on correct, 600ms delay
- **Scoring:** Streak counter visible. Difficulty adjusts after each answer (see §9)
- **Question source:** From language-pair word pools (EN→ES, EN→FR, etc.) with 100+ words per pool, tagged by CEFR band (A1/A2/B1/B2)
- **Smart selection:** Spaced repetition picker (§11) prioritises words the player got wrong before, introduces new words, and reduces mastered words

#### Word Pool Structure

Each word pool entry:
```
{
  prompt: "window"          // The word to translate
  correct: "ventana"        // Correct translation
  distractors: ["vecino", "verano"]  // Wrong options (2)
  band: "A1"               // CEFR level
}
```

Pools exist for: EN→ES, ES→EN, EN→FR, FR→EN, EN→DE, DE→EN, EN→IT, IT→EN, EN→PT, PT→EN

#### Summary Screen

- Score fraction (e.g. "8/10")
- Accuracy percentage
- Time taken
- Streak bonus display
- **Share Panel:** "Challenge a friend" — generates a shareable URL with the same seed + difficulty. Copy link button. Creates a challenge via API
- **"Stumble" text:** If the player missed certain words, shows a personalised callout (e.g. "You stumbled on: ventana, puente")
- Play Again button

#### Visual Design

- CSS Modules (`ByteChoiceGame.module.css`)
- Amber/gold accent colour scheme
- Dark header bar for timer
- Card-style option buttons with rounded corners
- Animated transitions between questions (slide/fade)

---

### 4.2 Pixel Pairs

**Slug:** `pixel-pairs`  
**Mechanic:** Memory card matching — flip cards to find translation pairs  
**URL Params:** `?lang=en|es`, `?mode=daily|practice`, `?challenge=CODE`, `?seed=N`, `?di=N`

#### Flow (Stages)

1. **Countdown** → 3-2-1 countdown
2. **Active Gameplay** → Card matching board
3. **Summary** → Results + share

#### Gameplay Mechanics

- **Grid layout** based on difficulty:
  - 6 pairs → 3×4 grid (beginner)
  - 8 pairs → 4×4 grid (standard — default)
  - 10 pairs → 4×5 grid (advanced)
- **30 word pairs** available per language (EN↔ES). Each pair = source word + translation
- Cards start face-down. Tap to flip. Two flipped cards either:
  - **Match** (same pairId, different kind) → both stay face-up, green matched state, 400ms delay
  - **Mismatch** → both flip back face-down after 800ms, cards briefly flash red
- **Move counter** tracks total flips (efficiency metric)
- **Streak tracking** — consecutive correct matches
- Each card has a `kind: "left" | "right"` — left is source language, right is target language
- Cards are shuffled randomly using a seeded RNG
- Cognitive governor adjusts visual feedback intensity based on performance

#### Word Pair Examples (EN→ES)
```
water ↔ agua, window ↔ ventana, book ↔ libro,
garden ↔ jardín, cat ↔ gato, dog ↔ perro,
house ↔ casa, sun ↔ sol, moon ↔ luna, etc.
```

#### Visual Design

- CSS Modules (`PixelPairsGame.module.css`)
- Amber/gold colour scheme (matches Byte Choice)
- Cards have a face-down state (patterned back) and face-up state (word visible)
- Matched cards get a green tint and slight scale-down
- Smooth flip animation (CSS transform rotateY)

---

### 4.3 Relay Sprint

**Slug:** `relay-sprint`  
**Mechanic:** Words fall from the top; catch the correct translation in one of 3 "cup" catchers at the bottom  
**URL Params:** `?lang=en|es`, `?mode=daily|practice`, `?challenge=CODE`, `?seed=N`, `?di=N`

#### Flow (Stages)

1. **Countdown** → 3-2-1
2. **Active Gameplay** → Phaser scene running
3. **Summary** → Results + share

#### Gameplay Mechanics

- **16 waves** per round
- **3 lives** — lose one per wrong answer or timeout
- Each wave: a **clue word** is shown prominently at the top. 3 answer cups are positioned horizontally at the bottom
- A word "drops" (falls) from the top — the player must tap the correct cup/catcher before it lands
- **Speed increases** as the game progresses (fall speed controlled by `speedMs` in HUD state, starts at ~2600ms)
- **Streak/combo system** — consecutive correct answers increase combo multiplier
- **Scoring:** Points per correct catch, bonus for streaks
- On correct: green flash on the screen border. On wrong: red flash
- Game ends when all 16 waves are complete or lives reach 0
- Audio toggle available (sound on/off)

#### Word Data Structure (35 rows per language)
```
["stair", "escalera", "estrella", "espejo"]
// [clue, correct, distractor1, distractor2]
```

Distractors are phonetically/visually similar to increase difficulty (e.g. "escalera" vs "estrella" vs "espejo").

#### Technical Implementation

- Uses **Phaser 3** game engine for the falling-word scene (via `PhaserHost` component and `relay-sprint-scene.ts`)
- HUD state managed in React, rendered as overlay on top of Phaser canvas
- HUD shows: score, streak, lives (hearts), clue word, wave counter, speed indicator
- Cognitive governor affects `paceMultiplier` (speeds up or slows down)

#### Visual Design

- CSS Modules (`RelaySprintGame.module.css`)
- Dark arcade theme
- 3 horizontal "cup" catchers at the bottom
- Word falls and visually lands inside the cup
- Screen-edge flash effects (green/red) on answer

---

## 5. V1 Games (Unlockable)

These use the v1 engine: Framer Motion animations, GameShell wrapper, shared GameResultCard, Tailwind CSS. No adaptive difficulty or cognitive governor.

### 5.1 Connections

**Slug:** `connections`  
**Mechanic:** NYT Connections-style — group 16 words into 4 categories of 4  
**Unlock Cost:** 30 tokens

#### Gameplay

- **16 words** displayed in a 4×4 grid (shuffled)
- Player selects exactly **4 words** they believe share a category, then submits
- **4 categories** per puzzle, each with a difficulty colour:
  - 🟨 Yellow (easy)
  - 🟩 Green (medium)
  - 🟦 Blue (hard)
  - 🟪 Purple (hardest)
- **Max 4 mistakes** allowed
- On correct group: category banner reveals with animation + colour. Words collapse out of the grid
- On wrong group: mistake counter increments, shake animation
- **"Vibe Clue" banner:** Optional hint banner shown above the grid
- **False friends support:** Words that look similar between languages but have different meanings — tracked and highlighted
- Victory confetti (canvas-confetti) on completing all 4 categories
- Share text generates an emoji grid (coloured squares per row representing guess order)

#### Puzzle Data

Static puzzles per language (EN, ES, FR, DE). Each puzzle:
```
{
  categories: [
    { name: "Category Name", words: ["w1","w2","w3","w4"], difficulty: "yellow" },
    ...
  ]
}
```

---

### 5.2 Daily Decode

**Slug:** `daily-decode`  
**Mechanic:** Cryptogram/cipher — decode a substitution cipher to reveal a quote  
**Unlock Cost:** 30 tokens

#### Gameplay

- A famous quote is encrypted using a substitution cipher (each letter replaced by another)
- **2 starter letters** are pre-revealed (the 2 most frequent letters in the text)
- Player taps a cipher letter → selects it → taps a keyboard letter to assign the mapping
- Alphabet keyboard shown below the cipher text. Used letters are dimmed
- **3 hints available** — each reveals one correct letter mapping
- Letters with accents are stripped for matching purposes (è → e)
- Correct assignments lock in place. Wrong mappings can be overwritten
- Game won when all mappings are correct
- **CipherText component** shows the encoded text with colour-coded letters:
  - Pre-revealed (starter): greyed out
  - Player-mapped: highlighted
  - Selected: active colour
  - Unmapped: default
- **QuoteReveal** component shows the decoded quote with attribution when won

#### Share Text
Generates an emoji grid showing how many hints were used and time taken.

---

### 5.3 Word Ladder

**Slug:** `word-ladder`  
**Mechanic:** Change one letter at a time to transform a start word into a target word  
**Unlock Cost:** 60 tokens

#### Gameplay

- Given a **start word** and a **target word** (same length)
- Player types intermediate words, each differing by exactly 1 letter from the previous
- **StepChain component** shows the chain visually — each step in a vertical chain
- **Validation:** `validateStep()` checks the word differs by exactly 1 letter and is a valid word
- Game won when the target word is reached
- Optional: show hint (next correct word), show optimal path (shortest solution)
- Mistakes tracked (invalid words submitted)
- Victory confetti + score based on steps taken vs. optimal path

---

### 5.4 Synonym Spiral

**Slug:** `synonym-spiral`  
**Mechanic:** Climb a tower by finding progressively rarer synonyms  
**Unlock Cost:** 60 tokens

#### Gameplay

- **5 rounds**, each with a seed word
- **60 seconds per round** (countdown timer)
- Player types synonyms of the given word. Each correct synonym moves them up one "depth level" on a visual tower
- **Depth levels:** Each chain has a hierarchy of synonyms from common (depth 1) to rare (depth 5+)
- **SpiralTower component:** Vertical tower visualisation. Words stack on top of each other
- **DepthMeter component:** Shows current depth reached vs. max available
- **WordInput component:** Text input with submit. Shows feedback per submission
- Feedback types: ✅ success (new valid synonym), ❌ error (not a synonym), ⏭ skip (already used)
- **Between rounds:** RoundSummary shows depth reached for that round, words found
- Final score = average depth across all 5 rounds
- Share text shows depth reached per round with a visual bar

---

### 5.5 Missing Piece

**Slug:** `missing-piece`  
**Mechanic:** Fill-in-the-blank — choose the correct word to complete a sentence  
**Unlock Cost:** 100 tokens

#### Gameplay

- Series of sentences with a **gap** (missing word)
- **4 options** per sentence (one correct, three distractors)
- **3 lives** — lose one per wrong answer
- **SentenceDisplay component:** Shows the sentence with a highlighted blank where the answer goes
- **OptionButton component:** 4 buttons with states: default, correct (green), wrong (red), dimmed
- On correct: button turns green, gap fills in, brief delay, next sentence
- On wrong: chosen button turns red, correct button turns green, life lost, brief delay
- **ExplanationPanel:** After each answer, shows a brief grammar/vocabulary explanation of why the answer is correct
- **GameProgressBar:** Shows current position (e.g. sentence 4/10)
- Game ends when all sentences are answered or lives reach 0
- Final score = correct answers / total sentences

#### Puzzle Data

Per language, per CEFR level:
```
{
  sentence: "El gato está ___ la mesa",
  options: ["sobre", "bajo", "entre", "dentro"],
  correctIndex: 0,
  explanation: "'Sobre' means 'on' or 'on top of'"
}
```

---

### 5.6 Odd One Out

**Slug:** `odd-one-out`  
**Mechanic:** Find the word that doesn't belong in a group  
**Unlock Cost:** 100 tokens

#### Gameplay

- **10 rounds**
- Each round: **4 words** displayed as cards. 3 share a common theme, 1 is the odd one out
- **3 lives**
- **WordCard component:** Large tappable cards with states: default, correct (green), wrong (red)
- Tap the word you think doesn't belong
- On correct: card highlights green, others dim, explanation shown
- On wrong: chosen card highlights red, correct card highlights green, life lost
- **RoundResult component:** Shows explanation between rounds
- **GameProgressBar:** 10-step indicator
- Victory confetti at end if score ≥ 7/10

---

### 5.7 Neon Intercept

**Slug:** `neon-intercept`  
**Mechanic:** Lane-based arcade — intercept correct translations falling through neon lanes  
**Unlock Cost:** 150 tokens

#### Gameplay

- **90-second session** (countdown timer)
- **3 lives**
- **3 lanes** displayed vertically — words fall down the lanes
- A **clue word** is shown at the top. Player must tap the lane containing the correct translation
- **Speed escalation:** Words fall faster as the game progresses
- **Combo system:** Consecutive correct → combo multiplier (displayed prominently)
- **Boss waves:** Special waves with harder words (false friends) — announced with "BOSS WAVE" banner
- **False friend detection:** When a false friend appears, special visual treatment + haptic
- **Pause/resume:** Tapping a pause button freezes the game
- **Feedback states:** idle, correct (lane flashes green), wrong (lane flashes red), timeout (missed)

#### HUD Display
- Time remaining (countdown from 90s)
- Score (large, centre-top)
- Lives (heart icons)
- Combo counter (flashes on increase)
- Wave indicator
- Current clue word (large, prominent)

#### Localised UI

Full UI text translations in EN and ES:
- All labels, feedback messages, result screen text
- "Nice catch!", "Too slow", "Almost!", "Boss Wave", etc.

#### Results Screen
- Final score
- Accuracy percentage
- Max combo
- Hits / Total waves
- **Weakness diagnosis:** Analyses mistakes and identifies weak topic area (e.g. "You missed 3 in False Friends — practise focus")
- Missed words review (expandable list showing: word, expected answer, your pick)
- Share button + Play Again

---

## 6. Coming Soon (Placeholder)

These 4 games appear in the hub as greyed-out cards with "Coming Soon" labels. Not yet built.

| Game | Description |
|------|------------|
| **Grammar Rush** | Race through grammar challenges |
| **Accent Match** | Match words to their correct pronunciation |
| **Idiom Hunt** | Discover hidden idioms in the word grid |
| **Tense Twist** | Transform sentences between tenses |

They have unlock costs of 9999 (effectively un-unlockable until implemented).

---

## 7. Token Economy & Unlock System

### Earning Tokens

| Action | Reward |
|--------|--------|
| Complete any game | +10 tokens |
| Master a game (≥90% or won) | +20 tokens |
| Share a game result | +15 tokens (once per game per day) |
| Add email (one-time) | +50 tokens |
| Daily streak bonus | +5 × streak day count |

### Spending Tokens

| Unlock Tier | Games | Cost per Game |
|-------------|-------|--------------|
| Free | Byte Choice, Pixel Pairs, Relay Sprint | 0 |
| Tier 1 | Connections, Daily Decode | 30 each |
| Tier 2 | Word Ladder, Synonym Spiral | 60 each |
| Tier 3 | Missing Piece, Odd One Out | 100 each |
| Tier 4 | Neon Intercept | 150 |

### Prize Tiers (Lifetime Tokens Earned)

| Threshold | Name | Emoji | Reward |
|-----------|------|-------|--------|
| 50 | Word Wanderer | 🌱 | Unlock your first bonus game |
| 150 | Phrase Pioneer | 🧭 | Exclusive word pack + avatar badge |
| 300 | Vocab Voyager | 🚀 | Early access to new games |
| 500 | Lingua Legend | 👑 | Custom challenge creator + leaderboard crown |

### Storage

All token state is in `localStorage` under key `tl-game-tokens`:
```json
{
  "totalEarned": 230,
  "balance": 80,
  "unlockedGames": ["byte-choice", "pixel-pairs", "relay-sprint", "connections", "daily-decode"],
  "shareLog": { "byte-choice": "2026-02-21" },
  "emailClaimed": true
}
```

Free games are always force-included in `unlockedGames` on load.

---

## 8. Streak System

### How It Works

- **Storage key:** `tl-game-streaks` in localStorage
- Playing any game on a given day counts as activity
- If you played yesterday → streak increments
- If you missed a day → streak resets to 1
- Multiple games on the same day don't double-count the streak

### Streak Data

```json
{
  "current": 7,
  "longest": 14,
  "lastPlayedDate": "2026-02-21",
  "totalGamesPlayed": 42,
  "gamesPlayedToday": ["byte-choice", "connections"],
  "streakPoints": 156
}
```

### Streak Tiers

| Days | Name | Emoji | Perk |
|------|------|-------|------|
| 1 | Started | ✨ | — |
| 3 | Building | ⚡ | — |
| 7 | Committed | 🔥 | Themed word pack unlocked |
| 14 | Dedicated | 💎 | 10-min tutor conversation |
| 30 | Legend | 👑 | Free level assessment session |

Streak points: each play awards `min(streakDays, 10)` points.

---

## 9. Adaptive Difficulty Engine

*V3 games only (Byte Choice, Pixel Pairs, Relay Sprint)*

### CEFR → Difficulty Mapping

| CEFR Level | Base Difficulty |
|------------|----------------|
| A1 | 20 |
| A2 | 35 |
| B1 | 50 |
| B2 | 65 |
| C1 | 80 |
| C2 | 90 |

Difficulty range: 10–96.

### Calibration (Placement Test)

Takes calibration samples (response time, correctness, hint usage) and adjusts baseline:
- Correctness ≥ 84% → +3
- Correctness ≤ 54% → −3
- Avg response < 1500ms → +2
- Avg response > 2600ms → −2
- Hint rate ≥ 50% → −2
- Total delta capped at ±8

### Per-Question Update

After each answer:
- Correct + fast (<1300ms) → +2
- Correct + medium (<1900ms) → +1
- Correct + streak ≥ 4 → additional +1
- Wrong + slow (>2400ms) → −3
- Wrong + normal → −2
- Delta capped at ±3 per question

### Difficulty Tiers (for telemetry)

| Tier | Description |
|------|------------|
| onboarding | Initial calibration phase |
| foundation | Base difficulty level |
| pressure | Elevated challenge |
| mastery | Near-peak difficulty |

### "Aha Spike" Detection

Triggered when: correct answer + response < 1500ms + difficulty ≥ 65. Indicates the player is "in the zone." Logged to telemetry.

---

## 10. Cognitive Governor

*V3 games only*

Monitors recent performance and adjusts the game's intensity:

### States

| State | Trigger | Effects |
|-------|---------|---------|
| **Focused** | ≥2 recent errors OR avg response > 2600ms | Decor opacity 50%, audio low-pass 60%, pace ×0.92 (slower) |
| **Balanced** | Default state | Decor opacity 82%, audio low-pass 85%, pace ×1.0 |
| **Boosted** | Streak ≥ 4 AND avg response < 1600ms | Decor opacity 100%, audio low-pass 100%, pace ×1.05 (faster) |

Effects:
- **decorOpacity:** Controls visual decoration intensity (backgrounds, particles). Reduced when struggling to minimise distraction
- **audioLowPass:** Filters audio complexity. Lower = calmer soundscape when struggling
- **paceMultiplier:** Adjusts game speed. <1 = slower (helping), >1 = faster (challenging)

---

## 11. Smart Question Picker (Spaced Repetition)

*Used by Byte Choice (and extensible to other v3 games)*

### Word Progress Tracking

Each word the player encounters is tracked in localStorage:
```json
{
  "en:window": {
    "seen": 5,
    "correct": 4,
    "wrong": 1,
    "mastery": 3,
    "lastSeen": 1708500000000,
    "lastWrong": 1708400000000
  }
}
```

Mastery levels: 0 (new), 1 (seen), 2 (learning), 3 (familiar), 4 (mastered)

### Selection Algorithm

1. **Filter** pool by target CEFR band (with adjacent band fallback if insufficient words)
2. **Deduplicate** by prompt
3. **Categorise** every word: `wrongBefore` / `unseen` / `rest`
4. **Guarantee composition:** ≥30% from words previously gotten wrong, ≥20% new unseen words
5. **Weight remaining slots** using spaced repetition scores:
   - Never seen → weight 1.0
   - Wrong recently (< 24h) → weight 3.0 (prioritised)
   - Wrong older, not mastered → weight 2.0
   - Learning (mastery 2) → weight 1.5
   - Familiar (mastery 3) → weight 0.5
   - Mastered (mastery 4) → weight 0.2 (rare)
6. **Weighted random pick** from remaining candidates
7. **Shuffle** final selection so guaranteed slots aren't always first

---

## 12. Haptics & Juice

### Haptic Patterns

Haptics fire via Telegram's native HapticFeedback API (when in Telegram) or `navigator.vibrate` fallback:

| Pattern | Telegram API | Vibrate Fallback (ms) | Used For |
|---------|-------------|----------------------|----------|
| `tap` | selectionChanged() | 10 | Button press, selection |
| `success` | notificationOccurred('success') | [20, 30, 20] | Correct answer |
| `error` | notificationOccurred('error') | [50, 30, 50] | Wrong answer |
| `gameOver` | success × 2 (120ms gap) | [100, 50, 200] | Game end |
| `streak` | notificationOccurred('success') | [10, 20, 10, 20, 50] | Streak milestone |
| `pangram` | impactOccurred('heavy') + success (80ms gap) | [40, 20, 40, 20, 80] | Special word found |
| `falseFriend` | notificationOccurred('warning') | [30, 40, 30] | False friend encountered |
| `streakMilestone` | impactOccurred('heavy') × 3 (100ms gaps) | [15, 15, 15, 15, 15, 15] | Big streak celebration |
| `heartbeat` | impactOccurred('soft') | [20, 80, 20] | Timer running low |
| `shareGenerated` | impactOccurred('light') | 8 | Share card ready |

### Visual Juice

- **Confetti:** `canvas-confetti` library, lazy-loaded. Fired on victory with configurable params (particle count, spread, velocity, gravity)
- **Spring animations** (Framer Motion):
  - `snappy` — stiffness 400, damping 30 (taps, buttons)
  - `standard` — stiffness 300, damping 25 (card reveals, transitions)
  - `gentle` — stiffness 200, damping 22 (result cards, victory screens)
- **GSAP:** Used for GameShell entrance animations
- **Shimmer overlay:** Hub game cards have a subtle left-to-right shimmer animation (4s loop) using CSS `background-position` animation

---

## 13. Sharing & Challenges

### Share Flow (V1 Games)

Each v1 game generates a share text with emoji grids. Example (Connections):
```
TutorLingua Connections #42 🇪🇸
🟩🟩🟩🟩
🟨🟨🟨🟨
🟦🟦🟪🟦
🟪🟪🟪🟪
3/4 mistakes
tutorlingua.co/games/connections
```

Share is triggered via `navigator.share()` (mobile) or clipboard copy fallback.

### Challenge Links (V3 Games)

V3 games support "Challenge a friend" — generates a unique URL that replays the exact same puzzle:

1. Player completes a game
2. Taps "Challenge a friend" on the summary screen
3. System calls `POST /api/games/challenges/create` with:
   - `gameSlug`, `seed`, `difficultyBand`, `mode`, `uiVersion`, `curveVersion`
   - Optional `stumbleText` (words the player got wrong)
4. API returns a short code + URL: `tutorlingua.co/games/byte-choice?challenge=ABC123`
5. When a friend opens the link, the game loads with the same seed and difficulty, creating an identical puzzle

### Share Panel Component

`SharePanel.tsx` — used by all v3 games at the summary stage:
- "Challenge a friend" heading
- Generated share text (score, stumble words)
- Copy link button (copies challenge URL to clipboard)
- Direct share button (native share API)
- Shows "+15 tokens" bonus indicator

---

## 14. Telemetry & API

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/games/runs/start` | POST | Log game start → returns `runId` |
| `/api/games/runs/complete` | POST | Log game completion with full metrics |
| `/api/games/challenges/create` | POST | Create a shareable challenge |
| `/api/games/challenges/[code]` | GET | Retrieve challenge data by code |
| `/api/games/leaderboard` | GET | Fetch leaderboard data |
| `/api/games/meta/progress` | POST | Sync progress for authenticated users |
| `/api/games/meta/profile` | GET/POST | User profile (email, display name) |
| `/api/games/meta/token-spend` | POST | Log token spending events |
| `/api/games/profile` | GET | Public profile data |

### Game Run Start Payload

```typescript
{
  gameSlug: string
  mode: "daily" | "practice" | "challenge" | "ranked"
  language: "en" | "es" | "fr" | "de" | "it" | "pt"
  deviceClass: "mobile" | "desktop" | "telegram"
  gameVersion: "v3"
  startingCefr: "A1" | "A2" | "B1" | "B2" | null
  calibratedDifficulty: number
  challengeCode?: string
  uiVersion: string  // e.g. "v3-byte-choice-2"
}
```

### Game Run Complete Payload

```typescript
{
  runId: string
  score: number
  maxScore: number
  accuracy: number           // 0-100
  timeMs: number
  mistakes: number
  maxCombo: number
  falseFriendHits: number
  firstCorrectMs: number | null
  firstMeaningfulActionMs: number | null
  startingCefr: "A1" | "A2" | "B1" | "B2" | null
  calibratedDifficulty: number
  difficultyDelta: number    // How much difficulty shifted during the game
  skillTrackDeltas: [{ track: string, delta: number }]
  cognitiveLoadState: "focused" | "balanced" | "boosted"
  ahaSpike: boolean          // Was the player "in the zone"?
  curveVersion: string       // "v3-gentle-ramp-1"
  uiVersion: string
  gameVersion: "v3"
  shareCardVersion: string
  challengeCode?: string
  replayed: boolean
  tierReached: "onboarding" | "foundation" | "pressure" | "mastery"
  metadata?: Record<string, unknown>
}
```

### Local-Only Fallback

If the API call fails (network error, no auth), the game runs in "local-only" mode — `persisted: false, localOnly: true`. All gameplay works; only server-side telemetry is lost. This ensures offline playability.

---

## 15. Design System & Visual Language

### Colour Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Background | `#F7F3EE` | Page background (warm off-white) |
| Surface | `#FFFFFF` | Cards, panels |
| Surface Muted | `#F5EDE8` | Selector backgrounds |
| Border | `#E2D8CA` | Card borders, dividers |
| Text Primary | `#1E2B36` | Headings, primary text |
| Text Secondary | `#3E4E5C` | Body text |
| Text Muted | `#697B89` | Labels, metadata |
| Text Disabled | `#9C9590` | Disabled, coming soon |
| Gold Primary | `#D9A441` | Tokens, accents, CTAs |
| Gold Light | `#F5D76E` | Token highlights, progress bars |
| Gold Dark | `#C49835` | Button gradients |
| Gold Subtle | `#A37E28` | Token icon detail |
| Success | `#2E7D5A` | Correct, mastered, won |
| Error | `#A34C44` | Wrong answers, validation errors |
| Dark Card BG | `#1E2B36` → `#2A3A48` | Token balance bar |

### Typography

| Element | Font | Weight | Size |
|---------|------|--------|------|
| Hub Title | Mansalva (cursive) | 400 | 32px |
| Game Name (hub card) | Plus Jakarta Sans | 800 | 15px |
| Game Name (in-game header) | Mansalva (cursive) | 400 | ~24px (v3) / ~18px (v1) |
| Body / Description | Plus Jakarta Sans | 500 | 11-14px |
| Token Count | JetBrains Mono | 800 | 22px |
| Metadata (timer, #puzzle) | Plus Jakarta Sans / Manrope | 600 | 11px |
| Neon Intercept Display | Fraunces (serif) | 650 | Various |
| Neon Intercept UI | Manrope | 500-800 | Various |

### Border Radii

| Element | Radius |
|---------|--------|
| Hub cards | 16px |
| Buttons | 10px |
| Progress bars | 9999px (full round) |
| Input fields | 10px |
| Panels / Sections | 12-14px |
| Pills / Badges | 9999px |

### Shadows

| Level | Value |
|-------|-------|
| Card (default) | `0 1px 3px rgba(30,43,54,0.06), 0 1px 2px rgba(30,43,54,0.04)` |
| Card (pressed) | none |
| Result Card | `0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)` |

### Interactions

- **Touch targets:** Minimum 44×44px (accessibility compliant)
- **Press feedback:** scale(0.97) on pointer down
- **Tap highlight:** `WebkitTapHighlightColor: transparent`
- **Touch action:** `manipulation` on all interactive elements
- **Transitions:** 80ms ease-out for press effects

---

## 16. Supported Languages

### V3 Games (Byte Choice)

Full multilingual word pools:

| Language Pair | Direction | Pool Size |
|--------------|-----------|-----------|
| English ↔ Spanish | EN→ES, ES→EN | 100+ words each |
| English ↔ French | EN→FR, FR→EN | 100+ words each |
| English ↔ German | EN→DE, DE→EN | 100+ words each |
| English ↔ Italian | EN→IT, IT→EN | 100+ words each |
| English ↔ Portuguese | EN→PT, PT→EN | 100+ words each |

Each word pool is CEFR-tagged (A1, A2, B1, B2) with prompt, correct answer, and 2 distractors.

### V3 Games (Pixel Pairs, Relay Sprint)

Currently EN↔ES only (30 word pairs / 35 word rows).

### V1 Games

Static puzzles available in: English, Spanish, French, German. Puzzle count varies per game and language.

### Language Selector Options

Byte Choice offers 6 languages: 🇪🇸 Spanish, 🇫🇷 French, 🇩🇪 German, 🇮🇹 Italian, 🇧🇷 Portuguese, 🇬🇧 English.

Other games offer a subset (typically EN + ES).

---

## 17. Telegram Mini App Integration

The games are also deployed as a **Telegram Mini App**. Key adaptations:

### Detection

`isTelegram()` utility checks for Telegram WebApp environment.

### Navigation

- **BackButton:** Telegram's native back button replaces the web "← Games" nav. Navigates to hub on tap
- The web nav bar is hidden inside Telegram

### Haptics

Telegram's `HapticFeedback` API is used directly:
- `WebApp.HapticFeedback.impactOccurred('heavy'|'soft'|'light')`
- `WebApp.HapticFeedback.notificationOccurred('success'|'error'|'warning')`
- `WebApp.HapticFeedback.selectionChanged()`

### Closing Confirmation

- **Enabled** during active gameplay (prevents accidental close)
- **Disabled** on game completion (allows clean exit)

### Safe Areas

Content respects Telegram's safe area insets:
- `.tg-content-safe-top` class for top padding
- Bottom padding: `max(5rem, calc(2rem + env(safe-area-inset-bottom)))` (Telegram) vs `max(6rem, ...)` (web)

### Segmented Controls

`LanguageSelector` renders as Telegram-native segmented control (`.tg-segmented-control` class) when inside Telegram.

---

## Appendix A: Daily Seed System

Games that rotate daily use a deterministic seed based on the game slug, language, and date:
- `getDailySeed(gameSlug, language)` → returns a seed number
- `seededRandom(seed)` → returns a deterministic RNG function
- `getPuzzleNumber(startDate)` → returns days since launch date (used as puzzle #)

This ensures:
1. All players see the same daily puzzle
2. Puzzles are different each day
3. Challenge links can reproduce exact puzzles via seed override

## Appendix B: Scoring System

### Universal Scoring

- **Time bonus:** `(1 - timeMs/maxTimeMs) × 100` (faster = more points)
- **Accuracy:** `(correct / total) × 100`
- **CEFR multipliers:** A1 = ×1.0, A2 = ×1.2, B1 = ×1.5, B2 = ×2.0, C1 = ×2.5, C2 = ×3.0

### Weakness Diagnosis

After each game, mistakes are grouped by topic. The weakest area is surfaced:
```
{
  topic: "False Friends",
  count: 3,
  examples: ["embarazada", "constipado", "éxito"]
}
```

This drives the "Practice Focus" recommendation on the results screen.

## Appendix C: Animation Keyframes (Hub)

```css
@keyframes hub-card-enter {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes hub-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes hub-streak-glow {
  0%, 100% { text-shadow: 0 0 4px rgba(212,164,65,0.4); }
  50% { text-shadow: 0 0 12px rgba(212,164,65,0.7); }
}

@keyframes hub-token-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}

@keyframes hub-unlock-pop {
  0% { transform: scale(0.9); opacity: 0; }
  60% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes hub-lock-breathe {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.7; }
}
```

---

*Document generated from live codebase analysis on 2026-02-21.*  
*TutorLingua — tutorlingua.co/games*