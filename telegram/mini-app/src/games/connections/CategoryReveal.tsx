/**
 * CategoryReveal — Animated category reveal on correct guess.
 */

import { motion } from 'framer-motion';
import type { ConnectionCategory } from '@/data/connections';

interface CategoryRevealProps {
  category: ConnectionCategory;
  index: number;
}

const DIFFICULTY_COLORS = {
  yellow: '#F59E0B',
  green: '#10B981',
  blue: '#3B82F6',
  purple: '#8B5CF6',
};

export function CategoryReveal({ category, index }: CategoryRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.1,
        type: 'spring',
        stiffness: 200,
        damping: 20,
      }}
      className="overflow-hidden rounded-2xl border border-white/10"
      style={{ 
        backgroundColor: DIFFICULTY_COLORS[category.difficulty] + '20',
        borderColor: DIFFICULTY_COLORS[category.difficulty] + '40',
      }}
    >
      <div className="p-4">
        {/* Category name */}
        <h3 
          className="mb-2 text-center text-sm font-bold"
          style={{ color: DIFFICULTY_COLORS[category.difficulty] }}
        >
          {category.name}
        </h3>
        
        {/* Words */}
        <div className="flex flex-wrap justify-center gap-1.5 text-xs font-medium text-foreground/90">
          {category.words.map((word, i) => (
            <motion.span
              key={word}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 + i * 0.05 }}
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
