/**
 * Share card text generators + deep link builders.
 */

import { tg } from '@/telegram';

export interface ShareCardData {
  gameName: string;
  puzzleNumber: number;
  language: string;
  emoji: string;
  grid?: string;
  stats: string[];
  deepLinkParam: string;
}

/**
 * Generate share text for a completed game.
 */
export function generateShareText(data: ShareCardData): string {
  const lines = [
    `${data.emoji} ${data.gameName} #${data.puzzleNumber} ${getLanguageFlag(data.language)}`,
  ];

  if (data.grid) {
    lines.push(data.grid);
  }

  lines.push(...data.stats);
  lines.push(getDeepLink(data.deepLinkParam));

  return lines.join('\n');
}

/**
 * Get language flag emoji.
 */
export function getLanguageFlag(language: string): string {
  const flags: Record<string, string> = {
    es: '🇪🇸',
    fr: '🇫🇷',
    de: '🇩🇪',
    it: '🇮🇹',
    pt: '🇧🇷',
  };
  return flags[language] || '🌍';
}

/**
 * Get deep link URL for a game.
 */
export function getDeepLink(param: string): string {
  // TODO: Replace with actual bot username
  return `t.me/TutorLinguaBot?start=${param}`;
}

/**
 * Format time as MM:SS.
 */
export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Share via Telegram.
 */
export async function shareGame(text: string): Promise<void> {
  await tg.share(text);
}

/**
 * Generate challenge link.
 */
export function generateChallengeLink(
  gameSlug: string,
  challengeId: string
): string {
  return getDeepLink(`${gameSlug}_challenge_${challengeId}`);
}

/**
 * Parse deep link parameter.
 */
export function parseDeepLink(param: string): {
  game: string;
  type: 'daily' | 'challenge';
  id?: string;
} | null {
  if (!param) return null;

  // Format: gameSlug_type_id
  // Examples:
  //   c3 -> connections daily puzzle #3
  //   sc5 -> spell-cast daily puzzle #5
  //   clash7 -> speed-clash daily puzzle #7
  //   connections_challenge_abc123 -> connections challenge
  
  if (param.includes('_challenge_')) {
    const [game, , id] = param.split('_');
    return { game, type: 'challenge', id };
  }

  // Extract game from shorthand
  const gameMap: Record<string, string> = {
    c: 'connections',
    sc: 'spell-cast',
    clash: 'speed-clash',
    wr: 'word-runner',
    vc: 'vocab-clash',
  };

  const match = param.match(/^([a-z]+)(\d*)$/);
  if (!match) return null;

  const [, prefix, number] = match;
  const game = gameMap[prefix] || prefix;

  return { game, type: 'daily', id: number };
}
