# TutorLingua Game Roadmap

> 30 language learning games — retro arcade, classic puzzles, light RPG, audio/sensory, and visual/creative. Every game feeds the same learner profile. The games are the diagnostic, the tutors are the cure.

---

## 🕹️ RETRO ARCADE

### 1. Speed Clash
Split-screen typing race. Word appears, type the translation before the timer. Gets faster. Leaderboard. Think Mavis Beacon meets Duolingo.

### 2. Verb Invaders
Space Invaders but the aliens have conjugations. Shoot the correct form before they land. Boss waves = irregular verbs.

### 3. Accent Drop
Tetris but the falling blocks are words missing accents/diacritics. Place them correctly before they stack up. é, ñ, ü — one wrong placement and the row doesn't clear.

### 4. Word Snake
Nokia Snake. Your snake eats letters to spell words. Eat the wrong letter and you shrink. Eat the full word and you grow. Endless mode.

### 5. Lingua Pong
Pong with a twist. Each volley shows a word — translate it correctly to return the ball. Miss the translation, miss the ball.

### 6. Breakout: False Friends
Breakout/Arkanoid. Bricks are "false friend" words. Hit them and their real meaning is revealed. Clear the board = clear the confusion.

### 7. Pac-Verb
Navigate a maze collecting verb forms in the correct tense order (yo, tú, él, nosotros, vosotros, ellos). Ghosts chase you if you collect out of order.

---

## 🧩 CLASSIC PUZZLES

### 8. Connections ✅ (BUILT)
NYT-style 4×4 grouping with language twists. Dark theme, 3 languages (ES/FR/DE), 7 hand-crafted Spanish puzzles, hint system, share-to-clipboard emoji grid, streak tracking.

**Status:** Built and tested. Needs puzzle generator for infinite content.

### 9. Daily Decode
Cryptogram. A famous quote in the target language, encoded. Crack the cipher letter by letter. Hints reveal grammar patterns.

### 10. Crossword Clash
Mini crosswords (5×5) where clues are in English, answers in target language. Daily puzzle + weekly mega grid.

### 11. Word Ladder
Change one letter at a time to transform one word into another. CASA → COSA → COPA → CAPA. Each step must be a real word.

### 12. Synonym Spiral
Start with a basic word, go deeper. Big → Enormous → Gigantic → Gargantuan. AI measures semantic distance using vector embeddings. How deep into the spiral can you go?

