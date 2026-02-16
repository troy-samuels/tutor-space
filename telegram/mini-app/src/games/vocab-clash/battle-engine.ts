/**
 * Vocab Clash Battle Engine
 * Pure functions for turn-based card battles
 */

import type {
  VocabCard,
  BattleState,
  BattleEvent,
  AbilityResult,
  FalseFriendChallenge,
  CardAbility,
} from './types';
import { getRandomCards } from './data/card-database';

const STARTING_HP = 20;
const MAX_ROUNDS = 5;

/**
 * Initialize a new battle
 */
export function initializeBattle(
  playerDeck: VocabCard[],
  opponentDeck: VocabCard[]
): BattleState {
  // Draw initial hands (5 cards each)
  const playerHand = playerDeck.slice(0, 5);
  const opponentHand = opponentDeck.slice(0, 5);
  
  return {
    playerHP: STARTING_HP,
    opponentHP: STARTING_HP,
    round: 1,
    maxRounds: MAX_ROUNDS,
    playerHand,
    opponentHand,
    playerDeck: playerDeck.slice(5),
    opponentDeck: opponentDeck.slice(5),
    playedCards: {
      player: null,
      opponent: null,
    },
    log: [],
    winner: null,
  };
}

/**
 * Play a round of battle
 */
export function playRound(
  state: BattleState,
  playerCard: VocabCard,
  opponentCard: VocabCard,
  falseFriendChallengeResult?: boolean // true = player got it right
): BattleState {
  const newState = { ...state };
  
  // Record cards played
  newState.playedCards = {
    player: playerCard,
    opponent: opponentCard,
  };
  
  // Log play events
  newState.log.push({
    type: 'play',
    turn: state.round,
    player: 'player',
    card: playerCard,
    message: `Player plays ${playerCard.word}`,
  });
  
  newState.log.push({
    type: 'play',
    turn: state.round,
    player: 'opponent',
    card: opponentCard,
    message: `Opponent plays ${opponentCard.word}`,
  });
  
  // Resolve abilities (player first, then opponent)
  const playerAbilityResult = resolveAbility(playerCard, opponentCard, 'player', falseFriendChallengeResult);
  const opponentAbilityResult = resolveAbility(opponentCard, playerCard, 'opponent');
  
  if (playerAbilityResult.message) {
    newState.log.push({
      type: 'ability',
      turn: state.round,
      player: 'player',
      card: playerCard,
      message: playerAbilityResult.message,
    });
  }
  
  if (opponentAbilityResult.message) {
    newState.log.push({
      type: 'ability',
      turn: state.round,
      player: 'opponent',
      card: opponentCard,
      message: opponentAbilityResult.message,
    });
  }
  
  // Determine winner of the clash
  let winner: 'player' | 'opponent' | 'tie';
  let loser: 'player' | 'opponent' | null = null;
  
  const playerPower = playerCard.power * playerAbilityResult.damageModifier;
  const opponentPower = opponentCard.power * opponentAbilityResult.damageModifier;
  
  if (playerPower > opponentPower) {
    winner = 'player';
    loser = 'opponent';
  } else if (opponentPower > playerPower) {
    winner = 'opponent';
    loser = 'player';
  } else {
    winner = 'tie';
  }
  
  // Calculate and apply damage
  if (winner !== 'tie' && loser) {
    const winnerCard = winner === 'player' ? playerCard : opponentCard;
    const loserCard = winner === 'player' ? opponentCard : playerCard;
    const damage = calculateDamage(winnerCard, loserCard);
    
    if (loser === 'player') {
      newState.playerHP = Math.max(0, newState.playerHP - damage);
    } else {
      newState.opponentHP = Math.max(0, newState.opponentHP - damage);
    }
    
    newState.log.push({
      type: 'damage',
      turn: state.round,
      player: loser,
      message: `${loser === 'player' ? 'Player' : 'Opponent'} takes ${damage} damage`,
      damage,
    });
  }
  
  newState.log.push({
    type: 'clash',
    turn: state.round,
    message: winner === 'tie' ? 'Clash ends in a tie!' : `${winner === 'player' ? 'Player' : 'Opponent'} wins the clash!`,
  });
  
  // Remove played cards from hands
  newState.playerHand = newState.playerHand.filter(c => c.id !== playerCard.id);
  newState.opponentHand = newState.opponentHand.filter(c => c.id !== opponentCard.id);
  
  // Draw new cards if deck has cards remaining
  if (newState.playerDeck.length > 0) {
    newState.playerHand.push(newState.playerDeck[0]);
    newState.playerDeck = newState.playerDeck.slice(1);
  }
  
  if (newState.opponentDeck.length > 0) {
    newState.opponentHand.push(newState.opponentDeck[0]);
    newState.opponentDeck = newState.opponentDeck.slice(1);
  }
  
  // Increment round
  newState.round++;
  
  // Check win conditions
  if (newState.playerHP <= 0) {
    newState.winner = 'opponent';
  } else if (newState.opponentHP <= 0) {
    newState.winner = 'player';
  } else if (newState.round > newState.maxRounds) {
    // Max rounds reached - highest HP wins
    if (newState.playerHP > newState.opponentHP) {
      newState.winner = 'player';
    } else if (newState.opponentHP > newState.playerHP) {
      newState.winner = 'opponent';
    } else {
      // Tie - use total damage dealt as tiebreaker
      const playerDamageDealt = STARTING_HP - newState.opponentHP;
      const opponentDamageDealt = STARTING_HP - newState.playerHP;
      newState.winner = playerDamageDealt > opponentDamageDealt ? 'player' : 'opponent';
    }
  }
  
  return newState;
}

