import { config } from '../config.js';

export type StartParamType = 
  | { type: 'game'; game: 'connections' | 'spellcast' | 'speedclash' | 'wordrunner' | 'vocabclash'; puzzle?: number }
  | { type: 'referral'; userId: string }
  | { type: 'challenge'; challengeId: string }
  | { type: 'unknown'; raw: string };

/**
 * Parse the start_param from a /start deep link
 */
export function parseStartParam(param: string): StartParamType {
  if (!param) {
    return { type: 'unknown', raw: '' };
  }

  // Referral: ref_12345
  if (param.startsWith('ref_')) {
    const userId = param.substring(4);
    return { type: 'referral', userId };
  }

  // Challenge: ch_abc123
  if (param.startsWith('ch_')) {
    const challengeId = param.substring(3);
    return { type: 'challenge', challengeId };
  }

  // Connections: c15
  if (param.startsWith('c') && /^c\d+$/.test(param)) {
    const puzzle = parseInt(param.substring(1), 10);
    return { type: 'game', game: 'connections', puzzle };
  }

  // Spell Cast: sc15
  if (param.startsWith('sc') && /^sc\d+$/.test(param)) {
    const puzzle = parseInt(param.substring(2), 10);
    return { type: 'game', game: 'spellcast', puzzle };
  }

  // Speed Clash: clash15
  if (param.startsWith('clash') && /^clash\d+$/.test(param)) {
    const puzzle = parseInt(param.substring(5), 10);
    return { type: 'game', game: 'speedclash', puzzle };
  }

  // Word Runner: wr
  if (param === 'wr') {
    return { type: 'game', game: 'wordrunner' };
  }

  // Vocab Clash: vc
  if (param === 'vc') {
    return { type: 'game', game: 'vocabclash' };
  }

  return { type: 'unknown', raw: param };
}

/**
 * Build a deep link for a game
 */
export function buildGameLink(game: string, puzzleNumber?: number): string {
  const botUsername = config.botUsername;
  
  let param = '';
  switch (game) {
    case 'connections':
      param = puzzleNumber ? `c${puzzleNumber}` : 'c1';
      break;
    case 'spellcast':
      param = puzzleNumber ? `sc${puzzleNumber}` : 'sc1';
      break;
    case 'speedclash':
      param = puzzleNumber ? `clash${puzzleNumber}` : 'clash1';
      break;
    case 'wordrunner':
      param = 'wr';
      break;
    case 'vocabclash':
      param = 'vc';
      break;
    default:
      param = 'c1';
  }

  return `t.me/${botUsername}?start=${param}`;
}

/**
 * Build a referral link for a user
 */
export function buildReferralLink(userId: string | number): string {
  const botUsername = config.botUsername;
  return `t.me/${botUsername}?start=ref_${userId}`;
}

/**
 * Build a challenge link
 */
export function buildChallengeLink(challengeId: string): string {
  const botUsername = config.botUsername;
  return `t.me/${botUsername}?start=ch_${challengeId}`;
}

/**
 * Get the game name in display format
 */
export function getGameDisplayName(game: string): string {
  const names: Record<string, string> = {
    connections: '🔗 Connections',
    spellcast: '🍯 Spell Cast',
    speedclash: '⚡ Speed Clash',
    wordrunner: '🏃 Word Runner',
    vocabclash: '🃏 Vocab Clash',
  };
  return names[game] || game;
}
