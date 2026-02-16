# Game Learning Upgrade — A1 to B2 Progression
## Grounded in CEFR Framework + Krashen's Input Hypothesis + Nation's Four Strands

---

## Current State Assessment

### What Exists (6 games, 3 languages)
| Game | Languages | Puzzles/lang | CEFR Coverage | Difficulty System |
|------|-----------|-------------|---------------|-------------------|
| Connections | ES/FR/DE | ~7 | Mixed A2-B1 | Colour-coded (yellow→purple) |
| Daily Decode | ES/FR/DE | ~8 | Mixed A1-B2 | easy/medium/hard |
| Missing Piece | ES/FR/DE | ~7 | A1-B2 ✅ | 1-2-3 per sentence |
| Odd One Out | ES/FR/DE | ~7 | A1-B1 | 1-2-3 per round |
| Synonym Spiral | ES/FR/DE | ~7 | A2-C1 | Depth 1-5 |
| Word Ladder | ES/FR/DE | ~8 | A1-A2 only | None |

### What's Missing for A1→B2 Journey
1. **No explicit CEFR level tagging** on puzzles or game sessions
2. **No adaptive difficulty** — player always sees the same puzzle regardless of level
3. **Only 3 languages** — spec promises 16
4. **~7 puzzles per game** — need 30+ per level for meaningful progression
5. **No progression system** linking games to learning outcomes
6. **Audio module** has no CEFR-graded content
7. **CompoundBridge** (CJK) has sample data only
8. **No grammar/vocabulary scope & sequence** mapped to CEFR

---

## CEFR Scope & Sequence for Games

### A1 — Breakthrough (Beginner)
**Vocabulary:** ~500 words. Greetings, numbers, colours, family, food, weather, days/months, basic adjectives
**Grammar:** Present tense (regular), articles, gender, basic prepositions, ser/estar distinction, basic questions
**Games should test:** Recognition, matching, basic recall

### A2 — Waystage (Elementary)  
**Vocabulary:** ~1000 words. Travel, shopping, directions, body, house, hobbies, emotions
**Grammar:** Past tenses (preterite vs imperfect), future (ir + a), reflexive verbs, object pronouns, comparatives
**Games should test:** Contextual usage, false friends, common collocations

### B1 — Threshold (Intermediate)
**Vocabulary:** ~2000 words. Work, health, media, opinions, abstract nouns
**Grammar:** Subjunctive (basic triggers), conditional, por vs para, relative clauses, reported speech
**Games should test:** Nuanced meaning, idioms, pragmatic appropriateness

### B2 — Vantage (Upper Intermediate)
**Vocabulary:** ~4000 words. Academic, formal, idiomatic, register awareness
**Grammar:** Advanced subjunctive, complex conditionals, passive voice, discourse markers, subjunctive in relative clauses
**Games should test:** Style, register, advanced collocations, cultural nuance

---

## Task List

### Phase 1: CEFR Infrastructure (Foundation)
- [x] T1.1 — Create shared `CefrLevel` type and level utility functions
- [x] T1.2 — Add `cefrLevel` field to all puzzle/sentence types
- [x] T1.3 — Create `DifficultySelector` component (A1/A2/B1/B2 picker shown before each game)
- [x] T1.4 — Create `LevelProgressBar` showing CEFR progress within a game session
- [x] T1.5 — Update `GameShell` to accept and display CEFR level

### Phase 2: Puzzle Content Expansion (30+ per level per language)
- [x] T2.1 — Missing Piece: 30 puzzles × 4 levels × ES (highest learning value game)
- [x] T2.2 — Odd One Out: 30 puzzles × 4 levels × ES
- [x] T2.3 — Connections: 15 puzzles × 4 levels × ES
- [x] T2.4 — Word Ladder: 20 puzzles × 4 levels × ES
- [x] T2.5 — Daily Decode: 15 puzzles × 4 levels × ES
- [x] T2.6 — Synonym Spiral: 15 puzzles × 4 levels × ES

### Phase 3: Adaptive Difficulty Engine
- [ ] T3.1 — Create `PlayerProgress` store (localStorage + Supabase sync)
- [ ] T3.2 — Implement spaced repetition for failed concepts (Leitner box model)
- [ ] T3.3 — Auto-adjust difficulty based on accuracy (80% correct → level up, <60% → level down)
- [ ] T3.4 — "Struggle detection" — track which grammar categories players fail most

### Phase 4: Language Expansion
- [ ] T4.1 — Port Missing Piece puzzles to FR/DE/IT/PT (highest priority)
- [ ] T4.2 — Port Odd One Out to FR/DE/IT/PT
- [ ] T4.3 — Add ZH/JA/KO puzzle data for CompoundBridge
- [ ] T4.4 — Port remaining games to new languages

### Phase 5: Audio Integration
- [ ] T5.1 — CEFR-graded audio lessons (A1-B2 per language)
- [ ] T5.2 — Link game failures to relevant audio lessons
- [ ] T5.3 — Pronunciation scoring using Web Speech API confidence

---

## Implementation Priority
Phase 1 & 2 first — they make every game immediately useful for real learning.
Phase 3 adds intelligence. Phase 4 adds breadth. Phase 5 connects modalities.
