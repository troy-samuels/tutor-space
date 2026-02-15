"use server";

import OpenAI from "openai";
import { z } from "zod";
import type { RecapSummary, RecapExercise, RecapUIStrings } from "./types";
import { DEFAULT_UI_STRINGS } from "./types";

export interface GenerateRecapResult {
  summary: RecapSummary;
  exercises: RecapExercise[];
  generationTimeMs: number;
}

// ── Zod schemas for LLM output validation ──

const difficultySchema = z.enum(["easy", "medium", "hard"]).optional();

const vocabWordSchema = z.object({
  word: z.string().min(1),
  translation: z.string().min(1),
  example: z.string().default(""),
  phonetic: z.string().default(""),
  partOfSpeech: z.string().optional(),
  collocations: z.array(z.string()).optional(),
});

const multipleChoiceSchema = z.object({
  type: z.literal("multipleChoice"),
  question: z.string().min(1),
  options: z.array(z.string()).min(2).max(6),
  correct: z.number().int().min(0),
  explanation: z.string().default(""),
  targetVocab: z.string().optional(),
  difficulty: difficultySchema,
});

const fillBlankSchema = z.object({
  type: z.literal("fillBlank"),
  question: z.string().min(1),
  answer: z.string().min(1),
  hint: z.string().optional(),
  explanation: z.string().default(""),
  targetVocab: z.string().optional(),
  difficulty: difficultySchema,
});

const wordOrderSchema = z.object({
  type: z.literal("wordOrder"),
  question: z.string().optional(),
  words: z.array(z.string()).min(2),
  correctOrder: z.array(z.number().int().min(0)),
  correctSentence: z.string().min(1),
  explanation: z.string().default(""),
  targetVocab: z.string().optional(),
  difficulty: difficultySchema,
});

const listeningSchema = z.object({
  type: z.literal("listening"),
  question: z.string().min(1),
  spokenText: z.string().min(1),
  speechLang: z.string().min(2),
  answer: z.string().min(1),
  hint: z.string().optional(),
  explanation: z.string().default(""),
  targetVocab: z.string().optional(),
  difficulty: difficultySchema,
});

const matchingSchema = z.object({
  type: z.literal("matching"),
  question: z.string().min(1),
  leftItems: z.array(z.string()).min(2).max(6),
  rightItems: z.array(z.string()).min(2).max(6),
  explanation: z.string().default(""),
  targetVocab: z.string().optional(),
  difficulty: difficultySchema,
});

const translationSchema = z.object({
  type: z.literal("translation"),
  question: z.string().min(1),
  sourceText: z.string().min(1),
  sourceLanguage: z.string().min(1),
  targetLanguage: z.string().min(1),
  answer: z.string().min(1),
  acceptableAnswers: z.array(z.string()).optional(),
  explanation: z.string().default(""),
  targetVocab: z.string().optional(),
  difficulty: difficultySchema,
});

const contextClozeSchema = z.object({
  type: z.literal("contextCloze"),
  question: z.string().min(1),
  passage: z.string().min(1),
  answers: z.record(z.string(), z.string()),
  hints: z.record(z.string(), z.string()).optional(),
  explanation: z.string().default(""),
  targetVocab: z.string().optional(),
  difficulty: difficultySchema,
});

const exerciseSchema = z.discriminatedUnion("type", [
  multipleChoiceSchema,
  fillBlankSchema,
  wordOrderSchema,
  listeningSchema,
  matchingSchema,
  translationSchema,
  contextClozeSchema,
]);

