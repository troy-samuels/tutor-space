"use client";

import * as React from "react";
import GameShell from "@/components/games/engine/GameShell";
import ConnectionsGame from "@/components/games/connections/ConnectionsGame";
import { getDailySeed, getPuzzleNumber } from "@/lib/games/daily-seed";
import { PUZZLES_ES } from "@/lib/games/data/connections/puzzles-es";
import type { ConnectionsPuzzle, ConnectionsGameState } from "@/lib/games/data/connections/types";

function getTodaysPuzzle(): ConnectionsPuzzle {
  const seed = getDailySeed("connections", "es");
  const puzzleNumber = getPuzzleNumber();
  const index = seed % PUZZLES_ES.length;
  const puzzle = PUZZLES_ES[index];
  return { ...puzzle, number: puzzleNumber };
}

export default function ConnectionsPage() {
  const [puzzle] = React.useState<ConnectionsPuzzle>(() => getTodaysPuzzle());
  const [endState, setEndState] = React.useState<{
    isComplete: boolean;
    isWon: boolean;
    mistakes: number;
  }>({ isComplete: false, isWon: false, mistakes: 0 });

  const handleGameEnd = React.useCallback((state: ConnectionsGameState) => {
    setEndState({
      isComplete: state.isComplete,
      isWon: state.isWon,
      mistakes: state.mistakes,
    });
  }, []);

  return (
    <GameShell
      gameName="Lingua Connections"
      puzzleNumber={puzzle.number}
      language={puzzle.language}
      isComplete={endState.isComplete}
      isWon={endState.isWon}
      mistakes={endState.mistakes}
    >
      <ConnectionsGame puzzle={puzzle} onGameEnd={handleGameEnd} />
    </GameShell>
  );
}
