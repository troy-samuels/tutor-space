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
import { hapticCorrect, hapticWrong, hapticVictory, hapticWordFound } from '@/lib/haptics';
import { recordGamePlay } from '@/lib/streaks';
import { generateShareText } from './share';

interface SpellCastGameProps {
  puzzle: HexPuzzle;
  puzzleNumber: number;
  onExit?: () => void;
}

const GAME_DURATION_MS = 2 * 60 * 1000; // 2 minutes
const COMBO_TIMEOUT_MS = 30 * 1000; // 30 seconds

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
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

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
      // If already selected, deselect
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      }
      
      // If empty, start new word
      if (prev.length === 0) {
        return [index];
      }

      // Check if adjacent to last selected hex
      const lastHex = prev[prev.length - 1];
      if (!isAdjacent(lastHex, index)) {
        return prev;
      }

      return [...prev, index];
    });
  }, [isComplete]);

  const handleSubmit = useCallback(() => {
    if (selectedHexes.length < 3) {
      setMessage({ text: 'Word too short!', type: 'error' });
      hapticWrong();
      setSelectedHexes([]);
      return;
    }

    const word = selectedHexes.map((i) => puzzle.letters[i]).join('');
    
    // Check if already found
    if (foundWords.has(word.toLowerCase())) {
      setMessage({ text: 'Already found!', type: 'error' });
      hapticWrong();
      setSelectedHexes([]);
      return;
    }

    // Validate word
    const validWord = isValidWord(word, puzzle.language);
    if (!validWord) {
      setMessage({ text: 'Not a valid word', type: 'error' });
      hapticWrong();
      setSelectedHexes([]);
      return;
    }

    // Calculate score
    const usedCenter = selectedHexes.includes(puzzle.centerIndex);
    const wordScore = calculateWordScore(validWord, usedCenter, combo);

    // Update state
    hapticWordFound();
    setFoundWords((prev) => new Set(prev).add(word.toLowerCase()));
    setScore((prev) => prev + wordScore);
    setLastWordTime(Date.now());
    
    // Update combo
    const newCombo = combo + 1;
    setCombo(newCombo);
    setMaxCombo((prev) => Math.max(prev, newCombo));

    // Track best word
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
      <div className="space-y-4">
        {/* Timer & Score */}
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-card p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {Math.floor(timeRemaining / 1000)}s
            </div>
            <div className="text-xs text-muted">Time Left</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{score}</div>
            <div className="text-xs text-muted">Score</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-accent">{foundWords.size}</div>
            <div className="text-xs text-muted">Words</div>
          </div>
        </div>

        {/* Combo indicator */}
        {combo > 1 && !isComplete && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-center"
          >
            <div className="text-lg font-bold text-accent">
              🔥 {combo}x Combo!
            </div>
          </motion.div>
        )}

        {/* Current word */}
        <div className="rounded-xl border border-white/10 bg-card px-4 py-3 text-center">
          <div className="text-xl font-bold text-foreground">
            {currentWord || '⏺ Tap hexes to spell'}
          </div>
        </div>

        {/* Message toast */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`text-center text-sm font-bold ${
                message.type === 'success' ? 'text-accent' : 'text-destructive'
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
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedHexes([])}
              disabled={selectedHexes.length === 0}
              className="flex-1 rounded-xl bg-card px-4 py-3 text-sm font-bold text-foreground disabled:opacity-40 active:bg-card/80"
            >
              Clear
            </button>
            <button
              onClick={handleSubmit}
              disabled={selectedHexes.length < 3}
              className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-40 active:bg-primary/90"
            >
              Submit
            </button>
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
            {/* Result banner */}
            <div className="rounded-2xl border border-white/10 bg-card p-6 text-center">
              <div className="text-4xl">🍯</div>
              <h2 className="mt-2 text-xl font-bold text-foreground">Time's Up!</h2>
              
              <div className="mt-4 space-y-2">
                <div className="text-2xl font-bold text-primary">{score} pts</div>
                <div className="text-sm text-muted">{foundWords.size} words found</div>
                {bestWord && (
                  <div className="text-xs text-muted">
                    Best: <span className="font-bold text-accent">{bestWord.word}</span> ({bestWord.score} pts)
                  </div>
                )}
                {maxCombo > 1 && (
                  <div className="text-xs text-muted">
                    Max combo: <span className="font-bold text-accent">{maxCombo}x</span>
                  </div>
                )}
              </div>
            </div>

            {/* Share */}
            <ShareCard text={shareText} />

            {/* Tutor CTA */}
            <TutorCTA />
          </motion.div>
        )}
      </div>
    </GameShell>
  );
}

/**
 * Check if two hex indices are adjacent.
 * Simplified adjacency for honeycomb layout.
 */
function isAdjacent(a: number, b: number): boolean {
  // Center hex (0) is adjacent to inner ring (1-6)
  if (a === 0) return b >= 1 && b <= 6;
  if (b === 0) return a >= 1 && a <= 6;

  // Inner ring adjacency
  if (a >= 1 && a <= 6 && b >= 1 && b <= 6) {
    const diff = Math.abs(a - b);
    return diff === 1 || diff === 5; // Adjacent in ring
  }

  // Outer ring to inner ring
  if (a >= 1 && a <= 6 && b >= 7) return true;
  if (b >= 1 && b <= 6 && a >= 7) return true;

  // Outer ring adjacency
  if (a >= 7 && b >= 7) {
    const diff = Math.abs(a - b);
    return diff === 1 || diff === 11; // Adjacent in ring
  }

  return false;
}
