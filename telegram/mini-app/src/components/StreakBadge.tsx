/**
 * StreakBadge — Premium glass streak display with tier emoji.
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
      transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      className={`inline-flex items-center gap-2.5 rounded-full bg-white/[0.06] backdrop-blur-xl border border-white/10 px-4 py-2 ${className}`}
    >
      <span className="text-[22px] leading-none">{tier.emoji}</span>
      <div className="flex flex-col items-start">
        <span className="text-[15px] font-bold leading-none text-white">{current} days</span>
        <span className="text-[12px] leading-none text-white/50 mt-0.5">{tier.name}</span>
      </div>
    </motion.div>
  );
}
