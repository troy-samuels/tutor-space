"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameButton from "@/components/games/engine/GameButton";
import GameResultCard from "@/components/games/engine/GameResultCard";
import WordTile from "./WordTile";
import type { TileState } from "./WordTile";
import CategoryReveal from "./CategoryReveal";
import VibeClueBanner from "./VibeClueBanner";
import { recordGamePlay } from "@/lib/games/streaks";
import { haptic } from "@/lib/games/haptics";
import { shareResult } from "@/components/games/engine/share";
import { fireConfetti } from "@/lib/games/juice";
import { getLanguageFlag } from "@/lib/games/language-utils";
import { cn } from "@/lib/utils";
import type {
  ConnectionsPuzzle,
  ConnectionsGameState,
  Difficulty,
} from "@/lib/games/data/connections/types";

interface ConnectionsGameProps {
  puzzle: ConnectionsPuzzle;
  onGameEnd?: (state: ConnectionsGameState) => void;
  onPlayAgain?: () => void;
}

const MAX_MISTAKES = 4;
const MAX_SELECTED = 4;

const DIFFICULTY_EMOJI: Record<Difficulty, string> = {
  yellow: "🟨",
  green: "🟩",
  blue: "🟦",
  purple: "🟪",
};

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** HIGH-2: Track which words are false friends for quick lookup */
function buildFalseFriendMap(puzzle: ConnectionsPuzzle): Map<string, { word: string; meaning: string }> {
  const map = new Map<string, { word: string; meaning: string }>();
  for (const cat of puzzle.categories) {
    for (const word of cat.words) {
      // Check word-level false friend data (from extended WordEntry type)
      const wordEntry = (cat as unknown as { wordEntries?: Array<{ word: string; falseFriend?: boolean; falseFriendMeaning?: string }> }).wordEntries;
      if (wordEntry) {
        const entry = wordEntry.find((e) => e.word === word);
        if (entry?.falseFriend && entry.falseFriendMeaning) {
          map.set(word, { word, meaning: entry.falseFriendMeaning });
        }
      }
    }
    // Category-level false friend flag
    if (cat.isFalseFriends) {
      for (const word of cat.words) {
        if (!map.has(word)) {
          map.set(word, { word, meaning: `${word} is a false friend` });
        }
      }
    }
  }
  return map;
}

