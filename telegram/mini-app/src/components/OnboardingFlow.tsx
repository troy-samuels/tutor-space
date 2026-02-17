/**
 * OnboardingFlow — Language + difficulty selection for first-time users.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/stores/user';
import { hapticPress, hapticCorrect } from '@/lib/haptics';
import { CEFR_LEVELS } from '@/lib/cefr';
import { Globe, GraduationCap } from 'lucide-react';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const LANGUAGES = [
  { code: 'es', name: 'Spanish', flag: '🇪🇸', native: 'Español' },
  { code: 'fr', name: 'French', flag: '🇫🇷', native: 'Français' },
  { code: 'de', name: 'German', flag: '🇩🇪', native: 'Deutsch' },
];

const DIFFICULTIES = ['A1', 'A2', 'B1', 'B2'] as const;

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
    }, 400);
  };

  const handleDifficultySelect = (level: typeof DIFFICULTIES[number]) => {
    hapticPress();
    setSelectedDifficulty(level);
    setDifficulty(level);
    setTimeout(() => {
      hapticCorrect();
      completeOnboarding();
      onComplete();
    }, 400);
  };

  const screenVariants = {
    initial: { opacity: 0, x: 50, scale: 0.95 },
    animate: { opacity: 1, x: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 200, damping: 25, duration: 0.5 } },
    exit: { opacity: 0, x: -50, scale: 0.95, transition: { ease: 'easeOut' as const, duration: 0.3 } },
  };

  const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1 + 0.2,
        type: 'spring' as const,
        stiffness: 150,
        damping: 20,
      },
    }),
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-background via-card/50 to-background opacity-50" />

      <div className="w-full max-w-md z-10">
        <AnimatePresence mode="wait">
          {step === 'language' ? (
            <motion.div
              key="language"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                  className="mb-6 text-primary flex justify-center"
                >
                  <Globe size={80} strokeWidth={1.5} />
                </motion.div>
                <h1 className="mb-3 text-3xl font-extrabold text-foreground leading-tight">
                  Which language are you learning?
                </h1>
                <p className="text-sm text-muted">
                  Choose your target language to get started on your journey!
                </p>
              </div>

              <div className="space-y-4">
                {LANGUAGES.map((lang, i) => (
                  <motion.button
                    key={lang.code}
                    variants={itemVariants}
                    custom={i}
                    initial="initial"
                    animate="animate"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleLanguageSelect(lang.code)}
                    className={`
                      flex w-full items-center gap-4 p-5 rounded-2xl border-2
                      bg-card shadow-lg transition-all duration-200
                      ${selectedLang === lang.code
                        ? 'border-primary bg-primary/20'
                        : 'border-white/10 active:bg-card/80'
                      }
                    `}
                  >
                    <span className="text-4xl">{lang.flag}</span>
                    <div className="flex-1 text-left">
                      <div className="font-bold text-lg text-foreground">{lang.name}</div>
                      <div className="text-sm text-muted">{lang.native}</div>
                    </div>
                    <motion.span
                      initial={{ x: 0 }}
                      animate={{ x: selectedLang === lang.code ? 5 : 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      className="text-2xl text-muted"
                    >
                      ›
                    </motion.span>
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
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0, rotate: 90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                  className="mb-6 text-primary flex justify-center"
                >
                  <GraduationCap size={80} strokeWidth={1.5} />
                </motion.div>
                <h1 className="mb-3 text-3xl font-extrabold text-foreground leading-tight">
                  What's your current level?
                </h1>
                <p className="text-sm text-muted">
                  Don't worry — you can change this anytime in settings
                </p>
              </div>

              <div className="space-y-4">
                {DIFFICULTIES.map((level, i) => {
                  const config = CEFR_LEVELS[level];
                  return (
                    <motion.button
                      key={level}
                      variants={itemVariants}
                      custom={i}
                      initial="initial"
                      animate="animate"
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleDifficultySelect(level)}
                      className={`
                        flex w-full items-center gap-4 p-5 rounded-2xl border-2
                        bg-card shadow-lg transition-all duration-200
                        ${selectedDifficulty === level
                          ? 'border-primary bg-primary/20'
                          : 'border-white/10 active:bg-card/80'
                        }
                      `}
                    >
                      <div
                        className="h-14 w-14 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md"
                        style={{ backgroundColor: config.colour }}
                      >
                        {level}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-bold text-lg text-foreground">{config.label}</div>
                        <div className="text-sm text-muted">{config.description}</div>
                      </div>
                      <motion.span
                        initial={{ x: 0 }}
                        animate={{ x: selectedDifficulty === level ? 5 : 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="text-2xl text-muted"
                      >
                        ›
                      </motion.span>
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
