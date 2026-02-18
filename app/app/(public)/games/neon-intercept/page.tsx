"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import GameShell from "@/components/games/engine/GameShell";
import HowToPlay from "@/components/games/engine/HowToPlay";
import LanguageSelector from "@/components/games/engine/LanguageSelector";
import NeonInterceptGame, { type NeonInterceptEndState } from "@/components/games/neon-intercept/NeonInterceptGame";
import {
  getTodaysPuzzle,
  SUPPORTED_GAME_LANGUAGES,
  type NeonInterceptPuzzle,
} from "@/lib/games/data/neon-intercept";

function safePuzzle(language: string): NeonInterceptPuzzle {
  return getTodaysPuzzle(language) || getTodaysPuzzle("en")!;
}

export default function NeonInterceptPage() {
  const searchParams = useSearchParams();
  const langParam = searchParams.get("lang");

  const [language, setLanguage] = React.useState(
    langParam && SUPPORTED_GAME_LANGUAGES.some((l) => l.code === langParam) ? langParam : "en",
  );
  const [puzzle, setPuzzle] = React.useState<NeonInterceptPuzzle>(() => safePuzzle(language));
  const [gameKey, setGameKey] = React.useState(0);
  const [endState, setEndState] = React.useState<NeonInterceptEndState>({
    isComplete: false,
    isWon: false,
    mistakes: 0,
    score: 0,
    maxCombo: 0,
    falseFriendHits: 0,
  });
  const [gameInProgress, setGameInProgress] = React.useState(false);

  const handleLanguageChange = React.useCallback((newLang: string) => {
    setLanguage(newLang);
    setPuzzle(safePuzzle(newLang));
    setGameKey((k) => k + 1);
    setEndState({
      isComplete: false,
      isWon: false,
      mistakes: 0,
      score: 0,
      maxCombo: 0,
      falseFriendHits: 0,
    });
    setGameInProgress(false);
  }, []);

  const handleGameEnd = React.useCallback((state: NeonInterceptEndState) => {
    setEndState(state);
    setGameInProgress(false);
  }, []);

  const handlePlayAgain = React.useCallback(() => {
    setGameKey((k) => k + 1);
    setEndState({
      isComplete: false,
      isWon: false,
      mistakes: 0,
      score: 0,
      maxCombo: 0,
      falseFriendHits: 0,
    });
    setGameInProgress(false);
  }, []);

  return (
    <GameShell
      gameName="Neon Intercept"
      gameSlug="neon-intercept"
      puzzleNumber={puzzle.number}
      language={puzzle.language}
      isComplete={endState.isComplete}
      isWon={endState.isWon}
      mistakes={endState.mistakes}
    >
      <HowToPlay gameSlug="neon-intercept" gameName="Neon Intercept" />

      <LanguageSelector
        languages={SUPPORTED_GAME_LANGUAGES}
        selected={language}
        onChange={handleLanguageChange}
        disabled={gameInProgress}
      />

      <div onPointerDownCapture={() => !gameInProgress && !endState.isComplete && setGameInProgress(true)}>
        <NeonInterceptGame
          key={gameKey}
          puzzle={puzzle}
          onGameEnd={handleGameEnd}
          onPlayAgain={handlePlayAgain}
        />
      </div>
    </GameShell>
  );
}

