# TutorLingua Telegram Mini App

A standalone Vite + React + TypeScript Mini App that runs inside Telegram, featuring 3 language-learning games.

## What's Built

### ✅ Infrastructure
- **Telegram WebApp SDK integration** (`src/telegram.ts`)
  - Haptic feedback, theme colours, user data, share functionality
  - Graceful fallback for development outside Telegram
- **Zustand stores** for game state, user preferences, and streaks
- **Shared libraries**: scoring, daily-seed, CEFR levels, streaks
- **Tailwind CSS** with Telegram theme colours

### ✅ Components
- `GameShell` — Universal wrapper for all games (timer, streak badge, header)
- `ShareCard` — Share results via Telegram or clipboard
- `OnboardingFlow` — Language & difficulty selection
- `StreakBadge` — Streak display with tier emoji
- `TutorCTA` — "Book a tutor" card shown after games

### ✅ Game 1: Connections
**Location:** `src/games/connections/`

- Find 4 groups of 4 related words
- Adapted from existing TutorLingua game with Telegram enhancements:
  - Haptic feedback on tap, correct, wrong
  - Emoji share grid generation
  - Challenge deep links
- Includes puzzle data for ES, FR, DE (7 puzzles each)

### ✅ Game 2: Spell Cast (Honeycomb)
**Location:** `src/games/spell-cast/`

- Hexagonal grid of 19 letters
- 2-minute timer
- Find words by tapping adjacent hexes
- CEFR-weighted scoring with combo multiplier
- Golden centre hex (2x score)
- Includes hex puzzles and word lists for ES, FR, DE

### ✅ Game 3: Speed Clash
**Location:** `src/games/speed-clash/`

- Fast reaction scenario-response game
- 10 rounds per match
- Scenario + 4 response options
- Score based on correctness and speed
- Includes scenarios for ES, FR, DE

## Not Included (Out of Scope for Sprint)
- Word Runner (endless runner game) — would require Canvas animation
- Vocab Clash (card battler) — would require extensive game data
- Ghost racers for Speed Clash — simplified for MVP
- Server API integration — currently offline-first with localStorage
- Advanced CEFR progression system

## Development

### Prerequisites
- Node.js 18+
- npm or pnpm

### Setup
```bash
cd /Users/t.samuels/Desktop/tutor-space/telegram/mini-app
npm install
```

### Development Server
```bash
npm run dev
```

Open http://localhost:3100

**Note:** Telegram-specific features (haptics, theme, share) will gracefully fallback for web development.

### Build
```bash
npm run build
```

Outputs to `dist/` directory.

### TypeScript Check
```bash
npx tsc --noEmit
```

## Deployment

### Vercel (Recommended)
```bash
vercel --prod
```

### Manual
1. Build: `npm run build`
2. Deploy `dist/` folder to any static host
3. Configure Telegram Bot via BotFather:
   - Set Menu Button URL to your deployed URL
   - Enable Mini App in bot settings

## Telegram Bot Setup

### 1. Create Bot
```
/newbot @BotFather
Name: TutorLingua Games
Username: TutorLinguaBot (or similar)
```

### 2. Configure Mini App
```
/setmenubutton @BotFather
Select bot: @TutorLinguaBot
URL: https://your-deployed-url.vercel.app
Button text: Play Games 🎮
```

### 3. Enable Inline Mode (for sharing)
```
/setinline @BotFather
Select bot: @TutorLinguaBot
Placeholder: "Share your score..."
```

## Project Structure

```
src/
├── App.tsx                 # Main router
├── main.tsx               # Entry point
├── telegram.ts            # Telegram WebApp SDK wrapper
├── components/            # Shared components
├── games/                 # Game implementations
│   ├── connections/
│   ├── spell-cast/
│   └── speed-clash/
├── data/                  # Puzzle data
│   ├── connections/
│   ├── spell-cast/
│   └── speed-clash/
├── lib/                   # Shared utilities
│   ├── scoring.ts
│   ├── daily-seed.ts
│   ├── cefr.ts
│   ├── streaks.ts
│   ├── haptics.ts
│   └── share.ts
└── stores/                # Zustand state management
    ├── game.ts
    ├── user.ts
    └── streak.ts
```

## Deep Links

Format: `t.me/TutorLinguaBot?start=<param>`

- `c3` — Connections puzzle #3
- `sc5` — Spell Cast puzzle #5
- `clash7` — Speed Clash puzzle #7
- `connections_challenge_<id>` — Challenge link

## Features

### Offline-First
- All games work without network
- Data syncs when connection available
- LocalStorage for persistence

### Telegram Integration
- Native haptic feedback
- Theme colour adaptation
- Share via Telegram picker
- Deep link routing

### Progressive Difficulty
- CEFR levels: A1, A2, B1, B2
- User selects level in onboarding
- Can adjust in settings

### Streak System
- Daily streak tracking
- Tier system: 🌱 → ✨ → ⚡ → 🔥 → 💎 → 👑
- Perks unlocked at milestones

## Next Steps

### Phase 2 (Post-Launch)
- Server API for cross-device sync
- Leaderboards (global + friends)
- Achievement system
- More puzzle data (30+ per language)
- Word Runner + Vocab Clash games
- Analytics integration

### Bot Features
- `/streak` command
- Daily puzzle notifications (opt-in)
- Challenge reminders
- Weekly stats summary

## British English
All user-facing text uses British spelling and conventions.

## License
Proprietary — TutorLingua 2026
