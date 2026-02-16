/**
 * Bridge Layer: Exercise Catalogue -> Practice Components
 *
 * This adapter exposes stable client-facing types while lazily loading
 * per-language catalogue packs and caching transformed data.
 */

import {
  getExercises,
  getAvailableLanguages,
  preloadLanguage,
  type CatalogueExercise,
  type DifficultyLevel,
} from "@/lib/exercise-catalogue";
import {
  LANGUAGES as MOCK_LANGUAGES,
  ASSESSMENT_EXERCISES as MOCK_ASSESSMENT,
  PRACTICE_SESSIONS as MOCK_PRACTICE,
  SCORE_RESULTS as MOCK_SCORES,
  type Language,
  type AssessmentExercise,
  type PracticeExercise,
  type PracticeSession,
  type PracticeDifficultyBand,
  type ScoreResult,
} from "@/components/practice/mock-data";

const DIFFICULTY_TO_ASSESSMENT: Record<DifficultyLevel, AssessmentExercise["difficulty"]> = {
  beginner: "easy",
  elementary: "easy",
  intermediate: "medium",
  "upper-intermediate": "hard",
  advanced: "expert",
};

const DIFFICULTY_XP: Record<DifficultyLevel, number> = {
  beginner: 10,
  elementary: 15,
  intermediate: 20,
  "upper-intermediate": 25,
  advanced: 30,
};

type CatalogueExercisesByLevel = Record<
  DifficultyLevel,
  readonly Readonly<CatalogueExercise>[]
> & {
  all: readonly Readonly<CatalogueExercise>[];
};

const assessmentTransformCache = new WeakMap<CatalogueExercise, AssessmentExercise>();
const practiceTransformCache = new WeakMap<CatalogueExercise, PracticeExercise>();
const hasCatalogueDataCache = new Map<string, Promise<boolean>>();
const assessmentCache = new Map<string, Promise<AssessmentExercise[]>>();
const practiceSessionCache = new Map<string, Promise<PracticeSession>>();
const practicePoolByLevelCache = new Map<string, Promise<PracticeExercise[]>>();
const catalogueByLevelCache = new Map<string, Promise<CatalogueExercisesByLevel>>();
const mappedPracticeByLanguageCache = new Map<string, Promise<PracticeExercise[]>>();

function createStableAssessmentFallback(exercise: CatalogueExercise): AssessmentExercise {
  return {
    type: "multiple-choice",
    prompt: exercise.prompt,
    options: ["Option 1", "Option 2", "Option 3"],
    correctIndex: 0,
    xp: DIFFICULTY_XP[exercise.level],
    difficulty: DIFFICULTY_TO_ASSESSMENT[exercise.level],
  };
}

function createStablePracticeFallback(exercise: CatalogueExercise): PracticeExercise {
  return {
    type: "conversation",
    prompt: exercise.prompt,
    aiMessage: exercise.aiMessage || "Let's practice this together.",
    suggestedResponse: exercise.suggestedResponse || "Sounds good!",
    xp: exercise.xp,
  };
}

function catalogueToAssessment(exercise: CatalogueExercise): AssessmentExercise {
  const cached = assessmentTransformCache.get(exercise);
  if (cached) {
    return cached;
  }

  const base = {
    prompt: exercise.prompt,
    xp: DIFFICULTY_XP[exercise.level],
    difficulty: DIFFICULTY_TO_ASSESSMENT[exercise.level],
  } as const;

  let transformed: AssessmentExercise;

  if (exercise.type === "multiple-choice") {
    transformed = {
      ...base,
      type: "multiple-choice",
      options: exercise.options || [],
      correctIndex: exercise.correctIndex ?? 0,
    };
  } else if (exercise.type === "fill-blank") {
    transformed = {
      ...base,
      type: "fill-blank",
      sentence: exercise.sentence || "",
      correctAnswer: exercise.correctAnswer || "",
      options: exercise.blankOptions || [],
      correctIndex: exercise.blankCorrectIndex ?? 0,
    };
  } else if (exercise.type === "word-order") {
    transformed = {
      ...base,
      type: "word-order",
      words: exercise.words || [],
      correctOrder: exercise.correctOrder || [],
    };
  } else {
    transformed = createStableAssessmentFallback(exercise);
  }

  assessmentTransformCache.set(exercise, transformed);
  return transformed;
}

