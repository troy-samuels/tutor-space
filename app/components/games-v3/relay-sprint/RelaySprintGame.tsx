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
import { sfxTick, sfxGo, sfxScoreTick, sfxStar } from "@/lib/games/v3/runtime/phaser/relay-audio";
import SharePanel from "@/components/games-v3/core/SharePanel";
import styles from "./RelaySprintGame.module.css";

const UI_VERSION = "v3-relay-sprint-3";
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

const STREAK_LABELS: Record<number, { text: string; emoji: string }> = {
  3: { text: "NICE!", emoji: "🔥" },
  5: { text: "ON FIRE!", emoji: "⚡" },
  8: { text: "UNSTOPPABLE!", emoji: "💥" },
  12: { text: "LEGENDARY!", emoji: "👑" },
};

function getStarCount(accuracy: number): number {
  if (accuracy >= 90) return 3;
  if (accuracy >= 70) return 2;
  if (accuracy >= 40) return 1;
  return 0;
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
  const [countdownValue, setCountdownValue] = React.useState<number | null>(null);
  const [difficulty, setDifficulty] = React.useState(initialDifficulty);
  const [runId, setRunId] = React.useState("local-boot");
  const [firstMeaningfulActionMs, setFirstMeaningfulActionMs] = React.useState<number | null>(null);
  const [firstCorrectMs, setFirstCorrectMs] = React.useState<number | null>(null);
  const [audioOn, setAudioOn] = React.useState(true);
  const [flashState, setFlashState] = React.useState<"none" | "correct" | "wrong">("none");
  const [finalResult, setFinalResult] = React.useState<GameResult | null>(null);
  const [streakPopup, setStreakPopup] = React.useState<{ text: string; emoji: string } | null>(null);
  const [showConfetti, setShowConfetti] = React.useState(false);
  const [revealedStars, setRevealedStars] = React.useState(0);
  const [countingScore, setCountingScore] = React.useState(0);
  const [resultReady, setResultReady] = React.useState(false);
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

  // ── Clear flash ──
  React.useEffect(() => {
    if (flashState === "none") return;
    const timer = setTimeout(() => setFlashState("none"), 450);
    return () => clearTimeout(timer);
  }, [flashState]);

  // ── Streak popup auto-dismiss ──
  React.useEffect(() => {
    if (!streakPopup) return;
    const timer = setTimeout(() => setStreakPopup(null), 1400);
    return () => clearTimeout(timer);
  }, [streakPopup]);

  // ── Results ceremony: score counting + star reveal ──
  React.useEffect(() => {
    if (stage !== "summary" || !finalResult) return;

    // Count up score
    const targetScore = finalResult.score;
    let current = 0;
    const scoreInterval = setInterval(() => {
      current++;
      if (audioOn) sfxScoreTick();
      setCountingScore(current);
      if (current >= targetScore) {
        clearInterval(scoreInterval);
        // Reveal stars after score finishes
        const stars = getStarCount(finalResult.accuracy);
        let revealed = 0;
        const starInterval = setInterval(() => {
          revealed++;
          if (audioOn) sfxStar();
          haptic("tap");
          setRevealedStars(revealed);
          if (revealed >= stars) {
            clearInterval(starInterval);
            setResultReady(true);
            // Confetti on good performance
            if (finalResult.accuracy >= 70) {
              setShowConfetti(true);
            }
          }
        }, 350);
      }
    }, 60);

    return () => clearInterval(scoreInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, finalResult]);

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
  const handleStartTap = React.useCallback(() => {
    if (countdownValue !== null) return;
    haptic("tap");
    setCountdownValue(3);
  }, [countdownValue]);

  React.useEffect(() => {
    if (countdownValue === null || stage !== "countdown") return;
    if (countdownValue <= 0) {
      if (audioOn) sfxGo();
      haptic("success");
      setStage("active");
      return;
    }
    const timer = setTimeout(() => {
      if (audioOn) sfxTick();
      haptic("tap");
      setCountdownValue(countdownValue - 1);
    }, 700);
    return () => clearTimeout(timer);
  }, [audioOn, countdownValue, stage]);

  // ── Streak milestone callback ──
  const handleStreakMilestone = React.useCallback((streak: number) => {
    const label = STREAK_LABELS[streak];
    if (label) {
      setStreakPopup(label);
      haptic("success");
    }
  }, []);

  // ── Phaser scene factory ──
  const sceneFactory = React.useCallback(
    (Phaser: typeof import("phaser")) =>
      createRelaySprintScene(Phaser, {
        puzzle,
        width: 360,
        height: 520,
        audioEnabled: audioOn,
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
        onStreakMilestone: handleStreakMilestone,
        onComplete: handleComplete,
      }),
    [audioOn, firstCorrectMs, firstMeaningfulActionMs, handleComplete, handleStreakMilestone, puzzle],
  );

  // ── Helpers ──
  function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  const speedLevel = hud.speedMs < 1800 ? "fast" : hud.speedMs < 2200 ? "medium" : "normal";

  // ═══ COUNTDOWN ═══
  if (stage === "countdown") {
    return (
      <div className={styles.arena}>
        <div className={styles.countdown}>
          {countdownValue === null ? (
            <>
              <div className={styles.onboarding}>
                <div className={styles.onboardingDemo}>
                  <div className={styles.demoWord}>hello</div>
                  <div className={styles.demoArrow}>↓</div>
                  <div className={styles.demoCatchers}>
                    <div className={styles.demoCatcher}>hola</div>
                    <div className={styles.demoCatcher} data-wrong="true">casa</div>
                    <div className={styles.demoCatcher} data-wrong="true">gato</div>
                  </div>
                  <div className={styles.demoHand}>👆</div>
                </div>
                <h2 className={styles.onboardingTitle}>Catch the Translation</h2>
                <p className={styles.onboardingDesc}>
                  Words fall — tap the correct translation before they hit the floor. Miss 3 and it&apos;s game over.
                </p>
                <div className={styles.onboardingTips}>
                  <span className={styles.tip}>🔥 Build combos for bonus points</span>
                  <span className={styles.tip}>⚡ Speed increases as you progress</span>
                </div>
              </div>
              <button
                type="button"
                className={styles.playButton}
                onPointerDown={handleStartTap}
              >
                <span className={styles.playButtonText}>TAP TO PLAY</span>
                <span className={styles.playButtonGlow} />
              </button>
            </>
          ) : (
            <div className={styles.countdownTimer}>
              <p className={styles.countdownNumber} key={countdownValue}>
                {countdownValue > 0 ? countdownValue : "GO!"}
              </p>
              <div className={styles.countdownRing} key={`ring-${countdownValue}`} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══ RESULTS ═══
  if (stage === "summary" && finalResult) {
    const stars = getStarCount(finalResult.accuracy);
    return (
      <div className={styles.arena}>
        {showConfetti && <div className={styles.confettiContainer} aria-hidden="true">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className={styles.confettiPiece}
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${1.5 + Math.random() * 1.5}s`,
                backgroundColor: ["#f0a030", "#3da672", "#e85d4a", "#5090d0", "#d050d0"][i % 5],
              }}
            />
          ))}
        </div>}

        <div className={styles.results}>
          {/* Stars */}
          <div className={styles.starsRow}>
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className={styles.star}
                data-earned={n <= revealedStars ? "true" : "false"}
                data-possible={n <= stars ? "true" : "false"}
              >
                ★
              </div>
            ))}
          </div>

          {/* Header */}
          <div className={styles.resultsHeader}>
            <h2 className={styles.resultsTitle}>
              {hud.lives <= 0
                ? "Game Over"
                : finalResult.accuracy >= 90
                  ? "Perfect Run!"
                  : finalResult.accuracy >= 70
                    ? "Great Work!"
                    : "Run Complete"}
            </h2>
            <p className={styles.resultsSubtitle}>{copy.progress}</p>
          </div>

          {/* Big score */}
          <div className={styles.bigScore}>
            <span className={styles.bigScoreLabel}>SCORE</span>
            <span className={styles.bigScoreValue}>{countingScore}</span>
          </div>

          {/* Stats grid */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Accuracy</p>
              <p className={styles.statValue} data-accent={finalResult.accuracy >= 70 ? "green" : "coral"}>
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
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Mistakes</p>
              <p className={styles.statValue} data-accent={finalResult.mistakes <= 1 ? "green" : "coral"}>
                {finalResult.mistakes}
              </p>
            </div>
          </div>

          {resultReady && (
            <div className={styles.resultsActions}>
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
          )}
        </div>
      </div>
    );
  }

  // ═══ ACTIVE GAME ═══
  return (
    <div className={styles.arena} data-danger={hud.lives <= 1 ? "true" : "false"}>
      {/* Streak popup overlay */}
      {streakPopup && (
        <div className={styles.streakPopup} key={streakPopup.text}>
          <span className={styles.streakPopupEmoji}>{streakPopup.emoji}</span>
          <span className={styles.streakPopupText}>{streakPopup.text}</span>
        </div>
      )}

      {/* HUD */}
      <div className={styles.hud}>
        <div className={styles.hudLeft}>
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
            <span className={styles.hudValue} data-bumped={hud.feedback === "correct" ? "true" : "false"}>
              {hud.score}
            </span>
          </div>
        </div>

        <div className={styles.hudRight}>
          {/* Combo badge (visible at 2+) */}
          {hud.streak >= 2 && (
            <div className={styles.comboBadge} data-hot={hud.streak >= 5 ? "true" : "false"}>
              <span className={styles.comboFire}>🔥</span>
              <span className={styles.comboValue}>{hud.streak}×</span>
            </div>
          )}
          <div className={styles.hudStat}>
            <span className={styles.hudLabel}>Wave</span>
            <span className={styles.hudValue}>
              {hud.waveIndex + 1}/{puzzle.waves.length}
            </span>
          </div>
          <div
            className={styles.speedBadge}
            data-level={speedLevel}
          >
            {speedLevel === "fast" ? "⚡" : speedLevel === "medium" ? "🔶" : "🔷"}
          </div>
        </div>
      </div>

      {/* Phaser Canvas */}
      <div
        className={styles.viewport}
        data-flash={flashState}
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
