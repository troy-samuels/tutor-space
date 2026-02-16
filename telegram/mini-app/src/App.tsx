/**
 * Main App — Router + Telegram initialization.
 */

import { useState, useEffect } from 'react';
import { OnboardingFlow } from './components/OnboardingFlow';
import { ConnectionsGame } from './games/connections/ConnectionsGame';
import { SpellCastGame } from './games/spell-cast/SpellCastGame';
import { SpeedClashGame } from './games/speed-clash/SpeedClashGame';
import { useUserStore } from './stores/user';
import { tg } from './telegram';
import { parseDeepLink } from './lib/share';
import { getTodaysPuzzle } from './data/connections';
import { getTodaysHexPuzzle, getSpellCastPuzzleNumber } from './data/spell-cast/hex-puzzles';

type Screen = 'menu' | 'connections' | 'spell-cast' | 'speed-clash';

function App() {
  const { hasCompletedOnboarding, language } = useUserStore();
  const [screen, setScreen] = useState<Screen>('menu');
  const [startParam] = useState(() => tg.getStartParam());

  // Parse deep link on mount
  useEffect(() => {
    if (!startParam) return;
    
    const parsed = parseDeepLink(startParam);
    if (!parsed) return;

    // Route to game based on deep link
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
            <button
              onClick={() => setScreen('menu')}
              className="mt-4 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground"
            >
              Back to Menu
            </button>
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
            <button
              onClick={() => setScreen('menu')}
              className="mt-4 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground"
            >
              Back to Menu
            </button>
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
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-lg space-y-6 pt-8">
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold text-foreground">
            TutorLingua Games
          </h1>
          <p className="text-sm text-muted">
            Learn {language.toUpperCase()} through daily challenges
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setScreen('connections')}
            className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-card p-5 text-left active:bg-card/80"
          >
            <div className="text-4xl">🔗</div>
            <div className="flex-1">
              <div className="font-bold text-foreground">Connections</div>
              <div className="text-xs text-muted">Find groups of 4 related words</div>
            </div>
            <div className="text-2xl text-muted">›</div>
          </button>

          <button
            onClick={() => setScreen('spell-cast')}
            className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-card p-5 text-left active:bg-card/80"
          >
            <div className="text-4xl">🍯</div>
            <div className="flex-1">
              <div className="font-bold text-foreground">Spell Cast</div>
              <div className="text-xs text-muted">Find words in the honeycomb grid</div>
            </div>
            <div className="text-2xl text-muted">›</div>
          </button>

          <button
            onClick={() => setScreen('speed-clash')}
            className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-card p-5 text-left active:bg-card/80"
          >
            <div className="text-4xl">⚡</div>
            <div className="flex-1">
              <div className="font-bold text-foreground">Speed Clash</div>
              <div className="text-xs text-muted">Fast reaction scenario challenges</div>
            </div>
            <div className="text-2xl text-muted">›</div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
