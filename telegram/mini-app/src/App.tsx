/**
 * Main App — Router + Telegram initialization.
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

type Screen = 'menu' | 'connections' | 'spell-cast' | 'speed-clash';

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

  if (screen === 'connections') {
    const puzzle = getTodaysPuzzle(language);
    if (!puzzle) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="text-center text-foreground">
            <div className="text-4xl">😕</div>
            <div className="mt-2">No puzzle available for {language}</div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setScreen('menu')}
              className="mt-4 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-md"
            >
              Back to Menu
            </motion.button>
          </div>
        </div>
      );
    }
    return <ConnectionsGame puzzle={puzzle} onExit={() => setScreen('menu')} />;
  }

  if (screen === 'spell-cast') {
    const puzzle = getTodaysHexPuzzle(language);
    const puzzleNumber = getSpellCastPuzzleNumber();
    if (!puzzle) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="text-center text-foreground">
            <div className="text-4xl">😕</div>
            <div className="mt-2">No puzzle available for {language}</div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setScreen('menu')}
              className="mt-4 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-md"
            >
              Back to Menu
            </motion.button>
          </div>
        </div>
      );
    }
    return <SpellCastGame puzzle={puzzle} puzzleNumber={puzzleNumber} onExit={() => setScreen('menu')} />;
  }

  if (screen === 'speed-clash') {
    return <SpeedClashGame language={language} puzzleNumber={1} onExit={() => setScreen('menu')} />;
  }

  // Menu screen
  return (
    <div className="min-h-screen bg-background p-4 pt-8 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-background via-card/50 to-background opacity-50" />

      <div className="mx-auto max-w-lg space-y-6 z-10 relative">
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-extrabold text-foreground leading-tight">
            TutorLingua Games
          </h1>
          <p className="text-md text-muted">
            Learn {language.toUpperCase()} with daily challenges
          </p>
          <div className="mt-4 flex justify-center">
            <StreakBadge />
          </div>
        </div>

        <div className="space-y-4">
          {GAME_CARDS.map((game, i) => (
            <motion.button
              key={game.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: i * 0.1 + 0.2,
                type: 'spring' as const,
                stiffness: 150,
                damping: 20,
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setScreen(game.screen)}
              className="relative flex w-full items-center gap-4 p-5 rounded-3xl bg-card border-2 border-white/10 shadow-xl overflow-hidden active:bg-card/80"
            >
              {/* Card gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-card to-card/90 -z-10" />

              <div className="text-4xl flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 shrink-0">
                {game.emoji}
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-xl text-foreground">{game.title}</h3>
                <p className="text-sm text-muted">{game.description}</p>
              </div>
              {gamesPlayedToday.includes(game.id) && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3 text-2xl"
                >
                  ✅
                </motion.div>
              )}
              <span className="text-3xl text-muted font-light">›</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
