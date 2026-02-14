import type {
  CatalogueExercise,
  DifficultyLevel,
  ExerciseType,
  TopicCategory,
} from "./types";
import { LANGUAGES, getAvailableLanguageCodes } from "./languages";

type MaybeFilter<T> = T | undefined;
type LanguageExerciseModule = {
  EXERCISES: readonly CatalogueExercise[];
};

type ExerciseLoader = () => Promise<LanguageExerciseModule>;

type LanguageIndex = {
  all: readonly Readonly<CatalogueExercise>[];
  byId: ReadonlyMap<string, Readonly<CatalogueExercise>>;
  byFilterKey: ReadonlyMap<string, readonly Readonly<CatalogueExercise>[]>;
  topics: readonly TopicCategory[];
};

const EMPTY_EXERCISES = Object.freeze([]) as readonly Readonly<CatalogueExercise>[];
const EMPTY_TOPICS = Object.freeze([]) as readonly TopicCategory[];
const DIFFICULTY_LEVELS: readonly DifficultyLevel[] = Object.freeze([
  "beginner",
  "elementary",
  "intermediate",
  "upper-intermediate",
  "advanced",
]);

const EXERCISE_LANGUAGE_LOADERS: Record<string, ExerciseLoader> = {
  ar: () => import("./exercises/ar"),
  de: () => import("./exercises/de"),
  en: () => import("./exercises/en"),
  es: () => import("./exercises/es"),
  fr: () => import("./exercises/fr"),
  it: () => import("./exercises/it"),
  ja: () => import("./exercises/ja"),
  ko: () => import("./exercises/ko"),
  nl: () => import("./exercises/nl"),
  pt: () => import("./exercises/pt"),
  ru: () => import("./exercises/ru"),
  zh: () => import("./exercises/zh"),
};

const CACHE_BY_LANGUAGE = new Map<string, Promise<LanguageIndex>>();
const RESOLVED_CACHE_BY_LANGUAGE = new Map<string, LanguageIndex>();
const LEVEL_INDEX_BY_LANGUAGE = new Map<
  string,
  readonly Readonly<CatalogueExercise>[]
>();

function normalizeLanguageCode(language: string): string {
  return language.trim().toLowerCase();
}

function createFilterKey(
  level: MaybeFilter<DifficultyLevel>,
  type: MaybeFilter<ExerciseType>,
  topic: MaybeFilter<TopicCategory>
): string {
  return `${level ?? "*"}|${type ?? "*"}|${topic ?? "*"}`;
}

function createLanguageLevelKey(
  languageCode: string,
  level: MaybeFilter<DifficultyLevel>
): string {
  return `${languageCode}:${level ?? "*"}`;
}

function seedEmptyLanguageLevelIndex(languageCode: string): void {
  LEVEL_INDEX_BY_LANGUAGE.set(
    createLanguageLevelKey(languageCode, undefined),
    EMPTY_EXERCISES
  );
  for (const level of DIFFICULTY_LEVELS) {
    LEVEL_INDEX_BY_LANGUAGE.set(
      createLanguageLevelKey(languageCode, level),
      EMPTY_EXERCISES
    );
  }
}

function cloneExercise(exercise: CatalogueExercise): CatalogueExercise {
  return {
    ...exercise,
    options: exercise.options ? [...exercise.options] : undefined,
    blankOptions: exercise.blankOptions ? [...exercise.blankOptions] : undefined,
    words: exercise.words ? [...exercise.words] : undefined,
    correctOrder: exercise.correctOrder ? [...exercise.correctOrder] : undefined,
    acceptedAnswers: exercise.acceptedAnswers ? [...exercise.acceptedAnswers] : undefined,
    tags: exercise.tags ? [...exercise.tags] : undefined,
  };
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    const target = value as Record<string, unknown>;
    for (const key of Object.keys(target)) {
      const nested = target[key];
      if (nested && typeof nested === "object") {
        deepFreeze(nested);
      }
    }
    Object.freeze(value);
  }
  return value;
}

