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
    default: 'bg-card border-white/10 text-foreground hover:border-white/20',
    selected: 'bg-primary/20 border-primary text-primary-foreground scale-[0.98] inner-shadow',
    wrong: 'bg-destructive/20 border-destructive text-foreground animate-shake',
  };

  return (
    <motion.button
      whileTap={disabled ? {} : { scale: 0.95 }}
      onClick={handleClick}
      disabled={disabled}
      className={`
        aspect-square rounded-xl border-2 px-2 py-3
        text-center text-sm font-bold leading-tight
        transition-all duration-200 shadow-sm
        ${stateClasses[state]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.95]'}
      `}
    >
      <span className="line-clamp-3">{word}</span>
    </motion.button>
  );
}
