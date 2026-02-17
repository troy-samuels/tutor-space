/**
 * ShareCard — Universal share component with copy-to-clipboard fallback.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { shareGame } from '@/lib/share';
import { hapticPress, hapticCorrect } from '@/lib/haptics';
import { Share2 } from 'lucide-react';

interface ShareCardProps {
  text: string;
  onShare?: () => void;
}

export function ShareCard({ text, onShare }: ShareCardProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    hapticPress();
    
    try {
      await shareGame(text);
      onShare?.();
    } catch (error) {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        hapticCorrect();
        setTimeout(() => setCopied(false), 2000);
      } catch {
        console.error('Failed to copy:', error);
      }
    }
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleShare}
      className="w-full rounded-2xl bg-primary px-6 py-4 text-lg font-bold text-primary-foreground shadow-md active:bg-primary/90 flex items-center justify-center gap-2"
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.span
            key="copied"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="flex items-center gap-2"
          >
            ✓ Copied!
          </motion.span>
        ) : (
          <motion.span
            key="share"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="flex items-center gap-2"
          >
            <Share2 size={22} strokeWidth={2} />
            Share Result
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
