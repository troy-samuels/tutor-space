/**
 * OnboardingFlow — Premium midnight blue design with stunning cards.
 * Full-height centered layout, animated orbs, 2×2 CEFR grid.
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
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#1A1A2E] px-5 py-8 pt-[env(safe-area-inset-top,60px)] relative overflow-hidden">
      {/* Decorative animated gradient orbs */}
      <motion.div
        animate={{ y: [-10, 10, -10], scale: [1, 1.08, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[15%] left-[20%] w-64 h-64 rounded-full bg-[#8B5CF6]/10 blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ y: [10, -10, 10], scale: [1.05, 1, 1.05] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-[20%] right-[10%] w-48 h-48 rounded-full bg-[#2DD4BF]/8 blur-3xl pointer-events-none"
      />

      <div className="w-full max-w-sm z-10">
        <AnimatePresence mode="wait">
          {step === 'language' ? (
            <motion.div
              key="language"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col items-center"
            >
              {/* Emoji with violet glow */}
              <div className="relative mb-5">
                <div className="absolute inset-0 bg-[#8B5CF6]/20 blur-3xl rounded-full scale-150 pointer-events-none" />
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.05 }}
                  className="relative text-[64px] leading-none"
                >
                  🌍
                </motion.div>
              </div>

              {/* Title */}
              <h1 className="text-[28px] font-bold text-[#E0E0E0] leading-tight tracking-tight text-center">
                What are you learning?
              </h1>
              <p className="mt-2 text-[15px] text-[#A0A0A0] text-center">
                Choose your target language
              </p>

              {/* Language cards */}
              <div className="mt-8 w-full space-y-3">
                {LANGUAGES.map((lang, i) => {
                  const isSelected = selectedLang === lang.code;
                  return (
                    <motion.button
                      key={lang.code}
                      custom={i}
                      variants={cardVariants}
                      initial="initial"
                      animate="animate"
                      whileTap={{ scale: 0.97, transition: { type: 'spring', stiffness: 400, damping: 30 } }}
                      onClick={() => handleLanguageSelect(lang.code)}
                      className={`
                        flex w-full items-center gap-4 min-h-[80px] px-5 py-4
                        rounded-2xl
                        border transition-all duration-200
                        active:scale-[0.97]
                        ${isSelected
                          ? 'bg-[#2C2C40] border-[#8B5CF6] shadow-glow'
                          : 'bg-[#2C2C40] border-[rgba(255,255,255,0.08)] shadow-card'
                        }
                      `}
                    >
                      <span className="text-[44px] leading-none shrink-0">{lang.flag}</span>
                      <div className="flex-1 text-left">
                        <div className="font-bold text-[18px] text-[#E0E0E0]">{lang.name}</div>
                        <div className="text-[14px] text-[#A0A0A0]">{lang.native}</div>
                      </div>
                      <span className="text-[#A0A0A0]/50 text-2xl shrink-0">›</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="difficulty"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col items-center"
            >
              {/* Emoji with violet glow */}
              <div className="relative mb-5">
                <div className="absolute inset-0 bg-[#8B5CF6]/20 blur-3xl rounded-full scale-150 pointer-events-none" />
                <motion.div
                  initial={{ scale: 0, rotate: 20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.05 }}
                  className="relative text-[64px] leading-none"
                >
                  📚
                </motion.div>
              </div>

              {/* Title */}
              <h1 className="text-[28px] font-bold text-[#E0E0E0] leading-tight tracking-tight text-center">
                What's your level?
              </h1>
              <p className="mt-2 text-[15px] text-[#A0A0A0] text-center">
                You can change this anytime
              </p>

              {/* 2×2 grid for A1/A2/B1/B2 */}
              <div className="mt-8 w-full grid grid-cols-2 gap-3">
                {DIFFICULTIES.map((level, i) => {
                  const config = CEFR_LEVELS[level];
                  const isSelected = selectedDifficulty === level;
                  return (
                    <motion.button
                      key={level}
                      custom={i}
                      variants={cardVariants}
                      initial="initial"
                      animate="animate"
                      whileTap={{ scale: 0.97, transition: { type: 'spring', stiffness: 400, damping: 30 } }}
                      onClick={() => handleDifficultySelect(level)}
                      className={`
                        relative flex flex-col items-center justify-center
                        min-h-[100px] px-4 py-5
                        rounded-2xl
                        border transition-all duration-200
                        active:scale-[0.97] overflow-hidden
                        ${isSelected
                          ? 'bg-[#2C2C40] border-[#8B5CF6] shadow-glow'
                          : 'bg-[#2C2C40] border-[rgba(255,255,255,0.08)] shadow-card'
                        }
                      `}
                    >
                      {/* Colored left accent */}
                      <div
                        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
                        style={{ backgroundColor: config.colour }}
                      />
                      <div className="text-[24px] font-bold text-[#E0E0E0]">{level}</div>
                      <div className="text-[14px] text-[#A0A0A0] mt-1">{config.label}</div>
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
