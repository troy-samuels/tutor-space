# TutorLingua Telegram Mini App — Strategy & Implementation

## Current State

### ✅ What's Built
- Full Telegram WebApp SDK integration (`lib/telegram.ts`)
- Safe area, fullscreen, haptics, back button, main/secondary buttons
- TelegramProvider with CSS custom property injection
- Theme adaptation (inherits Telegram dark/light mode)
- Closing confirmation during active gameplay
- Inline query share (`switchInlineQuery`)
- 6 working games with EN/ES/FR/DE support
- Light theme (NYT Games-inspired) for game canvas
- Tab bar with Play/Streak/Challenge/Learn/Profile (4 coming soon)

### ❌ What's Missing
1. **No Telegram Bot registered** — no @BotFather bot, no Mini App URL
2. **No share flow** — emoji share cards designed but not wired to Telegram share
3. **No inline bot** — can't share puzzles via `@tutorlingua_bot` in chats
4. **No deep linking** — can't link to specific games/languages
5. **No user identity** — not using `initDataUnsafe` for user tracking
6. **No push notifications** — no webhook for daily puzzle reminders
7. **English wasn't supported** (now fixed)

---

## Phase 1: Bot Registration & Mini App Setup

### 1.1 Create Bot via @BotFather
```
/newbot
Name: TutorLingua Games
Username: tutorlingua_games_bot (or tutorlingua_bot if available)
```

### 1.2 Set Mini App URL
```
/newapp
URL: https://tutorlingua.com/games
Short name: games
```

### 1.3 Configure Bot Settings
```
/setdescription — "Daily language learning games 🎮 Play Connections, Word Ladder, and more in 4 languages"
/setabouttext — "Free daily word games for language learners. Like NYT Games, but for every language."
/setuserpic — [TutorLingua logo]
/setcommands:
  start - Open the games hub
  play - Today's puzzles
  connections - Play Lingua Connections
  wordladder - Play Word Ladder
  decode - Play Daily Decode
  streak - Check your streak
  language - Change language (en/es/fr/de)
```

### 1.4 Enable Inline Mode
```
/setinline — "Share your game result"
```

### 1.5 Menu Button
```
/setmenubutton
Type: web_app
Text: "🎮 Play"
URL: https://tutorlingua.com/games
```

---

## Phase 2: UI/UX Optimisation for Telegram

### 2.1 Viewport Sizing
Telegram Mini Apps run in a WebView with specific dimensions:
- **Default**: ~60% screen height (expandable)
- **Expanded**: Full height minus header (~44px on iOS, ~56px on Android)
- **Fullscreen**: Edge-to-edge (we request this on init — good)

**Current issues:**
- Game hub cards use `aspect-ratio: 16/9` which may overflow on smaller phones
- Tab bar height (56px + safe area) eats into game area
- Content padding uses fixed px values, should scale with viewport

**Fixes needed:**
```css
/* Dynamic card sizing based on available viewport */
.tg-app .game-hero-card {
  aspect-ratio: auto;
  min-height: 72px;
  max-height: 100px;
}

/* Compact tab bar in Telegram */
.tg-app .game-tab-bar {
  --tab-height: 48px; /* vs 56px default */
}

/* Game tiles should use viewport-relative sizing */
.tg-app .game-tile {
  min-height: max(40px, 8dvh);
  font-size: clamp(0.8rem, 2.5dvh, 1.1rem);
}
```

### 2.2 Telegram-Specific Layout Adjustments
- **Hide web nav** when in Telegram (already done ✅)
- **Use BackButton** instead of breadcrumb (already done ✅)
- **Use MainButton** for primary CTA (already done ✅)
- **Reduce vertical spacing** — Telegram viewport is tighter
- **Game tiles**: use `dvh` units for tile heights so they scale with viewport
- **Keyboard handling**: When input is needed (Word Ladder), use `visualViewport` API to resize

### 2.3 Share Flow (Wordle-style)
When game completes:
1. Generate emoji grid (game-specific format)
2. **In Telegram**: Use `switchInlineQuery` to share as inline message
3. **Fallback**: Copy to clipboard + "Copied!" toast

**Share card format:**
```
🇬🇧 Lingua Connections #42
🟩🟩🟩🟩
🟨🟨🟨🟨
🟦⬜🟦🟦
🟪🟪🟪🟪
3/4 · 1 mistake

Play: t.me/tutorlingua_games_bot/games
```

