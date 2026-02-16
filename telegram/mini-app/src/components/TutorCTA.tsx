/**
 * TutorCTA — "Book a tutor" card shown after game completion.
 */

import { motion } from 'framer-motion';
import { tg } from '@/telegram';
import { hapticPress } from '@/lib/haptics';

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
      transition={{ delay: 0.4 }}
      className="mt-6 overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/10 to-accent/5"
    >
      <div className="p-5">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-2xl">👨‍🏫</span>
          <h3 className="text-base font-bold text-foreground">Ready to Level Up?</h3>
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
        
        <button
          onClick={handleClick}
          className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-bold text-accent-foreground active:bg-accent/90"
        >
          Book a Free Trial Lesson
        </button>
      </div>
    </motion.div>
  );
}
