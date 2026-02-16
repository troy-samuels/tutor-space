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
      className={`inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 ${className}`}
    >
      <span className="text-lg">{tier.emoji}</span>
      <div className="flex flex-col items-start">
        <span className="text-xs font-bold leading-none text-foreground">{current} days</span>
        <span className="text-[10px] leading-none text-muted">{tier.name}</span>
      </div>
    </motion.div>
  );
}