### 2.4 Deep Links
Support `tg://resolve?domain=tutorlingua_games_bot&startapp=<param>`:
- `connections` → Open Connections game
- `connections_es` → Open Connections in Spanish
- `wordladder_fr` → Open Word Ladder in French
- `daily` → Open today's recommended puzzle
- `challenge_<userId>` → Open a friend's challenge

Parse `startapp` param in the layout and redirect to the correct game.

---

## Phase 3: Distribution Strategy

### 3.1 Telegram Groups & Channels

**Target language learning groups (search & join):**
- English learning groups (massive reach on Telegram)
- Spanish/French/German learner communities
- Polyglot channels
- ESL teacher channels

**Strategy:**
1. Join 10-20 relevant groups
2. Share daily puzzle results as a regular user
3. When someone asks "what game is that?" → share bot link
4. Eventually post "Daily puzzle is live" in groups that allow it

**Key channels to target:**
- Language Exchange Telegram groups
- ESL/TEFL teacher channels
- Study motivation groups
- Daily challenge/quiz channels

### 3.2 Viral Mechanics

**A. Emoji Share Grid (THE killer feature)**
- Every game generates a shareable emoji grid on completion
- One-tap share via Telegram inline
- Works in groups, DMs, channels
- Spoiler-free (shows performance, not answers)

**B. Challenge-a-Friend**
- Generate `t.me/tutorlingua_games_bot?startapp=challenge_<id>` links
- Async: friend plays same puzzle, compare scores
- Ghost racer: show friend's time as you play

**C. Daily Streaks**
- Push notification at consistent time: "Your streak is at risk! 🔥"
- Streak freezes (1 per week)
- Streak milestones (7, 30, 100 days)

**D. Leaderboards**
- Within Telegram group: "/leaderboard" shows top players
- Global: top 100 on website
- Weekly reset for competitive freshness

### 3.3 Bot Commands for Engagement
```
/daily — Show today's puzzles with inline buttons
/streak — Show your current streak + achievements
/challenge @friend — Send a puzzle challenge
/leaderboard — This week's top players
/language en|es|fr|de — Set preferred language
```

Each command returns a message with an inline button to open the Mini App.

### 3.4 Inline Bot
Users can type `@tutorlingua_games_bot` in any chat to share:
- Their latest result (emoji grid)
- A challenge link
- Today's puzzle invitation

This is the PRIMARY distribution mechanism — it's how Wordle went viral, but native to Telegram.

---

## Phase 4: Content Generation with Imagen/Gemini

### 4.1 What We Need

**For Telegram:**
- Bot profile picture (512x512)
- Mini App splash/preview image
- Share preview images (when links are pasted)

**For Social Media (cross-domain):**
- Instagram posts/reels thumbnails (1080x1080, 1080x1920)
- Facebook group posts (1200x630)
- Twitter/X cards (1200x600)
- OG images for each game page

**For the Website:**
- Game card thumbnails
- Hero images
- Achievement badges

### 4.2 Gemini API for Image Generation

**Option A: Gemini 2.5 Flash Image (cheapest, fastest)**
- Native image generation built into the LLM
- Supports text-to-image
- Good for quick social content, thumbnails
- API: `generateContent` with `responseModalities: ["TEXT", "IMAGE"]`

**Option B: Imagen 4 (highest quality)**
- Best for hero images, brand materials
- Via Vertex AI or Google AI Studio
- Supports aspect ratio control
- Higher cost per image

**Option C: Gemini 3 Pro Image (best balance)**
- High quality + text rendering
- Good for OG images with text overlays
- Supports multiple aspect ratios

### 4.3 Required API Access

**What Troy needs to provide:**
1. **Google AI Studio API key** (free tier: 60 requests/min)
   - Get from: https://aistudio.google.com/apikey
   - Supports: Gemini Flash Image, Gemini Pro Image
   - Free for experimentation, pay-per-use for production

2. **Or: Google Cloud project with Vertex AI enabled**
   - More expensive but higher limits
   - Supports Imagen 3 + Imagen 4
   - Better for production pipeline

