# TutorLingua Telegram Mini Apps — Technical Specification

**Date:** 2026-02-16
**Status:** BUILDING (overnight sprint)

---

## Architecture Overview

### Approach: Hybrid (Mini App + Bot)

The existing TutorLingua games run as Next.js pages. For Telegram, we'll build a **standalone Mini App** that:

1. **Reuses game logic** (scoring, daily-seed, streaks, CEFR, false-friends data)
2. **Adds Telegram SDK integration** (WebApp API, sharing, deep links, haptics)
3. **Adds 2 new games** (Word Runner, Vocab Clash)
4. **Repurposes 3 existing games** (Connections, Spell Cast/Synonym Spiral, Speed Clash/Odd One Out)
5. **Bot handles** notifications, referrals, group commands, daily delivery

### Tech Stack

- **Mini App:** React 18 + Vite (fast builds, no SSR needed)
- **Telegram SDK:** `@twa-dev/sdk` (TypeScript Telegram WebApp wrapper)
- **Styling:** Tailwind CSS (consistent with main app)
- **Animation:** Framer Motion (consistent with main app)
- **Canvas:** HTML5 Canvas for Word Runner
- **State:** Zustand (lightweight, perfect for games)
- **Backend:** Existing Next.js API routes + new bot webhook endpoint
- **Bot Framework:** `grammy` (modern, TypeScript-native Telegram bot framework)
- **Deployment:** Vercel (Mini App static) + Railway/Vercel Edge (bot)

### File Structure

```
tutor-space/telegram/
├── bot/
│   ├── index.ts              # Bot entry point (grammy)
│   ├── commands/
│   │   ├── start.ts          # /start + deep link handling
│   │   ├── play.ts           # /play [game]
│   │   ├── streak.ts         # /streak
│   │   ├── challenge.ts      # /challenge @user [game]
│   │   └── leaderboard.ts    # /leaderboard
│   ├── middleware/
│   │   ├── auth.ts           # User registration/lookup
│   │   └── referral.ts       # Referral tracking
│   ├── notifications/
│   │   ├── daily-puzzle.ts   # Morning puzzle delivery
│   │   ├── streak-warning.ts # Evening streak reminders
│   │   └── challenge.ts      # Challenge notifications
│   └── utils/
│       ├── share-cards.ts    # Emoji grid generators
│       └── deep-links.ts     # Referral link builder
├── mini-app/
│   ├── src/
│   │   ├── App.tsx           # Router + Telegram init
│   │   ├── main.tsx          # Entry point
│   │   ├── telegram.ts       # Telegram WebApp SDK wrapper
│   │   ├── stores/
│   │   │   ├── game.ts       # Game state (Zustand)
│   │   │   ├── user.ts       # User profile + prefs
│   │   │   └── streak.ts     # Streak state (synced to backend)
│   │   ├── games/
│   │   │   ├── connections/
│   │   │   │   ├── ConnectionsGame.tsx
│   │   │   │   ├── WordTile.tsx
│   │   │   │   └── share.ts
│   │   │   ├── spell-cast/
│   │   │   │   ├── SpellCastGame.tsx
│   │   │   │   ├── HexGrid.tsx
│   │   │   │   └── share.ts
│   │   │   ├── speed-clash/
│   │   │   │   ├── SpeedClashGame.tsx
│   │   │   │   ├── GhostRacer.tsx
│   │   │   │   └── share.ts
│   │   │   ├── word-runner/
│   │   │   │   ├── WordRunnerGame.tsx
│   │   │   │   ├── Runner.tsx    # Canvas renderer
│   │   │   │   ├── Obstacle.tsx
│   │   │   │   └── share.ts
│   │   │   └── vocab-clash/
│   │   │       ├── VocabClashGame.tsx
│   │   │       ├── Card.tsx
│   │   │       ├── BattleArena.tsx
│   │   │       ├── DeckBuilder.tsx
│   │   │       └── share.ts
│   │   ├── components/
│   │   │   ├── GameShell.tsx     # Shared wrapper (adapted from main app)
│   │   │   ├── ShareCard.tsx     # Universal share card generator
│   │   │   ├── StreakBadge.tsx
│   │   │   ├── TutorCTA.tsx      # "Book a tutor" funnel
│   │   │   ├── Leaderboard.tsx
│   │   │   └── OnboardingFlow.tsx
│   │   ├── lib/
│   │   │   ├── scoring.ts       # Reuse from main app
│   │   │   ├── daily-seed.ts    # Reuse from main app
│   │   │   ├── streaks.ts       # Adapted for Telegram (server-synced)
│   │   │   ├── cefr.ts          # Reuse from main app
│   │   │   ├── haptics.ts       # Telegram haptic feedback wrapper
│   │   │   └── share.ts         # Telegram sharing utilities
│   │   └── data/                # Puzzle data (copied from main app)
│   │       ├── connections/
│   │       ├── false-friends.ts
│   │       └── word-lists/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── tsconfig.json
└── package.json
```

