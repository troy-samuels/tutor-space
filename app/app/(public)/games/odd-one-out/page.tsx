"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import GameShell from "@/components/games/engine/GameShell";
import HowToPlay from "@/components/games/engine/HowToPlay";
import LanguageSelector from "@/components/games/engine/LanguageSelector";
import OddOneOutGame from "@/components/games/odd-one-out/OddOneOutGame";
import { getDailySeed, getPuzzleNumber } from "@/lib/games/daily-seed";
import { PUZZLES_EN } from "@/lib/games/data/odd-one-out/puzzles-en";
import { PUZZLES_ES } from "@/lib/games/data/odd-one-out/puzzles-es";
import { PUZZLES_FR } from "@/lib/games/data/odd-one-out/puzzles-fr";
import { PUZZLES_DE } from "@/lib/games/data/odd-one-out/puzzles-de";
import { SUPPORTED_GAME_LANGUAGES, getShuffledPuzzle } from "@/lib/games/data/odd-one-out";
import type { OddOneOutPuzzle, OddOneOutGameState } from "@/lib/games/data/odd-one-out/types";

const ALL_PUZZLES: Record<string, OddOneOutPuzzle[]> = {
  en: PUZZLES_EN,
  es: PUZZLES_ES,
  fr: PUZZLES_FR,
  de: PUZZLES_DE,
};

function getPuzzleForLanguage(lang: string): OddOneOutPuzzle {
  const puzzles = ALL_PUZZLES[lang] || PUZZLES_EN;
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
    langParam && ALL_PUZZLES[langParam] ? langParam : "en",
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

  const handlePlayAgain = React.useCallback(() => {
    setGameKey((k) => k + 1);
    setEndState({ isComplete: false, isWon: false, mistakes: 0 });
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
      <HowToPlay gameSlug="odd-one-out" gameName="Odd One Out" />

      {/* Language selector */}
      <LanguageSelector
        languages={SUPPORTED_GAME_LANGUAGES}
        selected={language}
        onChange={handleLanguageChange}
      />

      <OddOneOutGame key={gameKey} puzzle={puzzle} onGameEnd={handleGameEnd} onPlayAgain={handlePlayAgain} />
    </GameShell>
  );
}