const uiStringsSchema = z.object({
  yourLessonRecap: z.string().default("Your Lesson Recap"),
  whatWeCovered: z.string().default("What we covered:"),
  keyVocabulary: z.string().default("🔤 Key Vocabulary"),
  yourMission: z.string().default("Your mission"),
  tapToReveal: z.string().default("Tap to reveal"),
  iKnowThese: z.string().default("I know these →"),
  continue: z.string().default("Continue →"),
  check: z.string().default("Check →"),
  correct: z.string().default("✨ Correct!"),
  notQuite: z.string().default("Not quite!"),
  correctAnswerIs: z.string().default("The correct answer is:"),
  correctSentenceLabel: z.string().default("Correct sentence:"),
  questionOf: z.string().default("Question {n} of {total}"),
  arrangeWords: z.string().default("Arrange the words to form a correct sentence:"),
  tapWordsHere: z.string().default("Tap words below to place them here..."),
  typeYourAnswer: z.string().default("Type your answer..."),
  showHint: z.string().default("💡 Show hint"),
  amazingWork: z.string().default("Amazing work"),
  greatEffort: z.string().default("Great effort"),
  keepGoing: z.string().default("Keep going"),
  bonusWord: z.string().default("🎁 Bonus word:"),
  prev: z.string().default("← Prev"),
  next: z.string().default("Next →"),
  listen: z.string().default("🔊 Listen"),
  startPractice: z.string().default("Start Practice"),
  saveProgress: z.string().default("Want to track your progress over time? Sign in to save your learning journey."),
  maybeLater: z.string().default("Maybe later"),
  poweredBy: z.string().default("⚡ Powered by"),
  listenAndType: z.string().default("🔊 Listen and type what you hear"),
  matchThePairs: z.string().default("🔗 Match the pairs"),
  translateThisSentence: z.string().default("🌍 Translate this sentence"),
  fillInTheBlanks: z.string().default("📝 Fill in all the blanks"),
  playAgain: z.string().default("🔊 Play again"),
  partOfSpeech: z.string().default("Part of speech"),
  collocations: z.string().default("Common pairings"),
  difficulty: z.string().default("Difficulty"),
  funFact: z.string().default("💡 Fun fact"),
  streak: z.string().default("🔥 Streak"),
  shareYourScore: z.string().default("📤 Share your score"),
  practiceAgainTomorrow: z.string().default("📅 Practice again tomorrow"),
}).optional();

const recapOutputSchema = z.object({
  studentName: z.string().nullable().default(null),
  tutorName: z.string().nullable().default(null),
  language: z.string().min(1).default("Unknown"),
  level: z.string().nullable().default(null),
  tutorLanguage: z.string().min(1).default("en"),
  encouragement: z.string().default("Great work today!"),
  covered: z.array(z.string()).default([]),
  vocabulary: z.array(vocabWordSchema).default([]),
  weakSpots: z.array(z.string()).default([]),
  homework: z.string().default(""),
  bonusWord: z
    .object({ word: z.string(), translation: z.string() })
    .default({ word: "", translation: "" }),
  funFact: z.string().optional(),
  mistakeAnalysis: z.array(z.string()).optional(),
  exercises: z.array(exerciseSchema).min(1).max(12),
  uiStrings: uiStringsSchema.optional(),
});

// ── Validation helpers ──

/** Ensure multipleChoice `correct` index is within bounds */
function sanitiseExercises(exercises: RecapExercise[]): RecapExercise[] {
  return exercises.map((ex) => {
    if (ex.type === "multipleChoice") {
      const maxIdx = ex.options.length - 1;
      if (ex.correct < 0 || ex.correct > maxIdx) {
        return { ...ex, correct: 0 };
      }
    }
    if (ex.type === "wordOrder") {
      const maxIdx = ex.words.length - 1;
      const validOrder = ex.correctOrder.every(
        (i) => i >= 0 && i <= maxIdx
      );
      if (!validOrder) {
        return {
          ...ex,
          correctOrder: ex.words.map((_, i) => i),
        };
      }
    }
    if (ex.type === "matching") {
      // Ensure left and right have same length
      const minLen = Math.min(ex.leftItems.length, ex.rightItems.length);
      if (ex.leftItems.length !== ex.rightItems.length) {
        return {
          ...ex,
          leftItems: ex.leftItems.slice(0, minLen),
          rightItems: ex.rightItems.slice(0, minLen),
        };
      }
    }
    return ex;
  });
}

