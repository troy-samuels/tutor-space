import type { CatalogueExercise } from "../types";

export type LanguageExerciseModule = {
  EXERCISES: readonly CatalogueExercise[];
};

export type ExerciseLoader = () => Promise<LanguageExerciseModule>;

// Dynamic import map keeps language packs code-split and lazily loaded.
export const EXERCISE_LANGUAGE_LOADERS: Record<string, ExerciseLoader> = {
  ar: () => import("./ar"),
  de: () => import("./de"),
  en: () => import("./en"),
  es: () => import("./es"),
  fr: () => import("./fr"),
  it: () => import("./it"),
  ja: () => import("./ja"),
  ko: () => import("./ko"),
  nl: () => import("./nl"),
  pt: () => import("./pt"),
  ru: () => import("./ru"),
  zh: () => import("./zh"),
};
