"use client";

import * as React from "react";
import { Fraunces, Manrope } from "next/font/google";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import GameShell from "@/components/games/engine/GameShell";
import NeonInterceptV2Game from "@/components/games/neon-intercept-v2/NeonInterceptV2Game";
import { listModes, parseGameMode } from "@/lib/games/runtime/modes";
import type { GameMode } from "@/lib/games/runtime/types";
import {
  getTodaysPuzzle,
  SUPPORTED_GAME_LANGUAGES,
  type NeonInterceptPuzzle,
} from "@/lib/games/data/neon-intercept";
import styles from "./page.module.css";

const neonDisplay = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--n-font-display",
});

const neonUi = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--n-font-ui-face",
});

interface NeonInterceptEndState {
  isComplete: boolean;
  isWon: boolean;
  mistakes: number;
  score: number;
  maxCombo: number;
  falseFriendHits: number;
}

const MODE_DETAIL_COPY: Record<GameMode, string> = {
  daily: "Balanced seeded run.",
  practice: "Longer learning run.",
  challenge: "Sharper timing windows.",
  ranked: "Competitive precision run.",
};

function safePuzzle(language: string): NeonInterceptPuzzle {
  return getTodaysPuzzle(language) || getTodaysPuzzle("en")!;
}

export default function NeonInterceptPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const langParam = searchParams.get("lang");
  const modeParam = searchParams.get("mode");

  const [language, setLanguage] = React.useState(
    langParam && SUPPORTED_GAME_LANGUAGES.some((l) => l.code === langParam) ? langParam : "en",
  );
  const [mode, setMode] = React.useState<GameMode>(() => parseGameMode(modeParam));
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

  const selectedLanguage = React.useMemo(
    () => SUPPORTED_GAME_LANGUAGES.find((lang) => lang.code === language) ?? SUPPORTED_GAME_LANGUAGES[0],
    [language],
  );

  const updateQuery = React.useCallback(
    (nextLang: string, nextMode: GameMode) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("lang", nextLang);
      params.set("mode", nextMode);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const resetRoundState = React.useCallback(() => {
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

  const handleLanguageChange = React.useCallback((newLang: string) => {
    setLanguage(newLang);
    setPuzzle(safePuzzle(newLang));
    setGameKey((k) => k + 1);
    updateQuery(newLang, mode);
    resetRoundState();
  }, [mode, resetRoundState, updateQuery]);

  const handleModeChange = React.useCallback((nextMode: GameMode) => {
    setMode(nextMode);
    setGameKey((k) => k + 1);
    updateQuery(language, nextMode);
    resetRoundState();
  }, [language, resetRoundState, updateQuery]);

  const handleGameEnd = React.useCallback((state: NeonInterceptEndState) => {
    setEndState(state);
    setGameInProgress(false);
  }, []);

  const handlePlayAgain = React.useCallback(() => {
    setGameKey((k) => k + 1);
    resetRoundState();
  }, [resetRoundState]);

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
      <div className={cn(styles.neonRoot, neonDisplay.variable, neonUi.variable)}>
        <section
          className={cn(styles.setupStrip, gameInProgress && styles.setupStripCompact)}
          data-state={gameInProgress ? "running" : "idle"}
        >
          {!gameInProgress ? (
            <>
              <div className={styles.languageRow} role="tablist" aria-label="Language">
                {SUPPORTED_GAME_LANGUAGES.map((lang) => {
                  const active = language === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      data-active={active ? "true" : "false"}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={styles.languageButton}
                      disabled={gameInProgress}
                    >
                      <span className={styles.languageFlag} aria-hidden>{lang.flag}</span>
                      <span className={styles.languageCode}>{lang.code.toUpperCase()}</span>
                      <span className={styles.languageName}>{lang.name}</span>
                    </button>
                  );
                })}
              </div>

              <div className={styles.modeRow} role="tablist" aria-label="Neon mode">
                {listModes().map((entry) => {
                  const active = entry.mode === mode;
                  return (
                    <button
                      key={entry.mode}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      data-active={active ? "true" : "false"}
                      onClick={() => handleModeChange(entry.mode)}
                      className={styles.modeButton}
                      disabled={gameInProgress}
                    >
                      {entry.label}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className={styles.runningSummary}>
              <span className={styles.runningSummaryItem}>
                <span aria-hidden>{selectedLanguage.flag}</span>
                <span>{selectedLanguage.code.toUpperCase()}</span>
              </span>
              <span className={styles.runningSummaryItem}>
                {listModes().find((entry) => entry.mode === mode)?.label ?? "Daily"}
              </span>
              <span className={styles.runningSummaryItem}>Run Live</span>
            </div>
          )}

          <p className={styles.modeLine}>{MODE_DETAIL_COPY[mode]}</p>
        </section>

        <div
          className={styles.runtimeWrap}
          onPointerDownCapture={() => {
            if (!gameInProgress && !endState.isComplete) {
              setGameInProgress(true);
            }
          }}
        >
          <NeonInterceptV2Game
            key={gameKey}
            puzzle={puzzle}
            mode={mode}
            onGameEnd={handleGameEnd}
            onRunStateChange={(state) => {
              setGameInProgress(state === "running");
            }}
          />
        </div>

        {endState.isComplete && (
          <div className={styles.resetWrap}>
            <button type="button" onClick={handlePlayAgain} className={styles.resetButton}>
              Start New Run
            </button>
          </div>
        )}
      </div>
    </GameShell>
  );
}