const SYSTEM_PROMPT = `You are a language teaching assistant. A tutor has just finished a lesson and provided a brief summary. Your job is to extract structured data and generate engaging, varied learning content.

CRITICAL — LANGUAGE DETECTION:
1. Detect the language the tutor is writing IN (not the language being taught). This is "tutorLanguage".
   - If the tutor writes in Japanese → tutorLanguage: "ja"
   - If the tutor writes in Portuguese → tutorLanguage: "pt"
   - If the tutor writes in English → tutorLanguage: "en"
   Use BCP-47 codes (en, es, fr, pt, de, it, ja, ko, nl, zh, ru, ar, etc.)

2. ALL text content (encouragement, covered, weakSpots, homework, explanations, questions, hints) MUST be written in the tutorLanguage — NOT English (unless tutorLanguage is English).

3. Vocabulary "translation" field: translate the target language word into the TUTOR'S language (tutorLanguage), not English.

4. The "uiStrings" object: translate ALL UI labels into tutorLanguage. These are interface strings the student will see.

Return valid JSON with these exact fields:

{
  "studentName": "extracted student name or null",
  "language": "the language being taught (in English, e.g. 'Spanish', 'English', 'French')",
  "level": "A1/A2/B1/B2/C1/C2 or null if unclear",
  "tutorName": "extracted tutor name or null",
  "tutorLanguage": "BCP-47 code of the language the tutor wrote in",
  "encouragement": "A warm, personal 2-sentence encouragement message (in tutorLanguage)",
  "covered": ["topic 1 (in tutorLanguage)", "topic 2 (in tutorLanguage)"],
  "vocabulary": [
    {
      "word": "target language word",
      "translation": "translation in tutorLanguage (NOT always English)",
      "example": "Example sentence using the word (in target language)",
      "phonetic": "approximate pronunciation guide",
      "partOfSpeech": "noun/verb/adjective/adverb/preposition/etc.",
      "collocations": ["common pairing 1", "common pairing 2"]
    }
  ],
  "weakSpots": ["specific struggle areas (in tutorLanguage)"],
  "homework": "homework description (in tutorLanguage)",
  "bonusWord": {
    "word": "one extra useful word related to the lesson",
    "translation": "translation in tutorLanguage"
  },
  "funFact": "An interesting cultural or linguistic fun fact related to the lesson topic (in tutorLanguage). E.g. etymology of a word, cultural context, historical tidbit.",
  "mistakeAnalysis": ["If the tutor mentioned specific student errors, describe each mistake pattern and what it reveals about the student's understanding (in tutorLanguage). Omit this field if no specific mistakes were mentioned."],
  "exercises": [
    {
      "type": "multipleChoice",
      "question": "Question testing lesson content (in tutorLanguage, with target language examples)",
      "options": ["option A", "option B", "option C", "option D"],
      "correct": 0,
      "explanation": "Why this is correct (in tutorLanguage)",
      "difficulty": "easy"
    },
    {
      "type": "fillBlank",
      "question": "Sentence with ___ to complete (in tutorLanguage with target language)",
      "answer": "correct word (target language)",
      "hint": "optional hint (in tutorLanguage)",
      "explanation": "Why this word fits (in tutorLanguage)",
      "difficulty": "easy"
    },
    {
      "type": "listening",
      "question": "Listen carefully and type what you hear (in tutorLanguage)",
      "spokenText": "A short sentence in the TARGET language to be read aloud by TTS",
      "speechLang": "BCP-47 code of the TARGET language (e.g. 'es' for Spanish)",
      "answer": "The exact text the student should type (same as spokenText)",
      "hint": "optional hint if they get it wrong (in tutorLanguage)",
      "explanation": "What this sentence means and why it's important (in tutorLanguage)",
      "difficulty": "medium"
    },
    {
      "type": "matching",
      "question": "Match each word with its meaning (in tutorLanguage)",
      "leftItems": ["word1", "word2", "word3", "word4"],
      "rightItems": ["meaning1", "meaning2", "meaning3", "meaning4"],
      "explanation": "Brief note about these vocabulary items (in tutorLanguage)",
      "difficulty": "easy"
    },
    {
      "type": "wordOrder",
      "question": "Instruction to arrange words (in tutorLanguage)",
      "words": ["scrambled", "words", "here"],
      "correctOrder": [2, 0, 1],
      "correctSentence": "The correct sentence (in target language)",
      "explanation": "Note on word order rules (in tutorLanguage)",
      "difficulty": "medium"
    },
    {
      "type": "translation",
      "question": "Translate this sentence (in tutorLanguage)",
      "sourceText": "A sentence in the source language",
      "sourceLanguage": "English",
      "targetLanguage": "Spanish",
      "answer": "The ideal translation in the target language",
      "acceptableAnswers": ["alternative correct translation 1", "alternative correct translation 2"],
      "explanation": "Notes on the translation (in tutorLanguage)",
      "difficulty": "medium"
    },
    {
      "type": "contextCloze",
      "question": "Read the paragraph and fill in all the blanks (in tutorLanguage)",
      "passage": "A full paragraph in the target language with {1} numbered blanks like {2} spread throughout the {3} text.",
      "answers": {"1": "answer1", "2": "answer2", "3": "answer3"},
      "hints": {"1": "optional hint for blank 1", "2": "optional hint for blank 2"},
      "explanation": "Overview of what this paragraph tests (in tutorLanguage)",
      "difficulty": "hard"
    },
    {
      "type": "multipleChoice",
      "question": "Another question (in tutorLanguage)",
      "options": ["option A", "option B", "option C", "option D"],
      "correct": 2,
      "explanation": "Explanation (in tutorLanguage)",
      "difficulty": "hard"
    }
  ],
  "uiStrings": {
    "yourLessonRecap": "Your Lesson Recap (translated to tutorLanguage)",
    "whatWeCovered": "What we covered: (translated)",
    "keyVocabulary": "🔤 Key Vocabulary (translated)",
    "yourMission": "Your mission (translated)",
    "tapToReveal": "Tap to reveal (translated)",
    "iKnowThese": "I know these → (translated)",
    "continue": "Continue → (translated)",
    "check": "Check → (translated)",
    "correct": "✨ Correct! (translated)",
    "notQuite": "Not quite! (translated)",
    "correctAnswerIs": "The correct answer is: (translated)",
    "correctSentenceLabel": "Correct sentence: (translated)",
    "questionOf": "Question {n} of {total} (translated, keep {n} and {total} placeholders)",
    "arrangeWords": "Arrange the words to form a correct sentence: (translated)",
    "tapWordsHere": "Tap words below to place them here... (translated)",
    "typeYourAnswer": "Type your answer... (translated)",
    "showHint": "💡 Show hint (translated)",
    "amazingWork": "Amazing work (translated)",
    "greatEffort": "Great effort (translated)",
    "keepGoing": "Keep going (translated)",
    "bonusWord": "🎁 Bonus word: (translated)",
    "prev": "← Prev (translated)",
    "next": "Next → (translated)",
    "listen": "🔊 Listen (translated)",
    "startPractice": "Start Practice (translated)",
    "saveProgress": "Want to track your progress over time? Sign in to save your learning journey. (translated)",
    "maybeLater": "Maybe later (translated)",
    "poweredBy": "⚡ Powered by (translated)",
    "listenAndType": "🔊 Listen and type what you hear (translated)",
    "matchThePairs": "🔗 Match the pairs (translated)",
    "translateThisSentence": "🌍 Translate this sentence (translated)",
    "fillInTheBlanks": "📝 Fill in all the blanks (translated)",
    "playAgain": "🔊 Play again (translated)",
    "partOfSpeech": "Part of speech (translated)",
    "collocations": "Common pairings (translated)",
    "difficulty": "Difficulty (translated)",
    "funFact": "💡 Fun fact (translated)",
    "streak": "🔥 Streak (translated)",
    "shareYourScore": "📤 Share your score (translated)",
    "practiceAgainTomorrow": "📅 Practice again tomorrow (translated)"
  }
}

Rules:
- Generate exactly 8 exercises, using ALL 7 types at least once (use one type twice)
- Order exercises by difficulty: start easy, end hard
- Vocabulary should have 4-8 words relevant to the lesson
- Each vocab word MUST include partOfSpeech and at least 1-2 collocations
- Exercises should progress in difficulty (2 easy, 3 medium, 3 hard)
- Each exercise MUST have a "difficulty" field
- Use the target language in questions where appropriate
- Explanations should be concise but educational
- If the tutor mentioned specific struggles, focus exercises on those areas and populate mistakeAnalysis
- Make exercises specifically about what was taught — not generic
- The exercises should feel personalised to this student's weak spots
- Always include a funFact — something interesting the student will enjoy
- For "listening" exercises, spokenText must be in the TARGET language and speechLang must be the TARGET language's BCP-47 code
- For "matching" exercises, leftItems and rightItems must be the same length; index 0 left pairs with index 0 right, etc.
- For "translation" exercises, include 1-3 acceptableAnswers for common valid alternatives
- For "contextCloze" exercises, use {1}, {2}, {3} etc. as blank markers in the passage; provide 2-4 blanks
- Keep emoji in uiStrings (🔤, ✨, 💡, 🎁, 🔊, ⚡, 🔗, 🌍, 📝, 📤, 📅, 🔥) — they are universal
- Keep {n} and {total} placeholders in questionOf exactly as shown
- If tutorLanguage is English, uiStrings should be standard English (no translation needed)`;

