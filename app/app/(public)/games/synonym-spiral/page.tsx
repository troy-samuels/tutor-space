"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import GameShell from "@/components/games/engine/GameShell";
import HowToPlay from "@/components/games/engine/HowToPlay";
import LanguageSelector from "@/components/games/engine/LanguageSelector";
import SynonymSpiralGame from "@/components/games/synonym-spiral/SynonymSpiralGame";
import { getDailySeed, getPuzzleNumber } from "@/lib/games/daily-seed";
import { PUZZLES_EN } from "@/lib/games/data/synonym-spiral/puzzles-en";
import { PUZZLES_ES } from "@/lib/games/data/synonym-spiral/puzzles-es";
import { PUZZLES_FR } from "@/lib/games/data/synonym-spiral/puzzles-fr";
import { PUZZLES_DE } from "@/lib/games/data/synonym-spiral/puzzles-de";
import { SUPPORTED_SPIRAL_LANGUAGES } from "@/lib/games/data/synonym-spiral";
import type { SynonymSpiralPuzzle } from "@/lib/games/data/synonym-spiral/types";

const ALL_PUZZLES: Record<string, SynonymSpiralPuzzle[]> = {
  en: PUZZLES_EN,
  es: PUZZLES_ES,
  fr: PUZZLES_FR,
  de: PUZZLES_DE,
};

function getPuzzleForLanguage(lang: string): SynonymSpiralPuzzle {
  const puzzles = ALL_PUZZLES[lang] || PUZZLES_EN;
  const seed = getDailySeed("synonym-spiral", lang);
  const puzzleNumber = getPuzzleNumber();
  const index = seed % puzzles.length;
  return { ...puzzles[index], number: puzzleNumber };
}

export default function SynonymSpiralPage() {
  const searchParams = useSearchParams();
  const langParam = searchParams.get("lang");

  const [language, setLanguage] = React.useState(
    langParam && ALL_PUZZLES[langParam] ? langParam : "en"
  );
  const [puzzle, setPuzzle] = React.useState<SynonymSpiralPuzzle>(() =>
    getPuzzleForLanguage(language)
  );
  const [gameKey, setGameKey] = React.useState(0);
  const [endState, setEndState] = React.useState<{
    isComplete: boolean;
    isWon: boolean;
    mistakes: number;
  }>({ isComplete: false, isWon: false, mistakes: 0 });
  const [gameInProgress, setGameInProgress] = React.useState(false);

  const handleLanguageChange = React.useCallback((newLang: string) => {
    setLanguage(newLang);
    setPuzzle(getPuzzleForLanguage(newLang));
    setGameKey((k) => k + 1);
    setEndState({ isComplete: false, isWon: false, mistakes: 0 });
    setGameInProgress(false);
  }, []);

  const handleGameEnd = React.useCallback(
    (state: {
      isComplete: boolean;
      isWon: boolean;
      mistakes: number;
      averageDepth: number;
      roundDepths: number[];
      totalTimeMs: number;
    }) => {
      setEndState({
        isComplete: state.isComplete,
        isWon: state.isWon,
        mistakes: state.mistakes,
      });
      setGameInProgress(false);
    },
    []
  );

  const handlePlayAgain = React.useCallback(() => {
    setGameKey((k) => k + 1);
    setEndState({ isComplete: false, isWon: false, mistakes: 0 });
    setGameInProgress(false);
  }, []);

  return (
    <GameShell
      gameName="Synonym Spiral"
      gameSlug="synonym-spiral"
      puzzleNumber={puzzle.number}
      language={puzzle.language}
      isComplete={endState.isComplete}
      isWon={endState.isWon}
      mistakes={endState.mistakes}
    >
      <HowToPlay gameSlug="synonym-spiral" gameName="Synonym Spiral" />

      {/* Language selector — disabled during active play */}
      <LanguageSelector
        languages={SUPPORTED_SPIRAL_LANGUAGES}
        selected={language}
        onChange={handleLanguageChange}
        disabled={gameInProgress}
      />

      <div onPointerDownCapture={() => !gameInProgress && !endState.isComplete && setGameInProgress(true)}>
        <SynonymSpiralGame
          key={gameKey}
          puzzle={puzzle}
          onGameEnd={handleGameEnd}
          onPlayAgain={handlePlayAgain}
        />
      </div>
    </GameShell>
  );
}
