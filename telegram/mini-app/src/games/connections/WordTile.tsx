/**
 * WordTile — Individual word tile with tap haptics.
 */

import { motion } from 'framer-motion';
import { hapticTap } from '@/lib/haptics';

export type TileState = 'default' | 'selected' | 'wrong';

interface WordTileProps {
  word: string;
  state: TileState;
  onClick: () => void;
  disabled?: boolean;
}

export function WordTile({ word, state, onClick, disabled }: WordTileProps) {
  const handleClick = () => {
    if (disabled) return;
    hapticTap();
    onClick();
  };

  const stateClasses = {
    default: 'bg-card border-white/10 text-foreground',
    selected: 'bg-primary border-primary text-primary-foreground scale-95',
    wrong: 'bg-destructive/20 border-destructive text-foreground animate-shake',
  };

  return (
    <motion.button
      whileTap={disabled ? {} : { scale: 0.9 }}
      onClick={handleClick}
      disabled={disabled}
      className={`
        aspect-square rounded-xl border-2 px-2 py-3
        text-center text-xs font-bold leading-tight
        transition-all duration-200
        ${stateClasses[state]}
        ${disabled ? 'opacity-50' : 'active:scale-95'}
      `}
    >
      <span className="line-clamp-3">{word}</span>
    </motion.button>
  );
}
