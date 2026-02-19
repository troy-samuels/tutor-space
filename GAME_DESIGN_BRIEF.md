# TutorLingua Games — Design Overhaul Brief
**Date:** 19 February 2026
**Objective:** Transform three functional prototypes into games that look and feel best-in-class.

---

## Design Philosophy

**"If 100 game designers were in a room, what would they ALL agree on?"**

These are the universals:

1. **Every tap must feel like something happened.** Colour change, scale bounce, haptic pulse — ideally all three. Zero dead taps.
2. **The game board is the star.** HUD should be peripheral, minimal, glanceable. If players are reading the HUD, they're not playing.
3. **Colour creates emotion.** Each game needs its own colour world. Walking into Byte Choice should FEEL different from Pixel Pairs.
4. **Progress is visual, not numerical.** Dots, bars, rings, fills — not "Score: 3". The brain processes visual progress 60x faster than numbers.
5. **Difficulty should be invisible.** Players feel challenge through speed, distractor quality, and timer pressure — never through a number on screen.
6. **Celebration is proportional.** Small win: subtle pulse. Streak: growing intensity. Game complete: full-screen celebration. The reward must match the achievement.
7. **First 3 seconds decide everything.** The game must communicate "here's what you do" visually in the time it takes to glance at it. No reading required.

---

## Reference Games (What "Best in Class" Looks Like)

### Visual Design
- **Wordle** — Proof that minimal can be premium. The tile flip animation IS the game feel. Colours are the only feedback needed.
- **NYT Connections** — Clean grid, colour-coded categories, satisfying group-reveal animation with bounce.
- **Duolingo** — Bold colours, rounded shapes, generous white space. Every screen has ONE primary action that's unmissable.

### Game Feel / Juice
- **Candy Crush** — The gold standard for feedback cascades. Every match triggers particles, score pops, board reshuffling. It's over-the-top but it WORKS.
- **Fruit Ninja** — Shows how satisfying a single gesture can be with the right visual+haptic+audio feedback.
- **Alto's Odyssey** — Proves that rhythm and flow state matter more than complexity.

### Progression / Meta
- **Candy Crush map** — Winding path with nodes, stars on completed levels, locked/unlocked visual states, landmark decorations.
- **Duolingo path** — Linear progression with branching, character celebrations at milestones, crown system for mastery.
- **Mario World overworld** — The original: completed nodes change appearance, paths connect, secrets hide.

---

## The Overhaul — Component by Component

### 1. GAME HUB (`GameHub.tsx`)

**Current:** Settings menu. Flat list of text cards on beige.
**Target:** Game select screen with personality, energy, and visual identity.

**Design:**
- **Dark header area** with game title and streak fire — creates contrast, feels premium
- **Game cards as visual tiles**, not text rows:
  - Each card uses its game's primary colour as a gradient accent
  - Left side: game icon/illustration (even a simple geometric icon — circles for Byte Choice, grid for Pixel Pairs, arrow for Relay Sprint)
  - Centre: game name + one-line description
  - Right side: completion status as a visual ring (empty/partial/full) not text
  - Subtle hover/press scale animation (0.97 scale on press)
- **Progress section** uses a segmented bar (3 segments, one per game) with colour fills
- **Streak** shown with fire emoji + number, pulsing glow when active
- **"World Map" CTA** is prominent but secondary — below the game cards, styled as an exploration prompt
- **Stagger entrance animation** — cards slide up with 50ms stagger delay using CSS transforms (no GSAP needed)

**Colour palette:**
- Hub background: `#1A1A2E` (deep navy) or keep warm `#F7F3EE` — but add colour THROUGH the cards
- Each card brings its game colour: Byte Choice blue `#24577A`, Pixel Pairs teal `#2F8B7A`, Relay Sprint navy-lime `#304B78`

### 2. RETRO GAME FRAME (`RetroGameFrame.tsx`)

**Current:** Generic beige box with 3-column HUD showing Score/Streak/Difficulty.
**Target:** Per-game themed frame with minimal, glanceable HUD.