function buildLanguageIndex(
  languageCode: string,
  exercises: readonly CatalogueExercise[]
): LanguageIndex {
  const frozenExercises = Object.freeze(
    exercises.map((exercise) => deepFreeze(cloneExercise(exercise)) as Readonly<CatalogueExercise>)
  ) as readonly Readonly<CatalogueExercise>[];

  const byId = new Map<string, Readonly<CatalogueExercise>>();
  const mutableByFilter = new Map<string, Readonly<CatalogueExercise>[]>();
  const topicSet = new Set<TopicCategory>();

  const pushFilterEntry = (
    level: MaybeFilter<DifficultyLevel>,
    type: MaybeFilter<ExerciseType>,
    topic: MaybeFilter<TopicCategory>,
    exercise: Readonly<CatalogueExercise>
  ) => {
    const key = createFilterKey(level, type, topic);
    const current = mutableByFilter.get(key);
    if (current) {
      current.push(exercise);
      return;
    }
    mutableByFilter.set(key, [exercise]);
  };

  for (const exercise of frozenExercises) {
    byId.set(exercise.id, exercise);
    topicSet.add(exercise.topic);

    // 8 wildcard combinations to support O(1) lookups for all filter patterns.
    pushFilterEntry(undefined, undefined, undefined, exercise);
    pushFilterEntry(exercise.level, undefined, undefined, exercise);
    pushFilterEntry(undefined, exercise.type, undefined, exercise);
    pushFilterEntry(undefined, undefined, exercise.topic, exercise);
    pushFilterEntry(exercise.level, exercise.type, undefined, exercise);
    pushFilterEntry(exercise.level, undefined, exercise.topic, exercise);
    pushFilterEntry(undefined, exercise.type, exercise.topic, exercise);
    pushFilterEntry(exercise.level, exercise.type, exercise.topic, exercise);
  }

  const byFilterKey = new Map<string, readonly Readonly<CatalogueExercise>[]>();
  for (const [key, items] of mutableByFilter.entries()) {
    byFilterKey.set(key, Object.freeze([...items]));
  }

  LEVEL_INDEX_BY_LANGUAGE.set(
    createLanguageLevelKey(languageCode, undefined),
    frozenExercises
  );
  for (const level of DIFFICULTY_LEVELS) {
    LEVEL_INDEX_BY_LANGUAGE.set(
      createLanguageLevelKey(languageCode, level),
      byFilterKey.get(createFilterKey(level, undefined, undefined)) ?? EMPTY_EXERCISES
    );
  }

  return {
    all: frozenExercises,
    byId,
    byFilterKey,
    topics: Object.freeze(Array.from(topicSet)),
  };
}

async function loadLanguageIndex(language: string): Promise<LanguageIndex> {
  const code = normalizeLanguageCode(language);

  const cached = CACHE_BY_LANGUAGE.get(code);
  if (cached) {
    return cached;
  }

  const loader = EXERCISE_LANGUAGE_LOADERS[code];
  if (!loader) {
    const emptyIndex: LanguageIndex = {
      all: EMPTY_EXERCISES,
      byId: new Map(),
      byFilterKey: new Map(),
      topics: EMPTY_TOPICS,
    };
    seedEmptyLanguageLevelIndex(code);
    CACHE_BY_LANGUAGE.set(code, Promise.resolve(emptyIndex));
    RESOLVED_CACHE_BY_LANGUAGE.set(code, emptyIndex);
    return emptyIndex;
  }

  const promise = loader()
    .then((module) => {
      const index = buildLanguageIndex(code, module.EXERCISES);
      RESOLVED_CACHE_BY_LANGUAGE.set(code, index);
      return index;
    })
    .catch(() => {
      const emptyIndex: LanguageIndex = {
        all: EMPTY_EXERCISES,
        byId: new Map(),
        byFilterKey: new Map(),
        topics: EMPTY_TOPICS,
      };
      seedEmptyLanguageLevelIndex(code);
      RESOLVED_CACHE_BY_LANGUAGE.set(code, emptyIndex);
      return emptyIndex;
    });

  CACHE_BY_LANGUAGE.set(code, promise);
  return promise;
}

