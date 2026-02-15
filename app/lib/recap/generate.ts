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

const vocabWordSchema = z.object({
  word: z.string().min(1),
  translation: z.string().min(1),
  example: z.string().default(""),
  phonetic: z.string().default(""),
});

const multipleChoiceSchema = z.object({
  type: z.literal("multipleChoice"),
  question: z.string().min(1),
  options: z.array(z.string()).min(2).max(6),
  correct: z.number().int().min(0),
  explanation: z.string().default(""),
  targetVocab: z.string().optional(),
});

const fillBlankSchema = z.object({
  type: z.literal("fillBlank"),
  question: z.string().min(1),
  answer: z.string().min(1),
  hint: z.string().optional(),
  explanation: z.string().default(""),
  targetVocab: z.string().optional(),
});

const wordOrderSchema = z.object({
  type: z.literal("wordOrder"),
  question: z.string().optional(),
  words: z.array(z.string()).min(2),
  correctOrder: z.array(z.number().int().min(0)),
  correctSentence: z.string().min(1),
  explanation: z.string().default(""),
  targetVocab: z.string().optional(),
});

const exerciseSchema = z.discriminatedUnion("type", [
  multipleChoiceSchema,
  fillBlankSchema,
  wordOrderSchema,
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
  exercises: z.array(exerciseSchema).min(1).max(10),
  uiStrings: uiStringsSchema.optional(),
});

// ── Validation helpers ──

/** Ensure multipleChoice `correct` index is within bounds */
function sanitiseExercises(exercises: RecapExercise[]): RecapExercise[] {
  return exercises.map((ex) => {
    if (ex.type === "multipleChoice" && ex.options) {
      const maxIdx = ex.options.length - 1;
      if (ex.correct !== undefined && (ex.correct < 0 || ex.correct > maxIdx)) {
        return { ...ex, correct: 0 };
      }
    }
    if (ex.type === "wordOrder" && ex.words && ex.correctOrder) {
      // Ensure correctOrder indices are within bounds
      const maxIdx = ex.words.length - 1;
      const validOrder = ex.correctOrder.every(
        (i) => i >= 0 && i <= maxIdx
      );
      if (!validOrder) {
        // Generate sequential order as fallback
        return {
          ...ex,
          correctOrder: ex.words.map((_, i) => i),
        };
      }
    }
    return ex;
  });
}

const SYSTEM_PROMPT = `You are a language teaching assistant. A tutor has just finished a lesson and provided a brief summary. Your job is to extract structured data and generate engaging learning content.

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
      "phonetic": "approximate pronunciation guide"
    }
  ],
  "weakSpots": ["specific struggle areas (in tutorLanguage)"],
  "homework": "homework description (in tutorLanguage)",
  "bonusWord": {
    "word": "one extra useful word related to the lesson",
    "translation": "translation in tutorLanguage"
  },
  "exercises": [
    {
      "type": "multipleChoice",
      "question": "Question testing lesson content (in tutorLanguage, with target language examples)",
      "options": ["option A", "option B", "option C", "option D"],
      "correct": 0,
      "explanation": "Why this is correct (in tutorLanguage)"
    },
    {
      "type": "fillBlank",
      "question": "Sentence with ___ to complete (in tutorLanguage with target language)",
      "answer": "correct word (target language)",
      "hint": "optional hint (in tutorLanguage)",
      "explanation": "Why this word fits (in tutorLanguage)"
    },
    {
      "type": "wordOrder",
      "question": "Instruction to arrange words (in tutorLanguage)",
      "words": ["scrambled", "words", "here"],
      "correctOrder": [2, 0, 1],
      "correctSentence": "The correct sentence (in target language)",
      "explanation": "Note on word order rules (in tutorLanguage)"
    },
    {
      "type": "multipleChoice",
      "question": "Another question (in tutorLanguage)",
      "options": ["option A", "option B", "option C", "option D"],
      "correct": 2,
      "explanation": "Explanation (in tutorLanguage)"
    },
    {
      "type": "fillBlank",
      "question": "Another fill-the-blank (in tutorLanguage)",
      "answer": "correct word",
      "hint": "optional hint (in tutorLanguage)",
      "explanation": "Explanation (in tutorLanguage)"
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
    "poweredBy": "⚡ Powered by (translated)"
  }
}

Rules:
- Generate exactly 5 exercises, mixing the 3 types (multipleChoice, fillBlank, wordOrder)
- Vocabulary should have 4-8 words relevant to the lesson
- Exercises should progress in difficulty
- Use the target language in questions where appropriate
- Explanations should be concise but educational
- If the tutor mentioned specific struggles, focus exercises there
- Make exercises specifically about what was taught — not generic
- The exercises should feel personalised to this student's weak spots
- Keep emoji in uiStrings (🔤, ✨, 💡, 🎁, 🔊, ⚡) — they are universal
- Keep {n} and {total} placeholders in questionOf exactly as shown
- If tutorLanguage is English, uiStrings should be standard English (no translation needed)`;

function getOpenAIKey(): string {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error("Missing OPENAI_API_KEY environment variable");
  }
  return key;
}

/**
 * @param input - The tutor's lesson notes
 * @param contextBlock - Optional SRS-derived context for adaptive exercises.
 *                       Built by `buildContextBlock()` from `./context.ts`.
 */
export async function generateRecap(
  input: string,
  contextBlock?: string
): Promise<GenerateRecapResult> {
  const startTime = Date.now();

  const client = new OpenAI({ apiKey: getOpenAIKey() });

  // Build the user message with optional SRS context
  let userContent = `TUTOR'S NOTE:\n"""\n${input}\n"""`;
  if (contextBlock && contextBlock.trim().length > 0) {
    userContent += `\n\n${contextBlock}`;
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
    max_tokens: 4000,
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
    uiStrings,
  };

  const exercises = sanitiseExercises(data.exercises as RecapExercise[]);

  const generationTimeMs = Date.now() - startTime;

  return { summary, exercises, generationTimeMs };
}