/**
 * Resolve card ability effects
 */
function resolveAbility(
  attackerCard: VocabCard,
  defenderCard: VocabCard,
  attacker: 'player' | 'opponent',
  falseFriendResult?: boolean
): AbilityResult {
  const result: AbilityResult = {
    blocked: false,
    damageModifier: 1.0,
    message: '',
  };
  
  switch (attackerCard.ability) {
    case 'confuse':
      // False Friend challenge
      // If attacker has false friend, they get bonus damage IF defender fails the challenge
      // In the UI, this would trigger a modal with 3 options
      result.message = `${attackerCard.word} triggers a False Friend challenge!`;
      if (falseFriendResult === false) {
        result.damageModifier = 2.0;
        result.message += ' Defender confused! Double damage!';
      } else if (falseFriendResult === true) {
        result.message += ' Defender answered correctly. Normal damage.';
      }
      break;
    
    case 'shield':
      // Defender gains +2 defence (reduced damage)
      result.message = `${attackerCard.word} has Shield! +2 defence`;
      // This is handled in damage calculation
      break;
    
    case 'surprise':
      // Double damage if opponent doesn't know the word (simulated as random for AI)
      const surprised = attacker === 'opponent' && Math.random() < 0.3; // 30% chance player is surprised
      if (surprised) {
        result.damageModifier = 2.0;
        result.message = `${attackerCard.word} surprises! Double damage!`;
      }
      break;
    
    case 'specialist':
      // High power words (handled in card stats, no runtime effect)
      break;
    
    case 'scout':
      // See opponent's next card (handled in UI, no combat effect)
      result.message = `${attackerCard.word} scouts ahead!`;
      break;
  }
  
  return result;
}

/**
 * Calculate damage dealt
 */
export function calculateDamage(winnerCard: VocabCard, loserCard: VocabCard): number {
  const baseDamage = winnerCard.power - loserCard.defence;
  
  // Apply ability modifiers
  let damageModifier = 1.0;
  
  if (loserCard.ability === 'shield') {
    damageModifier = 0.8; // Shield reduces damage by 20%
  }
  
  const finalDamage = Math.max(1, Math.round(baseDamage * damageModifier));
  return finalDamage;
}

/**
 * Check if a card triggers a False Friend challenge
 */
export function checkFalseFriendChallenge(card: VocabCard): FalseFriendChallenge | null {
  if (card.ability !== 'confuse') return null;
  
  // Generate false friend challenge
  // In a real implementation, this would look up actual false friend data
  // For now, generate plausible wrong answers
  return {
    word: card.word,
    correctMeaning: card.translation,
    wrongMeanings: [
      `${card.translation.split(' ')[0]} (wrong)`, // Simplified for demo
      `not ${card.translation}`,
    ],
  };
}

/**
 * Generate an AI deck based on difficulty
 */
export function generateAIDeck(
  difficulty: 'easy' | 'medium' | 'hard',
  language: 'es' | 'fr' | 'de'
): VocabCard[] {
  const deckSize = 12;
  
  switch (difficulty) {
    case 'easy':
      // Mostly common/uncommon, lower CEFR
      return getRandomCards(language, deckSize).filter(c => 
        ['common', 'uncommon'].includes(c.rarity) && 
        ['A1', 'A2'].includes(c.cefrLevel)
      ).slice(0, deckSize);
    
    case 'medium':
      // Mix of uncommon/rare, mid CEFR
      return getRandomCards(language, deckSize).filter(c => 
        ['uncommon', 'rare'].includes(c.rarity)
      ).slice(0, deckSize);
    
    case 'hard':
      // Rare/epic/legendary, high CEFR
      return getRandomCards(language, deckSize).filter(c => 
        ['rare', 'epic', 'legendary'].includes(c.rarity) &&
        ['B1', 'B2'].includes(c.cefrLevel)
      ).slice(0, deckSize);
    
    default:
      return getRandomCards(language, deckSize);
  }
}

/**
 * AI selects a card to play
 */
export function aiSelectCard(hand: VocabCard[], round: number): VocabCard {
  // Simple AI: play highest power card
  // In a more advanced implementation, this would consider opponent's likely card
  const sorted = [...hand].sort((a, b) => b.power - a.power);
  return sorted[0] || hand[0];
}
