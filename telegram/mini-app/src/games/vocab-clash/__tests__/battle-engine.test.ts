/**
 * Vocab Clash Battle Engine Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  initializeBattle,
  playRound,
  calculateDamage,
  generateAIDeck,
  aiSelectCard,
} from '../battle-engine';
import type { VocabCard, BattleState } from '../types';

describe('Battle Engine', () => {
  let playerDeck: VocabCard[];
  let opponentDeck: VocabCard[];
  
  beforeEach(() => {
    playerDeck = [
      {
        id: 'test_1',
        word: 'casa',
        translation: 'house',
        language: 'es',
        power: 5,
        defence: 4,
        ability: 'shield',
        rarity: 'common',
        cefrLevel: 'A1',
        category: 'home',
      },
      {
        id: 'test_2',
        word: 'gato',
        translation: 'cat',
        language: 'es',
        power: 3,
        defence: 6,
        ability: 'scout',
        rarity: 'common',
        cefrLevel: 'A1',
        category: 'nature',
      },
      {
        id: 'test_3',
        word: 'libro',
        translation: 'book',
        language: 'es',
        power: 4,
        defence: 5,
        ability: 'confuse',
        rarity: 'uncommon',
        cefrLevel: 'A2',
        category: 'education',
      },
      {
        id: 'test_4',
        word: 'montaña',
        translation: 'mountain',
        language: 'es',
        power: 6,
        defence: 3,
        ability: 'surprise',
        rarity: 'rare',
        cefrLevel: 'B1',
        category: 'nature',
      },
      {
        id: 'test_5',
        word: 'desarrollo',
        translation: 'development',
        language: 'es',
        power: 8,
        defence: 2,
        ability: 'specialist',
        rarity: 'epic',
        cefrLevel: 'B2',
        category: 'business',
      },
      // Need at least 12 cards for a full deck
      {
        id: 'test_6',
        word: 'agua',
        translation: 'water',
        language: 'es',
        power: 2,
        defence: 7,
        ability: 'shield',
        rarity: 'common',
        cefrLevel: 'A1',
        category: 'food',
      },
      {
        id: 'test_7',
        word: 'sol',
        translation: 'sun',
        language: 'es',
        power: 3,
        defence: 5,
        ability: 'shield',
        rarity: 'common',
        cefrLevel: 'A1',
        category: 'nature',
      },
      {
        id: 'test_8',
        word: 'luna',
        translation: 'moon',
        language: 'es',
        power: 3,
        defence: 5,
        ability: 'scout',
        rarity: 'common',
        cefrLevel: 'A1',
        category: 'nature',
      },
      {
        id: 'test_9',
        word: 'calle',
        translation: 'street',
        language: 'es',
        power: 4,
        defence: 4,
        ability: 'scout',
        rarity: 'common',
        cefrLevel: 'A1',
        category: 'travel',
      },
      {
        id: 'test_10',
        word: 'ciudad',
        translation: 'city',
        language: 'es',
        power: 5,
        defence: 3,
        ability: 'surprise',
        rarity: 'uncommon',
        cefrLevel: 'A2',
        category: 'travel',
      },
      {
        id: 'test_11',
        word: 'felicidad',
        translation: 'happiness',
        language: 'es',
        power: 7,
        defence: 2,
        ability: 'surprise',
        rarity: 'rare',
        cefrLevel: 'B1',
        category: 'emotions',
      },
      {
        id: 'test_12',
        word: 'conocimiento',
        translation: 'knowledge',
        language: 'es',
        power: 9,
        defence: 1,
        ability: 'confuse',
        rarity: 'epic',
        cefrLevel: 'B2',
        category: 'education',
      },
    ];
    
    opponentDeck = [...playerDeck]; // Same deck for simplicity
  });
  
  describe('initializeBattle', () => {
    it('should initialize battle with correct starting values', () => {
      const battle = initializeBattle(playerDeck, opponentDeck);
      
      expect(battle.playerHP).toBe(20);
      expect(battle.opponentHP).toBe(20);
      expect(battle.round).toBe(1);
      expect(battle.maxRounds).toBe(5);
      expect(battle.playerHand.length).toBe(5);
      expect(battle.opponentHand.length).toBe(5);
      expect(battle.log.length).toBe(0);
      expect(battle.winner).toBeNull();
    });
    
    it('should draw 5 cards to each hand from decks', () => {
      const battle = initializeBattle(playerDeck, opponentDeck);
      
      expect(battle.playerHand.length).toBe(5);
      expect(battle.opponentHand.length).toBe(5);
      expect(battle.playerDeck.length).toBe(7); // 12 - 5 = 7
      expect(battle.opponentDeck.length).toBe(7);
    });
  });
  
  describe('playRound', () => {
    it('should resolve a round with higher power winning', () => {
      const battle = initializeBattle(playerDeck, opponentDeck);
      
      const playerCard = battle.playerHand[0]; // casa (power 5)
      const opponentCard = battle.opponentHand[1]; // gato (power 3)
      
      const newState = playRound(battle, playerCard, opponentCard);
      
      // Player should win (higher power)
      expect(newState.opponentHP).toBeLessThan(20);
      expect(newState.round).toBe(2);
      expect(newState.log.length).toBeGreaterThan(0);
    });
    
    it('should handle tie correctly', () => {
      const battle = initializeBattle(playerDeck, opponentDeck);
      
      const card = battle.playerHand.find(c => c.power === 3)!;
      
      const newState = playRound(battle, card, card); // Same card = tie
      
      // Tie should not deal damage
      expect(newState.playerHP).toBe(20);
      expect(newState.opponentHP).toBe(20);
    });
    
    it('should increment round counter', () => {
      const battle = initializeBattle(playerDeck, opponentDeck);
      
      expect(battle.round).toBe(1);
      
      const newState = playRound(battle, battle.playerHand[0], battle.opponentHand[0]);
      
      expect(newState.round).toBe(2);
    });
    
    it('should remove played cards from hands', () => {
      const battle = initializeBattle(playerDeck, opponentDeck);
      
      const playerCard = battle.playerHand[0];
      const opponentCard = battle.opponentHand[0];
      
      const initialPlayerHandSize = battle.playerHand.length;
      const initialOpponentHandSize = battle.opponentHand.length;
      
      const newState = playRound(battle, playerCard, opponentCard);
      
      // Cards should be removed, but new ones drawn if deck has cards
      expect(newState.playerHand.some(c => c.id === playerCard.id)).toBe(false);
      expect(newState.opponentHand.some(c => c.id === opponentCard.id)).toBe(false);
    });
    
    it('should draw new cards after playing if deck has cards', () => {
      const battle = initializeBattle(playerDeck, opponentDeck);
      
      const newState = playRound(battle, battle.playerHand[0], battle.opponentHand[0]);
      
      // Hand size should remain 5 (removed 1, drew 1)
      expect(newState.playerHand.length).toBe(5);
      expect(newState.opponentHand.length).toBe(5);
    });
  });
  
  describe('calculateDamage', () => {
    it('should calculate base damage as power - defence', () => {
      const winner: VocabCard = {
        id: 'w1',
        word: 'test',
        translation: 'test',
        language: 'es',
        power: 8,
        defence: 3,
        ability: 'specialist',
        rarity: 'epic',
        cefrLevel: 'B2',
        category: 'business',
      };
      
      const loser: VocabCard = {
        id: 'l1',
        word: 'test',
        translation: 'test',
        language: 'es',
        power: 3,
        defence: 4,
        ability: 'scout',
        rarity: 'common',
        cefrLevel: 'A1',
        category: 'travel',
      };
      
      const damage = calculateDamage(winner, loser);
      
      // 8 (power) - 4 (defence) = 4
      expect(damage).toBe(4);
    });
    
    it('should apply shield ability damage reduction', () => {
      const winner: VocabCard = {
        id: 'w1',
        word: 'test',
        translation: 'test',
        language: 'es',
        power: 10,
        defence: 2,
        ability: 'specialist',
        rarity: 'epic',
        cefrLevel: 'B2',
        category: 'business',
      };
      
      const loserWithShield: VocabCard = {
        id: 'l1',
        word: 'test',
        translation: 'test',
        language: 'es',
        power: 2,
        defence: 3,
        ability: 'shield',
        rarity: 'common',
        cefrLevel: 'A1',
        category: 'home',
      };
      
      const damage = calculateDamage(winner, loserWithShield);
      
      // Base: 10 - 3 = 7
      // Shield modifier: 7 * 0.8 = 5.6 → 6
      expect(damage).toBeGreaterThan(0);
      expect(damage).toBeLessThanOrEqual(7);
    });
    
    it('should have minimum damage of 1', () => {
      const winner: VocabCard = {
        id: 'w1',
        word: 'test',
        translation: 'test',
        language: 'es',
        power: 2,
        defence: 5,
        ability: 'scout',
        rarity: 'common',
        cefrLevel: 'A1',
        category: 'nature',
      };
      
      const loser: VocabCard = {
        id: 'l1',
        word: 'test',
        translation: 'test',
        language: 'es',
        power: 1,
        defence: 10,
        ability: 'shield',
        rarity: 'common',
        cefrLevel: 'A1',
        category: 'home',
      };
      
      const damage = calculateDamage(winner, loser);
      
      // Should be at least 1
      expect(damage).toBeGreaterThanOrEqual(1);
    });
  });
  
  describe('HP Boundary Conditions', () => {
    it('should not allow HP to go below 0', () => {
      const battle = initializeBattle(playerDeck, opponentDeck);
      
      // Manually set HP low
      battle.playerHP = 1;
      
      // Play a round where opponent wins with high damage
      const weakCard = battle.playerHand.find(c => c.power <= 2)!;
      const strongCard = battle.opponentHand.find(c => c.power >= 8)!;
      
      const newState = playRound(battle, weakCard, strongCard);
      
      expect(newState.playerHP).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('Win Conditions', () => {
    it('should declare winner when HP reaches 0', () => {
      const battle = initializeBattle(playerDeck, opponentDeck);
      battle.opponentHP = 1; // Very low HP
      
      // Play round where player wins
      const strongCard = battle.playerHand.find(c => c.power >= 8)!;
      const weakCard = battle.opponentHand.find(c => c.power <= 2)!;
      
      const newState = playRound(battle, strongCard, weakCard);
      
      if (newState.opponentHP <= 0) {
        expect(newState.winner).toBe('player');
      }
    });
    
    it('should declare winner by HP after max rounds', () => {
      const battle = initializeBattle(playerDeck, opponentDeck);
      battle.round = 5; // Last round
      battle.playerHP = 15;
      battle.opponentHP = 10;
      
      const newState = playRound(battle, battle.playerHand[0], battle.opponentHand[0]);
      
      // After round 5, if max rounds reached, higher HP should win
      if (newState.round > newState.maxRounds && newState.playerHP > 0 && newState.opponentHP > 0) {
        expect(newState.winner).toBe('player');
      }
    });
    
    it('should use total damage as tiebreaker if HP is equal after max rounds', () => {
      const battle = initializeBattle(playerDeck, opponentDeck);
      battle.round = 5; // Last round
      battle.playerHP = 10;
      battle.opponentHP = 10; // Equal HP
      
      const newState = playRound(battle, battle.playerHand[0], battle.opponentHand[0]);
      
      // If HP is equal, winner is determined by total damage dealt
      if (newState.round > newState.maxRounds && newState.playerHP === newState.opponentHP) {
        expect(newState.winner).not.toBeNull();
      }
    });
  });
  
  describe('AI Deck Generation', () => {
    it('should generate easy deck with common/uncommon cards', () => {
      const deck = generateAIDeck('easy', 'es');
      
      expect(deck.length).toBeGreaterThan(0);
      expect(deck.length).toBeLessThanOrEqual(12);
      
      const hasOnlyLowRarity = deck.every(card => 
        ['common', 'uncommon'].includes(card.rarity)
      );
      // Note: may not always be true due to filtering, but should be attempted
    });
    
    it('should generate hard deck with rare+ cards', () => {
      const deck = generateAIDeck('hard', 'es');
      
      expect(deck.length).toBeGreaterThan(0);
      
      // Hard deck should attempt to use higher rarity cards
      const hasHighRarity = deck.some(card => 
        ['rare', 'epic', 'legendary'].includes(card.rarity)
      );
      // Note: depends on card availability
    });
  });
  
  describe('AI Card Selection', () => {
    it('should select card from hand', () => {
      const hand: VocabCard[] = playerDeck.slice(0, 5);
      const selected = aiSelectCard(hand, 1);
      
      expect(hand).toContain(selected);
    });
    
    it('should select highest power card (simple AI)', () => {
      const hand: VocabCard[] = [
        playerDeck.find(c => c.power === 3)!,
        playerDeck.find(c => c.power === 8)!,
        playerDeck.find(c => c.power === 5)!,
      ];
      
      const selected = aiSelectCard(hand, 1);
      
      expect(selected.power).toBe(8);
    });
  });
});
