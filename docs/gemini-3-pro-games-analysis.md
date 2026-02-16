# TutorLingua Games — Gemini 3 Pro Analysis
*Generated: 2026-02-16 via Google AI Studio (gemini-3-pro-preview, thinking: high)*

---

## SECTION 1: Non-European Language Suitability

The Latin alphabet allows for manipulation of individual phonemes/graphemes. Logographic (Chinese), Syllabic (Japanese Kana), Abjad (Arabic/Hebrew), and Abugida (Thai/Hindi) scripts behave fundamentally differently.

### 1. The "Breakers" (Games that Fail)

#### A. Word Ladder (The Biggest Offender)

**The Problem:**

- **CJK (Chinese/Japanese/Korean):** You cannot change "one letter" to make a new word. In Chinese, changing a stroke usually results in a non-character. In Japanese, changing one Kana changes the entire syllable, often breaking the word.
- **Arabic/Hebrew (Abjads):** Words are built on tri-consonantal roots. Changing one letter destroys the root derivation system. Plus, vowels are often diacritics (hidden), making "spelling" ambiguity high.
- **Thai/Hindi:** Vowels wrap around consonants (above, below, left, right). "Changing one position" is technically difficult to render and conceptually confusing.

**The Fix:**

Replace with **"Word Chain" (Shiritori):** The last character of Word A becomes the first character of Word B.
- *Mechanic:* Cat -> Top -> Pot.
- *Why it works:* It works in every language, including Chinese (Idiom Solitaire / ChengYu) and Japanese (Shiritori).

#### B. Daily Decode (Cryptogram)

**The Problem:**

- **CJK:** Substitution ciphers (A=Z) are mathematically impossible with character sets of 3,000+ symbols.

**The Fix:**

**Visual Deconstruction (The "Faded" Decode):** Instead of swapping symbols, obscure them.
- **Chinese/Kanji:** Break the character into its radical components. The player must reassemble components to form the quote.
- **Korean:** Separate Jamo (letters) from their blocks. Player re-stacks them.

#### C. Missing Piece (Cloze)

**The Problem:**

- **Agglutinative (Turkish/Finnish/Hungarian):** These languages glue suffixes to words to determine grammar. If you blank out a word, you might be blanking out the root + 3 suffixes.
- **CJK:** Chinese and Japanese do not use spaces between words. A "blank line" looks visually jarring and breaks the reading flow.

**The Fix:**

- **Agglutinative:** The multiple-choice options must be the same root with different suffixes (testing grammar), or different roots with the same suffix (testing vocab). You cannot mix them randomly.
- **CJK:** Use a "Block" UI rather than an underline. The missing piece is a square gap, not a text line.

### 2. The "Survivors" (Games that work with tweaks)

- **Lingua Connections:** Works everywhere, but requires high cultural context. (e.g., In Japanese, grouping by "Kanji Radical" is a fun variant).
- **Odd One Out:** Works everywhere.
- **Synonym Spiral:** Works everywhere.

### 3. NEW Script-Agnostic Game Concepts

These concepts rely on **Syntax and Semantics**, which exist in all languages, rather than Orthography (spelling).

#### Concept A: "Sentence Scramble" (Syntax Focus)

- **Mechanic:** A valid sentence is shattered into shuffled blocks. The user must drag and drop them into the correct order.
- **Why it works:** Every language has syntax rules (SVO, SOV, VSO). It teaches grammar intuitively.
- **RTL Note:** For Arabic/Hebrew, the drop zones populate Right-to-Left.

#### Concept B: "Emoji Rosetta" (Semantic Focus)

- **Mechanic:** Show a sequence of 3 Emojis (e.g., 🏃‍♂️ + 🌧️ = 🏠). The user has 6 word tiles in the target language. They must select the words that describe the emoji story (Run + Rain + Home).
- **Why it works:** Emojis are the only universal "script." It bypasses translation and links concept directly to L2 vocabulary.

