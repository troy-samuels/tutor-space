# TutorLingua Game Engine — Strategy & Architecture
## v2 — Refined 16 Feb 2026

---

## The Thesis

Games are the top-of-funnel that practice never will be. Practice requires intent ("I want to learn Spanish"). Games require curiosity ("Can I beat this?"). Every game session is a soft onboarding into the TutorLingua ecosystem.

**The flywheel:**
```
Casual player → daily game ritual → shares score → friend plays → discovers TutorLingua
         ↑                                                                          ↓
  Tutor assigns game ← Correction Loop triggers booking ← Player realises gaps ←───┘
```

---

## The 5 Games

### 1. Lingua Connections (The Anchor — High Virality)
**Format:** 16 words in target language. Group into 4 categories of 4.  
**Daily:** Same puzzle for everyone. One per day.

**Design Principles:**
- **Lateral Semantic Linking** — avoid simple categories ("Animals", "Colours"). Use deceptive overlaps where words could belong to multiple groups.
- **False Friends / Deceptive Cognates** — the signature mechanic. Include words like Spanish *actual* (current), *real* (royal), *sensible* (sensitive). The "aha" moment when players realise a word doesn't mean what they assumed is the story they tell people.
- **"Vibe Clue" AI Hints** — hints don't reveal answers. They give lateral context: "These words are all things you'd overhear in a 1920s Buenos Aires café." Powered by AI but pre-generated daily.
- **Difficulty colours** (🟨🟩🟦🟪) from easiest to hardest category, matching NYT Connections format.

**Share Card:**
```
Lingua Connections 🇪🇸 #47
🟨🟩🟦🟪
Solved in 3:42 · 1 mistake
tutorlingua.co/games/connections
```

**Funnel:** "You grouped 'actual' with 'real' — both are False Friends! 73% of B1 students make this mistake. [See why →]"

---

### 2. Lingua Strands (The Visual Hook — TikTok Native)
**Format:** 6×8 letter grid. Find themed vocabulary words hidden in bending paths. Theme clue given as emoji rebus or target-language riddle (NOT native language).

**Design Principles:**
- **Ghost Words** — valid words in the grid that don't belong to the theme. Finding 3 ghost words earns "Hint Energy" to reveal one theme word. Flips penalty into reward.
- **Visual/Emoji Clues** — theme is hinted with emojis (🍳🥘🍷 = "En la cocina") rather than English text. Forces target-language thinking.
- **Liquid Motion UX** — found paths glow and pulse. On mobile: haptic feedback on word completion. The "feel" is the content — screen recordings of glowing paths are inherently TikTok-worthy.
- **Spangram** — one word that spans the entire grid and names the theme.

**Share Card:** Grid image with coloured paths showing found words.

**Funnel:** "You found 5/7 kitchen words. The ones you missed are commonly used in restaurant conversation. [Try a restaurant roleplay →]"

---

### 3. Spell Cast (The Breadth Tester — Addictive Loop)
**Format:** 7-letter honeycomb. Form as many valid target-language words as possible. One mandatory centre letter.

**Design Principles:**
- **CEFR-Weighted Scoring** — common A1 words (casa, mesa) = base points. C1 words (desconcertante, imprescindible) = double/triple points. Rewards vocabulary depth.
- **Level-Up Bonuses** — finding advanced words unlocks "Scholar" → "Genius" → "Maestro" ranks.
- **Semantic Distance Coaching** — AI backend categorises found words: "You found all concrete nouns but missed the abstract ones." This is coaching disguised as a game hint.
- **Pangram bonus** — using all 7 letters in one word = massive bonus.

**Share Card:**
```
Spell Cast 🇫🇷 #31
🏆 Maestro · 187 points
Found 23 words (3 rare!)
tutorlingua.co/games/spell-cast
```

**Funnel:** "You scored Genius but missed 'imprescindible.' Advanced vocabulary is what separates B2 from C1. [Take a level assessment →]"

---

### 4. Speed Clash (The Competitive Engine — High Retention)
**Format:** 10 rapid-fire "reaction phrases." NOT simple translation — show a situation image/emoji and pick the most natural target-language response. 60-second timer. Challenge a friend via link.

