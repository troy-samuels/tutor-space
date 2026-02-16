/**
 * Connections-specific share card generator.
 */

import { getLanguageFlag, getDeepLink, formatTime } from '@/lib/share';
import type { Difficulty } from '@/data/connections';

const DIFFICULTY_EMOJI: Record<Difficulty, string> = {
  yellow: '🟨',
  green: '🟩',
  blue: '🟦',
  purple: '🟪',
};

export function generateShareText(
  puzzleNumber: number,
  language: string,
  guessHistory: Difficulty[][],
  mistakes: number,
  timeMs: number
): string {
  const flag = getLanguageFlag(language);

  // Build emoji grid from guess history
  const grid = guessHistory
    .map((row) => row.map((d) => DIFFICULTY_EMOJI[d]).join(''))
    .join('\n');

  const mistakeStr = mistakes === 0 ? 'Perfect!' : `${mistakes} mistake${mistakes > 1 ? 's' : ''}`;
  const timeStr = formatTime(timeMs);

  return [
    `🔗 Connections #${puzzleNumber} ${flag}`,
    grid,
    `${mistakeStr} · ${timeStr}`,
    getDeepLink(`c${puzzleNumber}`),
  ].join('\n');
}
