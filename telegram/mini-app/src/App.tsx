/**
 * Main App — Router + Premium dark glass menu.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { OnboardingFlow } from './components/OnboardingFlow';
import { ConnectionsGame } from './games/connections/ConnectionsGame';
import { SpellCastGame } from './games/spell-cast/SpellCastGame';
import { SpeedClashGame } from './games/speed-clash/SpeedClashGame';
import { useUserStore } from './stores/user';
import { useStreakStore } from './stores/streak';
import { tg } from './telegram';
import { parseDeepLink } from './lib/share';
import { getTodaysPuzzle } from './data/connections';
import { getTodaysHexPuzzle, getSpellCastPuzzleNumber } from './data/spell-cast/hex-puzzles';
import { StreakBadge } from './components/StreakBadge';
import { hapticPress } from './lib/haptics';

type Screen = 'menu' | 'connections' | 'spell-cast' | 'speed-clash';

// Game color gradients for card overlays
const GAME_COLORS: Record<string, string> = {
  connections: 'from-violet-500/10 to-transparent',
  'spell-cast': 'from-amber-500/10 to-transparent',
  'speed-clash': 'from-blue-500/10 to-transparent',
};

const GAME_CARDS = [
  {
    id: 'connections',
    title: 'Connections',
    description: 'Find groups of 4 related words',
    emoji: '🔗',
    screen: 'connections' as Screen,
  },
  {
    id: 'spell-cast',
    title: 'Spell Cast',
    description: 'Find words in the honeycomb grid',
    emoji: '🍯',
    screen: 'spell-cast' as Screen,
  },
  {
    id: 'speed-clash',
    title: 'Speed Clash',
    description: 'Fast reaction scenario challenges',
    emoji: '⚡',
    screen: 'speed-clash' as Screen,
  },
];

const cardVariants = {
  initial: { opacity: 0, y: 24 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08 + 0.1,
      type: 'spring' as const,
      stiffness: 180,
      damping: 22,
    },
  }),
};

function App() {
  const { hasCompletedOnboarding, language } = useUserStore();
  const { gamesPlayedToday } = useStreakStore();
  const [screen, setScreen] = useState<Screen>('menu');
  const [startParam] = useState(() => tg.getStartParam());

  // Parse deep link on mount
  useEffect(() => {
    if (!startParam) return;
    
    const parsed = parseDeepLink(startParam);
    if (!parsed) return;

    if (parsed.game === 'connections') {
      setScreen('connections');
    } else if (parsed.game === 'spell-cast') {
      setScreen('spell-cast');
    } else if (parsed.game === 'speed-clash') {
      setScreen('speed-clash');
    }
  }, [startParam]);

  if (!hasCompletedOnboarding) {
    return <OnboardingFlow onComplete={() => {}} />;
  }

  // --- Game screens ---
  if (screen === 'connections') {
    const puzzle = getTodaysPuzzle(language);
    if (!puzzle) {
      return <NoPuzzle language={language} onBack={() => setScreen('menu')} />;
    }
    return <ConnectionsGame puzzle={puzzle} onExit={() => setScreen('menu')} />;
  }

  if (screen === 'spell-cast') {
    const puzzle = getTodaysHexPuzzle(language);
    const puzzleNumber = getSpellCastPuzzleNumber();
    if (!puzzle) {
      return <NoPuzzle language={language} onBack={() => setScreen('menu')} />;
    }
    return <SpellCastGame puzzle={puzzle} puzzleNumber={puzzleNumber} onExit={() => setScreen('menu')} />;
  }

  if (screen === 'speed-clash') {
    return <SpeedClashGame language={language} puzzleNumber={1} onExit={() => setScreen('menu')} />;
  }

  // --- Menu screen ---
  const user = tg.getUser();
  const firstName = user?.first_name || 'Player';
  const playedCount = gamesPlayedToday.length;

  return (
    <div className="min-h-[100dvh] bg-[#0a0a0b] relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-primary/[0.04] blur-3xl pointer-events-none" />

      <div className="relative z-10 px-5 pt-[env(safe-area-inset-top,60px)] pb-10">
        <div className="mx-auto max-w-md">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="mb-8"
          >
            <h1 className="text-[28px] font-extrabold text-white leading-tight tracking-tight">
              Hey {firstName} 👋
            </h1>
            <p className="mt-1 text-[15px] text-white/50">
              {playedCount === 0
                ? 'Ready for today\'s challenges?'
                : `${playedCount}/${GAME_CARDS.length} played today`}
            </p>
            
            {/* Streak badge */}
            <div className="mt-4">
              <StreakBadge />
            </div>
          </motion.div>

          {/* Section label */}
          <div className="text-[13px] font-semibold text-white/30 uppercase tracking-wider mb-3">
            Daily Puzzles
          </div>

          {/* Game cards */}
          <div className="space-y-3">
            {GAME_CARDS.map((game, i) => {
              const played = gamesPlayedToday.includes(game.id);
              return (
                <motion.button
                  key={game.id}
                  custom={i}
                  variants={cardVariants}
                  initial="initial"
                  animate="animate"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    hapticPress();
                    setScreen(game.screen);
                  }}
                  className="
                    relative flex w-full items-center gap-4
                    min-h-[100px] px-5 py-5
                    rounded-2xl backdrop-blur-xl
                    bg-white/[0.06] border border-white/10
                    text-left transition-all duration-150
                    active:scale-[0.98] active:bg-white/[0.08]
                    overflow-hidden
                  "
                >
                  {/* Color gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${GAME_COLORS[game.id] || ''} pointer-events-none`} />

                  {/* Emoji */}
                  <div className="relative text-[40px] leading-none shrink-0">
                    {game.emoji}
                  </div>

                  {/* Text */}
                  <div className="relative flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-[18px] text-white">{game.title}</h3>
                      {played && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                          className="text-success text-sm"
                        >
                          ✓
                        </motion.span>
                      )}
                    </div>
                    <p className="text-[14px] text-white/50 mt-0.5">{game.description}</p>
                  </div>

                  {/* Arrow */}
                  <span className="relative text-white/20 text-2xl shrink-0">›</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Fallback screen when no puzzle is available */
function NoPuzzle({ language, onBack }: { language: string; onBack: () => void }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#0a0a0b] p-5">
      <div className="text-center">
        <div className="text-[64px] mb-4">😕</div>
        <div className="text-white/70 text-[16px]">No puzzle available for {language}</div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onBack}
          className="mt-6 rounded-xl bg-white/[0.06] border border-white/10 px-6 py-3 text-[15px] font-bold text-white transition-all active:scale-[0.98]"
        >
          Back to Menu
        </motion.button>
      </div>
    </div>
  );
}

export default App;
