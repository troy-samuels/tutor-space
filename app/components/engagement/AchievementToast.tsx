"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import type { Achievement } from "@/lib/engagement/types";

interface AchievementToastProps {
  achievement: Achievement | null;
  onClose: () => void;
  autoCloseMs?: number;
}

const rarityColors: Record<Achievement["rarity"], string> = {
  common: "from-gray-500/20 to-gray-600/20 border-gray-500/30",
  rare: "from-blue-500/20 to-blue-600/20 border-blue-500/30",
  epic: "from-purple-500/20 to-purple-600/20 border-purple-500/30",
  legendary: "from-amber-500/20 to-amber-600/20 border-amber-500/30",
};

const rarityTextColors: Record<Achievement["rarity"], string> = {
  common: "text-gray-400",
  rare: "text-blue-400",
  epic: "text-purple-400",
  legendary: "text-amber-400",
};

export default function AchievementToast({
  achievement,
  onClose,
  autoCloseMs = 5000,
}: AchievementToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
      
      if (autoCloseMs > 0) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }, autoCloseMs);

        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [achievement, autoCloseMs, onClose]);

  if (!achievement) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25,
          }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full mx-4"
        >
          <div
            className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br backdrop-blur-xl ${
              rarityColors[achievement.rarity]
            } p-4 shadow-2xl`}
          >
            {/* Sparkle animation */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  initial={{
                    x: Math.random() * 300,
                    y: -20,
                    scale: 0,
                    opacity: 1,
                  }}
                  animate={{
                    y: [null, 200],
                    scale: [0, 1, 0],
                    opacity: [1, 1, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.1,
                    ease: "easeOut",
                  }}
                >
                  <Sparkles className="w-4 h-4 text-white" />
                </motion.div>
              ))}
            </div>

            {/* Content */}
            <div className="relative flex items-start gap-3">
              <motion.div
                animate={{
                  rotate: [0, -10, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 0.6,
                  delay: 0.2,
                }}
                className="text-4xl"
              >
                {achievement.icon}
              </motion.div>

              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Achievement Unlocked!
                </p>
                <h3 className="text-lg font-bold text-foreground mb-1">
                  {achievement.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {achievement.description}
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-semibold uppercase ${
                      rarityTextColors[achievement.rarity]
                    }`}
                  >
                    {achievement.rarity}
                  </span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-accent font-semibold">
                    +{achievement.xpReward} XP
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(onClose, 300);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
