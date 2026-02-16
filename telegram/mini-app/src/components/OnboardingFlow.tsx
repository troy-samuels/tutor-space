/**
 * OnboardingFlow — Language + difficulty selection for first-time users.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/stores/user';
import { hapticPress, hapticCorrect } from '@/lib/haptics';
import type { CefrLevel } from '@/lib/cefr';
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

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<'language' | 'difficulty'>('language');
  const { setLanguage, setDifficulty, completeOnboarding } = useUserStore();
  const [selectedLang, setSelectedLang] = useState<string | null>(null);

  const handleLanguageSelect = (code: string) => {
    hapticPress();
    setSelectedLang(code);
    setLanguage(code);
    setTimeout(() => {
      hapticCorrect();
      setStep('difficulty');
    }, 300);
  };

  const handleDifficultySelect = (level: typeof DIFFICULTIES[number]) => {
    hapticPress();
    setDifficulty(level);
    setTimeout(() => {
      hapticCorrect();
      completeOnboarding();
      onComplete();
    }, 300);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {step === 'language' ? (
            <motion.div
              key="language"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="mb-4 text-6xl"
                >
                  🌍
                </motion.div>
                <h1 className="mb-2 text-2xl font-bold text-foreground">
                  Which language are you learning?
                </h1>
                <p className="text-sm text-muted">
                  Choose your target language to get started
                </p>
              </div>

              <div className="space-y-3">
                {LANGUAGES.map((lang, i) => (
                  <motion.button
                    key={lang.code}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleLanguageSelect(lang.code)}
                    className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-card p-4 active:bg-card/80"
                  >
                    <span className="text-4xl">{lang.flag}</span>
                    <div className="flex-1 text-left">
                      <div className="font-bold text-foreground">{lang.name}</div>
                      <div className="text-sm text-muted">{lang.native}</div>
                    </div>
                    <span className="text-2xl text-muted">›</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="difficulty"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="mb-4 text-6xl"
                >
                  📊
                </motion.div>
                <h1 className="mb-2 text-2xl font-bold text-foreground">
                  What's your current level?
                </h1>
                <p className="text-sm text-muted">
                  Don't worry — you can change this anytime
                </p>
              </div>

              <div className="space-y-3">
                {DIFFICULTIES.map((level, i) => {
                  const config = CEFR_LEVELS[level];
                  return (
                    <motion.button
                      key={level}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleDifficultySelect(level)}
                      className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-card p-4 active:bg-card/80"
                    >
                      <div
                        className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: config.colour }}
                      >
                        {level}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-bold text-foreground">{config.label}</div>
                        <div className="text-xs text-muted">{config.description}</div>
                      </div>
                      <span className="text-2xl text-muted">›</span>
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
