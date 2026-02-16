/**
 * Vocab Clash Card Component
 * Beautiful card design with rarity-based styling
 */

import React from 'react';
import type { VocabCard, CardRarity } from './types';

interface CardProps {
  card: VocabCard;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  revealed?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const RARITY_STYLES: Record<CardRarity, { border: string; glow: string; bg: string }> = {
  common: {
    border: 'border-gray-400',
    glow: 'shadow-gray-400/50',
    bg: 'bg-gradient-to-br from-gray-600 to-gray-700',
  },
  uncommon: {
    border: 'border-green-400',
    glow: 'shadow-green-400/50',
    bg: 'bg-gradient-to-br from-green-600 to-green-700',
  },
  rare: {
    border: 'border-blue-400',
    glow: 'shadow-blue-400/50',
    bg: 'bg-gradient-to-br from-blue-600 to-blue-700',
  },
  epic: {
    border: 'border-purple-400',
    glow: 'shadow-purple-400/50',
    bg: 'bg-gradient-to-br from-purple-600 to-purple-700',
  },
  legendary: {
    border: 'border-yellow-400',
    glow: 'shadow-yellow-400/50 animate-pulse',
    bg: 'bg-gradient-to-br from-yellow-600 via-yellow-500 to-yellow-600',
  },
  mythic: {
    border: 'border-pink-400',
    glow: 'shadow-pink-400/50 animate-pulse',
    bg: 'bg-gradient-to-br from-pink-600 via-purple-500 to-blue-600',
  },
};

const ABILITY_ICONS: Record<string, string> = {
  confuse: '❓',
  shield: '🛡️',
  surprise: '⚡',
  specialist: '🎓',
  scout: '👁️',
};

const CEFR_COLORS: Record<string, string> = {
  A1: 'bg-emerald-500',
  A2: 'bg-blue-500',
  B1: 'bg-amber-500',
  B2: 'bg-violet-500',
};

export const Card: React.FC<CardProps> = ({
  card,
  onClick,
  selected = false,
  disabled = false,
  revealed = true,
  size = 'medium',
}) => {
  const rarityStyle = RARITY_STYLES[card.rarity];
  
  const sizeClasses = {
    small: 'w-24 h-36 text-xs',
    medium: 'w-32 h-48 text-sm',
    large: 'w-40 h-60 text-base',
  }[size];
  
  return (
    <div
      className={`
        ${sizeClasses}
        relative rounded-xl border-4 ${rarityStyle.border}
        ${rarityStyle.bg}
        shadow-xl ${rarityStyle.glow}
        transition-all duration-300
        ${selected ? 'scale-110 -translate-y-4' : ''}
        ${!disabled && onClick ? 'cursor-pointer hover:scale-105' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      onClick={!disabled ? onClick : undefined}
    >
      {revealed ? (
        <>
          {/* CEFR Badge */}
          <div className={`absolute top-2 right-2 ${CEFR_COLORS[card.cefrLevel]} text-white text-xs font-bold px-2 py-1 rounded-full`}>
            {card.cefrLevel}
          </div>
          
          {/* Word */}
          <div className="absolute top-8 left-0 right-0 px-3">
            <p className="text-white font-bold text-center uppercase tracking-wide truncate">
              {card.word}
            </p>
          </div>
          
          {/* Translation */}
          <div className="absolute top-16 left-0 right-0 px-3">
            <p className="text-white/80 text-xs text-center truncate">
              {card.translation}
            </p>
          </div>
          
          {/* Ability Icon */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl">
            {ABILITY_ICONS[card.ability]}
          </div>
          
          {/* Stats */}
          <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
            {/* Power (Attack) */}
            <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded">
              <span className="text-red-400">⚔️</span>
              <span className="text-white font-bold">{card.power}</span>
            </div>
            
            {/* Defence */}
            <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded">
              <span className="text-blue-400">🛡️</span>
              <span className="text-white font-bold">{card.defence}</span>
            </div>
          </div>
        </>
      ) : (
        // Card back
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl">
          <div className="text-6xl">🎴</div>
        </div>
      )}
      
      {/* Holographic effect for Mythic cards */}
      {card.rarity === 'mythic' && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer pointer-events-none" />
      )}
    </div>
  );
};
