# Neon Intercept Redesign — Task & Test Checklist

## Problem Analysis
Troy's feedback: "Game doesn't visually make sense — words fall but end nowhere, not logical to click words at bottom, sentences are confusing, none of the gameplay works."

### Root Causes
1. **Disconnected UI**: Falling clue word has no visual relationship to the 3 lane options
2. **No landing metaphor**: Word falls into void — doesn't "arrive" anywhere
3. **Confusing clue format**: Emoji + word with similar-looking distractors — unclear what you're matching
4. **No physical logic**: In real life, falling objects land on things. Our game breaks this mental model
5. **Phaser canvas is separate from React HUD**: Creates a split-brain experience

## Redesign Concept: "Drop & Catch"

### Core Metaphor
A **foreign word** drops from the top. Three **translation "catchers"** (open containers/platforms) sit at the bottom. You tap the correct catcher to **catch the word**. The word visually falls INTO the catcher you tap, creating a satisfying physical connection.

### Why This Works
- **Gravity is intuitive**: Things fall. You catch them. Zero learning curve.
- **Clear question/answer**: Foreign word falls → Tap the English translation to catch it
- **Visual completion**: Word literally lands inside the container you chose
- **Satisfying feedback**: Correct = word lands with a bounce. Wrong = word smashes through.
- **No Phaser needed**: This can be pure HTML/CSS/JS with requestAnimationFrame — faster, lighter, easier to style, responsive

### Layout (360-wide, full-height component)

```
┌──────────────────────────────────────┐
│          [Language] [Mode]           │  ← 48px setup strip
├──────────────────────────────────────┤
│  ❤️❤️❤️    Score: 420    🔥 5x       │  ← 44px HUD bar
├──────────────────────────────────────┤
│                                      │
│                                      │
│           ┌─────────┐               │
│           │  agua   │  ← falling    │  ← Drop zone (main area)
│           └─────────┘    word card   │
│               │                      │
│               ▼                      │
│                                      │
│                                      │
│   ┌────────┐ ┌────────┐ ┌────────┐  │
│   │ water  │ │ fire   │ │ earth  │  │  ← 3 catchers
│   │   🫳   │ │   🫳   │ │   🫳   │  │
│   └────────┘ └────────┘ └────────┘  │
│                                      │
│  Wave 5/60           ⏱ 1:42         │  ← 36px footer
└──────────────────────────────────────┘
```

### Interaction Flow
1. Foreign word card appears at top, starts falling
2. Player reads the word and scans the 3 catchers below
3. Player taps the correct translation catcher
4. **Correct**: Word card accelerates into the catcher, bounces, flash green, score +
5. **Wrong**: Word card redirects to wrong catcher, smashes/shatters, flash red, -1 life
6. **Timeout**: Word falls past all catchers, falls off screen, -1 life
7. Next word spawns after 300ms delay

### Key Visual Details
- **Falling word**: Large, clean card with rounded corners. Foreign word in bold. Subtle shadow underneath for depth.
- **Catchers**: Open-top containers with a slight "shelf" appearance. Translation word centered. When correct word lands, the container "fills" with a subtle glow.
- **Speed**: Starts slow (2.5s fall time), gets faster (down to 1.2s) as game progresses
- **Onboarding**: First 3 words have a pulsing glow on the correct catcher

## Implementation Plan

### Phase 1: Pure HTML/CSS/JS Game Engine (no Phaser)
- [ ] Create `NeonInterceptV3Game.tsx` — pure React + requestAnimationFrame
- [ ] Implement falling word card animation (CSS transform + RAF)
- [ ] Implement 3 catcher containers with tap handlers
- [ ] Implement word-into-catcher landing animation
- [ ] Implement correct/wrong/timeout feedback
- [ ] Wire up lives, score, combo systems

### Phase 2: Visual Polish
- [ ] Smooth spring physics for landing bounce
- [ ] Shatter/break animation for wrong answers
- [ ] Particle effects for combos
- [ ] Onboarding glow for first 3 waves
- [ ] Responsive sizing (works on phones and tablets)
- [ ] CSS transitions for all state changes

### Phase 3: Integration
- [ ] Wire to existing puzzle data (same data format)
- [ ] Wire to existing mode/timer system
- [ ] Wire to run-lifecycle (startGameRun/completeGameRun)
- [ ] Wire to streaks + haptics
- [ ] Replace V2 with V3 on the page
- [ ] Remove Phaser dependency for this game

### Phase 4: Testing Loop
- [ ] Play through complete game visually in browser
- [ ] Verify word falls smoothly (60fps)
- [ ] Verify tap on correct catcher shows green + word lands
- [ ] Verify tap on wrong catcher shows red + animation
- [ ] Verify timeout when word reaches bottom
- [ ] Verify lives decrement properly
- [ ] Verify game ends at 0 lives
- [ ] Verify score and combo work
- [ ] Verify all 4 languages work
- [ ] Verify responsive at different widths
- [ ] Take screenshot, evaluate, iterate

## Test Criteria (must pass ALL)
1. **5-second test**: Can a new player understand what to do in 5 seconds? (falling thing → catch it)
2. **Visual coherence**: Every element has a clear purpose and spatial relationship
3. **No dead zones**: No part of the screen is wasted or confusing
4. **Satisfying feedback**: Correct answers FEEL good (animation + timing)
5. **Speed progression**: Game clearly gets harder over time
6. **Clean aesthetic**: Consistent with TutorLingua brand — warm, modern, no neon/cyber
7. **60fps**: Animations never stutter