---

## Game 1: Lingua Connections (Repurposed — Level 2-3)

### Existing → Telegram Adaptations

**Already built:** Full ConnectionsGame.tsx (459 lines), WordTile, CategoryReveal, VibeClueBanner, 21 puzzles (7×3 languages), false friends database

**Telegram enhancements:**
- Haptic feedback on tile tap (light), wrong guess (error), correct group (success)
- Full-screen mode (hide Telegram header)
- Emoji share grid auto-generated:
  ```
  🔗 Connections #3 🇪🇸
  🟨🟨🟨🟨
  🟩🟩🟩🟩
  🟦🟦🟦🟦
  🟪🟪🟪🟪
  ⏱️ 2:34 | 🔥 12-day streak
  t.me/TutorLinguaBot?start=c3
  ```
- Challenge deep link: tap "Challenge Friend" → select contact → friend gets notification
- Group play: post results to group automatically (opt-in)
- "Losing concept" diagnosis shown on game over → "A tutor can help with [topic]" CTA

### Edge Cases
- User closes app mid-game → save state to localStorage, resume on return
- User plays on web AND Telegram → separate streak tracking (Telegram uses server-synced)
- No internet during play → game works offline, syncs on reconnect
- User changes timezone → daily puzzle tied to UTC, not local time
- Same puzzle for everyone → deterministic seed (already implemented)

---

## Game 2: Spell Cast (Repurposed — Level 3)

### Concept
Adapted from Synonym Spiral + new honeycomb mechanic. Hexagonal grid of letters, find words by connecting adjacent hexes. CEFR-weighted scoring.

**Core loop:**
1. 2-minute timer starts
2. Hexagonal grid of 19 letters appears (honeycomb layout)
3. Tap/swipe to connect adjacent hexes forming words
4. Valid word = points (CEFR-weighted: A1=1x, C2=3x)
5. Chain bonus: 3+ words in 30 seconds = combo multiplier
6. Special "golden hex" in centre — words using it score 2x

### Telegram-Specific
- Haptic pulse on each hex selection
- Haptic buzz on valid word found
- Timer creates natural tension → haptic heartbeat in final 10 seconds
- Share card:
  ```
  🍯 Spell Cast #5 🇫🇷
  Score: 342 pts
  Best: BIBLIOTHÈQUE (12L, C1)
  ⛓️ Max combo: 5x
  Top 8% today 🏆
  t.me/TutorLinguaBot?start=sc5
  ```

### Edge Cases
- Dictionary validation: preloaded word lists per language (no API call needed)
- Swipe vs tap: support both input methods
- Small screens: hex grid must fit 320px width minimum
- Duplicate words: prevent same word being found twice
- Timer pause: if user backgrounds app, pause timer (Telegram `deactivated` event)
- Colour blindness: use patterns/shapes in addition to colours for hex states

---

## Game 3: Speed Clash (Repurposed — Level 3-4)

### Concept
Adapted from Odd One Out into async competitive reaction game. NOT translation — reaction phrases.

**Core loop:**
1. Scenario appears: "Your friend says: '¿Cómo estás?'"
2. 4 response options appear simultaneously
3. Tap the correct/most natural response as fast as possible
4. Ghost racers (AI opponents) also racing — their cursors visible
5. 10 rounds per match
6. Faster correct answers = more points