**Design Principles:**
- **Reaction Phrases > Translation** — instead of "translate: I am hungry," show 🧊❄️ (cold room) and 4 target-language responses. Pick the most natural. Tests pragmatic competence, not dictionary recall.
- **Ghost Racers** — while playing, see a progress bar showing the challenger's pace as a "ghost" icon. Async feels like live racing.
- **Haptic Heartbeat** — final 10 seconds: phone pulses like a heartbeat. High adrenaline = high memorability = high sharing.
- **"Losing Concept" Diagnosis** — post-game: "You lost 3 seconds on Subjunctive Verbs. Want a 5-minute cheat sheet session with a TutorLingua coach to win the rematch?"

**Share Card:** Side-by-side score comparison with time bars.

**Funnel:** The "Losing Concept" is the most qualified lead possible. The student knows exactly what they're weak at, and the CTA offers to fix that specific thing.

---

### 5. Daily Decode (The Master Game — High Conversion)
**Format:** A paragraph in target language with 5 words replaced by 🔲 blanks. Context clues only. No multiple choice — type the word.

**Design Principles:**
- **Global Storyline** — every user gets the same "chapter" of a mystery story that unfolds over a month. Not isolated paragraphs — a narrative that builds. Miss a day, miss a chapter (drives streaks).
- **Community Hints** — if 50% of players fail a specific blank, a "Community Insight" unlocks: a short video clip of a TutorLingua tutor explaining the cultural nuance.
- **CEFR Level Detection** — score maps to fluency level. "You decoded 4/5. You're at B2. Students at this level usually struggle with [Topic]."
- **Fluency Heatmap Share Card** — a blurred paragraph where correct words glow in neon and missed words are "glitched out." Creates "I need to fix this" psychological itch.

**Share Card:**
```
Daily Decode 🇩🇪 Ch.12
████ decoded ████ 
4/5 · B2 Level
[Glitched heatmap image]
tutorlingua.co/games/decode
```

**Funnel:** "Book a free assessment to bridge the gap" — this is the highest-intent CTA because the player has just proven to themselves what they don't know.

---

## 2026 Growth Rules

### 1. The Correction Loop Is the Sale
Every "Game Over" screen has an "Explain my mistakes" button → 60-second AI explanation → "Still confused? This grammar point is being covered in tomorrow's Live Drop session on TutorLingua. [Join Session]"

### 2. Design for Silent Socials
- 100% playable on mute
- Captivating captions for all audio moments
- "Share to Story" generates a vertical video of best moments with lo-fi background track
- All animations are satisfying without sound

### 3. Streaks Are Currency
Streak points can be spent on TutorLingua perks:
- 7-day streak → unlock themed word pack
- 14-day streak → 10-min emergency conversation with a tutor
- 30-day streak → free level assessment session
This makes gameplay literally worth money.

---

## Architecture

### Directory Structure
```
app/(public)/games/
  page.tsx                         # Game hub / arcade
  layout.tsx                       # Shared game layout
  connections/
    page.tsx                       # Lingua Connections
  strands/
    page.tsx                       # Lingua Strands
  spell-cast/
    page.tsx                       # Spell Cast
  speed-clash/
    page.tsx                       # Speed Clash  
  decode/
    page.tsx                       # Daily Decode

components/games/
  engine/
    GameShell.tsx                   # Shared wrapper (header, score, timer, share)
    ScoreCard.tsx                   # End-of-game results + explain mistakes CTA
    ShareCard.tsx                   # Social share image generator
    ShareToStory.tsx               # Vertical video generator
    StreakTracker.tsx               # Cross-game streak (localStorage)
    DailyChallenge.tsx             # Same-seed-for-everyone daily mode
    Timer.tsx                       # Countdown with haptic heartbeat
    HintSystem.tsx                 # Vibe Clues / Ghost Words / Hint Energy
    CorrectionLoop.tsx             # "Explain my mistakes" → AI → tutor CTA
    TutorCTA.tsx                   # Contextual "find a tutor" prompts
    SoundEngine.tsx                # Optional sound effects (respects mute)
  
  connections/
    ConnectionsGame.tsx
    WordGrid.tsx                   # 4×4 word grid
    CategoryReveal.tsx             # Animated category reveal
  
  strands/
    StrandsGame.tsx
    LetterGrid.tsx                 # 6×8 grid with path drawing
    GhostWordTracker.tsx
  
  spell-cast/
    SpellCastGame.tsx
    Honeycomb.tsx                  # 7-letter hex grid
    WordList.tsx                   # Found words with CEFR tags
  
  speed-clash/
    SpeedClashGame.tsx
    ReactionCard.tsx               # Situation + response options
    GhostRacer.tsx                 # Async opponent progress bar
    ResultComparison.tsx           # Side-by-side scores
  
  decode/
    DecodeGame.tsx
    StoryParagraph.tsx             # Paragraph with blanks
    FluencyHeatmap.tsx             # Visual share card
    CommunityHint.tsx              # Tutor video hints

lib/games/
  engine.ts                        # Core game loop utilities
  scoring.ts                       # Universal scoring (with CEFR weighting)
  daily-seed.ts                    # Deterministic daily seed generator
  share.ts                         # Share URL + OG image generation
  streaks.ts                       # Cross-game streak management
  correction-loop.ts               # AI mistake explanation
  
  data/
    connections/                   # Daily puzzle definitions
      es.json                      # Spanish puzzles
      fr.json
      de.json
      ...
    strands/
      es.json
      fr.json
      de.json
    spell-cast/
      es.json                      # Valid word lists + CEFR levels
      fr.json
      de.json
    speed-clash/
      scenarios.json               # Situation images + response sets
    decode/
      stories/                     # Monthly story chapters
        2026-02/
          es.json
          fr.json
          de.json
  
  word-data/
    false-friends.ts               # Deceptive cognates per language pair
    cefr-levels.ts                 # Word → CEFR level mapping
    gender-data.ts                 # Noun genders (FR/DE/ES)
    frequency-lists.ts             # Word frequency rankings

app/api/
  og/games/
    [gameSlug]/route.tsx           # Dynamic OG images for share cards
  games/
    daily/route.ts                 # Daily challenge seed + puzzle
    leaderboard/route.ts           # Anonymous leaderboard
    challenge/route.ts             # Create/resolve challenge links
    explain/route.ts               # AI mistake explanation endpoint
    community-hints/route.ts       # Aggregate community failure data
```

