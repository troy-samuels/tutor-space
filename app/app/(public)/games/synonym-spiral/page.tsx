"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import GameShell from "@/components/games/engine/GameShell";
import SynonymSpiralGame from "@/components/games/synonym-spiral/SynonymSpiralGame";
import { getDailySeed, getPuzzleNumber } from "@/lib/games/daily-seed";
import { PUZZLES_ES } from "@/lib/games/data/synonym-spiral/puzzles-es";
import { PUZZLES_FR } from "@/lib/games/data/synonym-spiral/puzzles-fr";
import { PUZZLES_DE } from "@/lib/games/data/synonym-spiral/puzzles-de";
import { SUPPORTED_SPIRAL_LANGUAGES } from "@/lib/games/data/synonym-spiral";
import type { SynonymSpiralPuzzle } from "@/lib/games/data/synonym-spiral/types";

const ALL_PUZZLES: Record<string, SynonymSpiralPuzzle[]> = {
  es: PUZZLES_ES,
  fr: PUZZLES_FR,
  de: PUZZLES_DE,
};

function getPuzzleForLanguage(lang: string): SynonymSpiralPuzzle {
  const puzzles = ALL_PUZZLES[lang] || PUZZLES_ES;
  const seed = getDailySeed("synonym-spiral", lang);
  const puzzleNumber = getPuzzleNumber();
  const index = seed % puzzles.length;
  return { ...puzzles[index], number: puzzleNumber };
}

export default function SynonymSpiralPage() {
  const searchParams = useSearchParams();
  const langParam = searchParams.get("lang");

  const [language, setLanguage] = React.useState(
    langParam && ALL_PUZZLES[langParam] ? langParam : "es"
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

  const handleLanguageChange = React.useCallback((newLang: string) => {
    setLanguage(newLang);
    setPuzzle(getPuzzleForLanguage(newLang));
    setGameKey((k) => k + 1);
    setEndState({ isComplete: false, isWon: false, mistakes: 0 });
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
    },
    []
  );

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
      {/* Language selector */}
      <div className="mb-4 flex justify-center gap-1.5 flex-wrap">
        {SUPPORTED_SPIRAL_LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`rounded-full px-3 py-2 text-sm font-medium transition-all min-h-[44px] touch-manipulation ${
              language === lang.code
                ? "bg-primary text-primary-foreground shadow-lg"
                : "bg-white/[0.05] text-muted-foreground hover:bg-white/[0.1]"
            }`}
          >
            {lang.flag} {lang.name}
          </button>
        ))}
      </div>

      <SynonymSpiralGame
        key={gameKey}
        puzzle={puzzle}
        onGameEnd={handleGameEnd}
      />
    </GameShell>
  );
}
