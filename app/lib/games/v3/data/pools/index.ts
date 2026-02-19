import { EN_ES_POOL } from './en-es';
import { ES_EN_POOL } from './es-en';
import { EN_FR_POOL } from './en-fr';
import { EN_DE_POOL } from './en-de';
import { EN_IT_POOL } from './en-it';
import { EN_PT_POOL } from './en-pt';
import { FR_EN_POOL } from './fr-en';
import { DE_EN_POOL } from './de-en';
import { IT_EN_POOL } from './it-en';
import { PT_EN_POOL } from './pt-en';

export type SourceLanguage = "en" | "es" | "fr" | "de" | "it" | "pt";
export type GameLanguage = "en" | "es" | "fr" | "de" | "it" | "pt";

export interface PoolRow {
  prompt: string;
  correct: string;
  distractors: [string, string];
  band: "A1" | "A2" | "B1" | "B2";
}

/**
 * Get pool. `target` = language being learned, `source` = user's native language.
 * source defaults to "en" for learning other languages, or the target language's reverse for learning English.
 */
export function getPool(target: GameLanguage, source?: SourceLanguage): PoolRow[] {
  if (target === "en") {
    // Learning English — pick pool based on source language
    switch (source) {
      case "es": return ES_EN_POOL;
      case "fr": return FR_EN_POOL;
      case "de": return DE_EN_POOL;
      case "it": return IT_EN_POOL;
      case "pt": return PT_EN_POOL;
      default: return ES_EN_POOL; // fallback
    }
  }
  // Learning another language from English
  switch (target) {
    case "es": return EN_ES_POOL;
    case "fr": return EN_FR_POOL;
    case "de": return EN_DE_POOL;
    case "it": return EN_IT_POOL;
    case "pt": return EN_PT_POOL;
    default: return EN_ES_POOL;
  }
}

export {
  EN_ES_POOL, ES_EN_POOL, EN_FR_POOL, EN_DE_POOL, EN_IT_POOL, EN_PT_POOL,
  FR_EN_POOL, DE_EN_POOL, IT_EN_POOL, PT_EN_POOL,
};
