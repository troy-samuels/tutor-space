import { EN_ES_POOL } from './en-es';
import { ES_EN_POOL } from './es-en';
import { EN_FR_POOL } from './en-fr';
import { EN_DE_POOL } from './en-de';
import { EN_IT_POOL } from './en-it';
import { EN_PT_POOL } from './en-pt';

export type GameLanguage = "en" | "es" | "fr" | "de" | "it" | "pt";

export interface PoolRow {
  prompt: string;
  correct: string;
  distractors: [string, string];
  band: "A1" | "A2" | "B1" | "B2";
}

/** Get the word pool for a given language. The language is what the user is LEARNING. */
export function getPool(language: GameLanguage): PoolRow[] {
  switch (language) {
    case "es": return EN_ES_POOL;  // Learning Spanish → English prompts, Spanish answers
    case "fr": return EN_FR_POOL;
    case "de": return EN_DE_POOL;
    case "it": return EN_IT_POOL;
    case "pt": return EN_PT_POOL;
    case "en":
    default: return ES_EN_POOL;  // Learning English → Spanish prompts, English answers
  }
}

export { EN_ES_POOL, ES_EN_POOL, EN_FR_POOL, EN_DE_POOL, EN_IT_POOL, EN_PT_POOL };
