# TutorLingua Telegram Bot

The Telegram bot component for TutorLingua Games. This handles:
- User onboarding and language selection
- Deep link routing to Mini App games
- Referral tracking
- Daily puzzle notifications
- Streak warnings
- Challenge system
- Group leaderboards

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env and add your BOT_TOKEN from @BotFather
   ```

3. **Run in development:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

## Configuration

Required environment variables:
- `BOT_TOKEN` - Your Telegram bot token from @BotFather
- `BOT_USERNAME` - Your bot's username (e.g., TutorLinguaBot)

Optional:
- `MINI_APP_URL` - URL of the Mini App (default: https://tutorlingua-telegram.vercel.app)
- `WEB_APP_URL` - URL of the main website (default: https://tutorlingua.com)
- `NOTIFICATION_HOUR` - Hour for daily puzzle notifications (default: 8)
- `STREAK_WARNING_HOUR` - Hour for streak warning notifications (default: 20)

## Commands

User commands:
- `/start` - Start the bot or open a specific game via deep link
- `/play [game]` - Open the Mini App
- `/streak` - Check your current streak
- `/challenge @user <game>` - Challenge a friend
- `/leaderboard` - View top players
- `/help` - Show help message

Group commands:
- `/groupchallenge [game]` - Start a group challenge
- `/groupleaderboard` - Show group rankings (coming soon)
- `/groupstats` - Show group statistics (coming soon)

## Deep Links

The bot supports these deep link formats:

**Game links:**
- `t.me/TutorLinguaBot?start=c15` - Connections puzzle #15
- `t.me/TutorLinguaBot?start=sc20` - Spell Cast puzzle #20
- `t.me/TutorLinguaBot?start=clash10` - Speed Clash puzzle #10
- `t.me/TutorLinguaBot?start=wr` - Word Runner
- `t.me/TutorLinguaBot?start=vc` - Vocab Clash

**Other:**
- `t.me/TutorLinguaBot?start=ref_12345` - Referral link
- `t.me/TutorLinguaBot?start=ch_abc123` - Challenge link

## Testing

Run tests:
```bash
npm test
```

Watch mode:
```bash
npm run test:watch
```

## Architecture

```
src/
├── index.ts              # Bot entry point
├── config.ts             # Configuration
├── commands/             # Command handlers
│   ├── start.ts
│   ├── play.ts
│   ├── streak.ts
│   ├── challenge.ts
│   ├── leaderboard.ts
│   └── help.ts
├── middleware/           # Middleware
│   ├── auth.ts
│   └── referral.ts
├── notifications/        # Notification senders
│   ├── daily-puzzle.ts
│   ├── streak-warning.ts
│   └── challenge.ts
├── group/               # Group chat features
│   └── commands.ts
└── utils/               # Utilities
    ├── deep-links.ts
    ├── share-cards.ts
    └── user-store.ts
```

## Data Storage

For MVP, data is stored in JSON files:
- `data/users.json` - User profiles
- `data/challenges.json` - Challenge records
- `data/referrals.json` - Referral relationships

**TODO:** Migrate to PostgreSQL/Supabase for production.

## Notifications

The bot can send scheduled notifications:

**Daily Puzzle (8 AM):**
```typescript
import { bot, sendDailyPuzzleNotifications } from './src/index.js';
await sendDailyPuzzleNotifications(bot);
```

**Streak Warning (8 PM):**
```typescript
import { bot, sendStreakWarningNotifications } from './src/index.js';
await sendStreakWarningNotifications(bot);
```

Set these up with cron jobs or a task scheduler in production.

## Deployment

**Railway:**
1. Connect GitHub repository
2. Set environment variables
3. Deploy with `npm start`

**Vercel Edge Functions:**
1. Use webhook mode instead of polling
2. Create API route for webhook
3. Set webhook URL via Telegram API

## British English

All user-facing text uses British English spelling and conventions:
- "Realise" not "realize"
- "Colour" not "color"
- "Organised" not "organized"

## Contributing

Follow these guidelines:
- TypeScript strict mode
- Use grammy framework
- British English in UI text
- Test all edge cases
- Handle errors gracefully

## License

ISC
