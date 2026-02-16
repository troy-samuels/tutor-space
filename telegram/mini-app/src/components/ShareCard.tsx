/**
 * ShareCard — Universal share component with copy-to-clipboard fallback.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { shareGame } from '@/lib/share';
import { hapticPress, hapticCorrect } from '@/lib/haptics';

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
      whileTap={{ scale: 0.97 }}
      onClick={handleShare}
      className="w-full rounded-2xl bg-primary px-6 py-4 text-base font-bold text-primary-foreground active:bg-primary/90"
    >
      {copied ? '✓ Copied to Clipboard!' : '📤 Share Result'}
    </motion.button>
  );
}
