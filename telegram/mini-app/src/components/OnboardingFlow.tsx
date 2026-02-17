/**
 * OnboardingFlow — Premium dark glass language + difficulty selection.
 * Full-height centered layout with large tappable glass cards.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/stores/user';
import { hapticPress, hapticCorrect } from '@/lib/haptics';
import { CEFR_LEVELS } from '@/lib/cefr';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const LANGUAGES = [
  { code: 'es', name: 'Spanish', flag: '🇪🇸', native: 'Español' },
  { code: 'fr', name: 'French', flag: '🇫🇷', native: 'Français' },
  { code: 'de', name: 'German', flag: '🇩🇪', native: 'Deutsch' },
];

const DIFFICULTIES = ['A1', 'A2', 'B1', 'B2'] as const;

const screenVariants = {
  initial: { opacity: 0, x: 60, scale: 0.96 },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 200, damping: 25 },
  },
  exit: {
    opacity: 0,
    x: -60,
    scale: 0.96,
    transition: { ease: 'easeOut' as const, duration: 0.25 },
  },
};

const cardVariants = {
  initial: { opacity: 0, y: 24 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08 + 0.15,
      type: 'spring' as const,
      stiffness: 180,
      damping: 22,
    },
  }),
};

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<'language' | 'difficulty'>('language');
  const { setLanguage, setDifficulty, completeOnboarding } = useUserStore();
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<typeof DIFFICULTIES[number] | null>(null);

  const handleLanguageSelect = (code: string) => {
    hapticPress();
    setSelectedLang(code);
    setLanguage(code);
    setTimeout(() => {
      hapticCorrect();
      setStep('difficulty');
    }, 350);
  };

  const handleDifficultySelect = (level: typeof DIFFICULTIES[number]) => {
    hapticPress();
    setSelectedDifficulty(level);
    setDifficulty(level);
    setTimeout(() => {
      hapticCorrect();
      completeOnboarding();
      onComplete();
    }, 350);
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#0a0a0b] px-5 py-8 relative overflow-hidden">
      {/* Subtle ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-primary/[0.06] blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm z-10">
        <AnimatePresence mode="wait">
          {step === 'language' ? (
            <motion.div
              key="language"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-8"
            >
              {/* Header */}
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.05 }}
                  className="text-[80px] leading-none mb-5"
                >
                  🌍
                </motion.div>
                <h1 className="text-[28px] font-extrabold text-white leading-tight tracking-tight">
                  What are you learning?
                </h1>
                <p className="mt-2 text-[15px] text-white/50">
                  Choose your target language
                </p>
              </div>

              {/* Language cards */}
              <div className="space-y-3">
                {LANGUAGES.map((lang, i) => (
                  <motion.button
                    key={lang.code}
                    custom={i}
                    variants={cardVariants}
                    initial="initial"
                    animate="animate"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleLanguageSelect(lang.code)}
                    className={`
                      flex w-full items-center gap-4 min-h-[76px] px-5 py-4
                      rounded-2xl backdrop-blur-xl
                      border transition-all duration-150
                      active:scale-[0.98]
                      ${selectedLang === lang.code
                        ? 'bg-white/[0.12] border-primary/60 shadow-glow-sm'
                        : 'bg-white/[0.06] border-white/10 hover:bg-white/[0.08]'
                      }
                    `}
                  >
                    <span className="text-[48px] leading-none shrink-0">{lang.flag}</span>
                    <div className="flex-1 text-left">
                      <div className="font-bold text-[18px] text-white">{lang.name}</div>
                      <div className="text-[14px] text-white/50">{lang.native}</div>
                    </div>
                    <span className="text-white/20 text-2xl shrink-0">›</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="difficulty"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-8"
            >
              {/* Header */}
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0, rotate: 20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.05 }}
                  className="text-[80px] leading-none mb-5"
                >
                  📚
                </motion.div>
                <h1 className="text-[28px] font-extrabold text-white leading-tight tracking-tight">
                  What's your level?
                </h1>
                <p className="mt-2 text-[15px] text-white/50">
                  You can change this anytime
                </p>
              </div>

              {/* Difficulty cards */}
              <div className="space-y-3">
                {DIFFICULTIES.map((level, i) => {
                  const config = CEFR_LEVELS[level];
                  return (
                    <motion.button
                      key={level}
                      custom={i}
                      variants={cardVariants}
                      initial="initial"
                      animate="animate"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleDifficultySelect(level)}
                      className={`
                        flex w-full items-center gap-4 min-h-[76px] px-5 py-4
                        rounded-2xl backdrop-blur-xl
                        border transition-all duration-150
                        active:scale-[0.98]
                        ${selectedDifficulty === level
                          ? 'bg-white/[0.12] border-primary/60 shadow-glow-sm'
                          : 'bg-white/[0.06] border-white/10 hover:bg-white/[0.08]'
                        }
                      `}
                    >
                      <div
                        className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0 shadow-lg"
                        style={{ backgroundColor: config.colour }}
                      >
                        {level}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-bold text-[18px] text-white">{config.label}</div>
                        <div className="text-[13px] text-white/50 leading-snug">{config.description}</div>
                      </div>
                      <span className="text-white/20 text-2xl shrink-0">›</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
