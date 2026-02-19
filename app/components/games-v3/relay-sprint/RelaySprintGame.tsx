"use client";

import * as React from "react";
import { haptic } from "@/lib/games/haptics";
import { recordDailyProgress } from "@/lib/games/progress";
import { startGameRun, completeGameRun } from "@/lib/games/runtime/run-lifecycle";
import type { DifficultyTier } from "@/lib/games/runtime/types";
import PhaserHost from "@/components/games/runtime/PhaserHost";
import { getCopy } from "@/lib/games/v3/copy";
import { getRelaySprintPuzzle } from "@/lib/games/v3/data/relay-sprint";
import {
  getBaselineDifficulty,
  updateDifficulty,
  type CefrLevel,
} from "@/lib/games/v3/adaptation/engine";
import { computeCognitiveGovernor } from "@/lib/games/v3/adaptation/cognitive-governor";
import {
  createRelaySprintScene,
  type RelayHudState,
} from "@/lib/games/v3/runtime/phaser/relay-sprint-scene";
import SharePanel from "@/components/games-v3/core/SharePanel";
import styles from "./RelaySprintGame.module.css";

const UI_VERSION = "v3-relay-sprint-2";
const CURVE_VERSION = "v3-gentle-ramp-1";
const SHARE_CARD_VERSION = "v3-share-1";

interface RelaySprintGameProps {
  language: "en" | "es";
  mode: "daily" | "practice";
  cefr?: CefrLevel | null;
  challengeCode?: string | null;
  challengeSeed?: number | null;
  challengeDifficulty?: number | null;
}

type Stage = "countdown" | "active" | "summary";

interface GameResult {
  score: number;
  mistakes: number;
  maxCombo: number;
  accuracy: number;
  timeMs: number;
}

