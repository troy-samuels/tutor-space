/**
 * CategoryReveal — Animated category reveal on correct guess.
 */

import { motion } from 'framer-motion';
import type { ConnectionCategory } from '@/data/connections';

interface CategoryRevealProps {
  category: ConnectionCategory;
  index: number;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  yellow: '#F59E0B',
  green: '#10B981',
  blue: '#3B82F6',
  purple: '#8B5CF6',
};

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function CategoryReveal({ category, index }: CategoryRevealProps) {
  const baseColor = DIFFICULTY_COLORS[category.difficulty] || '#8B5CF6';
  const bgColor = hexToRgba(baseColor, 0.15);
  const borderColor = hexToRgba(baseColor, 0.4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.15,
        type: 'spring',
        stiffness: 180,
        damping: 22,
      }}
      className="overflow-hidden rounded-2xl border-2 shadow-md"
      style={{ 
        backgroundColor: bgColor,
        borderColor: borderColor,
      }}
    >
      <div className="p-4">
        {/* Category name */}
        <h3 
          className="mb-2 text-center text-md font-bold"
          style={{ color: baseColor }}
        >
          {category.name}
        </h3>
        
        {/* Words */}
        <div className="flex flex-wrap justify-center gap-1.5 text-xs font-semibold text-foreground/90">
          {category.words.map((word, i) => (
            <motion.span
              key={word}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.15 + i * 0.07, type: 'spring', stiffness: 300, damping: 25 }}
            >
              {word}
              {i < category.words.length - 1 && ', '}
            </motion.span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