---

## SECTION 2: UI/UX Tightening (The "Juice")

### 1. The Game Hub (The Menu)

- **"Bento Box" Grid:** Don't use a list. Use a masonry or grid layout where each game is a "card."
- **Progress Rings:** Each game card should have a small SVG circle. Empty = Unplayed. Filled = Played. Gold = Won.
- **Daily "Pulse":** If a user hasn't played a game today, the card should have a very subtle, breathing scale animation (scale 1.0 to 1.02 every 3s).
- **Global Streak Header:** Top right. Flame icon + Number. If the streak is at risk (it's 11 PM), make the flame flicker (opacity/color shift).

### 2. In-Game Experience (The Core Loop)

- **Custom Virtual Keyboard (CRITICAL):**
  - Do not trigger the native mobile OS keyboard. It pushes content up and ruins immersion.
  - Build an on-screen HTML/JS keyboard.
  - *Why:* Allows you to control available letters (limiting options for beginners) and handle special characters (Ñ, Ç, Ü) without long-press frustration.

- **Framer Motion Interactions:**
  - **Input:** When a letter/word is tapped, the tile should scale down slightly (scale: 0.95) and bounce back (type: "spring").
  - **Error:** Don't just turn red. Shake the tile (x-axis keyframes) and vibrate the phone (Haptic Feedback).
  - **Success:** The tile should do a "Pop" or a 360-degree flip (Wordle style) with a staggered delay across the row.

- **Dark Mode Specifics:**
  - Avoid pure black (#000000). It causes "smearing" on OLED scrolling. Use #121212 or very dark gunmetal.
  - Text contrast: Use off-white (#EDEDED) for text to reduce eye strain.

### 3. Engagement & Onboarding

- **"No-Tutorial" Tutorial:**
  - First time load: Do not show a modal with text instructions.
  - Show a "Ghost Hand" animation overlay performing the first move, then fading away. Users learn by mimicry, not reading.

- **Micro-Interactions (The "Juice"):**
  - Confetti is cheap. Use particles relevant to the game.
  - **Synonym Spiral:** When the timer ends, spiral particles suction into the center.
  - **Connections:** When a group is found, the 4 blocks merge into one solid colored bar with a "clunk" sound effect.

- **Haptics (navigator.vibrate):**
  - Light tap (10ms) on key press.
  - Double tap (50ms) on success.
  - Heavy buzz (200ms) on "Game Over."

### 4. Post-Game (The Hook)

- **Share Grid (Social Currency):**
  - Generate a text-based grid of emojis representing the game performance (like Wordle).
  - **Crucial:** Add a "Deep Link" to the specific puzzle. `tutorlingua.com/daily/2023-10-27`. If I click your score, I go to that puzzle.

- **Definition Expansion:**
  - After the game ends, allow the user to tap any word on the board to see a modal with:
    - Pronunciation (Audio button).
    - Definition.
    - "Add to Flashcards" button (Retention hook).

### 5. Mobile Optimisation

- **Touch Targets:** Minimum 48x48px for all interactive elements.
- **The "Thumb Zone":** Place all primary inputs (keyboards, submit buttons) in the bottom 30% of the screen. Place "Hint" and "Settings" buttons at the top.
- **Safari/Chrome Bar:** Use `dvh` (Dynamic Viewport Height) in CSS instead of `vh` to prevent the URL bar from cutting off the bottom of the UI.

---

## Summary Checklist

1. **Refactor Word Ladder:** Fork the logic. European = Ladder; CJK = Shiritori.
2. **Refactor Cryptogram:** Fork the logic. European = Substitution; CJK = Component Assembly.
3. **UI Component:** Build a `VirtualKeyboard` component that accepts a `language` prop (determines layout).
4. **UX:** Implement `navigator.vibrate` hooks on all interactions.
5. **New Game:** Prototype "Sentence Scramble" (Syntax sorting) as it is the safest global bet.
