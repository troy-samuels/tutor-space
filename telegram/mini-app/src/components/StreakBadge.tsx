/**
 * StreakBadge — Display streak with tier emoji.
 */

import { motion } from 'framer-motion';
import { useStreakStore } from '@/stores/streak';

interface StreakBadgeProps {
  className?: string;
}

export function StreakBadge({ className = '' }: StreakBadgeProps) {
  const { current, tier } = useStreakStore();

  if (current === 0) return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className={`inline-flex items-center gap-2 rounded-full bg-card px-4 py-1.5 shadow-md border border-white/10 ${className}`}
    >
      <span className="text-xl">{tier.emoji}</span>
      <div className="flex flex-col items-start">
        <span className="text-base font-bold leading-none text-foreground">{current} days</span>
        <span className="text-xs leading-none text-muted">{tier.name}</span>
      </div>
    </motion.div>
  );
}