### Ghost Racer System
- 3 ghost racers with personalities:
  - 🐢 "Beginner" — answers in 4-6 seconds, sometimes wrong
  - 🐇 "Regular" — answers in 2-4 seconds, usually right
  - ⚡ "Native" — answers in 0.8-1.5 seconds, almost always right
- Ghosts are pre-recorded paths, not real-time AI
- Creates illusion of multiplayer without server costs
- User sees ghost cursor dots moving toward options

### Telegram-Specific
- Haptic on answer selection
- Heavy haptic on beating the ⚡ ghost
- Full-screen for immersion
- Challenge mode: async 1v1 via deep link
  - Player A completes 10 rounds, results stored
  - Player A sends challenge link to Player B
  - Player B plays same 10 rounds
  - Both see head-to-head comparison
- Share card:
  ```
  ⚡ Speed Clash #7 🇩🇪
  Score: 8/10 correct
  Avg speed: 1.8s
  Beat 🐇 Regular! Lost to ⚡ Native
  🔥 14-day streak
  Race me: t.me/TutorLinguaBot?start=clash7
  ```

### Edge Cases
- Network latency: all game logic runs client-side, no server round-trips during play
- Ghost timing: randomize ±0.3s each round to feel natural
- Tie with ghost: user wins ties (feels better)
- Wrong answer speed: fast wrong answer = more points lost than slow wrong answer
- All 4 options must be plausible (no obviously wrong answers)
- Options randomized in position each round

---

## Game 4: Word Runner (NEW — Level 3-4)

### Concept
Endless runner using HTML5 Canvas. Character runs automatically, player swipes to change lanes. Each lane has a word — only one is the correct translation/answer.

**Core loop:**
1. Character runs forward automatically (side-scrolling)
2. Prompt appears at top: "Which means 'house'?"
3. 3 lanes ahead, each with a word floating above it
4. Swipe left/right to change lane (or tap lane)
5. Correct lane = keep running, speed increases slightly
6. Wrong lane = stumble animation, lose a life (3 lives)
7. Speed increases every 10 correct answers
8. Game ends when lives run out

### Visual Design
- Canvas-based rendering (60fps target)
- Stylised low-poly background (city/nature theme based on vocab category)
- Character: simple silhouette with running animation
- Words float as neon signs above lanes
- Correct: green flash + speed boost animation
- Wrong: red flash + stumble + screen shake
- Power-ups every 15 words:
  - ❤️ Extra life
  - 🛡️ Shield (absorbs one wrong answer)
  - ⏳ Slow-mo (5 seconds of half speed)
  - 2️⃣ Binary (removes one wrong lane)

### Accelerometer Integration
- Optional tilt-to-steer mode (using Telegram accelerometer API)
- Tilt phone left/right to change lanes
- Toggle in settings (default: swipe)

### Scoring
- Base: 10 points per correct answer
- Speed bonus: +1 point per speed level
- Streak bonus: 5+ correct in a row = 2x multiplier
- CEFR multiplier: harder words = more points
- Distance: total "metres run" displayed

### Share Card
```
🏃 Word Runner 🇪🇸
Distance: 847m
Score: 1,240 pts
Speed: Level 12
Best streak: 23 words
❤️❤️🖤

Can you go further? t.me/TutorLinguaBot?start=wr
```

### Edge Cases
- Performance: Canvas must maintain 60fps on low-end devices (use Telegram hardware info API to detect performance class, reduce particles on low-end)
- Accelerometer calibration: prompt user to hold phone level before tilt mode starts
- App backgrounding: pause game state, resume on return
- Screen orientation: lock to portrait for consistent gameplay
- Word length: long words (>12 chars) need smaller font or abbreviation
- Repeat words: track shown words, don't repeat in same run
- Language switching mid-run: not allowed, selected at start
- Accessibility: swipe mode always available even with accelerometer

---

## Game 5: Vocab Clash (NEW — Level 3-4)

### Concept
Collectible card battler where words ARE the cards. Build a deck from vocabulary you've learned across all games, then battle other players (async) or AI.