function catalogueToPractice(exercise: CatalogueExercise): PracticeExercise {
  const cached = practiceTransformCache.get(exercise);
  if (cached) {
    return cached;
  }

  const base = {
    type: exercise.type as PracticeExercise["type"],
    prompt: exercise.prompt,
    xp: exercise.xp,
  };

  let transformed: PracticeExercise;

  if (exercise.type === "multiple-choice") {
    transformed = {
      ...base,
      type: "multiple-choice",
      options: exercise.options || [],
      correctIndex: exercise.correctIndex ?? 0,
    };
  } else if (exercise.type === "fill-blank") {
    transformed = {
      ...base,
      type: "fill-blank",
      sentence: exercise.sentence || "",
      correctAnswer: exercise.correctAnswer || "",
      blankOptions: exercise.blankOptions || [],
      blankCorrectIndex: exercise.blankCorrectIndex ?? 0,
    };
  } else if (exercise.type === "word-order") {
    transformed = {
      ...base,
      type: "word-order",
      words: exercise.words || [],
      correctOrder: exercise.correctOrder || [],
    };
  } else if (exercise.type === "conversation") {
    transformed = {
      ...base,
      type: "conversation",
      aiMessage: exercise.aiMessage || "",
      suggestedResponse: exercise.suggestedResponse || "",
    };
  } else {
    transformed = createStablePracticeFallback(exercise);
  }

  practiceTransformCache.set(exercise, transformed);
  return transformed;
}

function sampleWithoutReplacement<T>(items: readonly T[], count: number): T[] {
  if (count <= 0 || items.length === 0) {
    return [];
  }
  if (count >= items.length) {
    return [...items];
  }

  const seen = new Set<number>();
  const result: T[] = [];
  while (result.length < count) {
    const index = Math.floor(Math.random() * items.length);
    if (seen.has(index)) {
      continue;
    }
    seen.add(index);
    result.push(items[index]);
  }
  return result;
}

async function hasCatalogueData(languageCode: string): Promise<boolean> {
  const normalizedCode = languageCode.toLowerCase();
  const cached = hasCatalogueDataCache.get(normalizedCode);
  if (cached) {
    return cached;
  }

  const request = getCatalogueExercisesByLevel(normalizedCode)
    .then((catalogue) => catalogue.all.length > 0)
    .catch(() => false);

  hasCatalogueDataCache.set(normalizedCode, request);
  return request;
}

async function getCatalogueExercisesByLevel(
  languageCode: string
): Promise<CatalogueExercisesByLevel> {
  const normalizedCode = languageCode.toLowerCase();
  const cached = catalogueByLevelCache.get(normalizedCode);
  if (cached) {
    return cached;
  }

  const request = preloadLanguage(normalizedCode)
    .then(() =>
      Promise.all([
        getExercises(normalizedCode, "beginner"),
        getExercises(normalizedCode, "elementary"),
        getExercises(normalizedCode, "intermediate"),
        getExercises(normalizedCode, "upper-intermediate"),
        getExercises(normalizedCode, "advanced"),
      ])
    )
    .then(([beginner, elementary, intermediate, upperIntermediate, advanced]) => {
      const all = Object.freeze([
        ...beginner,
        ...elementary,
        ...intermediate,
        ...upperIntermediate,
        ...advanced,
      ]) as readonly Readonly<CatalogueExercise>[];

      return {
        beginner,
        elementary,
        intermediate,
        "upper-intermediate": upperIntermediate,
        advanced,
        all,
      };
    });

  catalogueByLevelCache.set(normalizedCode, request);
  return request;
}

function difficultyMultiplierToLevel(multiplier: number): DifficultyLevel {
  if (multiplier >= 2) return "upper-intermediate";
  if (multiplier >= 1.5) return "intermediate";
  return "elementary";
}

function difficultyMultiplierToBand(multiplier: number): PracticeDifficultyBand {
  if (multiplier >= 2) return "hard";
  if (multiplier >= 1.5) return "medium";
  return "easy";
}

async function getPracticePoolForLevel(
  languageCode: string,
  level: DifficultyLevel
): Promise<PracticeExercise[]> {
  const key = `${languageCode}|${level}`;
  const cached = practicePoolByLevelCache.get(key);
  if (cached) {
    return cached;
  }

  const request = getCatalogueExercisesByLevel(languageCode)
    .then((catalogue) => catalogue[level].map(catalogueToPractice))
    .catch(() => []);

  practicePoolByLevelCache.set(key, request);
  return request;
}

async function getMappedPracticeForLanguage(languageCode: string): Promise<PracticeExercise[]> {
  const normalizedCode = languageCode.toLowerCase();
  const cached = mappedPracticeByLanguageCache.get(normalizedCode);
  if (cached) {
    return cached;
  }

  const request = getCatalogueExercisesByLevel(normalizedCode)
    .then((catalogue) => catalogue.all.map(catalogueToPractice))
    .catch(() => []);

  mappedPracticeByLanguageCache.set(normalizedCode, request);
  return request;
}

