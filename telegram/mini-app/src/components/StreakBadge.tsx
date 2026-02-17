/**
 * StreakBadge — Premium pill badge with amber glow on active streak.
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
      className={`
        inline-flex items-center gap-2 rounded-full
        bg-[#2C2C40] border border-[rgba(255,255,255,0.08)]
        px-3.5 py-1.5 shadow-glow-amber
        ${className}
      `}
      style={{
        boxShadow: current > 0 ? '0 0 16px rgba(251, 191, 36, 0.2)' : undefined,
      }}
    >
      <span className="text-[18px] leading-none">🔥</span>
      <span className="text-[14px] font-bold text-[#E0E0E0] leading-none">{current}</span>
      <span className="text-[12px] text-[#A0A0A0] leading-none">{tier.name}</span>
    </motion.div>
  );
}