**Card System:**
Each vocabulary word becomes a card with:
- **Name:** The word (e.g., "BIBLIOTHÈQUE")
- **Translation:** English meaning
- **Power:** Attack value (1-10, based on word length + CEFR)
- **Defence:** Health value (1-10, based on word frequency — common words are harder to kill)
- **Ability:** Special effect based on word category:
  - 🔥 **False Friends:** "Confuse" — opponent must identify the true meaning to block
  - 🛡️ **Cognates:** "Shield" — easy to play, +2 defence
  - ⚡ **Idioms:** "Surprise" — double damage if opponent doesn't know it
  - 💊 **Medical/Technical:** "Specialist" — high power but costs 2 turns to play
  - 🌍 **Travel words:** "Scout" — see opponent's next card before they play it
- **Rarity:** Based on CEFR level
  - A1 = Common (grey border)
  - A2 = Uncommon (green border)
  - B1 = Rare (blue border)
  - B2 = Epic (purple border)
  - C1 = Legendary (gold border)
  - C2 = Mythic (holographic border)

### Collection Mechanics
- **Earning cards:** Complete any TutorLingua game → earn cards based on words in that puzzle
- **Daily free pack:** 3 random cards per day
- **Streak bonus:** 7-day streak = guaranteed Rare+ card
- **Trading:** Send duplicate cards to friends (Telegram share)
- **Crafting:** Combine 3 duplicates → upgrade rarity by 1 level

