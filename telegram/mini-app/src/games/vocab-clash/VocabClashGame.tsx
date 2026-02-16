/**
 * Vocab Clash Game — Main Component
 * Turn-based card battler
 */

import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { initializeBattle, playRound, aiSelectCard, generateAIDeck } from './battle-engine';
import { getRandomCards } from './data/card-database';
import { generateShareCard } from './share';
import type { VocabCard, BattleState, Language } from './types';

interface VocabClashGameProps {
  language: Language;
  playerDeck?: VocabCard[];
  difficulty?: 'easy' | 'medium' | 'hard';
  onGameOver?: (winner: 'player' | 'opponent', shareText: string) => void;
}

export const VocabClashGame: React.FC<VocabClashGameProps> = ({
  language,
  playerDeck,
  difficulty = 'medium',
  onGameOver,
}) => {
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [selectedCard, setSelectedCard] = useState<VocabCard | null>(null);
  const [animating, setAnimating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  // Initialize battle
  useEffect(() => {
    const pDeck = playerDeck || getRandomCards(language, 12);
    const oDeck = generateAIDeck(difficulty, language);
    const initialState = initializeBattle(pDeck, oDeck);
    setBattle(initialState);
  }, [language, difficulty]);
  
  // Handle card selection
  const handleCardSelect = (card: VocabCard) => {
    if (animating || !battle || battle.winner) return;
    setSelectedCard(card.id === selectedCard?.id ? null : card);
  };
  
  // Play a round
  const handlePlayCard = async () => {
    if (!selectedCard || !battle || animating) return;
    
    setAnimating(true);
    
    // AI selects its card
    const aiCard = aiSelectCard(battle.opponentHand, battle.round);
    
    // Play the round
    const newState = playRound(battle, selectedCard, aiCard);
    
    // Animate the clash
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setBattle(newState);
    setSelectedCard(null);
    setAnimating(false);
    
    // Check if game is over
    if (newState.winner) {
      setShowResults(true);
      const shareText = generateShareCard(newState, language);
      onGameOver?.(newState.winner, shareText);
    }
  };
  
  if (!battle) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-white text-2xl">Loading battle...</div>
      </div>
    );
  }
  
  const languageFlag = {
    es: '🇪🇸',
    fr: '🇫🇷',
    de: '🇩🇪',
  }[language];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4">
      {/* Header: HP Bars */}
      <div className="max-w-4xl mx-auto mb-8">
        {/* Opponent HP */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold">Opponent</span>
            <span className="text-sm">{battle.opponentHP}/20 HP</span>
          </div>
          <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 transition-all duration-500"
              style={{ width: `${(battle.opponentHP / 20) * 100}%` }}
            />
          </div>
        </div>
        
        {/* Round indicator */}
        <div className="text-center text-sm mb-4">
          Round {battle.round} / {battle.maxRounds}
        </div>
        
        {/* Player HP */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold">You</span>
            <span className="text-sm">{battle.playerHP}/20 HP</span>
          </div>
          <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${(battle.playerHP / 20) * 100}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Battle Arena */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex justify-center items-center gap-8 min-h-[300px]">
          {/* Opponent's played card */}
          {battle.playedCards.opponent ? (
            <Card card={battle.playedCards.opponent} size="large" />
          ) : (
            <div className="w-40 h-60 border-4 border-dashed border-gray-600 rounded-xl flex items-center justify-center">
              <span className="text-gray-600 text-4xl">🎴</span>
            </div>
          )}
          
          {/* VS */}
          <div className="text-4xl font-bold text-yellow-400">VS</div>
          
          {/* Player's played card */}
          {battle.playedCards.player ? (
            <Card card={battle.playedCards.player} size="large" />
          ) : (
            <div className="w-40 h-60 border-4 border-dashed border-gray-600 rounded-xl flex items-center justify-center">
              <span className="text-gray-600 text-4xl">🎴</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Player Hand */}
      <div className="max-w-4xl mx-auto">
        <h3 className="text-lg font-bold mb-4 text-center">Your Hand</h3>
        <div className="flex justify-center gap-4 mb-4 flex-wrap">
          {battle.playerHand.map((card) => (
            <Card
              key={card.id}
              card={card}
              onClick={() => handleCardSelect(card)}
              selected={selectedCard?.id === card.id}
              disabled={animating}
            />
          ))}
        </div>
        
        {/* Play button */}
        <div className="flex justify-center">
          <button
            onClick={handlePlayCard}
            disabled={!selectedCard || animating}
            className={`
              px-8 py-4 rounded-xl font-bold text-lg
              transition-all duration-300
              ${selectedCard && !animating
                ? 'bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/50'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {animating ? 'Battle in progress...' : 'Play Card'}
          </button>
        </div>
      </div>
      
      {/* Results Modal */}
      {showResults && battle.winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className={`
            max-w-md mx-4 px-8 py-10 rounded-2xl shadow-2xl text-white text-center
            ${battle.winner === 'player'
              ? 'bg-gradient-to-br from-emerald-600 to-blue-600'
              : 'bg-gradient-to-br from-red-600 to-purple-600'
            }
          `}>
            <div className="text-6xl mb-4">
              {battle.winner === 'player' ? '🏆' : '💀'}
            </div>
            <h2 className="text-3xl font-bold mb-6">
              {battle.winner === 'player' ? 'Victory!' : 'Defeat'}
            </h2>
            
            <div className="space-y-2 mb-8 text-left">
              <div className="flex justify-between">
                <span>Your HP:</span>
                <span className="font-bold">{battle.playerHP}/20</span>
              </div>
              <div className="flex justify-between">
                <span>Opponent HP:</span>
                <span className="font-bold">{battle.opponentHP}/20</span>
              </div>
              <div className="flex justify-between">
                <span>Rounds:</span>
                <span className="font-bold">{battle.round - 1}/{battle.maxRounds}</span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-4 bg-white text-purple-600 font-bold text-lg rounded-xl hover:bg-purple-50 transition-colors shadow-lg"
              >
                Play Again
              </button>
              <button
                onClick={() => {
                  const shareText = generateShareCard(battle, language);
                  console.log('Share:', shareText);
                }}
                className="flex-1 py-4 bg-emerald-500 text-white font-bold text-lg rounded-xl hover:bg-emerald-600 transition-colors shadow-lg"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
