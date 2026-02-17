/**
 * OnboardingFlow — Design Bible visual language.
 * Deep dark canvas, Inter Tight headings, proper CEFR level cards
 * with gradient accents, generous spacing, and cinematic feel.
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

/** CEFR level display config — proper icons and accent gradients */
const LEVEL_DISPLAY: Record<string, { icon: string; gradient: string; glowColor: string }> = {
  A1: { icon: '🌱', gradient: 'from-emerald-500/20 to-emerald-600/5', glowColor: 'rgba(16,185,129,0.15)' },
  A2: { icon: '📗', gradient: 'from-blue-500/20 to-blue-600/5', glowColor: 'rgba(59,130,246,0.15)' },
  B1: { icon: '🔥', gradient: 'from-amber-500/20 to-amber-600/5', glowColor: 'rgba(245,158,11,0.15)' },
  B2: { icon: '🚀', gradient: 'from-violet-500/20 to-violet-600/5', glowColor: 'rgba(139,92,246,0.15)' },
};

const screenVariants = {
  initial: { opacity: 0, y: 30 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 200, damping: 25 },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { ease: 'easeOut' as const, duration: 0.2 },
  },
};

const cardVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.07 + 0.15,
      type: 'spring' as const,
      stiffness: 220,
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
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 relative overflow-hidden"
         style={{ background: 'var(--game-bg-deep)' }}>
      
      {/* Subtle radial gradient spotlight */}
      <div 
        className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(252,211,77,0.04) 0%, transparent 70%)' }}
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
              {/* Hero emoji */}
              <motion.div
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.05 }}
                className="text-[72px] leading-none mb-6"
              >
                🌍
              </motion.div>

              {/* Title — Inter Tight */}
              <h1 
                className="text-[30px] font-extrabold leading-tight tracking-tight text-center"
                style={{ fontFamily: "'Inter Tight', 'Inter', sans-serif", color: 'var(--game-text-primary)' }}
              >
                What are you learning?
              </h1>
              <p 
                className="mt-3 text-[15px] text-center"
                style={{ color: 'var(--game-text-secondary)' }}
              >
                Choose your target language
              </p>

              {/* Language cards — full width, generous spacing */}
              <div className="mt-10 w-full space-y-3">
                {LANGUAGES.map((lang, i) => {
                  const isSelected = selectedLang === lang.code;
                  return (
                    <motion.button
                      key={lang.code}
                      custom={i}
                      variants={cardVariants}
                      initial="initial"
                      animate="animate"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleLanguageSelect(lang.code)}
                      className="flex w-full items-center gap-4 px-5 py-5 rounded-2xl border transition-all duration-200"
                      style={{
                        background: isSelected ? 'var(--game-bg-active)' : 'var(--game-bg-surface)',
                        borderColor: isSelected ? 'var(--game-text-accent)' : 'rgba(255,255,255,0.06)',
                        boxShadow: isSelected ? '0 0 24px rgba(252,211,77,0.12)' : 'none',
                      }}
                    >
                      <span className="text-[44px] leading-none shrink-0">{lang.flag}</span>
                      <div className="flex-1 text-left">
                        <div 
                          className="font-bold text-[18px]"
                          style={{ fontFamily: "'Inter Tight', sans-serif", color: 'var(--game-text-primary)' }}
                        >
                          {lang.name}
                        </div>
                        <div 
                          className="text-[14px] mt-0.5"
                          style={{ color: 'var(--game-text-secondary)' }}
                        >
                          {lang.native}
                        </div>
                      </div>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0 opacity-30">
                        <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
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
              {/* Hero emoji */}
              <motion.div
                initial={{ scale: 0, rotate: 15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.05 }}
                className="text-[72px] leading-none mb-6"
              >
                📚
              </motion.div>

              {/* Title — Inter Tight */}
              <h1 
                className="text-[30px] font-extrabold leading-tight tracking-tight text-center"
                style={{ fontFamily: "'Inter Tight', 'Inter', sans-serif", color: 'var(--game-text-primary)' }}
              >
                What's your level?
              </h1>
              <p 
                className="mt-3 text-[15px] text-center"
                style={{ color: 'var(--game-text-secondary)' }}
              >
                You can change this anytime
              </p>

              {/* Level cards — vertical list with rich detail */}
              <div className="mt-10 w-full space-y-3">
                {DIFFICULTIES.map((level, i) => {
                  const config = CEFR_LEVELS[level];
                  const display = LEVEL_DISPLAY[level];
                  const isSelected = selectedDifficulty === level;
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
                        relative flex w-full items-center gap-4 px-5 py-5
                        rounded-2xl border transition-all duration-200 overflow-hidden
                      `}
                      style={{
                        background: isSelected ? 'var(--game-bg-active)' : 'var(--game-bg-surface)',
                        borderColor: isSelected ? config.colour : 'rgba(255,255,255,0.06)',
                        boxShadow: isSelected ? `0 0 24px ${display.glowColor}` : 'none',
                      }}
                    >
                      {/* Accent gradient overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-r ${display.gradient} pointer-events-none`} />
                      
                      {/* Left accent bar */}
                      <div 
                        className="absolute left-0 top-4 bottom-4 w-[3px] rounded-full"
                        style={{ backgroundColor: config.colour }}
                      />

                      {/* Icon */}
                      <div className="relative flex items-center justify-center w-12 h-12 rounded-xl shrink-0"
                           style={{ background: `${config.colour}15` }}>
                        <span className="text-2xl">{display.icon}</span>
                      </div>

                      {/* Text content */}
                      <div className="relative flex-1 text-left min-w-0">
                        <div className="flex items-center gap-2">
                          <span 
                            className="font-bold text-[17px]"
                            style={{ fontFamily: "'Inter Tight', sans-serif", color: 'var(--game-text-primary)' }}
                          >
                            {config.label}
                          </span>
                          <span 
                            className="text-[13px] font-semibold px-2 py-0.5 rounded-md"
                            style={{ 
                              fontFamily: "'JetBrains Mono', monospace",
                              color: config.colour,
                              background: `${config.colour}15`,
                            }}
                          >
                            {level}
                          </span>
                        </div>
                        <div 
                          className="text-[13px] mt-1 leading-snug"
                          style={{ color: 'var(--game-text-secondary)' }}
                        >
                          {config.description}
                        </div>
                      </div>

                      {/* Chevron */}
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="relative shrink-0 opacity-25">
                        <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
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
