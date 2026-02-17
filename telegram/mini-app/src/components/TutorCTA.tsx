/**
 * TutorCTA — "Book a tutor" card shown after game completion.
 */

import { motion } from 'framer-motion';
import { tg } from '@/telegram';
import { hapticPress } from '@/lib/haptics';
import { GraduationCap } from 'lucide-react';

interface TutorCTAProps {
  weakness?: {
    topic: string;
    count: number;
    examples: string[];
  };
}

export function TutorCTA({ weakness }: TutorCTAProps) {
  const handleClick = () => {
    hapticPress();
    const url = weakness
      ? `https://tutorlingua.co/find-tutor?ref=telegram&topic=${encodeURIComponent(weakness.topic)}`
      : 'https://tutorlingua.co/find-tutor?ref=telegram';
    tg.openLink(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, type: 'spring', stiffness: 150, damping: 20 }}
      className="mt-6 overflow-hidden rounded-2.5xl border border-accent/40 bg-gradient-to-br from-accent/10 to-accent/5 shadow-lg"
    >
      <div className="p-5">
        <div className="mb-2 flex items-center gap-3">
          <GraduationCap size={28} className="text-accent" strokeWidth={1.5} />
          <h3 className="text-lg font-bold text-foreground">Ready to Level Up?</h3>
        </div>
        
        {weakness ? (
          <p className="mb-4 text-sm leading-relaxed text-muted">
            You struggled with <span className="font-semibold text-accent">{weakness.topic}</span> today.
            A native tutor can help you master it in 30 minutes.
          </p>
        ) : (
          <p className="mb-4 text-sm leading-relaxed text-muted">
            Great performance! A tutor can help you reach the next level faster.
          </p>
        )}
        
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleClick}
          className="w-full rounded-xl bg-accent px-4 py-3 text-base font-bold text-accent-foreground shadow-md active:bg-accent/90"
        >
          Book a Free Trial Lesson
        </motion.button>
      </div>
    </motion.div>
  );
}
