/**
 * Type definitions for Vocab Clash card battler
 */

export type Language = 'es' | 'fr' | 'de';
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2';
export type CardRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type CardAbility = 'confuse' | 'shield' | 'surprise' | 'specialist' | 'scout';
export type CardCategory = 'food' | 'travel' | 'emotions' | 'business' | 'nature' | 'technology' | 'culture' | 'body' | 'home' | 'education';

export interface VocabCard {
  id: string;
  word: string; // Target language word
  translation: string; // English meaning
  language: Language;
  power: number; // 1-10 attack
  defence: number; // 1-10 health
  ability: CardAbility;
  rarity: CardRarity;
  cefrLevel: CEFRLevel;
  category: CardCategory;
}

export interface FalseFriendChallenge {
  word: string;
  correctMeaning: string;
  wrongMeanings: [string, string];
}

export interface AbilityResult {
  blocked: boolean;
  damageModifier: number; // Multiplier (1.0 = normal, 2.0 = double, 0.5 = half)
  message: string;
  challengeRequired?: FalseFriendChallenge;
}

export interface BattleEvent {
  type: 'play' | 'clash' | 'ability' | 'damage' | 'challenge';
  turn: number;
  player?: string;
  card?: VocabCard;
  message: string;
  damage?: number;
}

export interface BattleState {
  playerHP: number;
  opponentHP: number;
  round: number;
  maxRounds: number;
  playerHand: VocabCard[];
  opponentHand: VocabCard[];
  playerDeck: VocabCard[];
  opponentDeck: VocabCard[];
  playedCards: {
    player: VocabCard | null;
    opponent: VocabCard | null;
  };
  log: BattleEvent[];
  winner: 'player' | 'opponent' | null;
}

export interface DeckStats {
  avgPower: number;
  avgDefence: number;
  abilityDistribution: Record<CardAbility, number>;
  rarityDistribution: Record<CardRarity, number>;
  totalCards: number;
}

export interface Collection {
  userId: string;
  collectedCards: Set<string>; // Card IDs
  totalCards: number;
  totalPossible: number;
}