function getLoadedLanguageIndex(language: string): LanguageIndex | null {
  return RESOLVED_CACHE_BY_LANGUAGE.get(normalizeLanguageCode(language)) ?? null;
}

function inferLanguageFromExerciseId(id: string): string | null {
  const [prefix] = id.split("-");
  if (!prefix) {
    return null;
  }
  return getAvailableLanguageCodes().includes(prefix) ? prefix : null;
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

export async function preloadLanguage(language: string): Promise<void> {
  await loadLanguageIndex(language);
}

export async function preloadAllLanguages(): Promise<void> {
  await Promise.all(getAvailableLanguageCodes().map((languageCode) => preloadLanguage(languageCode)));
}

export async function getExercises(
  language: string,
  level?: DifficultyLevel,
  type?: ExerciseType,
  topic?: TopicCategory
): Promise<readonly Readonly<CatalogueExercise>[]> {
  const code = normalizeLanguageCode(language);
  const index = await loadLanguageIndex(code);
  if (!type && !topic) {
    return (
      LEVEL_INDEX_BY_LANGUAGE.get(createLanguageLevelKey(code, level)) ??
      EMPTY_EXERCISES
    );
  }
  return index.byFilterKey.get(createFilterKey(level, type, topic)) ?? EMPTY_EXERCISES;
}

/**
 * Synchronous accessor for already-loaded language packs only.
 * This is useful in render code that cannot await and gracefully falls back.
 */
export function getExercisesSync(
  language: string,
  level?: DifficultyLevel,
  type?: ExerciseType,
  topic?: TopicCategory
): readonly Readonly<CatalogueExercise>[] {
  const code = normalizeLanguageCode(language);
  const index = getLoadedLanguageIndex(code);
  if (!index) {
    return EMPTY_EXERCISES;
  }
  if (!type && !topic) {
    return (
      LEVEL_INDEX_BY_LANGUAGE.get(createLanguageLevelKey(code, level)) ??
      EMPTY_EXERCISES
    );
  }
  return index.byFilterKey.get(createFilterKey(level, type, topic)) ?? EMPTY_EXERCISES;
}

export async function getExerciseById(
  id: string
): Promise<Readonly<CatalogueExercise> | undefined> {
  const inferredLanguage = inferLanguageFromExerciseId(id);
  if (inferredLanguage) {
    const languageIndex = await loadLanguageIndex(inferredLanguage);
    return languageIndex.byId.get(id);
  }

  // Fallback path for ids without language prefixes.
  await preloadAllLanguages();
  for (const index of RESOLVED_CACHE_BY_LANGUAGE.values()) {
    const found = index.byId.get(id);
    if (found) {
      return found;
    }
  }
  return undefined;
}

export async function getRandomExerciseSet(
  language: string,
  level: DifficultyLevel,
  count: number
): Promise<readonly Readonly<CatalogueExercise>[]> {
  const filtered = await getExercises(language, level);
  return Object.freeze(sampleWithoutReplacement(filtered, count));
}

export function getAvailableLanguages() {
  return [...LANGUAGES];
}

export async function getTopicsForLanguage(language: string): Promise<readonly TopicCategory[]> {
  const index = await loadLanguageIndex(language);
  return index.topics;
}

export async function getExercisesByTopic(
  language: string,
  topic: TopicCategory,
  level?: DifficultyLevel
): Promise<readonly Readonly<CatalogueExercise>[]> {
  return getExercises(language, level, undefined, topic);
}

export async function getExercisesByType(
  language: string,
  type: ExerciseType,
  level?: DifficultyLevel
): Promise<readonly Readonly<CatalogueExercise>[]> {
  return getExercises(language, level, type);
}

export * from "./types";
export * from "./languages";
export * from "./scoring";
export * from "./assessment";
export * from "./exercises";
