/**
 * ConnectionsGame — Telegram Mini App version with haptics and share.
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameShell } from '@/components/GameShell';
import { ShareCard } from '@/components/ShareCard';
import { TutorCTA } from '@/components/TutorCTA';
import { WordTile } from './WordTile';
import { CategoryReveal } from './CategoryReveal';
import type { TileState } from './WordTile';
import type { ConnectionsPuzzle, ConnectionCategory, Difficulty } from '@/data/connections';
import { hapticPress, hapticCorrect, hapticWrong, hapticVictory, hapticDefeat, hapticShuffle, hapticReveal } from '@/lib/haptics';
import { recordGamePlay } from '@/lib/streaks';
import { generateShareText } from './share';
import { Shuffle, X, Send, Clock, Lightbulb } from 'lucide-react';

interface ConnectionsGameProps {
  puzzle: ConnectionsPuzzle;
  onExit?: () => void;
}

const MAX_MISTAKES = 4;
const MAX_SELECTED = 4;

const DIFFICULTY_EMOJI: Record<Difficulty, string> = {
  yellow: '🟨',
  green: '🟩',
  blue: '🟦',
  purple: '🟪',
};

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function ConnectionsGame({ puzzle, onExit }: ConnectionsGameProps) {
  const [remainingWords, setRemainingWords] = useState<string[]>(() => {
    const allWords = puzzle.categories.flatMap((c) => c.words);
    return shuffleArray(allWords);
  });
  
  const [solvedCategories, setSolvedCategories] = useState<ConnectionCategory[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [wrongGuessWords, setWrongGuessWords] = useState<Set<string>>(new Set());
  const [oneAway, setOneAway] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [showExplanations, setShowExplanations] = useState(false);
  const [guessHistory, setGuessHistory] = useState<Difficulty[][]>([]);
  const [startTime] = useState(Date.now());
  const [endTime, setEndTime] = useState<number | null>(null);

  // Clear wrong state after animation
  useEffect(() => {
    if (wrongGuessWords.size === 0) return;
    const timer = setTimeout(() => {
      setWrongGuessWords(new Set());
    }, 600);
    return () => clearTimeout(timer);
  }, [wrongGuessWords]);

  // Clear "one away" toast
  useEffect(() => {
    if (!oneAway) return;
    const timer = setTimeout(() => setOneAway(false), 2000);
    return () => clearTimeout(timer);
  }, [oneAway]);

  const handleWordTap = useCallback((word: string) => {
    if (isComplete) return;

    setSelectedWords((prev) => {
      const isSelected = prev.includes(word);
      if (isSelected) {
        return prev.filter((w) => w !== word);
      } else if (prev.length < MAX_SELECTED) {
        return [...prev, word];
      }
      return prev;
    });
  }, [isComplete]);

  const handleSubmit = useCallback(() => {
    if (selectedWords.length !== MAX_SELECTED) return;

    hapticPress();

    // Check if guess matches any unsolved category
    const matchedCategory = puzzle.categories.find(
      (cat) =>
        !solvedCategories.includes(cat) &&
        cat.words.every((w) => selectedWords.includes(w))
    );

    if (matchedCategory) {
      hapticCorrect();
      setTimeout(() => hapticReveal(), 200);

      const newSolved = [...solvedCategories, matchedCategory];
      const newRemaining = remainingWords.filter(
        (w) => !matchedCategory.words.includes(w)
      );

      setSolvedCategories(newSolved);
      setRemainingWords(newRemaining);
      setSelectedWords([]);

      setGuessHistory((prev) => [
        ...prev,
        [matchedCategory.difficulty, matchedCategory.difficulty, matchedCategory.difficulty, matchedCategory.difficulty],
      ]);

      if (newSolved.length === 4) {
        setIsComplete(true);
        setIsWon(true);
        setEndTime(Date.now());
        hapticVictory();
        recordGamePlay('connections');
      }
    } else {
      hapticWrong();

      let maxOverlap = 0;
      for (const cat of puzzle.categories) {
        if (solvedCategories.includes(cat)) continue;
        const overlap = cat.words.filter((w) => selectedWords.includes(w)).length;
        if (overlap > maxOverlap) maxOverlap = overlap;
      }

      if (maxOverlap === 3) {
        setOneAway(true);
      }

      const guessColors: Difficulty[] = selectedWords.map((w) => {
        const cat = puzzle.categories.find((c) => c.words.includes(w));
        return cat ? cat.difficulty : 'yellow';
      });

      setWrongGuessWords(new Set(selectedWords));
      setGuessHistory((prev) => [...prev, guessColors]);

      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);

      if (newMistakes >= MAX_MISTAKES) {
        hapticDefeat();
        setIsComplete(true);
        setIsWon(false);
        setEndTime(Date.now());

        const remainingCats = puzzle.categories.filter(
          (c) => !solvedCategories.includes(c)
        );
        setSolvedCategories([...solvedCategories, ...remainingCats]);
        setRemainingWords([]);
      }

      setSelectedWords([]);
    }
  }, [selectedWords, puzzle.categories, solvedCategories, remainingWords, mistakes, isComplete]);

  const handleShuffle = useCallback(() => {
    hapticShuffle();
    setRemainingWords((prev) => shuffleArray(prev));
  }, []);

  const handleDeselectAll = useCallback(() => {
    hapticPress();
    setSelectedWords([]);
  }, []);

  const getTileState = (word: string): TileState => {
    if (wrongGuessWords.has(word)) return 'wrong';
    if (selectedWords.includes(word)) return 'selected';
    return 'default';
  };

  const shareText = isComplete
    ? generateShareText(puzzle.number, puzzle.language, guessHistory, mistakes, endTime ? endTime - startTime : 0)
    : '';

  return (
    <GameShell
      gameName="Connections"
      puzzleNumber={puzzle.number}
      language={puzzle.language}
      onBack={onExit}
    >
      <div className="space-y-5">
        {/* Mistake indicators */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-muted">Mistakes:</span>
          <div className="flex gap-1.5">
            {Array.from({ length: MAX_MISTAKES }).map((_, i) => (
              <div
                key={i}
                className={`h-3 w-3 rounded-full border-2 transition-all duration-300 ${
                  i < mistakes ? 'bg-destructive border-destructive' : 'bg-transparent border-muted/50'
                }`}
              />
            ))}
          </div>
        </div>

        {/* "One away" toast */}
        <AnimatePresence>
          {oneAway && (
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex justify-center"
            >
              <div className="animate-pulse rounded-full border-2 border-accent bg-accent/15 px-4 py-1.5 text-sm font-bold text-accent shadow-md">
                One away! 🤏
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Solved Categories */}
        <div className="space-y-3">
          {solvedCategories.map((cat, i) => (
            <CategoryReveal key={cat.name} category={cat} index={i} />
          ))}
        </div>

        {/* Word Grid */}
        {remainingWords.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {remainingWords.map((word) => (
              <WordTile
                key={word}
                word={word}
                state={getTileState(word)}
                onClick={() => handleWordTap(word)}
                disabled={isComplete}
              />
            ))}
          </div>
        )}

        {/* Action buttons */}
        {!isComplete && (
          <div className="flex items-center gap-2 mt-5">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleShuffle}
              className="flex-1 rounded-xl bg-card border border-white/10 px-5 py-3 text-base font-bold text-foreground shadow-md active:bg-card/80 flex items-center justify-center gap-2"
            >
              <Shuffle size={18} strokeWidth={2} /> Shuffle
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleDeselectAll}
              disabled={selectedWords.length === 0}
              className="flex-1 rounded-xl bg-card border border-white/10 px-5 py-3 text-base font-bold text-foreground shadow-md disabled:opacity-50 active:bg-card/80 flex items-center justify-center gap-2"
            >
              <X size={18} strokeWidth={2} /> Deselect
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              disabled={selectedWords.length !== MAX_SELECTED}
              className="flex-1 rounded-xl bg-primary px-5 py-3 text-base font-bold text-primary-foreground shadow-md disabled:opacity-50 active:bg-primary/90 flex items-center justify-center gap-2"
            >
              <Send size={18} strokeWidth={2} /> Submit
            </motion.button>
          </div>
        )}

        {/* Victory / Game Over */}
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 20 }}
            className="mt-6 space-y-4"
          >
            {/* Result banner */}
            <div className="rounded-2.5xl border-2 border-white/10 bg-card p-6 text-center shadow-xl">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.5 }}
                className="text-5xl mb-2"
              >
                {isWon ? '🎉' : '💪'}
              </motion.div>
              <h2 className="mt-2 text-2xl font-bold text-foreground">
                {isWon ? '¡Perfecto!' : 'Good try!'}
              </h2>
              <p className="mt-1 text-md text-muted">
                {isWon
                  ? `Solved with ${mistakes} mistake${mistakes !== 1 ? 's' : ''}`
                  : "You'll get it next time"}
              </p>

              {/* Score grid */}
              <div className="mx-auto mt-4 max-w-[200px] space-y-1.5">
                {guessHistory.map((row, i) => (
                  <div key={i} className="flex justify-center gap-1.5 text-lg">
                    {row.map((d, j) => (
                      <span key={j}>{DIFFICULTY_EMOJI[d]}</span>
                    ))}
                  </div>
                ))}
              </div>

              {/* Time */}
              {endTime && (
                <p className="mt-3 text-sm text-muted flex items-center justify-center gap-1">
                  <Clock size={16} strokeWidth={2} />
                  {(() => {
                    const secs = Math.floor((endTime - startTime) / 1000);
                    return `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`;
                  })()}
                </p>
              )}
            </div>

            {/* Share */}
            <ShareCard text={shareText} />

            {/* Explain mistakes */}
            {mistakes > 0 && (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowExplanations((prev) => !prev)}
                className="w-full rounded-xl border border-white/10 bg-card px-6 py-4 text-base font-bold text-foreground shadow-md active:bg-card/80 flex items-center justify-center gap-2"
              >
                <Lightbulb size={20} strokeWidth={2} />
                {showExplanations ? 'Hide Explanations' : 'Explain My Mistakes'}
              </motion.button>
            )}

            {/* Explanations */}
            <AnimatePresence>
              {showExplanations && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                  className="space-y-3 overflow-hidden"
                >
                  {puzzle.categories.map((cat) => (
                    <div
                      key={cat.name}
                      className="rounded-xl border border-white/10 bg-card/50 p-4"
                    >
                      <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                        {DIFFICULTY_EMOJI[cat.difficulty]} {cat.name}
                      </h4>
                      <p className="mt-1 text-xs leading-relaxed text-muted">
                        {cat.explanation}
                      </p>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tutor CTA */}
            <TutorCTA />
          </motion.div>
        )}
      </div>
    </GameShell>
  );
}