export const LANGUAGES: Language[] = (() => {
  try {
    const catalogueLanguages = getAvailableLanguages();
    if (catalogueLanguages.length > 0) {
      const CJK_CODES = new Set(["zh", "ja", "ko"]);
      return catalogueLanguages.map((language) => ({
        code: language.code,
        name: language.name,
        nativeName: language.nativeName,
        flag: language.flag,
        ...(CJK_CODES.has(language.code) ? { isCJK: true } : {}),
      }));
    }
  } catch {
    // no-op fallback
  }
  return MOCK_LANGUAGES;
})();

export const ASSESSMENT_EXERCISES: Record<string, AssessmentExercise[]> = MOCK_ASSESSMENT;
export const PRACTICE_SESSIONS: Record<string, PracticeSession> = MOCK_PRACTICE;

export async function getAssessmentExercisesForLanguage(
  languageCode: string
): Promise<AssessmentExercise[]> {
  const normalizedCode = languageCode.toLowerCase();
  const cached = assessmentCache.get(normalizedCode);
  if (cached) {
    return cached;
  }

  const request = (async () => {
    if (!(await hasCatalogueData(normalizedCode))) {
      return MOCK_ASSESSMENT[normalizedCode] || MOCK_ASSESSMENT.es;
    }

    const byLevel = await getCatalogueExercisesByLevel(normalizedCode);

    const selected = [
      ...byLevel.beginner.slice(0, 1),
      ...byLevel.elementary.slice(0, 1),
      ...byLevel.intermediate.slice(0, 2),
      ...byLevel["upper-intermediate"].slice(0, 1),
    ];

    if (selected.length === 0) {
      return MOCK_ASSESSMENT[normalizedCode] || MOCK_ASSESSMENT.es;
    }

    return selected.map(catalogueToAssessment);
  })();

  assessmentCache.set(normalizedCode, request);
  return request;
}

export async function getPracticeSessionForLanguage(
  languageCode: string
): Promise<PracticeSession> {
  const normalizedCode = languageCode.toLowerCase();
  const cached = practiceSessionCache.get(normalizedCode);
  if (cached) {
    return cached;
  }

  const request = (async () => {
    if (!(await hasCatalogueData(normalizedCode))) {
      return MOCK_PRACTICE[normalizedCode] || MOCK_PRACTICE.es;
    }

    const mapped = await getMappedPracticeForLanguage(normalizedCode);
    if (mapped.length === 0) {
      return MOCK_PRACTICE[normalizedCode] || MOCK_PRACTICE.es;
    }

    const easy: PracticeExercise[] = [];
    const medium: PracticeExercise[] = [];
    const hard: PracticeExercise[] = [];

    for (const exercise of mapped) {
      if (exercise.xp <= 15) {
        easy.push(exercise);
      } else if (exercise.xp <= 25) {
        medium.push(exercise);
      } else {
        hard.push(exercise);
      }
    }

    return {
      topic: "General Practice",
      level: "Mixed",
      exercises: mapped,
      questionPools: {
        easy: easy.length > 0 ? easy : mapped.slice(0, Math.min(3, mapped.length)),
        medium:
          medium.length > 0
            ? medium
            : mapped.slice(Math.min(3, mapped.length), Math.min(6, mapped.length)),
        hard:
          hard.length > 0
            ? hard
            : mapped.slice(Math.min(6, mapped.length)),
      },
    };
  })();

  practiceSessionCache.set(normalizedCode, request);
  return request;
}

export async function getPracticeExercisesForDifficulty(
  languageCode: string,
  difficultyMultiplier: number
): Promise<PracticeExercise[]> {
  const normalizedCode = languageCode.toLowerCase();

  if (await hasCatalogueData(normalizedCode)) {
    const level = difficultyMultiplierToLevel(difficultyMultiplier);
    const pool = await getPracticePoolForLevel(normalizedCode, level);
    if (pool.length > 0) {
      return sampleWithoutReplacement(pool, 8);
    }
  }

  const fallbackSession = await getPracticeSessionForLanguage(normalizedCode);
  return fallbackSession.questionPools[difficultyMultiplierToBand(difficultyMultiplier)];
}

export const SCORE_RESULTS: Record<string, ScoreResult> = MOCK_SCORES;

export type {
  Language,
  AssessmentExercise,
  PracticeExercise,
  PracticeSession,
  ScoreResult,
};
