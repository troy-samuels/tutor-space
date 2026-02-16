/**
 * Vocab Clash share card generator
 */

import type { BattleState, Language } from './types';

export function generateShareCard(battle: BattleState, language: Language): string {
  const languageFlag = {
    es: '🇪🇸',
    fr: '🇫🇷',
    de: '🇩🇪',
  }[language];
  
  const result = battle.winner === 'player' ? 'Won' : 'Lost';
  const score = `${battle.round - 1}-${battle.maxRounds - (battle.round - 1)}`;
  
  // Find MVP card (highest power card played by winner)
  const winnerCards = battle.log
    .filter(event => event.type === 'play' && event.player === battle.winner)
    .map(event => event.card!)
    .filter(Boolean);
  
  const mvpCard = winnerCards.sort((a, b) => b.power - a.power)[0];
  
  // Count false friend challenges
  const falseFriendCount = battle.log.filter(
    event => event.type === 'ability' && event.message?.includes('False Friend')
  ).length;
  
  const lines = [
    `🃏 Vocab Clash ${languageFlag}`,
    `${result} ${score} vs AI (Medium)`,
    mvpCard ? `MVP: ${mvpCard.word.toUpperCase()} ⭐` : '',
    falseFriendCount > 0 ? `False Friend trap: Caught!` : '',
    `Collection: 47/200`,
    '',
    't.me/TutorLinguaBot?start=vc',
  ];
  
  return lines.filter(Boolean).join('\n');
}
