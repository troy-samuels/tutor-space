/**
 * Word lists for Spell Cast with CEFR levels.
 * Used for both puzzle generation and validation.
 */

import type { ValidWord } from './types';
import type { CefrLevel } from '@/lib/cefr';

// Spanish word list (sample — in production this would be 500+ words)
export const SPANISH_WORDS: ValidWord[] = [
  // A1 words
  { word: 'casa', cefrLevel: 'A1', frequency: 95 },
  { word: 'gato', cefrLevel: 'A1', frequency: 85 },
  { word: 'mesa', cefrLevel: 'A1', frequency: 90 },
  { word: 'agua', cefrLevel: 'A1', frequency: 98 },
  { word: 'sol', cefrLevel: 'A1', frequency: 92 },
  { word: 'pan', cefrLevel: 'A1', frequency: 88 },
  { word: 'ojo', cefrLevel: 'A1', frequency: 87 },
  { word: 'luz', cefrLevel: 'A1', frequency: 86 },
  
  // A2 words
  { word: 'escuela', cefrLevel: 'A2', frequency: 80 },
  { word: 'trabajo', cefrLevel: 'A2', frequency: 85 },
  { word: 'familia', cefrLevel: 'A2', frequency: 88 },
  { word: 'tiempo', cefrLevel: 'A2', frequency: 82 },
  { word: 'persona', cefrLevel: 'A2', frequency: 84 },
  
  // B1 words
  { word: 'sociedad', cefrLevel: 'B1', frequency: 65 },
  { word: 'gobierno', cefrLevel: 'B1', frequency: 70 },
  { word: 'empresa', cefrLevel: 'B1', frequency: 68 },
  { word: 'cultura', cefrLevel: 'B1', frequency: 72 },
  
  // B2 words
  { word: 'desarrollo', cefrLevel: 'B2', frequency: 55 },
  { word: 'investigación', cefrLevel: 'B2', frequency: 50 },
  { word: 'perspectiva', cefrLevel: 'B2', frequency: 48 },
];

// French word list (sample)
export const FRENCH_WORDS: ValidWord[] = [
  // A1 words
  { word: 'chat', cefrLevel: 'A1', frequency: 90 },
  { word: 'pain', cefrLevel: 'A1', frequency: 92 },
  { word: 'eau', cefrLevel: 'A1', frequency: 95 },
  { word: 'main', cefrLevel: 'A1', frequency: 88 },
  { word: 'jour', cefrLevel: 'A1', frequency: 93 },
  { word: 'nuit', cefrLevel: 'A1', frequency: 87 },
  
  // A2 words
  { word: 'école', cefrLevel: 'A2', frequency: 85 },
  { word: 'travail', cefrLevel: 'A2', frequency: 83 },
  { word: 'famille', cefrLevel: 'A2', frequency: 88 },
  { word: 'temps', cefrLevel: 'A2', frequency: 82 },
  
  // B1 words
  { word: 'société', cefrLevel: 'B1', frequency: 70 },
  { word: 'culture', cefrLevel: 'B1', frequency: 72 },
  { word: 'histoire', cefrLevel: 'B1', frequency: 75 },
  
  // B2 words
  { word: 'développement', cefrLevel: 'B2', frequency: 52 },
  { word: 'recherche', cefrLevel: 'B2', frequency: 55 },
];

// German word list (sample)
export const GERMAN_WORDS: ValidWord[] = [
  // A1 words
  { word: 'Haus', cefrLevel: 'A1', frequency: 92 },
  { word: 'Mann', cefrLevel: 'A1', frequency: 90 },
  { word: 'Frau', cefrLevel: 'A1', frequency: 91 },
  { word: 'Kind', cefrLevel: 'A1', frequency: 88 },
  { word: 'Tag', cefrLevel: 'A1', frequency: 93 },
  { word: 'Jahr', cefrLevel: 'A1', frequency: 89 },
  
  // A2 words
  { word: 'Schule', cefrLevel: 'A2', frequency: 85 },
  { word: 'Arbeit', cefrLevel: 'A2', frequency: 83 },
  { word: 'Familie', cefrLevel: 'A2', frequency: 87 },
  { word: 'Zeit', cefrLevel: 'A2', frequency: 86 },
  
  // B1 words
  { word: 'Gesellschaft', cefrLevel: 'B1', frequency: 68 },
  { word: 'Kultur', cefrLevel: 'B1', frequency: 70 },
  { word: 'Geschichte', cefrLevel: 'B1', frequency: 72 },
  
  // B2 words
  { word: 'Entwicklung', cefrLevel: 'B2', frequency: 54 },
  { word: 'Forschung', cefrLevel: 'B2', frequency: 52 },
];

/**
 * Get word list for a language.
 */
export function getWordList(language: string): ValidWord[] {
  const lists: Record<string, ValidWord[]> = {
    es: SPANISH_WORDS,
    fr: FRENCH_WORDS,
    de: GERMAN_WORDS,
  };
  return lists[language] || SPANISH_WORDS;
}

/**
 * Validate if a word exists in the word list.
 */
export function isValidWord(word: string, language: string): ValidWord | null {
  const list = getWordList(language);
  const normalized = word.toLowerCase();
  return list.find((w) => w.word.toLowerCase() === normalized) || null;
}

/**
 * Calculate score for a word based on CEFR level and length.
 */
export function calculateWordScore(
  word: ValidWord,
  usedCenterHex: boolean,
  comboMultiplier: number
): number {
  const cefrMultipliers: Record<CefrLevel, number> = {
    A1: 1,
    A2: 1.5,
    B1: 2,
    B2: 3,
    C1: 4,
    C2: 5,
  };

  const baseScore = word.word.length * 10;
  const cefrBonus = baseScore * cefrMultipliers[word.cefrLevel];
  const centerBonus = usedCenterHex ? cefrBonus * 2 : cefrBonus;
  const comboScore = centerBonus * comboMultiplier;

  return Math.round(comboScore);
}
