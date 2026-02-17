/**
 * SpellCastGame — Honeycomb word-finding game with 2-minute timer.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameShell } from '@/components/GameShell';
import { ShareCard } from '@/components/ShareCard';
import { TutorCTA } from '@/components/TutorCTA';
import { HexGrid } from './HexGrid';
import type { HexPuzzle } from '@/data/spell-cast/types';
import { isValidWord, calculateWordScore } from '@/data/spell-cast/word-lists';
import { hapticCorrect, hapticWrong, hapticVictory, hapticWordFound, hapticCombo } from '@/lib/haptics';
import { recordGamePlay } from '@/lib/streaks';
import { generateShareText } from './share';
import { Clock, TrendingUp, Hash, X, Check, Flame } from 'lucide-react';

interface SpellCastGameProps {
  puzzle: HexPuzzle;
  puzzleNumber: number;
  onExit?: () => void;
}

const GAME_DURATION_MS = 2 * 60 * 1000;
const COMBO_TIMEOUT_MS = 30 * 1000;

export function SpellCastGame({ puzzle, puzzleNumber, onExit }: SpellCastGameProps) {
  const [selectedHexes, setSelectedHexes] = useState<number[]>([]);
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [lastWordTime, setLastWordTime] = useState(Date.now());
  const [timeRemaining, setTimeRemaining] = useState(GAME_DURATION_MS);
  const [isComplete, setIsComplete] = useState(false);
  const [bestWord, setBestWord] = useState<{ word: string; score: number } | null>(null);
  const [maxCombo, setMaxCombo] = useState(1);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Timer
  useEffect(() => {
    if (isComplete) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const next = prev - 1000;
        if (next <= 0) {
          setIsComplete(true);
          hapticVictory();
          recordGamePlay('spell-cast');
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isComplete]);

  // Combo timeout
  useEffect(() => {
    if (isComplete) return;

    const timeSinceLastWord = Date.now() - lastWordTime;
    if (timeSinceLastWord > COMBO_TIMEOUT_MS && combo > 1) {
      setCombo(1);
    }
  }, [lastWordTime, combo, isComplete]);

  // Clear message after 2 seconds
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 2000);
    return () => clearTimeout(timer);
  }, [message]);

  const handleHexTap = useCallback((index: number) => {
    if (isComplete) return;

    setSelectedHexes((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      }
      
      if (prev.length === 0) {
        return [index];
      }

      const lastHex = prev[prev.length - 1];
      if (!isAdjacent(lastHex, index)) {
        return prev;
      }

      return [...prev, index];
    });
  }, [isComplete]);

  const handleSubmit = useCallback(() => {
    if (selectedHexes.length < 3) {
      setMessage({ text: 'Word too short! (Min 3)', type: 'error' });
      hapticWrong();
      setSelectedHexes([]);
      return;
    }

    const word = selectedHexes.map((i) => puzzle.letters[i]).join('');
    
    if (foundWords.has(word.toLowerCase())) {
      setMessage({ text: 'Already found!', type: 'error' });
      hapticWrong();
      setSelectedHexes([]);
      return;
    }

    const validWord = isValidWord(word, puzzle.language);
    if (!validWord) {
      setMessage({ text: 'Not a valid word', type: 'error' });
      hapticWrong();
      setSelectedHexes([]);
      return;
    }

    const usedCenter = selectedHexes.includes(puzzle.centerIndex);
    const wordScore = calculateWordScore(validWord, usedCenter, combo);

    hapticWordFound();
    setFoundWords((prev) => new Set(prev).add(word.toLowerCase()));
    setScore((prev) => prev + wordScore);
    setLastWordTime(Date.now());
    
    const newCombo = combo + 1;
    setCombo(newCombo);
    setMaxCombo((prev) => Math.max(prev, newCombo));
    hapticCombo(newCombo);

    if (!bestWord || wordScore > bestWord.score) {
      setBestWord({ word: validWord.word, score: wordScore });
    }

    setMessage({ text: `+${wordScore} pts${newCombo > 1 ? ` (${newCombo}x combo!)` : ''}`, type: 'success' });
    setSelectedHexes([]);
  }, [selectedHexes, puzzle, foundWords, combo, bestWord]);

  const currentWord = selectedHexes.map((i) => puzzle.letters[i]).join('');
  const usedIndices = new Set<number>();

  const shareText = isComplete
    ? generateShareText(puzzleNumber, puzzle.language, score, foundWords.size, bestWord?.word || '', maxCombo)
    : '';

  return (
    <GameShell
      gameName="Spell Cast"
      puzzleNumber={puzzleNumber}
      language={puzzle.language}
      onBack={onExit}
    >
      <div className="space-y-5">
        {/* Timer & Score & Words */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          className="rounded-2xl border-2 border-white/10 bg-gradient-to-br from-card to-card/90 p-4 flex items-center justify-around shadow-md"
        >
          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-1 text-primary">
              <Clock size={22} strokeWidth={2} />
              <div className="text-3xl font-bold font-mono">{Math.floor(timeRemaining / 1000)}</div>
            </div>
            <div className="text-sm text-muted">Time Left</div>
          </div>
          
          <div className="border-l border-white/10 h-12 mx-2" />

          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-1 text-success">
              <TrendingUp size={22} strokeWidth={2} />
              <div className="text-3xl font-bold">{score}</div>
            </div>
            <div className="text-sm text-muted">Score</div>
          </div>

          <div className="border-l border-white/10 h-12 mx-2" />
          
          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-1 text-accent">
              <Hash size={22} strokeWidth={2} />
              <div className="text-3xl font-bold">{foundWords.size}</div>
            </div>
            <div className="text-sm text-muted">Words</div>
          </div>
        </motion.div>

        {/* Combo indicator */}
        <AnimatePresence>
          {combo > 1 && !isComplete && (
            <motion.div
              key="combo"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="text-center"
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-accent/20 border border-accent px-4 py-1.5 text-lg font-bold text-accent shadow-sm animate-pulsefast">
                <Flame size={20} strokeWidth={2} /> {combo}x Combo!
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current word */}
        <motion.div
          key={currentWord}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="rounded-xl border-2 border-white/10 bg-card p-4 text-center shadow-sm"
        >
          <div className="text-2xl font-bold text-foreground">
            {currentWord || <span className="text-lg font-semibold text-muted">Tap hexes to spell...</span>}
          </div>
        </motion.div>

        {/* Message toast */}
        <AnimatePresence>
          {message && (
            <motion.div
              key="message"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`text-center rounded-lg px-3 py-1.5 text-sm font-bold shadow-sm border ${
                message.type === 'success' ? 'bg-success/20 text-success border-success/50' :
                message.type === 'error' ? 'bg-destructive/20 text-destructive border-destructive/50' :
                'bg-card text-muted border-white/10'
              }`}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hex Grid */}
        {!isComplete && (
          <HexGrid
            letters={puzzle.letters}
            selectedIndices={selectedHexes}
            usedIndices={usedIndices}
            centerIndex={puzzle.centerIndex}
            onHexTap={handleHexTap}
          />
        )}

        {/* Action buttons */}
        {!isComplete && (
          <div className="flex gap-3 mt-5">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedHexes([])}
              disabled={selectedHexes.length === 0}
              className="flex-1 rounded-xl bg-card border border-white/10 px-5 py-3 text-base font-bold text-foreground shadow-md disabled:opacity-50 active:bg-card/80 flex items-center justify-center gap-2"
            >
              <X size={18} strokeWidth={2} /> Clear
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              disabled={selectedHexes.length < 3}
              className="flex-1 rounded-xl bg-primary px-5 py-3 text-base font-bold text-primary-foreground shadow-md disabled:opacity-50 active:bg-primary/90 flex items-center justify-center gap-2"
            >
              <Check size={18} strokeWidth={2} /> Submit
            </motion.button>
          </div>
        )}

        {/* Game Complete */}
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="mt-6 space-y-4"
          >
            <div className="rounded-2.5xl border-2 border-white/10 bg-card p-6 text-center shadow-xl">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.5 }}
                className="text-5xl mb-2"
              >
                🍯
              </motion.div>
              <h2 className="mt-2 text-2xl font-bold text-foreground">Time's Up!</h2>
              
              <div className="mt-4 space-y-2">
                <div className="text-3xl font-bold text-primary">{score} pts</div>
                <div className="text-md text-muted">{foundWords.size} words found</div>
                {bestWord && (
                  <div className="text-sm text-muted flex items-center justify-center gap-1">
                    <TrendingUp size={16} strokeWidth={2} />
                    Best: <span className="font-bold text-accent">{bestWord.word}</span> ({bestWord.score} pts)
                  </div>
                )}
                {maxCombo > 1 && (
                  <div className="text-sm text-muted flex items-center justify-center gap-1">
                    <Flame size={16} strokeWidth={2} />
                    Max combo: <span className="font-bold text-accent">{maxCombo}x</span>
                  </div>
                )}
              </div>
            </div>

            <ShareCard text={shareText} />
            <TutorCTA />
          </motion.div>
        )}
      </div>
    </GameShell>
  );
}

function isAdjacent(a: number, b: number): boolean {
  if (a === 0) return b >= 1 && b <= 6;
  if (b === 0) return a >= 1 && a <= 6;

  if (a >= 1 && a <= 6 && b >= 1 && b <= 6) {
    const diff = Math.abs(a - b);
    return diff === 1 || diff === 5;
  }

  if (a >= 1 && a <= 6 && b >= 7) return true;
  if (b >= 1 && b <= 6 && a >= 7) return true;

  if (a >= 7 && b >= 7) {
    const diff = Math.abs(a - b);
    return diff === 1 || diff === 11;
  }

  return false;
}