### 4.4 Content Pipeline Design

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│  Prompt      │ →  │  Gemini API  │ →  │  Resize &   │
│  Templates   │    │  (Image Gen) │    │  Optimize   │
└─────────────┘    └──────────────┘    └─────────────┘
                                              │
                         ┌────────────────────┼────────────────┐
                         ▼                    ▼                ▼
                   ┌───────────┐      ┌──────────┐    ┌──────────┐
                   │ Telegram  │      │ Instagram│    │ Facebook │
                   │ Bot/MiniApp│     │ Posts    │    │ Posts    │
                   └───────────┘      └──────────┘    └──────────┘
```

**Prompt templates for each domain:**

**Telegram Bot Avatar:**
```
A modern, minimal game controller icon merged with a speech bubble,
gradient from blue to purple, clean vector style, white background,
suitable for a Telegram bot profile picture, 512x512
```

**Instagram Carousel:**
```
A vibrant, eye-catching language learning game screenshot mockup,
showing a 4x4 word grid with colorful category highlighting,
mobile-first design, modern UI, "Can you solve this?" text overlay,
aspect ratio 4:5
```

**OG Image Template:**
```
A clean, premium social share card for "[Game Name]",
showing emoji result grid, game branding "TutorLingua",
warm gradient background, modern typography,
1200x630 pixels
```

### 4.5 Aspect Ratios & Sizing Reference

| Platform | Dimension | Aspect Ratio | Use Case |
|----------|-----------|-------------|----------|
| Telegram Bot | 512×512 | 1:1 | Profile picture |
| Telegram Preview | 1280×720 | 16:9 | Link preview |
| Instagram Post | 1080×1080 | 1:1 | Feed post |
| Instagram Story | 1080×1920 | 9:16 | Story/Reel |
| Facebook Post | 1200×630 | ~1.9:1 | Feed post |
| Twitter Card | 1200×600 | 2:1 | Summary card |
| OG Image | 1200×630 | ~1.9:1 | Link preview |
| Game Tile (mobile) | ~375×(dynamic) | varies | In-app |

**Gemini API aspect ratios supported:**
- `1:1` — Square (Instagram, Telegram avatar)
- `3:4` / `4:3` — Portrait/landscape
- `9:16` / `16:9` — Tall/wide (stories, previews)
- Custom via Imagen: specify exact pixel dimensions

---

## Phase 5: Implementation Roadmap

### Week 1 (Immediate)
- [x] Fix English puzzle support (build was broken)
- [ ] Register Telegram bot via @BotFather
- [ ] Set Mini App URL
- [ ] Implement deep link parsing (`startapp` param)
- [ ] Wire emoji share grid to `switchInlineQuery`
- [ ] Viewport sizing fixes for Telegram

### Week 2
- [ ] Build bot command handlers (Node.js webhook or edge function)
- [ ] Implement `/daily`, `/streak`, `/challenge` commands
- [ ] Add inline bot mode for result sharing
- [ ] Set up daily notification (streak reminder)
- [ ] Generate Imagen content for bot profile + social media

### Week 3
- [ ] Join 10+ Telegram language learning groups
- [ ] Start sharing daily results in groups
- [ ] Cross-post to Reddit, Instagram, Facebook
- [ ] Set up analytics (PostHog) for game events
- [ ] A/B test share card designs

### Week 4
- [ ] Challenge-a-friend feature
- [ ] In-group leaderboards
- [ ] SEO pages for daily answers
- [ ] Push notification optimisation
- [ ] First 50 signups milestone

---

## Technical Notes

### Telegram Mini App Sizing
```javascript
// Telegram provides these viewport values:
window.Telegram.WebApp.viewportHeight    // Current height
window.Telegram.WebApp.viewportStableHeight  // Height without keyboard
window.Telegram.WebApp.isExpanded        // Whether app is full height

// Our code already calls:
wa.expand()           // Expand to full height
wa.requestFullscreen() // Go edge-to-edge (hides header)
wa.disableVerticalSwipes() // Prevent pull-to-close during gameplay
```

### Share via Inline Query
```javascript
// Already implemented in lib/telegram.ts:
export function tgShareInline(text: string): boolean {
  const wa = getWebApp();
  if (!wa?.switchInlineQuery) return false;
  wa.switchInlineQuery(text, ["users", "groups", "channels"]);
  return true;
}
```

### Deep Link Parsing
```javascript
// In games layout or page:
const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
if (startParam === "connections") router.push("/games/connections");
if (startParam === "connections_es") router.push("/games/connections?lang=es");
```

### Imagen API Call (Node.js)
```javascript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
        responseMimeType: "text/plain",
      },
    }),
  }
);
```
