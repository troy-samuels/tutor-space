"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import GameShell from "@/components/games/engine/GameShell";
import HowToPlay from "@/components/games/engine/HowToPlay";
import LanguageSelector from "@/components/games/engine/LanguageSelector";
import WordLadderGame from "@/components/games/word-ladder/WordLadderGame";
import { getDailySeed, getPuzzleNumber } from "@/lib/games/daily-seed";
import { PUZZLES_EN } from "@/lib/games/data/word-ladder/puzzles-en";
import { PUZZLES_ES } from "@/lib/games/data/word-ladder/puzzles-es";
import { PUZZLES_FR } from "@/lib/games/data/word-ladder/puzzles-fr";
import { PUZZLES_DE } from "@/lib/games/data/word-ladder/puzzles-de";
import { SUPPORTED_GAME_LANGUAGES } from "@/lib/games/data/word-ladder";
import type { WordLadderPuzzle } from "@/lib/games/data/word-ladder/types";

const ALL_PUZZLES: Record<string, WordLadderPuzzle[]> = {
  en: PUZZLES_EN,
  es: PUZZLES_ES,
  fr: PUZZLES_FR,
  de: PUZZLES_DE,
};

function getPuzzleForLanguage(lang: string): WordLadderPuzzle {
  const puzzles = ALL_PUZZLES[lang] || PUZZLES_EN;
  const seed = getDailySeed("word-ladder", lang);
  const puzzleNumber = getPuzzleNumber();
  const index = seed % puzzles.length;
  return { ...puzzles[index], number: puzzleNumber };
}

export default function WordLadderPage() {
  const searchParams = useSearchParams();
  const langParam = searchParams.get("lang");

  const [language, setLanguage] = React.useState(
    langParam && ALL_PUZZLES[langParam] ? langParam : "en"
  );
  const [puzzle, setPuzzle] = React.useState<WordLadderPuzzle>(() =>
    getPuzzleForLanguage(language)
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

  const handleGameEnd = React.useCallback(
    (state: { isComplete: boolean; isWon: boolean; mistakes: number }) => {
      setEndState(state);
    },
    [],
  );

  const handlePlayAgain = React.useCallback(() => {
    setGameKey((k) => k + 1);
    setEndState({ isComplete: false, isWon: false, mistakes: 0 });
  }, []);

  return (
    <GameShell
      gameName="Word Ladder"
      gameSlug="word-ladder"
      puzzleNumber={puzzle.number}
      language={puzzle.language}
      isComplete={endState.isComplete}
      isWon={endState.isWon}
      mistakes={endState.mistakes}
    >
      <HowToPlay gameSlug="word-ladder" gameName="Word Ladder" />

      {/* Language selector */}
      <LanguageSelector
        languages={SUPPORTED_GAME_LANGUAGES}
        selected={language}
        onChange={handleLanguageChange}
      />

      <WordLadderGame key={gameKey} puzzle={puzzle} onGameEnd={handleGameEnd} onPlayAgain={handlePlayAgain} />
    </GameShell>
  );
}
