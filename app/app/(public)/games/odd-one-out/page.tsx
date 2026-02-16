"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import GameShell from "@/components/games/engine/GameShell";
import OddOneOutGame from "@/components/games/odd-one-out/OddOneOutGame";
import { getDailySeed, getPuzzleNumber } from "@/lib/games/daily-seed";
import { PUZZLES_ES } from "@/lib/games/data/odd-one-out/puzzles-es";
import { PUZZLES_FR } from "@/lib/games/data/odd-one-out/puzzles-fr";
import { PUZZLES_DE } from "@/lib/games/data/odd-one-out/puzzles-de";
import { SUPPORTED_GAME_LANGUAGES, getShuffledPuzzle } from "@/lib/games/data/odd-one-out";
import type { OddOneOutPuzzle, OddOneOutGameState } from "@/lib/games/data/odd-one-out/types";

const ALL_PUZZLES: Record<string, OddOneOutPuzzle[]> = {
  es: PUZZLES_ES,
  fr: PUZZLES_FR,
  de: PUZZLES_DE,
};

function getPuzzleForLanguage(lang: string): OddOneOutPuzzle {
  const puzzles = ALL_PUZZLES[lang] || PUZZLES_ES;
  const seed = getDailySeed("odd-one-out", lang);
  const puzzleNumber = getPuzzleNumber();
  const index = seed % puzzles.length;
  const basePuzzle = { ...puzzles[index], number: puzzleNumber };
  return getShuffledPuzzle(basePuzzle);
}

export default function OddOneOutPage() {
  const searchParams = useSearchParams();
  const langParam = searchParams.get("lang");

  const [language, setLanguage] = React.useState(
    langParam && ALL_PUZZLES[langParam] ? langParam : "es",
  );
  const [puzzle, setPuzzle] = React.useState<OddOneOutPuzzle>(() =>
    getPuzzleForLanguage(language),
  );
  const [gameKey, setGameKey] = React.useState(0);
  const [endState, setEndState] = React.useState<{
    isComplete: boolean;
    isWon: boolean;
    mistakes: number;
  }>({ isComplete: false, isWon: false, mistakes: 0 });

  const handleLanguageChange = React.useCallback((newLang: string) => {
    setLanguage(newLang);
    setPuzzle(getPuzzleForLanguage(newLang));
    setGameKey((k) => k + 1);
    setEndState({ isComplete: false, isWon: false, mistakes: 0 });
  }, []);

  const handleGameEnd = React.useCallback((state: OddOneOutGameState) => {
    setEndState({
      isComplete: state.isComplete,
      isWon: state.isWon,
      mistakes: state.maxLives - state.lives,
    });
  }, []);

  return (
    <GameShell
      gameName="Odd One Out"
      gameSlug="odd-one-out"
      puzzleNumber={puzzle.number}
      language={puzzle.language}
      isComplete={endState.isComplete}
      isWon={endState.isWon}
      mistakes={endState.mistakes}
    >
      {/* Language selector */}
      <div className="mb-4 flex justify-center gap-2">
        {SUPPORTED_GAME_LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all min-h-[44px] touch-manipulation ${
              language === lang.code
                ? "bg-primary text-primary-foreground shadow-lg"
                : "bg-white/[0.05] text-muted-foreground hover:bg-white/[0.1]"
            }`}
          >
            {lang.flag} {lang.name}
          </button>
        ))}
      </div>

      <OddOneOutGame key={gameKey} puzzle={puzzle} onGameEnd={handleGameEnd} />
    </GameShell>
  );
}