export default function RelaySprintGame({
  language,
  mode,
  cefr = "A2",
  challengeCode = null,
  challengeSeed = null,
  challengeDifficulty = null,
}: RelaySprintGameProps) {
  const copy = React.useMemo(() => getCopy(language), [language]);
  const puzzle = React.useMemo(
    () => getRelaySprintPuzzle(language, challengeSeed),
    [challengeSeed, language],
  );
  const initialDifficulty = React.useMemo(
    () => challengeDifficulty ?? getBaselineDifficulty(cefr),
    [cefr, challengeDifficulty],
  );

  const [stage, setStage] = React.useState<Stage>("countdown");
  const [countdownProgress, setCountdownProgress] = React.useState(0);
  const [difficulty, setDifficulty] = React.useState(initialDifficulty);
  const [runId, setRunId] = React.useState("local-boot");
  const [firstMeaningfulActionMs, setFirstMeaningfulActionMs] = React.useState<number | null>(null);
  const [firstCorrectMs, setFirstCorrectMs] = React.useState<number | null>(null);
  const [audioOn, setAudioOn] = React.useState(true);
  const [flashState, setFlashState] = React.useState<"none" | "correct" | "wrong">("none");
  const [finalResult, setFinalResult] = React.useState<GameResult | null>(null);
  const [hud, setHud] = React.useState<RelayHudState>({
    score: 0,
    streak: 0,
    lives: 3,
    clue: puzzle.waves[0]?.clue ?? "",
    waveIndex: 0,
    speedMs: 2600,
    feedback: "idle",
  });

  const startedAtRef = React.useRef(Date.now());
  const resolvedRef = React.useRef(false);

  const governor = computeCognitiveGovernor({
    recentErrors: Math.max(0, 3 - hud.lives),
    recentAvgResponseMs: hud.speedMs,
    streak: hud.streak,
  });

  // ── Difficulty sync ──
  React.useEffect(() => {
    setDifficulty(initialDifficulty);
  }, [initialDifficulty]);

  // ── Start game run telemetry ──
  React.useEffect(() => {
    startedAtRef.current = Date.now();
    void startGameRun({
      gameSlug: "relay-sprint",
      mode,
      language,
      deviceClass: "mobile",
      gameVersion: "v3",
      startingCefr: cefr,
      calibratedDifficulty: initialDifficulty,
      challengeCode: challengeCode ?? undefined,
      uiVersion: UI_VERSION,
    })
      .then((response) => setRunId(response.runId))
      .catch(() => setRunId(`local-${crypto.randomUUID()}`));
  }, [cefr, challengeCode, initialDifficulty, language, mode]);

  // ── Feedback flash + difficulty updates ──
  React.useEffect(() => {
    if (hud.feedback === "correct") {
      haptic("success");
      setFlashState("correct");
      setDifficulty((prev) =>
        updateDifficulty({
          currentDifficulty: prev,
          responseMs: Math.round(hud.speedMs),
          isCorrect: true,
          streak: hud.streak,
        }).nextDifficulty,
      );
    } else if (hud.feedback === "wrong" || hud.feedback === "timeout") {
      haptic("error");
      setFlashState("wrong");
      setDifficulty((prev) =>
        updateDifficulty({
          currentDifficulty: prev,
          responseMs: Math.round(hud.speedMs + 350),
          isCorrect: false,
          streak: 0,
        }).nextDifficulty,
      );
    }
  }, [hud.feedback, hud.speedMs, hud.streak]);

  // ── Clear flash after animation ──
  React.useEffect(() => {
    if (flashState === "none") return;
    const timer = setTimeout(() => setFlashState("none"), 450);
    return () => clearTimeout(timer);
  }, [flashState]);

  // ── Game complete handler ──
  const handleComplete = React.useCallback(
    (result: GameResult) => {
      if (resolvedRef.current) return;
      resolvedRef.current = true;

      setFinalResult(result);
      recordDailyProgress("relay-sprint", result.accuracy >= 70);
      setStage("summary");

      void completeGameRun({
        runId,
        score: result.score,
        maxScore: puzzle.waves.length,
        accuracy: result.accuracy,
        timeMs: result.timeMs,
        mistakes: result.mistakes,
        maxCombo: result.maxCombo,
        falseFriendHits: 0,
        firstCorrectMs,
        startingCefr: cefr,
        firstMeaningfulActionMs,
        replayed: false,
        tierReached: resolveTier(difficulty),
        curveVersion: CURVE_VERSION,
        uiVersion: UI_VERSION,
        gameVersion: "v3",
        calibratedDifficulty: difficulty,
        difficultyDelta: difficulty - initialDifficulty,
        cognitiveLoadState: governor.state,
        ahaSpike: result.accuracy >= 90,
        shareCardVersion: SHARE_CARD_VERSION,
        challengeCode: challengeCode ?? undefined,
        metadata: {
          seed: puzzle.seed,
          puzzleNumber: puzzle.puzzleNumber,
          language,
          mode,
          challengeCode,
        },
      }).catch(() => {});
    },
    [cefr, challengeCode, difficulty, firstCorrectMs, firstMeaningfulActionMs, governor.state, initialDifficulty, language, mode, puzzle.puzzleNumber, puzzle.seed, puzzle.waves.length, runId],
  );

  // ── Countdown ──
  const handleCountdownTap = React.useCallback(
    (value: number) => {
      const expected = 3 - countdownProgress;
      if (value !== expected) {
        haptic("error");
        return;
      }

      haptic("tap");
      const next = countdownProgress + 1;
      setCountdownProgress(next);
      if (next >= 3) {
        setStage("active");
      }
    },
    [countdownProgress],
  );

  // ── Phaser scene factory ──
  const sceneFactory = React.useCallback(
    (Phaser: typeof import("phaser")) =>
      createRelaySprintScene(Phaser, {
        puzzle,
        width: 360,
        height: 520,
        onHud: setHud,
        onMeaningfulAction: (ms) => {
          if (firstMeaningfulActionMs === null) {
            setFirstMeaningfulActionMs(ms);
          }
        },
        onFirstCorrect: (ms) => {
          if (firstCorrectMs === null) {
            setFirstCorrectMs(ms);
          }
        },
        onComplete: handleComplete,
      }),
    [firstCorrectMs, firstMeaningfulActionMs, handleComplete, puzzle],
  );

  // ── Helpers ──
  function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  const speedLevel = hud.speedMs < 1800 ? "fast" : hud.speedMs < 2200 ? "medium" : "normal";

  // ═══ RENDER ═══

  // Countdown — dark arcade theme
  if (stage === "countdown") {
    return (
      <div className={styles.arena}>
        <div className={styles.countdown}>
          <div className={styles.countdownBrief}>
            <p className={styles.briefIcon}>🎯</p>
            <p className={styles.briefTitle}>Intercept the word</p>
            <p className={styles.briefDesc}>A word drops down the screen — tap the correct translation from three lanes before it reaches the bottom. 3 lives. Speed increases.</p>
          </div>
          <div className={styles.countdownNumbers}>
            {[3, 2, 1].map((value) => (
              <button
                key={value}
                type="button"
                className={styles.countdownButton}
                data-tapped={countdownProgress >= 4 - value ? "true" : "false"}
                onPointerDown={() => handleCountdownTap(value)}
                aria-label={`Tap ${value} to start`}
              >
                {value}
              </button>
            ))}
          </div>
          <p className={styles.countdownHint}>Tap 3 → 2 → 1 to begin</p>
        </div>
      </div>
    );
  }

  // Game Over / Results — arcade aesthetic
  if (stage === "summary" && finalResult) {
    return (
      <div className={styles.arena}>
        <div className={styles.results}>
          <div className={styles.resultsHeader}>
            <p className={styles.resultsEmoji}>
              {finalResult.accuracy >= 80 ? "⚡" : finalResult.accuracy >= 50 ? "🎯" : "💀"}
            </p>
            <h2 className={styles.resultsTitle}>
              {hud.lives <= 0
                ? "Game Over"
                : finalResult.accuracy >= 80
                  ? "Lightning Fast!"
                  : "Run Complete"}
            </h2>
            <p className={styles.resultsSubtitle}>{copy.progress}</p>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Score</p>
              <p className={styles.statValue} data-accent="amber">
                {finalResult.score}
              </p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Accuracy</p>
              <p className={styles.statValue} data-accent="green">
                {finalResult.accuracy}%
              </p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Best Combo</p>
              <p className={styles.statValue}>
                {finalResult.maxCombo}×
              </p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Time</p>
              <p className={styles.statValue}>
                {formatTime(finalResult.timeMs)}
              </p>
            </div>
          </div>

          <SharePanel
            gameSlug="relay-sprint"
            seed={puzzle.seed}
            mode={mode}
            score={hud.score}
            streak={hud.streak}
            difficultyBand={difficulty}
            locale={language}
            shareWin={copy.shareWin}
            shareStumble={copy.shareStumble}
            uiVersion={UI_VERSION}
            curveVersion={CURVE_VERSION}
          />

          <button
            type="button"
            className={styles.playAgainBtn}
            onPointerDown={() => location.reload()}
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  // Active game
  return (
    <div className={styles.arena}>
      {/* HUD */}
      <div className={styles.hud}>
        <div className={styles.hudLeft}>
          {/* Lives as hearts */}
          <div className={styles.lives}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={styles.heart}
                data-lost={i >= hud.lives ? "true" : "false"}
              >
                ❤️
              </span>
            ))}
          </div>
          <div className={styles.hudDivider} />
          <div className={styles.hudStat}>
            <span className={styles.hudLabel}>Score</span>
            <span className={styles.hudValue}>{hud.score}</span>
          </div>
        </div>

        <div className={styles.hudRight}>
          <div className={styles.hudStat}>
            <span className={styles.hudLabel}>Wave</span>
            <span className={styles.hudValue}>
              {hud.waveIndex + 1}/{puzzle.waves.length}
            </span>
          </div>
          <div
            className={styles.speedIndicator}
            data-fast={speedLevel === "fast" ? "true" : "false"}
          >
            <span className={styles.speedLabel}>
              {speedLevel === "fast" ? "⚡ FAST" : speedLevel === "medium" ? "🔶 MED" : "🔷 STD"}
            </span>
          </div>
        </div>
      </div>

      {/* Streak */}
      <div className={styles.streakBar} data-active={hud.streak >= 2 ? "true" : "false"}>
        <span className={styles.streakEmoji}>🔥</span>
        <span className={styles.streakText}>{hud.streak}× combo</span>
      </div>

      {/* Phaser Canvas — dominant, with flash overlay */}
      <div
        className={styles.viewport}
        data-flash={flashState}
        style={{
          filter: audioOn ? `brightness(${governor.audioLowPass})` : "none",
          opacity: governor.decorOpacity,
        }}
      >
        <button
          type="button"
          className={styles.audioToggle}
          onPointerDown={() => setAudioOn((prev) => !prev)}
          aria-label={audioOn ? "Mute audio" : "Enable audio"}
        >
          {audioOn ? "🔊" : "🔇"}
        </button>
        <PhaserHost
          sceneFactory={sceneFactory}
          sceneKey={`${puzzle.seed}-${mode}`}
          width={360}
          height={520}
        />
      </div>
    </div>
  );
}

function resolveTier(difficulty: number): DifficultyTier {
  if (difficulty < 35) return "onboarding";
  if (difficulty < 60) return "foundation";
  if (difficulty < 82) return "pressure";
  return "mastery";
}
