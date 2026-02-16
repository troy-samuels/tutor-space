/**
 * Spell Cast share card generator.
 */

import { getLanguageFlag, getDeepLink } from '@/lib/share';

export function generateShareText(
  puzzleNumber: number,
  language: string,
  score: number,
  wordCount: number,
  bestWord: string,
  maxCombo: number
): string {
  const flag = getLanguageFlag(language);

  const lines = [
    `🍯 Spell Cast #${puzzleNumber} ${flag}`,
    `Score: ${score} pts`,
    `${wordCount} words found`,
  ];

  if (bestWord) {
    lines.push(`Best: ${bestWord.toUpperCase()}`);
  }

  if (maxCombo > 1) {
    lines.push(`⛓️ Max combo: ${maxCombo}x`);
  }

  lines.push(getDeepLink(`sc${puzzleNumber}`));

  return lines.join('\n');
}