**Design:**
- **Remove the 3-card HUD entirely.** Replace with a single top bar:
  - Left: Score as animated counter
  - Centre: Progress dots (one per question/round, filling as you go)
  - Right: Streak shown as fire icons (🔥 × 3) when active, hidden when 0
- **Remove "Difficulty" from display.** It's an internal metric. Players feel difficulty through gameplay.
- **Remove the countdown buttons.** Replace with:
  - Auto countdown: big "3" → "2" → "1" → "GO!" with scale animation and game colour
  - Single tap anywhere to start (for impatient players)
  - The countdown numbers should be in the game's primary colour, large (72px+), and pulse/scale
- **Frame colour matches the game:**
  - Byte Choice: subtle blue tint to background
  - Pixel Pairs: subtle teal tint
  - Relay Sprint: subtle navy tint
- **Feedback line** stays but becomes visual: green flash for correct, red shake for wrong, rather than text swap
- Accept a `theme` prop with the game's colour to tint the entire frame

### 3. BYTE CHOICE (Vocabulary Quiz)

**Current:** Big prompt word + flat option buttons.
**Target:** The cleanest, most satisfying multiple-choice game you've played.

**Design:**
- **The prompt word** is hero-sized (42-48px), centred, with the game's primary colour. It should feel like the ONLY thing on screen.
- **Options as cards**, not buttons:
  - Generous height (72px minimum)
  - Rounded corners (14px)
  - Subtle shadow for depth
  - Left-aligned text with padding (feels more like reading, less like a test)
  - Number indicators (A, B, C, D) in small circles on the left edge
- **Correct answer animation:**
  - Card background slides to success green (`#2E7D5A`)
  - Checkmark icon fades in on the right
  - Score counter pulses (+1 floats up and fades)
  - Other cards fade to 40% opacity
  - 400ms hold before advancing (let the player see they were right)
- **Wrong answer animation:**
  - Selected card shakes horizontally (CSS shake keyframe, 300ms)
  - Card background goes error red (`#A34C44`)
  - Correct answer simultaneously highlights in green (teaches as it corrects)
  - X icon on the wrong card
  - 600ms hold (slightly longer — let the correction register)
- **Between questions:** smooth crossfade (opacity transition), not a hard cut
- **Progress dots** at top: one per question, filled dots for completed, current dot slightly larger

### 4. PIXEL PAIRS (Memory Match)

**Current:** Flat 2-column grid of text tiles.
**Target:** A memory game that feels tactile and satisfying.

**Design:**
- **Grid:** 4×3 or 4×4 depending on pair count (NOT 2-column — too stretched)
- **Cards have two visual states:**
  - **Face down:** solid colour card back using game teal (`#2F8B7A`) with a subtle pattern (CSS repeating gradient or a simple geometric pattern). All face-down cards look identical.
  - **Face up:** white/cream card showing the word, with a flip animation (CSS 3D transform, 300ms)
- **Card flip animation:**
  - `transform: rotateY(180deg)` with `perspective(800px)` on parent
  - Card scales slightly on tap before flipping (press feedback)
  - Backface-visibility hidden
- **Match found:**
  - Both cards pulse with green glow border
  - Cards shrink slightly (scale 0.95) and become semi-transparent after 500ms
  - Score pop (+1)
  - Matched pair stays visible but muted (player can see their progress)
- **No match:**
  - Brief red border flash on both cards
  - Cards flip back face-down after 800ms (give player time to memorise)
  - Subtle shake on both cards
- **Moves counter** instead of raw score — "Moves: 12" gives players a metric to optimise

### 5. RELAY SPRINT (Word Intercept)

This one uses Phaser (game engine), so it already has more visual capability. Focus on:
- **Lane visual clarity** — lanes should have clear boundaries, slight gradient differences
- **Falling words** should have a "weight" to them — slight shadow, increasing size as they fall
- **Catch feedback:** satisfying particle burst in the game's lime colour (`#88B948`)
- **Miss feedback:** word shatters/explodes in red
- **Speed increases should be felt** — screen edge glow intensifies, background subtly shifts colour as difficulty ramps
- **Lives** shown as hearts/icons, not numbers — each lost life should have a crack/break animation