### Shared GameShell Props
```typescript
interface GameShellProps {
  gameSlug: string;
  gameName: string;
  language: string;
  dailyNumber: number;
  children: React.ReactNode;
  
  // State
  isComplete: boolean;
  score?: GameScore;
  mistakes?: Mistake[];
  
  // Config
  showTimer?: boolean;
  timerMode?: 'countdown' | 'countup';
  timerSeconds?: number;
  hapticHeartbeat?: boolean;  // pulse in final 10s
  
  // Hints
  hintSystem?: 'vibe-clue' | 'ghost-words' | 'none';
  hintsAvailable?: number;
  
  // Share
  shareText: string;
  shareGrid?: string;          // emoji grid for text sharing
  shareImageUrl?: string;      // OG image URL
}
```

---

## Build Order

### Week 1: Engine + Lingua Connections
1. GameShell, ScoreCard, ShareCard, StreakTracker, DailyChallenge, Timer
2. Lingua Connections game logic + UI
3. False Friends data for ES/FR/DE
4. Daily seed system
5. OG image generation for share cards
6. /games hub page

### Week 2: Speed Clash
1. ReactionCard, GhostRacer, ResultComparison
2. Situation/response data sets
3. Challenge link system (create + resolve)
4. Haptic heartbeat timer
5. "Losing Concept" diagnosis

### Week 3: Lingua Strands
1. LetterGrid with path drawing
2. Ghost word system
3. Emoji/rebus clue system
4. Liquid motion animations
5. Spangram mechanic

### Week 4: Spell Cast
1. Honeycomb component
2. Valid word lists with CEFR tagging
3. Semantic distance scoring
4. Pangram detection

### Week 5: Daily Decode
1. Story paragraph with blanks
2. Monthly story content pipeline
3. Community hint aggregation
4. Fluency heatmap share card
5. CEFR level detection

---

## Content Pipeline

### AI-Generated (Weekly Automation)
- Connections puzzles: AI generates 7 puzzles/week per language with false friends
- Strands grids: AI generates grids from themed word lists
- Spell Cast: Valid word lists extracted from dictionary APIs
- Speed Clash: AI generates situation/response sets
- Decode: AI writes monthly story chapters (reviewed by humans)

### Human-Curated
- False friends database (initial seed, then community-contributed)
- Monthly story arcs for Daily Decode
- Community hint videos from tutors
- Quality review of AI-generated puzzles

---

## Success Metrics

| Metric | Target (Month 1) | Target (Month 3) |
|--------|------------------|------------------|
| Daily active players | 500 | 5,000 |
| Games played / day | 1,500 | 20,000 |
| Share rate | 15% | 20% |
| Challenge link creation | 10% | 15% |
| "Explain mistakes" click | 25% | 30% |
| Tutor booking from games | 2% | 5% |
| 7-day streak retention | 20% | 35% |
| 30-day streak retention | 5% | 15% |
