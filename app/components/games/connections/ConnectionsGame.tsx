"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import WordTile from "./WordTile";
import type { TileState } from "./WordTile";
import CategoryReveal from "./CategoryReveal";
import VibeClueBanner from "./VibeClueBanner";
import { recordGamePlay } from "@/lib/games/streaks";
import { cn } from "@/lib/utils";
import type {
  ConnectionsPuzzle,
  ConnectionCategory,
  ConnectionsGameState,
  Difficulty,
} from "@/lib/games/data/connections/types";

interface ConnectionsGameProps {
  puzzle: ConnectionsPuzzle;
  onGameEnd?: (state: ConnectionsGameState) => void;
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

export default function ConnectionsGame({ puzzle, onGameEnd }: ConnectionsGameProps) {
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
    };
  });

  const [wrongGuessWords, setWrongGuessWords] = React.useState<Set<string>>(new Set());
  const [oneAway, setOneAway] = React.useState(false);
  const [showExplanations, setShowExplanations] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [guessHistory, setGuessHistory] = React.useState<Difficulty[][]>([]);

  // Notify parent when game ends
  React.useEffect(() => {
    if (gameState.isComplete && onGameEnd) {
      onGameEnd(gameState);
    }
  }, [gameState.isComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear wrong state after animation
  React.useEffect(() => {
    if (wrongGuessWords.size === 0) return;
    const timer = setTimeout(() => {
      setWrongGuessWords(new Set());
    }, 600);
    return () => clearTimeout(timer);
  }, [wrongGuessWords]);

  // Clear "one away" toast
  React.useEffect(() => {
    if (!oneAway) return;
    const timer = setTimeout(() => setOneAway(false), 2000);
    return () => clearTimeout(timer);
  }, [oneAway]);

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

      setWrongGuessWords(new Set(selectedWords));
      setGuessHistory((prev) => [...prev, guessColors]);

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
  }, [gameState]);

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
    const langFlag = puzzle.language === "fr" ? "🇫🇷" : puzzle.language === "de" ? "🇩🇪" : "🇪🇸";
    const header = `Lingua Connections #${puzzle.number} ${langFlag}`;
    const mistakeStr = gameState.isWon
      ? `${gameState.mistakes}/${MAX_MISTAKES} mistakes`
      : "❌ Not solved";
    const elapsed = gameState.endTime
      ? Math.floor((gameState.endTime - gameState.startTime) / 1000)
      : 0;
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const timeStr = `⏱ ${minutes}:${seconds.toString().padStart(2, "0")}`;

    // Build the emoji grid from guessHistory
    const grid = guessHistory
      .map((row) => row.map((d) => DIFFICULTY_EMOJI[d]).join(""))
      .join("\n");

    return `${header}\n${mistakeStr} · ${timeStr}\n\n${grid}\n\ntutorlingua.co/games/connections`;
  }, [puzzle.number, gameState, guessHistory]);

  const handleShare = React.useCallback(async () => {
    const text = generateShareText();
    try {
      if (navigator.share) {
        await navigator.share({ title: "Lingua Connections", text });
        return;
      }
    } catch {
      // fallthrough to clipboard
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [generateShareText]);

  const getTileState = (word: string): TileState => {
    if (wrongGuessWords.has(word)) return "wrong";
    if (gameState.selectedWords.includes(word)) return "selected";
    return "default";
  };

  return (
    <div className="space-y-4">
      {/* Mistake dots */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-xs text-muted-foreground">Mistakes:</span>
        <div className="flex gap-1">
          {Array.from({ length: MAX_MISTAKES }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                i < gameState.mistakes
                  ? "bg-destructive"
                  : "bg-white/[0.1]",
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
            <Badge variant="outline" className="animate-pulse text-xs">
              One away! 🤏
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Solved Categories */}
      <AnimatePresence>
        <div className="space-y-2">
          {gameState.solvedCategories.map((cat, i) => (
            <CategoryReveal key={cat.name} category={cat} index={i} />
          ))}
        </div>
      </AnimatePresence>

      {/* Word Grid */}
      {gameState.remainingWords.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {gameState.remainingWords.map((word) => (
            <WordTile
              key={word}
              word={word}
              state={getTileState(word)}
              onClick={() => handleWordTap(word)}
              disabled={gameState.isComplete}
            />
          ))}
        </div>
      )}

      {/* Action buttons */}
      {!gameState.isComplete && (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShuffle}
            className="flex-1 rounded-xl text-xs"
          >
            🔀 Shuffle
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeselectAll}
            disabled={gameState.selectedWords.length === 0}
            className="flex-1 rounded-xl text-xs"
          >
            ✕ Deselect
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSubmit}
            disabled={gameState.selectedWords.length !== MAX_SELECTED}
            className="flex-1 rounded-xl text-xs"
          >
            Submit
          </Button>
        </div>
      )}

      {/* Vibe Clue Hints */}
      {!gameState.isComplete && puzzle.vibeClues && (
        <VibeClueBanner
          clues={puzzle.vibeClues}
          solvedCount={gameState.solvedCategories.length}
        />
      )}

      {/* Victory / Game Over */}
      <AnimatePresence>
        {gameState.isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 20 }}
            className="mt-6 space-y-4"
          >
            {/* Result banner */}
            <div className="rounded-2xl border border-border/50 bg-card p-6 text-center">
              <div className="text-4xl">
                {gameState.isWon ? "🎉" : "💪"}
              </div>
              <h2 className="mt-2 font-heading text-xl text-foreground">
                {gameState.isWon ? "¡Perfecto!" : "Good try!"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {gameState.isWon
                  ? `Solved with ${gameState.mistakes} mistake${gameState.mistakes !== 1 ? "s" : ""}`
                  : "You'll get it next time"}
              </p>

              {/* Score grid */}
              <div className="mx-auto mt-4 max-w-[200px] space-y-1">
                {guessHistory.map((row, i) => (
                  <div key={i} className="flex justify-center gap-0.5 text-lg">
                    {row.map((d, j) => (
                      <span key={j}>{DIFFICULTY_EMOJI[d]}</span>
                    ))}
                  </div>
                ))}
              </div>

              {/* Time */}
              {gameState.endTime && (
                <p className="mt-3 text-xs text-muted-foreground">
                  ⏱{" "}
                  {(() => {
                    const secs = Math.floor(
                      (gameState.endTime - gameState.startTime) / 1000,
                    );
                    return `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, "0")}`;
                  })()}
                </p>
              )}
            </div>

            {/* Share button */}
            <Button
              onClick={handleShare}
              variant="default"
              size="lg"
              className="w-full rounded-xl"
            >
              {copied ? "✓ Copied!" : "📋 Share Result"}
            </Button>

            {/* Explain mistakes */}
            {gameState.mistakes > 0 && (
              <Button
                onClick={() => setShowExplanations((prev) => !prev)}
                variant="outline"
                size="lg"
                className="w-full rounded-xl"
              >
                {showExplanations ? "Hide Explanations" : "🧠 Explain My Mistakes"}
              </Button>
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
                      className="rounded-xl border border-border/50 bg-card/50 p-4"
                    >
                      <h4 className="text-sm font-bold text-foreground">
                        {DIFFICULTY_EMOJI[cat.difficulty]} {cat.name}
                      </h4>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
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