### 13. Odd One Out
4 words, 3 share something. Find the imposter. Could be grammar (one's feminine), meaning (one's a false friend), or phonetics (one doesn't rhyme).

### 14. Sentence Sculptor
Scrambled words, build the sentence. Drag tiles into correct order. Timed. Difficulty = longer sentences + subordinate clauses.

### 15. Missing Piece
A sentence with a blank. 4 options. Looks simple but the distractors are nasty — wrong preposition, wrong gender, wrong tense. Grammar sniper training.

---

## ⚔️ LIGHT RPG

### 16. The Negotiator
Roleplay haggling sim. AI plays a stubborn shopkeeper. Buy the vase under €50. Graded on grammar AND cultural politeness.

**AI Tools:** LLM (for dialogue) + Text-to-Speech (for immersion).

**TutorLingua Funnel:** "You were 20% too aggressive for a Spanish social context. Join our 'Cultural Nuance' workshop to master the art of polite conversation."

### 17. Dungeon Declension
Turn-based dungeon crawler. Each room = a grammar challenge. Correct answer = attack. Wrong = enemy hits you. Boss = full paragraph translation. Loot = new vocabulary.

### 18. Potion Brewer
Combine ingredient words (adjective + noun + verb) to brew potions. Grammatically correct combos = powerful potions. Wrong gender agreement = explosion.

### 19. Tavern Tales
You're at a medieval tavern. NPCs tell stories with gaps. Fill in the missing words to keep the story going. Wrong answers = the crowd boos. Chain stories for XP.

### 20. Quest Board
Daily quest system. "Order food at a restaurant in past tense." "Describe your room using only subjunctive." Complete quests for gold. Gold unlocks cosmetics.

### 21. Arena Duel
PvP vocabulary battles (async). Both players get the same word — race to provide more synonyms, conjugations, or example sentences. AI judges quality.

---

## 🎵 AUDIO & SENSORY

### 22. Phantom Phone Call
Listen to a crackly voicemail in the target language. Answer who/what/where. Background noise varies difficulty (busy train station, windy beach). Accent training.

**AI Tools:** ElevenLabs (for realistic voices) + Whisper (for transcription).

**TutorLingua Funnel:** "You missed the location because of the speaker's accent. We have 3 tutors from that specific region available for a 15-minute 'Ear Training' session."

### 23. Lyric Gap
A real song plays (30s clip). Lyrics shown with blanks. Fill them in real-time. Scoring based on speed + accuracy. Weekly featured artist.

### 24. Tone Match
Hear a sentence. Is the speaker angry, sarcastic, happy, or asking a question? Train your ear for intonation, not just words. Critical for tonal understanding.

### 25. Whisper Chain
AI whispers a phrase. You type what you hear. Then it whispers a harder one. Gets progressively faster and more mumbled. How far can you go?

---

## 🎨 VISUAL & CREATIVE

### 26. Vision Quest
AI-generated scene (cyberpunk kitchen, medieval hospital). 60 seconds to tag every object in the target language. Tap-to-label.

**AI Tools:** GPT-4o / Gemini Vision (for image analysis).

**TutorLingua Funnel:** "You know 90% of household objects, but 0% of medical terms. You're ready for our 'Specialized Vocabulary' modules."

### 27. Comic Strip
3-panel comic with empty speech bubbles. Write dialogue that makes the story make sense. AI grades grammar, creativity, and humour. Shareable results.

### 28. The Uncanny Translator
Three translations of a sentence: two are subtly wrong (grammatically correct but culturally "weird"), one is a "Native Human" version. Spot the human one.

**TutorLingua Funnel:** "You have a 'Robot Score' of 70%. Our tutors can help you find your 'Human Voice' in Italian."

### 29. Emoji Decoder
A sequence of emojis represents a phrase or idiom. 🐱👜 = "let the cat out of the bag." Guess the expression in the target language. Gets culturally specific.

### 30. Postcard Writer
AI generates a photo of a destination. Write a postcard home describing it in the target language. AI grades and "sends" it. Collectible stamps for streaks.

---

## 🧠 The Adaptive Engine

The biggest advantage of using LLMs and generative AI is the transition from **"Static Content"** (manually created puzzles) to **"Infinite Procedural Content"** (puzzles that adapt to the user's specific weaknesses in real-time).

### How Codex & AI Tools Automate This

- **Infinite Daily Content:** No content team needed for 365 puzzles. Codex generates puzzles on demand: "Generate a Lingua Connections grid for B1 Spanish students focusing on 'False Friends' and 'Office Tech', ensuring there is exactly one overlapping red herring."
- **Personalised Difficulty:** If a user is crushing the Daily Decode, the AI silently increases the complexity of the syntax for that specific user the next day.
- **Real-time Feedback:** Instead of a "Wrong" red X, the AI generates a one-sentence explanation of why your guess was incorrect based on the context of the game.

### The "Shareable" Secret

For all games, use AI to generate a **"Personality Archetype"** based on playstyle:

| Playstyle | Archetype |
|-----------|-----------|
| Speed Clash players | **The Sonic Speaker** (Fast but messy) |
| Daily Decode players | **The Linguistic Detective** |
| The Negotiator players | **The Diplomat** |
| Dungeon Declension players | **The Grammar Knight** |
| Verb Invaders players | **The Conjugation Commander** |

People don't just share scores; they share identities. These labels drive users back to TutorLingua to "level up" their persona.

### The Funnel

Every game connects to the tutoring marketplace:
- Play games → discover weaknesses → get personalised tutor recommendations
- Share results → friends see the game → viral loop
- Streak system → daily engagement → habit formation
- Archetype labels → identity attachment → retention

---

## Build Priority

| Phase | Games | Notes |
|-------|-------|-------|
| **Phase 1** (Built) | Connections | ✅ Done. Needs puzzle generator. |
| **Phase 2** (Quick wins) | Synonym Spiral, Odd One Out, Missing Piece, Daily Decode, Word Ladder | Classic puzzles, low infra cost, high shareability |
| **Phase 3** (Audio) | Phantom Phone Call, Whisper Chain, Tone Match, Lyric Gap | Needs audio pipeline (ElevenLabs + Whisper) |
| **Phase 4** (RPG) | The Negotiator, Dungeon Declension, Quest Board, Tavern Tales | LLM-powered, higher complexity |
| **Phase 5** (Retro) | Verb Invaders, Speed Clash, Accent Drop, Word Snake | Canvas/game engine needed |
| **Phase 6** (Visual) | Vision Quest, Comic Strip, Postcard Writer, Emoji Decoder | Image generation/analysis |
| **Phase 7** (Social) | Arena Duel, Crossword Clash, The Uncanny Translator | Multiplayer/async infra |
| **Phase 8** (Polish) | Lingua Pong, Breakout, Pac-Verb, Potion Brewer, Sentence Sculptor | Arcade polish, cosmetics, leaderboards |