export default function ConnectionsGame({ puzzle, onGameEnd, onPlayAgain }: ConnectionsGameProps) {
  const [gameState, setGameState] = React.useState<ConnectionsGameState>(() => {
    const allWords = puzzle.categories.flatMap((c) => c.words);
    return {
      puzzle,
      remainingWords: shuffleArray(allWords),
      solvedCategories: [],
      mistakes: 0,
      maxMistakes: MAX_MISTAKES,
      selectedWords: [],
      isComplete: false,
      isWon: false,
      startTime: Date.now(),
      solveOrder: [],
      falseFriendsEncountered: [],
    };
  });

  const [wrongGuessWords, setWrongGuessWords] = React.useState<Set<string>>(new Set());
  const [falseFriendWords, setFalseFriendWords] = React.useState<Set<string>>(new Set());
  // Debounce guard — prevents double-submit on rapid taps
  const isSubmittingRef = React.useRef(false);
  const [oneAway, setOneAway] = React.useState(false);
  const [showExplanations, setShowExplanations] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [guessHistory, setGuessHistory] = React.useState<Difficulty[][]>([]);

  // LOW-1: Ref to track copy timeout for cleanup
  const copyTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable ref to latest onGameEnd callback + single-fire guard
  const onGameEndRef = React.useRef(onGameEnd);
  React.useEffect(() => { onGameEndRef.current = onGameEnd; });
  const hasNotifiedRef = React.useRef(false);

  // HIGH-2: Build false friend lookup map
  const falseFriendMap = React.useMemo(() => buildFalseFriendMap(puzzle), [puzzle]);

  // Notify parent when game ends (fires exactly once)
  React.useEffect(() => {
    if (!gameState.isComplete || hasNotifiedRef.current) return;
    hasNotifiedRef.current = true;
    onGameEndRef.current?.(gameState);
  }, [gameState]);

  // Victory confetti on full win
  React.useEffect(() => {
    if (!gameState.isComplete || !gameState.isWon) return;
    const timer = setTimeout(() => {
      void fireConfetti({
        particleCount: 80,
        spread: 100,
        startVelocity: 35,
        gravity: 0.7,
        ticks: 100,
        origin: { y: 0.5 },
        colors: ["#D36135", "#3E5641", "#D4A843", "#5A8AB5", "#8B5CB5"],
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [gameState.isComplete, gameState.isWon]);

  // HIGH-3: Clear wrong state after 200ms (was 600ms)
  React.useEffect(() => {
    if (wrongGuessWords.size === 0) return;
    const timer = setTimeout(() => {
      setWrongGuessWords(new Set());
      // After wrong animation, show false friend state if any
    }, 200);
    return () => clearTimeout(timer);
  }, [wrongGuessWords]);

  // HIGH-2: Clear false friend state after reveal animation
  React.useEffect(() => {
    if (falseFriendWords.size === 0) return;
    const timer = setTimeout(() => {
      setFalseFriendWords(new Set());
    }, 1200); // Design Bible: 1200ms for false friend reveal
    return () => clearTimeout(timer);
  }, [falseFriendWords]);

  // Clear "one away" toast
  React.useEffect(() => {
    if (!oneAway) return;
    const timer = setTimeout(() => setOneAway(false), 2000);
    return () => clearTimeout(timer);
  }, [oneAway]);

  // LOW-1: Cleanup copy timeout on unmount
  React.useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handleWordTap = React.useCallback((word: string) => {
    if (gameState.isComplete) return;

    setGameState((prev) => {
      const isSelected = prev.selectedWords.includes(word);
      let next: string[];
      if (isSelected) {
        next = prev.selectedWords.filter((w) => w !== word);
      } else if (prev.selectedWords.length < MAX_SELECTED) {
        next = [...prev.selectedWords, word];
      } else {
        return prev;
      }
      return { ...prev, selectedWords: next };
    });
  }, [gameState.isComplete]);

  const handleSubmit = React.useCallback(() => {
    // Debounce: block rapid double-taps
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setTimeout(() => { isSubmittingRef.current = false; }, 350);

    const { selectedWords, puzzle: puz } = gameState;
    if (selectedWords.length !== MAX_SELECTED) return;

    // Check if guess matches any unsolved category
    const matchedCategory = puz.categories.find(
      (cat) =>
        !gameState.solvedCategories.includes(cat) &&
        cat.words.every((w) => selectedWords.includes(w)),
    );

    if (matchedCategory) {
      // Correct guess!
      setGameState((prev) => {
        const newSolved = [...prev.solvedCategories, matchedCategory];
        const newRemaining = prev.remainingWords.filter(
          (w) => !matchedCategory.words.includes(w),
        );
        const newSolveOrder = [...prev.solveOrder, matchedCategory.difficulty];
        const isWon = newSolved.length === 4;
        const newState: ConnectionsGameState = {
          ...prev,
          solvedCategories: newSolved,
          remainingWords: newRemaining,
          selectedWords: [],
          solveOrder: newSolveOrder,
          isComplete: isWon,
          isWon,
          endTime: isWon ? Date.now() : undefined,
        };
        return newState;
      });

      haptic("success");

      // Record guess in history — 4 emojis of the same colour for a correct guess
      setGuessHistory((prev) => [
        ...prev,
        [matchedCategory.difficulty, matchedCategory.difficulty, matchedCategory.difficulty, matchedCategory.difficulty],
      ]);

      // If won, record streak
      if (gameState.solvedCategories.length === 3) {
        recordGamePlay("connections");
      }
    } else {
      // Wrong guess — check if "one away"
      let maxOverlap = 0;
      for (const cat of puz.categories) {
        if (gameState.solvedCategories.includes(cat)) continue;
        const overlap = cat.words.filter((w) => selectedWords.includes(w)).length;
        if (overlap > maxOverlap) maxOverlap = overlap;
      }

      // Build colour row: map each selected word to its actual category's difficulty
      const guessColors: Difficulty[] = selectedWords.map((w) => {
        const cat = puz.categories.find((c) => c.words.includes(w));
        return cat ? cat.difficulty : "yellow";
      });

      if (maxOverlap === 3) {
        setOneAway(true);
      }

      haptic("error");
      setWrongGuessWords(new Set(selectedWords));
      setGuessHistory((prev) => [...prev, guessColors]);

      // HIGH-2: Check for false friends among selected words
      const detectedFalseFriends = selectedWords.filter((w) => falseFriendMap.has(w));
      if (detectedFalseFriends.length > 0) {
        haptic("falseFriend");
        // Show false friend state after wrong animation clears (200ms)
        setTimeout(() => {
          setFalseFriendWords(new Set(detectedFalseFriends));
        }, 250);
        // Track encountered false friends
        setGameState((prev) => {
          const newEncountered = [...(prev.falseFriendsEncountered || [])];
          for (const w of detectedFalseFriends) {
            if (!newEncountered.some((ff) => ff.word === w)) {
              const entry = falseFriendMap.get(w);
              if (entry) newEncountered.push(entry);
            }
          }
          return { ...prev, falseFriendsEncountered: newEncountered };
        });
      }

      setGameState((prev) => {
        const newMistakes = prev.mistakes + 1;
        const isGameOver = newMistakes >= MAX_MISTAKES;

        if (isGameOver) {
          // Reveal all remaining categories
          const remainingCats = puz.categories.filter(
            (c) => !prev.solvedCategories.includes(c),
          );
          return {
            ...prev,
            mistakes: newMistakes,
            selectedWords: [],
            isComplete: true,
            isWon: false,
            endTime: Date.now(),
            solvedCategories: [...prev.solvedCategories, ...remainingCats],
            remainingWords: [],
            solveOrder: [
              ...prev.solveOrder,
              ...remainingCats.map((c) => c.difficulty),
            ],
          };
        }

        return {
          ...prev,
          mistakes: newMistakes,
          selectedWords: [],
        };
      });
    }
  }, [gameState, falseFriendMap]);

  const handleShuffle = React.useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      remainingWords: shuffleArray(prev.remainingWords),
    }));
  }, []);

  const handleDeselectAll = React.useCallback(() => {
    setGameState((prev) => ({ ...prev, selectedWords: [] }));
  }, []);

  const generateShareText = React.useCallback((): string => {
    const langFlag = getLanguageFlag(puzzle.language);
    const header = `Lingua Connections #${puzzle.number} ${langFlag}`;
    const mistakeStr = gameState.isWon
      ? `${gameState.mistakes}/${MAX_MISTAKES} mistakes`
      : "❌ Not solved";
    const elapsed = gameState.endTime
      ? Math.floor((gameState.endTime - gameState.startTime) / 1000)
      : 0;
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const timeStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;

    // Build the emoji grid from guessHistory
    const grid = guessHistory
      .map((row) => row.map((d) => DIFFICULTY_EMOJI[d]).join(""))
      .join("\n");

    // HIGH-2: Include false friend count in share text
    const ffCount = gameState.falseFriendsEncountered?.length || 0;
    const ffStr = ffCount > 0 ? ` · 🪤 ${ffCount} False Friend${ffCount !== 1 ? "s" : ""}` : "";

    return `${header}\n${mistakeStr} · ${timeStr}${ffStr}\n\n${grid}\n\ntutorlingua.co/games/connections`;
  }, [puzzle.number, puzzle.language, gameState, guessHistory]);

  const handleShare = React.useCallback(async () => {
    const text = generateShareText();
    await shareResult(text, "Lingua Connections", setCopied, copyTimeoutRef);
  }, [generateShareText]);

  const getTileState = (word: string): TileState => {
    if (falseFriendWords.has(word)) return "false-friend";
    if (wrongGuessWords.has(word)) return "wrong";
    if (gameState.selectedWords.includes(word)) return "selected";
    return "default";
  };

  /** HIGH-2: Get the false friend back text for a word */
  const getFalseFriendBack = (word: string): string | undefined => {
    const entry = falseFriendMap.get(word);
    return entry?.meaning;
  };

  return (
    <div className="relative space-y-4">
      {/* Mistake dots — minimal */}
      <div className="flex items-center justify-center gap-1.5 mb-3">
        <div className="flex gap-1.5">
          {Array.from({ length: MAX_MISTAKES }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-2 w-2 rounded-full transition-colors duration-200",
                i < gameState.mistakes
                  ? "bg-[var(--game-wrong)]"
                  : "bg-black/[0.08]",
              )}
            />
          ))}
        </div>
      </div>

      {/* "One away" toast */}
      <AnimatePresence>
        {oneAway && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex justify-center"
          >
            <motion.span
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              style={{
                display: "inline-block",
                fontSize: "12px",
                fontWeight: 600,
                padding: "2px 10px",
                borderRadius: "9999px",
                border: "1px solid rgba(var(--game-warning-rgb, 212,168,67), 0.3)",
                color: "var(--game-warning)",
              }}
            >
              One away! 🤏
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Solved Categories — bold, filled category colour */}
      <AnimatePresence>
        <div className="space-y-1.5">
          {gameState.solvedCategories.map((cat, i) => (
            <CategoryReveal key={cat.name} category={cat} index={i} />
          ))}
        </div>
      </AnimatePresence>

      {/* Word Grid — Design Bible: 6px gap, 8px radius tiles */}
      {gameState.remainingWords.length > 0 && (
        <div className="grid grid-cols-4 gap-2" role="grid">
          {gameState.remainingWords.map((word) => (
            <WordTile
              key={word}
              word={word}
              state={getTileState(word)}
              onClick={() => handleWordTap(word)}
              disabled={gameState.isComplete}
              falseFriendBack={getFalseFriendBack(word)}
            />
          ))}
        </div>
      )}

      {/* Action buttons */}
      {!gameState.isComplete && (
        <div
          className="sticky bottom-0 z-10 -mx-4 mt-4 px-4 py-3"
          style={{
            background: "rgba(253, 248, 245, 0.95)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderTop: "1px solid rgba(45, 42, 38, 0.06)",
            paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
          }}
        >
          <div className="flex items-center gap-2">
            {/* Shuffle */}
            <motion.button
              onClick={handleShuffle}
              whileTap={{ scale: 0.96 }}
              className="flex-1 rounded-xl text-[13px] font-medium min-h-[48px] touch-manipulation select-none"
              style={{ color: "#6B6560", background: "#F5EDE8" }}
            >
              Shuffle
            </motion.button>
            {/* Deselect */}
            <motion.button
              onClick={handleDeselectAll}
              disabled={gameState.selectedWords.length === 0}
              whileTap={gameState.selectedWords.length > 0 ? { scale: 0.96 } : undefined}
              className="flex-1 rounded-xl text-[13px] font-medium min-h-[48px] touch-manipulation select-none disabled:opacity-30"
              style={{ color: "#6B6560", background: "#F5EDE8" }}
            >
              Deselect
            </motion.button>
            {/* Submit — primary CTA */}
            <motion.button
              onClick={handleSubmit}
              disabled={gameState.selectedWords.length !== MAX_SELECTED}
              whileTap={gameState.selectedWords.length === MAX_SELECTED ? { scale: 0.96 } : undefined}
              className="flex-1 rounded-xl text-[13px] font-semibold min-h-[48px] touch-manipulation select-none"
              style={{
                color: "#FFFFFF",
                background: gameState.selectedWords.length !== MAX_SELECTED ? "#9C9590" : "#2D2A26",
                opacity: gameState.selectedWords.length !== MAX_SELECTED ? 0.4 : 1,
              }}
            >
              Submit
            </motion.button>
          </div>
        </div>
      )}

      {/* Vibe Clue Hints */}
      {!gameState.isComplete && puzzle.vibeClues && (
        <VibeClueBanner
          clues={puzzle.vibeClues}
          solvedCount={gameState.solvedCategories.length}
        />
      )}

      {/* Victory / Game Over — Design Bible result card */}
      <AnimatePresence>
        {gameState.isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 20 }}
            className="mt-6 space-y-4"
          >
            {/* Shared result card with emoji grid as children */}
            <GameResultCard
              emoji={gameState.isWon ? "🎉" : "💪"}
              heading={gameState.isWon ? "Well done!" : "Good try!"}
              subtext={
                gameState.isWon
                  ? `Solved with ${gameState.mistakes} mistake${gameState.mistakes !== 1 ? "s" : ""}`
                  : "You'll get it next time"
              }
              timeSeconds={
                gameState.endTime
                  ? Math.floor((gameState.endTime - gameState.startTime) / 1000)
                  : undefined
              }
            >
              {/* Emoji grid */}
              <div className="mx-auto max-w-[200px] space-y-1">
                {guessHistory.map((row, i) => (
                  <div key={i} className="flex justify-center gap-0.5 text-lg">
                    {row.map((d, j) => (
                      <span key={j}>{DIFFICULTY_EMOJI[d]}</span>
                    ))}
                  </div>
                ))}
              </div>
            </GameResultCard>

            {/* HIGH-2: False Friends Gallery */}
            {gameState.falseFriendsEncountered && gameState.falseFriendsEncountered.length > 0 && (
              <div
                className="rounded-2xl p-5"
                style={{
                  background: "var(--game-bg-surface)",
                  border: "1px solid rgba(251, 191, 36, 0.2)",
                }}
              >
                <h3
                  className="text-sm font-bold flex items-center gap-2"
                  style={{ color: "var(--game-warning)" }}
                >
                  🪤 False Friends Gallery
                </h3>
                <p
                  className="text-xs mt-1 mb-3"
                  style={{ color: "var(--game-text-secondary)" }}
                >
                  Words that tricked you — not what they seem!
                </p>
                <div className="space-y-2">
                  {gameState.falseFriendsEncountered.map((ff) => (
                    <div
                      key={ff.word}
                      className="flex items-center gap-3 rounded-lg px-3 py-2"
                      style={{
                        background: "var(--game-bg-elevated)",
                        border: "1px solid rgba(251, 191, 36, 0.1)",
                      }}
                    >
                      <span className="text-sm">🪤</span>
                      <div>
                        <span
                          className="text-sm font-bold uppercase"
                          style={{ color: "var(--game-text-primary)" }}
                        >
                          {ff.word}
                        </span>
                        <span
                          className="text-xs ml-2"
                          style={{ color: "var(--game-text-secondary)" }}
                        >
                          {ff.meaning}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Share button */}
            <GameButton onClick={handleShare} variant="accent">
              {copied ? "✓ Copied!" : "📋 Share Result"}
            </GameButton>

            {/* Explain mistakes */}
            {gameState.mistakes > 0 && (
              <GameButton
                onClick={() => setShowExplanations((prev) => !prev)}
                variant="outline"
              >
                {showExplanations ? "Hide Explanations" : "Explain My Mistakes"}
              </GameButton>
            )}

            {/* Play Again */}
            {onPlayAgain && (
              <GameButton onClick={onPlayAgain} variant="secondary">
                🔄 Play Again
              </GameButton>
            )}

            {/* Explanations panel */}
            <AnimatePresence>
              {showExplanations && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  {puzzle.categories.map((cat) => (
                    <div
                      key={cat.name}
                      className="rounded-xl p-4"
                      style={{
                        background: "var(--game-bg-elevated)",
                        border: "1px solid rgba(0,0,0,0.06)",
                      }}
                    >
                      <h4
                        className="text-sm font-bold"
                        style={{ color: "var(--game-text-primary)" }}
                      >
                        {DIFFICULTY_EMOJI[cat.difficulty]} {cat.name}
                      </h4>
                      <p
                        className="mt-1 text-xs leading-relaxed"
                        style={{ color: "var(--game-text-secondary)" }}
                      >
                        {cat.explanation}
                      </p>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