### Battle System
**Turn-based, 5 cards per deck (fast battles):**
1. Both players draw hand of 5 cards from their deck (8-12 card deck)
2. Each turn: play 1 card face-down
3. Both reveal simultaneously
4. Higher power card wins the clash
5. BUT: abilities trigger first (False Friend confusion, Idiom surprise, etc.)
6. Winner of clash deals (their power - opponent's defence) damage to opponent's HP
7. Each player starts with 20 HP
8. First to 0 HP loses (or most HP after 5 rounds)

### False Friend Mechanic (Signature)
When a False Friend card is played:
- Opponent sees the word and must tap the CORRECT meaning from 3 options
- If opponent gets it wrong: the False Friend card deals double damage
- If opponent gets it right: normal battle proceeds
- This is the game-within-a-game that makes it educational

### Modes
1. **AI Battle:** Fight AI decks of increasing difficulty (daily, always available)
2. **Challenge:** Async 1v1 via deep link (like Speed Clash challenges)
3. **Tournament:** Weekly 8-player brackets (unlock at 50+ cards)

### Telegram-Specific
- Card reveal animation with haptic
- Collection screen shows all cards in binder format
- Share card:
  ```
  🃏 Vocab Clash 🇫🇷
  Won 3-2 vs AI (Intermediate)
  MVP: BIBLIOTHÈQUE (Legendary 📖)
  False Friend trap: Caught opponent!
  Collection: 47/200 cards
  
  Battle me: t.me/TutorLinguaBot?start=vc
  ```
- "I just pulled a Legendary card!" share prompt
- Card trading via Telegram share

### Tutor Funnel
- After losing to AI: "Your deck is weak in [category]. A tutor can teach you 20 new words in one session."
- After winning with False Friends: "Love catching people with false friends? A tutor can teach you 50 more."
- Weekly deck review: "Your strongest cards are all A1-A2. Ready to level up?" → tutor CTA

### Edge Cases
- Card balance: playtest extensively, adjust power/defence values
- Duplicate handling: cap at 3 duplicates per card (excess auto-converted to crafting points)
- Empty deck: always provide 5 starter cards on first play
- Language mixing: deck is per-language (can't mix Spanish and French cards)
- Offline battles: AI battles work fully offline
- Challenge expiry: async challenges expire after 48 hours
- Tie-breaking: if HP equal after 5 rounds, player who dealt more total damage wins
- Card text overflow: truncate long words, show full on tap
- Animation performance: card flip/reveal must be smooth, preload assets

---

## Shared Systems

### Telegram SDK Integration (`telegram.ts`)

```typescript
import WebApp from '@twa-dev/sdk';

export const tg = {
  // Initialization
  init() {
    WebApp.ready();
    WebApp.expand(); // Full screen
    WebApp.requestFullscreen();
    WebApp.disableVerticalSwipes(); // Prevent swipe-to-close during games
    WebApp.enableClosingConfirmation(); // Warn before closing mid-game
  },
  
  // Haptics
  haptic: {
    light: () => WebApp.HapticFeedback.impactOccurred('light'),
    medium: () => WebApp.HapticFeedback.impactOccurred('medium'),
    heavy: () => WebApp.HapticFeedback.impactOccurred('heavy'),
    success: () => WebApp.HapticFeedback.notificationOccurred('success'),
    error: () => WebApp.HapticFeedback.notificationOccurred('error'),
    warning: () => WebApp.HapticFeedback.notificationOccurred('warning'),
    select: () => WebApp.HapticFeedback.selectionChanged(),
  },
  
  // User data
  getUser() {
    return WebApp.initDataUnsafe.user;
  },
  
  // Deep link start param
  getStartParam() {
    return WebApp.initDataUnsafe.start_param;
  },
  
  // Share
  async shareScore(text: string, imageUrl?: string) {
    // Use Telegram share picker
    WebApp.switchInlineQuery(text, ['users', 'groups', 'channels']);
  },
  
  // Theme
  getTheme() {
    return WebApp.themeParams;
  },
  
  // Close
  close() {
    WebApp.close();
  }
};
```

### Referral & Deep Link System

Format: `t.me/TutorLinguaBot?start=<action>_<data>_<referrer>`

Actions:
- `c<N>` — Connections puzzle #N
- `sc<N>` — Spell Cast puzzle #N
- `clash<N>` — Speed Clash puzzle #N
- `wr` — Word Runner
- `vc` — Vocab Clash
- `ref_<userId>` — Referral link
- `ch_<challengeId>` — Challenge link

### Share Card Generator

Each game exports a `generateShareCard()` function that returns:
1. Emoji grid text (for Telegram message)
2. Canvas-rendered image (for social sharing)
3. Deep link URL

### Notification Schedule

| Time | Notification | Condition |
|------|-------------|-----------|
| 8:00 AM local | "Your daily puzzles are ready! 🎮" | Always (if opted in) |
| 8:00 PM local | "Don't break your streak! 🔥 X days" | Only if haven't played today |
| Immediate | "Challenge from [friend]!" | When challenged |
| Immediate | "[Friend] beat your score!" | When friend completes your challenge |
| Weekly (Mon AM) | "Last week: X games, Y words learned" | Always |

### Tutor Funnel Integration

Every game end screen includes one of:
1. **Losing concept diagnosis** → "Struggling with [topic]? Book a free trial lesson"
2. **Streak milestone** → "7-day streak! Unlock a free 10-min tutor chat"
3. **Card collection gap** → "Missing [category] cards? A tutor can teach you 20 new words"

CTA links to: `https://tutorlingua.com/find-tutor?ref=telegram&game=<slug>`

---

## Distribution MVP (Night Build)

### Phase 0 (Tonight):
1. Register @TutorLinguaBot via BotFather
2. Set up bot with /start, /play, /streak commands
3. Build Mini App scaffold with game router
4. Deploy to Vercel (mini app) + set webhook (bot)

### Phase 1 (Tomorrow):
1. Create @TutorLinguaGames channel
2. Write first 5 channel posts (one per game preview)
3. Draft Reddit launch posts for r/Telegram, r/languagelearning
4. Prep Product Hunt listing
5. Generate share card templates

---

## Testing Strategy

### Unit Tests (Vitest)
- Scoring calculations (all CEFR multipliers)
- Daily seed determinism (same date = same puzzle)
- Streak logic (continue, break, edge cases around midnight)
- Share card text generation
- Deep link parsing
- Card battle outcome calculation (Vocab Clash)
- Ghost racer timing (Speed Clash)
- Canvas collision detection (Word Runner)

### Integration Tests
- Game flow: start → play → complete → share
- Telegram SDK mock: verify haptic calls, share calls
- Referral tracking: deep link → user registration → reward
- Challenge flow: create → share → accept → play → compare

### Edge Case Tests
- Midnight timezone crossing during game
- App backgrounding/foregrounding
- Network disconnect during sync
- Extremely fast completion (bot detection)
- Very slow completion (hour-long session)
- Empty puzzle data
- Invalid deep link parameters
