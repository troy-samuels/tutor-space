import { buildGameLink } from './deep-links.js';

export interface ConnectionsResult {
  puzzleNumber: number;
  language: string;
  attempts: number;
  completed: boolean;
  timeSeconds: number;
  streak?: number;
  groups: Array<'yellow' | 'green' | 'blue' | 'purple'>;
}

export interface SpellCastResult {
  puzzleNumber: number;
  language: string;
  score: number;
  bestWord: string;
  bestWordLength: number;
  bestWordLevel: string;
  maxCombo: number;
  percentile?: number;
}

export interface SpeedClashResult {
  puzzleNumber: number;
  language: string;
  correct: number;
  total: number;
  avgSpeed: number;
  beatGhosts: string[];
  lostToGhosts: string[];
  streak?: number;
}

export interface WordRunnerResult {
  distance: number;
  score: number;
  speedLevel: number;
  bestStreak: number;
  livesLeft: number;
}

export interface VocabClashResult {
  won: boolean;
  score: string;
  opponent: string;
  mvpCard: string;
  mvpRarity: string;
  totalCards: number;
}

/**
 * Generate share card text for Connections
 */
export function generateConnectionsShareCard(result: ConnectionsResult): string {
  const { puzzleNumber, language, attempts, completed, timeSeconds, streak, groups } = result;
  
  const flagEmojis: Record<string, string> = {
    spanish: '🇪🇸',
    french: '🇫🇷',
    german: '🇩🇪',
  };
  const flag = flagEmojis[language.toLowerCase()] || '🌍';

  const colorEmojis = {
    yellow: '🟨',
    green: '🟩',
    blue: '🟦',
    purple: '🟪',
  };

  const grid = groups.map(color => 
    `${colorEmojis[color]}${colorEmojis[color]}${colorEmojis[color]}${colorEmojis[color]}`
  ).join('\n');

  const minutes = Math.floor(timeSeconds / 60);
  const seconds = timeSeconds % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const streakStr = streak ? ` | 🔥 ${streak}-day streak` : '';
  const resultEmoji = completed ? '✅' : '❌';

  return `🔗 Connections #${puzzleNumber} ${flag}
${grid}
${resultEmoji} ${attempts} ${attempts === 1 ? 'mistake' : 'mistakes'} | ⏱️ ${timeStr}${streakStr}

${buildGameLink('connections', puzzleNumber)}`;
}

/**
 * Generate share card text for Spell Cast
 */
export function generateSpellCastShareCard(result: SpellCastResult): string {
  const { puzzleNumber, language, score, bestWord, bestWordLength, bestWordLevel, maxCombo, percentile } = result;
  
  const flagEmojis: Record<string, string> = {
    spanish: '🇪🇸',
    french: '🇫🇷',
    german: '🇩🇪',
  };
  const flag = flagEmojis[language.toLowerCase()] || '🌍';

  const percentileStr = percentile ? `\nTop ${percentile}% today 🏆` : '';
  const comboStr = maxCombo > 1 ? `\n⛓️ Max combo: ${maxCombo}x` : '';

  return `🍯 Spell Cast #${puzzleNumber} ${flag}
Score: ${score} pts
Best: ${bestWord} (${bestWordLength}L, ${bestWordLevel})${comboStr}${percentileStr}

${buildGameLink('spellcast', puzzleNumber)}`;
}

/**
 * Generate share card text for Speed Clash
 */
export function generateSpeedClashShareCard(result: SpeedClashResult): string {
  const { puzzleNumber, language, correct, total, avgSpeed, beatGhosts, lostToGhosts, streak } = result;
  
  const flagEmojis: Record<string, string> = {
    spanish: '🇪🇸',
    french: '🇫🇷',
    german: '🇩🇪',
  };
  const flag = flagEmojis[language.toLowerCase()] || '🌍';

  const ghostEmojis: Record<string, string> = {
    'Beginner': '🐢',
    'Regular': '🐇',
    'Native': '⚡',
  };

  const beatStr = beatGhosts.length > 0 
    ? `\nBeat ${beatGhosts.map(g => ghostEmojis[g] || g).join(' ')}!`
    : '';
  const lostStr = lostToGhosts.length > 0
    ? `\nLost to ${lostToGhosts.map(g => ghostEmojis[g] || g).join(' ')}`
    : '';

  const streakStr = streak ? `\n🔥 ${streak}-day streak` : '';

  return `⚡ Speed Clash #${puzzleNumber} ${flag}
Score: ${correct}/${total} correct
Avg speed: ${avgSpeed.toFixed(1)}s${beatStr}${lostStr}${streakStr}

Race me: ${buildGameLink('speedclash', puzzleNumber)}`;
}

/**
 * Generate share card text for Word Runner
 */
export function generateWordRunnerShareCard(result: WordRunnerResult, language: string): string {
  const { distance, score, speedLevel, bestStreak, livesLeft } = result;
  
  const flagEmojis: Record<string, string> = {
    spanish: '🇪🇸',
    french: '🇫🇷',
    german: '🇩🇪',
  };
  const flag = flagEmojis[language.toLowerCase()] || '🌍';

  const hearts = '❤️'.repeat(livesLeft) + '🖤'.repeat(3 - livesLeft);

  return `🏃 Word Runner ${flag}
Distance: ${distance}m
Score: ${score.toLocaleString()} pts
Speed: Level ${speedLevel}
Best streak: ${bestStreak} words
${hearts}

Can you go further? ${buildGameLink('wordrunner')}`;
}

/**
 * Generate share card text for Vocab Clash
 */
export function generateVocabClashShareCard(result: VocabClashResult, language: string): string {
  const { won, score, opponent, mvpCard, mvpRarity, totalCards } = result;
  
  const flagEmojis: Record<string, string> = {
    spanish: '🇪🇸',
    french: '🇫🇷',
    german: '🇩🇪',
  };
  const flag = flagEmojis[language.toLowerCase()] || '🌍';

  const resultEmoji = won ? '🏆' : '💔';
  const resultText = won ? 'Won' : 'Lost';

  const rarityEmojis: Record<string, string> = {
    'Common': '⚪',
    'Uncommon': '🟢',
    'Rare': '🔵',
    'Epic': '🟣',
    'Legendary': '🟡',
    'Mythic': '✨',
  };
  const rarityEmoji = rarityEmojis[mvpRarity] || '📖';

  return `🃏 Vocab Clash ${flag}
${resultEmoji} ${resultText} ${score} vs ${opponent}
MVP: ${mvpCard} (${mvpRarity} ${rarityEmoji})
Collection: ${totalCards}/200 cards

Battle me: ${buildGameLink('vocabclash')}`;
}
