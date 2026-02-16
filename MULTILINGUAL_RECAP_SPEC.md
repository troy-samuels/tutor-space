# Multilingual Recap — Technical Spec

## Problem

The recap feature assumes English-speaking tutors. The system prompt tells GPT to return "English translation", all UI strings are hardcoded English, and the `translation` field on vocabulary is always English. Tutors who speak Portuguese, Japanese, Korean, etc. get a broken experience — half their language, half English.

## Design Principles

1. **Zero extra effort for the tutor** — language detection is automatic from their input
2. **GPT does the heavy lifting** — it already knows what language the input is in
3. **UI strings come from GPT too** — we don't need `next-intl` for the recap student page because the content is already dynamic. We just need GPT to return localised UI labels alongside the content.
4. **Tutor input page stays English** — it's a product page, SEO matters, and it's simple enough. (Future: add `next-intl` if needed.)
5. **Backward compatible** — existing recaps continue to work; `uiStrings` is optional with English fallbacks everywhere.

## Architecture

### 1. New field: `tutorLanguage` (detected by GPT)

GPT already receives the tutor's note. We add `tutorLanguage` to the output schema — the BCP-47 code of the language the tutor is writing *in* (not the language being taught).

Examples:
- Japanese tutor writes in Japanese → `tutorLanguage: "ja"`
- Brazilian tutor writes in Portuguese → `tutorLanguage: "pt"`
- English tutor writes in English → `tutorLanguage: "en"`

### 2. New field: `uiStrings` (GPT-generated UI translations)

Instead of maintaining translation files for 10+ languages for just the recap page, we have GPT return the UI labels in `tutorLanguage`. This is cheaper, simpler, and covers languages we haven't even added to `next-intl`.

```typescript
interface RecapUIStrings {
  yourLessonRecap: string;      // "Your Lesson Recap" / "Tu resumen de clase"
  whatWeCovered: string;         // "What we covered" / "Lo que vimos"
  keyVocabulary: string;        // "Key Vocabulary" / "Vocabulario clave"
  yourMission: string;          // "Your mission" / "Tu misión"
  tapToReveal: string;          // "Tap to reveal" / "Toca para ver"
  iKnowThese: string;           // "I know these →" / "Ya los sé →"
  continue: string;             // "Continue →" / "Continuar →"
  check: string;                // "Check →" / "Comprobar →"
  correct: string;              // "✨ Correct!" / "✨ ¡Correcto!"
  notQuite: string;             // "Not quite!" / "¡Casi!"
  correctAnswerIs: string;      // "The correct answer is:" / "La respuesta correcta es:"
  correctSentence: string;      // "Correct sentence:" / "Frase correcta:"
  questionOf: string;           // "Question {n} of {total}" pattern
  arrangeWords: string;         // "Arrange the words..." / "Ordena las palabras..."
  tapWordsHere: string;         // "Tap words below to place them here..."
  typeYourAnswer: string;       // "Type your answer..."
  showHint: string;             // "💡 Show hint"
  amazingWork: string;          // "Amazing work" / "¡Trabajo increíble!"
  greatEffort: string;          // "Great effort" / "¡Gran esfuerzo!"
  keepGoing: string;            // "Keep going" / "¡Sigue así!"
  bonusWord: string;            // "🎁 Bonus word:" / "🎁 Palabra extra:"
  prev: string;                 // "← Prev"
  next: string;                 // "Next →"
  listen: string;               // "🔊 Listen"
  startPractice: string;        // "Start Practice"
  saveProgress: string;         // "Want to track your progress..."
  maybeLater: string;           // "Maybe later"
  poweredBy: string;            // "⚡ Powered by"
}
```

### 3. Updated system prompt

Key changes:
- Detect `tutorLanguage` from the input
- `translation` field becomes bilingual: translate to tutorLanguage (not hardcoded English)
- `encouragement`, `homework`, `covered`, `weakSpots` all in tutorLanguage
- `exercises` questions/explanations in tutorLanguage (with target language examples)
- Return `uiStrings` object with all UI labels in tutorLanguage
- If tutorLanguage is English, everything stays as-is (backward compatible)

### 4. Changes to `RecapSummary` type

```typescript
interface RecapSummary {
  // ... existing fields ...
  tutorLanguage: string;       // NEW: BCP-47 code, e.g. "en", "ja", "pt"
  uiStrings?: RecapUIStrings;  // NEW: localised UI labels (optional, English fallback)
}
```

### 5. Changes to DB schema

No migration needed. `summary` is already JSONB — new fields just get stored inside it.

### 6. Component changes

Every hardcoded English string in the recap student experience gets replaced with:
```typescript
summary.uiStrings?.fieldName ?? "English fallback"
```

Files to update:
- `lib/recap/types.ts` — add `tutorLanguage` + `RecapUIStrings` interface
- `lib/recap/generate.ts` — update system prompt + Zod schema
- `components/recap/WelcomeCard.tsx` — use `uiStrings`
- `components/recap/VocabCards.tsx` — use `uiStrings`
- `components/recap/ExerciseStep.tsx` — use `uiStrings`
- `components/recap/ResultsCard.tsx` — use `uiStrings`
- `components/recap/MultipleChoiceExercise.tsx` — use `uiStrings`
- `components/recap/FillBlankExercise.tsx` — use `uiStrings`
- `components/recap/WordOrderExercise.tsx` — use `uiStrings`

### 7. Date formatting

`WelcomeCard` currently uses `"en-GB"` locale for date formatting. Switch to `summary.tutorLanguage` or fallback to `"en-GB"`.

## What stays English

- `/recap` tutor input page — product/marketing page, stays English
- Error messages in API routes — developer-facing
- Not-found page — generic, stays English
- Logo, brand elements

## Token cost

The `uiStrings` object adds ~200 tokens to GPT output. At GPT-4o-mini pricing ($0.15/1M output tokens), that's ~$0.00003 per recap. Negligible.

## Testing

1. Generate recap with Japanese input → verify all UI in Japanese
2. Generate recap with Spanish input → verify all UI in Spanish
3. Generate recap with English input → verify nothing breaks (backward compat)
4. Load an existing (pre-migration) recap → verify English fallbacks work
