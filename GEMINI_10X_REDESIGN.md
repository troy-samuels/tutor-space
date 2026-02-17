# TutorLingua 10x Visual Overhaul — Gemini 3 Pro Preview Directive
## Date: 2026-02-17

Source: Gemini 3 Pro Preview consultation for game UI/UX redesign.

---

## Global Design System ("Juice Layer")

### Canvas Palette
```css
canvas-DEFAULT: #080C14  /* The Void */
canvas-surface: #111827  /* Cards/Panels */
canvas-elevated: #1F2937 /* Modals */
accent-gold: #FFD700     /* Primary Action */
accent-glow: rgba(255, 215, 0, 0.15)
```

### GSAP Interaction Physics
```javascript
const EASE_ELASTIC = "elastic.out(1, 0.5)"; // Badge pop-ins
const EASE_SNAP = "back.out(1.7)";          // Tile selection
const EASE_SMOOTH = "power3.out";           // Page transitions

// Button Press (ALL interactive elements)
const pressAnim = { scale: 0.95, duration: 0.1, ease: "power1.out" };
```

### Haptic Vocabulary
- Tap Tile: `impactOccurred('light')` — Crisp click
- Submit Wrong: `notificationOccurred('error')` — Buzz
- Submit Success: `notificationOccurred('success')` — Double thump
- Timer < 10s: `impactOccurred('soft')` — Heartbeat

---

## 1. Game Hub ("The Arcade")

### Layout
- Header (10%): User Profile (Left) + Streak Flame (Right, animating). Transparent bg.
- Scroll Area (90%): Vertical stack of Hero Cards
- Card Size: Width 92%, Aspect Ratio 16:9, Spacing: 24px

### Card CSS
```css
.game-card {
  background: linear-gradient(145deg, #1A2333 0%, #0F1520 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  position: relative;
  overflow: hidden;
}

.game-card::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; height: 100%;
  background: radial-gradient(circle at 50% 0%, rgba(255,255,255,0.1) 0%, transparent 60%);
  pointer-events: none;
}
```

### Animations
- Hub load: `gsap.from(".game-card", { y: 100, opacity: 0, stagger: 0.1, ease: "back.out(1.2)" })`
- Play button: CSS heartbeat shadow pulse
- Streak: Lottie flame animation

### 3 Biggest Wins
1. Animated backgrounds in each card (floating letters etc)
2. Play button pulse glow
3. Animated streak flame (Lottie)

---

## 2. Lingua Connections (Flagship)

### Layout
- Grid (65%): Centered 4x4, max-width 360px
- Mistakes (10%): Dots below grid
- Controls (25%): Big "Submit" pill button

### Tile CSS
```css
.tile {
  background: #1E293B;
  border-radius: 12px;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  text-transform: uppercase;
  border-bottom: 4px solid #0F172A; /* Faux 3D depth */
  transition: transform 0.1s;
}

.tile.selected {
  background: #3B82F6;
  border-bottom: 4px solid #1D4ED8;
  color: white;
  transform: translateY(2px); /* Press down */
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.5); /* Neon Glow */
}
```

### Solve Animation (GSAP Timeline)
1. Jump: Selected tiles hop up (y: -10)
2. Merge: Move to top row (layout animation)
3. Fuse: Morph into single coloured bar
4. Particles: 20 confetti particles burst from fusion point

### False Friend Reveal
1. Trap tile shakes violently (Red)
2. FLIP: 180 degree 3D transform
3. Back side: Shows real meaning vs assumed meaning
4. Toast: "Touché!" overlay

### 3 Biggest Wins
1. Faux-3D tiles (4px bottom border)
2. Neon selection glow (box-shadow)
3. Particle bursts on every correct solve

---

## 3. Lingua Strands

### Key Directives
- Grid: Invisible. Only letters visible.
- Selection path: SVG spline, stroke 24px, gold, rounded caps
- Path glow: `filter: drop-shadow(0 0 8px #FCD34D)`

### "Circuit Complete" Effect
1. Selection path flashes white
2. Settles into theme colour
3. Letters pop (scale 1.2 -> 1.0)
4. Subtle ripple distorts background

### 3 Biggest Wins
1. Connecting lines (Snake style), not block highlights
2. Dynamic theme particles (Ocean=bubbles, Fire=sparks)
3. Ghost words: fade out and fly into "Hint Meter"

---

## 4. Spell Cast (Honeycomb)

### Layout
- Hive (50%): 7 hexagons, CSS clip-path or SVG
- Input (20%): Large text field showing current letters
- Rank (10%): Progress bar at top (Beginner -> Genius)
- Center hex: Throbbing gently (scale: 1.05 loop), gold border

### Pangram Explosion
1. Screen shake: viewport shakes (x: [-5, 5])
2. Bloom: Intense screen flash
3. Audio: Heavy "thoom" + high chime
4. Text: "PANGRAM!" slams on with elastic.out

---

## 5. Speed Clash (Adrenaline)

### Key Directives
- Timer: Shrinking bar (not number). Green -> Yellow -> Red/Strobing
- Opponent: Ghost progress bar above yours

### Animations
- Right answer: Green flash + "+100" floats up
- Wrong answer: Red screen tint + shake + "-50" falls down

### 3 Biggest Wins
1. Panic border: <5s = red vignette pulsing on screen edges
2. Combo counter: 3x right = "3x COMBO" flame
3. Opponent avatar reactions

---

## 6. Daily Decode (Mystery)

### Key Directives
- Typography: Serif font (Merriweather/Playfair) — looks like a book page
- Blanks: Not underlines — "Missing ink" effect
- Input: Letters look handwritten

### "Ink Reveal" Hero Moment
Story fully solved -> handwritten morphs to book font -> illustration fades in behind text (parallax)

---

## Build Priority (Tonight)

1. Install GSAP: `npm install gsap`
2. Update palette in tailwind config
3. Create new GameCard component (16:9 ratio + inner glow)
4. Refactor Tile component (4px bottom border, neon selection)
5. Add haptics to every onClick
6. Wire canvas-confetti for solve celebrations
7. GSAP stagger animation on hub load