### 6. WORLD MAP (`WorldMap.tsx`)

**Current:** A flat list with text labels.
**Target:** A visual map that makes progression feel like an adventure.

**Design:**
- **Vertical path layout** — nodes connected by a dotted/dashed line
- **Each node is a circle** (64×64px) with the game's icon/colour:
  - **Unlocked + completed:** filled with game colour, checkmark badge, glowing
  - **Unlocked + not completed:** filled with game colour, pulsing border (play me!)
  - **Locked:** grey, slightly smaller, lock icon overlay, connected by faded path
- **Connecting paths** between nodes:
  - Completed: solid line in game colour
  - Next: dashed line, slightly animated (CSS dash-offset animation)
  - Locked: dotted grey line
- **Token display** as a coin/crystal icon with number, not just "Tokens 0"
- **Next unlock requirement** shown as a subtle progress bar under the locked node: "12/30 tokens"
- **Background:** subtle topographic/wave pattern (CSS-only) to suggest a landscape

### 7. SUMMARY / RESULTS SCREEN

**Current:** Two plain cards showing "Progress" and "Next" with generic text.
**Target:** A celebration screen that rewards good play and motivates replays.

**Design:**
- **Performance rating:** 3 stars (filled based on score %) with pop-in animation and subtle bounce
  - ≥90%: 3 stars + confetti burst
  - ≥70%: 2 stars + gentle celebration
  - <70%: 1 star + encouraging copy
- **Stats grid:** 2×2 cards showing Score, Accuracy (as percentage), Best Streak, Time
- **Share button** prominently styled in gold (`#D9A441`)
- **Two CTAs:**
  - "Play Again" (primary, game colour)
  - "Back to Games" (secondary, outlined)
- **If challenge mode:** show "Challenge a Friend" prominently with a link/share mechanism

---

## Technical Approach

### CSS-Only Animations (No Heavy Libraries)
All animations should be CSS-based for performance:
```css
/* Correct answer */
@keyframes correct-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.03); }
  100% { transform: scale(1); }
}

/* Wrong answer shake */
@keyframes wrong-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}

/* Score pop float */
@keyframes score-pop {
  0% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-32px) scale(1.2); }
}

/* Card flip */
@keyframes card-flip {
  0% { transform: perspective(800px) rotateY(0); }
  100% { transform: perspective(800px) rotateY(180deg); }
}

/* Countdown pulse */
@keyframes countdown-pulse {
  0% { transform: scale(0.5); opacity: 0; }
  50% { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

/* Stagger entrance */
@keyframes slide-up {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Progress dot fill */
@keyframes dot-fill {
  from { background: transparent; }
  to { background: currentColor; }
}
```

### Design Token Usage
The existing tokens in `games-v3/tokens/` are well-structured. Use them properly:
- Each game component receives its `theme` colour
- Frame background tints toward the game's colour at 5-8% opacity
- Interactive elements use the game's primary colour
- Success/error use the semantic tokens (already defined)

### CSS Modules
Continue using CSS modules (`.module.css`). Add the keyframe animations to a shared `animations.module.css` that all games import.

### Mobile-First
- All measurements in the current code are reasonable
- Touch targets minimum 48px (already met)
- Use `touch-action: manipulation` everywhere (faster taps, no double-tap zoom)

---

## Execution Priority

1. **RetroGameFrame** — shared frame, biggest impact (countdown, HUD, theme)
2. **GameHub** — first thing you see
3. **Byte Choice** — simplest game, easiest to get right, most satisfying quick win
4. **Pixel Pairs** — card flip is THE feature
5. **Summary screen** — rewards matter
6. **World Map** — progression visualisation
7. **Relay Sprint** — Phaser-based, most complex, do last

---

## What NOT to Change

- Game logic, adaptation engine, difficulty calibration — all sound
- The data layer (puzzle generation, seeding) — working
- The run lifecycle (startGameRun, completeGameRun) — working
- The Telegram integration — working
- The haptics system — working
- The share/challenge system — working

The game DESIGN is good. The game FEEL needs the overhaul.