function getOpenAIKey(): string {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error("Missing OPENAI_API_KEY environment variable");
  }
  return key;
}

export type RecapTone = "encouraging" | "neutral" | "challenging";

/**
 * @param input - The tutor's lesson notes
 * @param contextBlock - Optional SRS-derived context for adaptive exercises.
 *                       Built by `buildContextBlock()` from `./context.ts`.
 * @param tone - Optional tone for encouragement and exercise framing.
 */
export async function generateRecap(
  input: string,
  contextBlock?: string,
  tone?: RecapTone
): Promise<GenerateRecapResult> {
  const startTime = Date.now();

  const client = new OpenAI({ apiKey: getOpenAIKey() });

  // Build the user message with optional SRS context and tone
  let userContent = `TUTOR'S NOTE:\n"""\n${input}\n"""`;
  if (contextBlock && contextBlock.trim().length > 0) {
    userContent += `\n\n${contextBlock}`;
  }
  if (tone && tone !== "encouraging") {
    const toneInstructions: Record<string, string> = {
      neutral: "\n\nTONE: Use a clear, balanced, matter-of-fact tone. No excessive praise or warmth. Professional and straightforward encouragement.",
      challenging: "\n\nTONE: Use a motivating, push-them-further tone. Be direct, set high expectations, and frame mistakes as opportunities. Think coach, not cheerleader. The student can handle it.",
    };
    userContent += toneInstructions[tone] ?? "";
  }

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: userContent,
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 6000,
    temperature: 0.5,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No content returned from OpenAI");
  }

  let rawParsed: unknown;
  try {
    rawParsed = JSON.parse(content);
  } catch {
    throw new Error("Invalid JSON returned from OpenAI");
  }

  // Validate with Zod — reject malformed LLM output before DB insert
  const validated = recapOutputSchema.safeParse(rawParsed);
  if (!validated.success) {
    console.error("[Recap Generate] LLM output validation failed:", validated.error.flatten());
    throw new Error("LLM returned invalid content structure");
  }

  const data = validated.data;

  // Merge GPT uiStrings with defaults for any missing keys
  const uiStrings: RecapUIStrings = {
    ...DEFAULT_UI_STRINGS,
    ...(data.uiStrings as Partial<RecapUIStrings>),
  };

  const summary: RecapSummary = {
    studentName: data.studentName,
    tutorName: data.tutorName,
    language: data.language,
    level: data.level,
    tutorLanguage: data.tutorLanguage,
    encouragement: data.encouragement,
    covered: data.covered,
    vocabulary: data.vocabulary,
    weakSpots: data.weakSpots,
    homework: data.homework,
    bonusWord: data.bonusWord,
    funFact: data.funFact,
    mistakeAnalysis: data.mistakeAnalysis,
    uiStrings,
  };

  const exercises = sanitiseExercises(data.exercises as RecapExercise[]);

  const generationTimeMs = Date.now() - startTime;

  return { summary, exercises, generationTimeMs };
}
