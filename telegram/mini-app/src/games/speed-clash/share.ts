/**
 * Speed Clash share card generator.
 */

import { getLanguageFlag, getDeepLink } from '@/lib/share';

export function generateShareText(
  puzzleNumber: number,
  language: string,
  correctCount: number,
  totalRounds: number,
  avgSpeedMs: number
): string {
  const flag = getLanguageFlag(language);
  const avgSpeedSec = (avgSpeedMs / 1000).toFixed(1);

  return [
    `⚡ Speed Clash #${puzzleNumber} ${flag}`,
    `Score: ${correctCount}/${totalRounds} correct`,
    `Avg speed: ${avgSpeedSec}s`,
    getDeepLink(`clash${puzzleNumber}`),
  ].join('\n');
}
