# TutorLingua Games — Distribution Playbook

## Overview

Free daily word games as a top-of-funnel acquisition engine for TutorLingua's tutoring marketplace.

**Funnel:** Play free games → Build habit → See tutor CTA → Book lesson

---

## Channel 1: Telegram Mini App (PRIMARY)

### Why Telegram First
- **750M+ MAU**, fastest-growing messenger
- Mini Apps = native web apps inside Telegram (no download, instant)
- Viral sharing built in (inline bot, forward, groups)
- Language learning communities are massive on Telegram
- Bot API = automated engagement (daily notifications, streaks)

### Bot Setup Checklist
- [ ] Create bot via @BotFather (`@tutorlingua_games_bot`)
- [ ] Set webhook → `/api/telegram/webhook`
- [ ] Set commands, menu button, descriptions
- [ ] Create Mini App in BotFather (link to `/games`)
- [ ] Set bot profile picture
- [ ] Test deep linking (`tg://resolve?domain=tutorlingua_games_bot&startapp=connections`)

### Growth Tactics
1. **Telegram language learning groups** — post daily results with bot link
2. **Cross-promotion** with other educational bots
3. **Daily push notifications** (opt-in) at user's preferred time
4. **Group leaderboards** — who scored highest in the group today?
5. **Inline sharing** — `@tutorlingua_games_bot` in any chat to share results

### Metrics to Track
- Bot starts (from `/start`)
- DAU (daily active users)
- Games played / session
- Share rate (% who share results)
- Conversion to tutorlingua.co

---

## Channel 2: Reddit (ORGANIC)

### Target Subreddits
| Subreddit | Subscribers | Strategy |
|-----------|------------|----------|
| r/languagelearning | 1.8M | Share as useful resource, not promo |
| r/learnspanish | 400K+ | Spanish-specific puzzles |
| r/learnfrench | 300K+ | French-specific puzzles |
| r/learnGerman | 200K+ | German-specific puzzles |
| r/EnglishLearning | 500K+ | English for non-native speakers |
| r/TEFL | 100K+ | Teachers looking for classroom tools |
| r/wordgames | 15K | Direct audience |
| r/puzzles | 200K+ | Daily puzzle enthusiasts |
| r/telegramgroups | 50K+ | Promote the bot directly |

### Reddit Post Templates

**r/languagelearning — Value-first post:**
```
Title: I built daily word games for language learners (Connections, Word Ladder, etc.) — free, no ads, 4 languages

Been learning Spanish and noticed there aren't many daily puzzle games designed specifically for language learners. NYT Games is great but English-only.

So I built TutorLingua Games — 6 daily word games you can play in English, Spanish, French, or German:

🧩 Lingua Connections — group 16 words into 4 hidden categories (think NYT Connections but with false friends, idioms, and grammar traps)

🪜 Word Ladder — change one letter at a time to reach the target word

🔐 Daily Decode — crack a cipher to reveal a famous quote

🎯 Odd One Out — spot the word that doesn't belong

📝 Missing Piece — fill in the gap (tests grammar, prepositions, tenses)

🌀 Synonym Spiral — climb from basic synonyms to literary/poetic ones

Each puzzle is designed around common learning pitfalls — homophones, false friends, irregular plurals, etc. New puzzles daily.

Play free: tutorlingua.co/games (also on Telegram as a Mini App)

Would love feedback from fellow learners!
```

**r/EnglishLearning — Helpful tool post:**
```
Title: Free daily word games to practise tricky English (homophones, phrasal verbs, irregular plurals)

Hey everyone! I made a set of free daily word games specifically for English learners. Each puzzle targets common mistakes:

- Homophones (their/there/they're)  
- False friends (actual ≠ actualmente!)
- Irregular plurals (child → children, sheep → sheep)
- Phrasal verbs (give up, turn up, make up)
- Grammar patterns (lay vs lie, affect vs effect)

6 different games, new puzzles every day. Works in your browser, no account needed.

Link: tutorlingua.co/games

Also available as a Telegram Mini App: t.me/tutorlingua_games_bot

Curious what you all think — any common mistakes I should add to future puzzles?
```

**r/TEFL — Teacher resource post:**
```
Title: Free daily word games you can use with ESL students (A1-C2, browser-based)

Just launched TutorLingua Games — 6 daily word puzzles designed for ESL/EFL learners. Thought teachers here might find them useful:

- Works on any device (browser-based, no app install)
- 4 languages: EN, ES, FR, DE
- Targets common learner mistakes (false friends, homophones, irregular forms)
- Difficulty ranges from A1 to C2
- Free, no ads, no tracking

I use them as warm-ups in my own lessons — 5 minutes at the start to get students thinking about words.

Link: tutorlingua.co/games

Would love to hear what games/exercises you use for vocabulary warm-ups!
```

### Reddit Rules
- **Never spam** — 1 post per subreddit, max 2 subreddits per day
- **Engage authentically** — reply to every comment
- **Show don't tell** — include screenshots/GIFs
- **Accept feedback** — even negative

---

## Channel 3: Instagram

### Content Strategy
1. **Daily puzzle teasers** — "Can you find the 4 categories?" with emoji grid
2. **Result cards** — Show solved puzzles with "I scored X" format
3. **Language tips** — "Did you know? 'Embarrassed' ≠ 'embarazada'" (false friends)
4. **Reels** — Screen recordings of solving puzzles (30-60 seconds)
5. **Stories** — Interactive polls: "Which word is the odd one out?"

### Hashtags
`#languagelearning #ESL #learnenglish #learnspanish #wordgames #dailypuzzle #vocabulary #polyglot #bilingual #tutorlingua`

---

## Channel 4: Facebook Groups

### Target Groups
- "Learn English" groups (millions of members)
- "English Learners & Teachers" groups
- Language exchange groups
- ESL Teacher groups

### Strategy
- Share as a free resource, never hard-sell
- Post Monday mornings: "New week of puzzles ready!"
- Encourage members to share their scores

---

## Channel 5: SEO (Long-term)

### Target Keywords
| Keyword | Volume | Difficulty | Current Page |
|---------|--------|-----------|-------------|
| language learning games | 14K/mo | Medium | /games |
| word games for language learners | 1K/mo | Low | /games |
| daily word puzzle | 8K/mo | High | /games/connections |
| connections game | 200K/mo | High | /games/connections |
| cryptogram puzzle | 30K/mo | Medium | /games/daily-decode |
| synonym finder game | 2K/mo | Low | /games/synonym-spiral |

### SEO Checklist
- [x] Sitemap with language-specific URLs
- [x] Per-game SEO layouts with OG + Twitter metadata
- [x] JSON-LD structured data (WebApplication schema)
- [x] Keywords in metadata
- [ ] Blog posts targeting long-tail keywords
- [ ] "How to play" pages with internal links
- [ ] Alt text on all images
- [ ] FAQ schema on game pages

---

## Channel 6: Product Hunt

### Positioning
"NYT Games for Language Learners — 6 Free Daily Word Puzzles in 4 Languages"

### Timing
- Launch on a Tuesday or Wednesday
- Have 30+ days of puzzles ready
- Recruit 10+ hunters for upvotes
- Prepare a maker intro video

---

## Metrics Dashboard (Future)

| Metric | Target (Month 1) | Target (Month 3) |
|--------|------------------|------------------|
| Daily Active Users | 50 | 500 |
| Games played/day | 100 | 2,000 |
| Share rate | 10% | 15% |
| Telegram bot users | 200 | 2,000 |
| Organic search traffic | 50/day | 500/day |
| Conversion to tutor page | 2% | 5% |
