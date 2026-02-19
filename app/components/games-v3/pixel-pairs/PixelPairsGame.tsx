"use client";

import * as React from "react";
import { haptic } from "@/lib/games/haptics";
import { recordDailyProgress } from "@/lib/games/progress";
import { startGameRun, completeGameRun } from "@/lib/games/runtime/run-lifecycle";
import type { DifficultyTier } from "@/lib/games/runtime/types";
import { getCopy } from "@/lib/games/v3/copy";
import { getPixelPairsPuzzle } from "@/lib/games/v3/data/pixel-pairs";
import {
  getBaselineDifficulty,
  updateDifficulty,
  type CefrLevel,
} from "@/lib/games/v3/adaptation/engine";
import { computeCognitiveGovernor } from "@/lib/games/v3/adaptation/cognitive-governor";
import SharePanel from "@/components/games-v3/core/SharePanel";
import styles from "./PixelPairsGame.module.css";

const UI_VERSION = "v3-pixel-pairs-2";
const CURVE_VERSION = "v3-gentle-ramp-1";
const SHARE_CARD_VERSION = "v3-share-1";

const MISMATCH_DELAY_MS = 800;
const MATCH_DELAY_MS = 400;

interface PixelPairsGameProps {
  language: "en" | "es";
  mode: "daily" | "practice";
  cefr?: CefrLevel | null;
  challengeCode?: string | null;
  challengeSeed?: number | null;
  challengeDifficulty?: number | null;
}

type Stage = "countdown" | "active" | "summary";
type CardState = "facedown" | "selected" | "matched" | "mismatched";

interface CardData {
  id: string;
  value: string;
  pairId: string;
  kind: "left" | "right";
  state: CardState;
}

export default function PixelPairsGame({
  language,
  mode,
  cefr = "A2",
  challengeCode = null,
  challengeSeed = null,
  challengeDifficulty = null,
}: PixelPairsGameProps) {
  const copy = React.useMemo(() => getCopy(language), [language]);
  const puzzle = React.useMemo(
    () => getPixelPairsPuzzle(language, challengeSeed),
    [challengeSeed, language],
  );
  const initialDifficulty = React.useMemo(
    () => challengeDifficulty ?? getBaselineDifficulty(cefr),
    [cefr, challengeDifficulty],
  );

  const pairCount = puzzle.pairCount;
  const totalPairs = pairCount;

  // Grid layout: determine columns based on pair count
  const gridCols = React.useMemo(() => {
    if (pairCount <= 6) return 3; // 3×4
    if (pairCount <= 8) return 4; // 4×4
    return 4; // 4×5
  }, [pairCount]);

  const [stage, setStage] = React.useState<Stage>("countdown");
  const [countdownProgress, setCountdownProgress] = React.useState(0);
  const [cards, setCards] = React.useState<CardData[]>(() =>
    puzzle.tiles.map((tile) => ({
      ...tile,
      state: "facedown" as CardState,
    })),
  );
  const [moveCount, setMoveCount] = React.useState(0);
  const [matchedCount, setMatchedCount] = React.useState(0);
  const [streak, setStreak] = React.useState(0);
  const [difficulty, setDifficulty] = React.useState(initialDifficulty);
  const [runId, setRunId] = React.useState("local-boot");
  const [firstMeaningfulActionMs, setFirstMeaningfulActionMs] = React.useState<number | null>(null);
  const [firstCorrectMs, setFirstCorrectMs] = React.useState<number | null>(null);
  const [elapsed, setElapsed] = React.useState(0);
  const [boardReady, setBoardReady] = React.useState(false);

  const startedAtRef = React.useRef<number>(Date.now());
  const resolvedRef = React.useRef(false);
  const lockRef = React.useRef(false);
  const selectedRef = React.useRef<string[]>([]);

  const governor = computeCognitiveGovernor({
    recentErrors: Math.max(0, Math.floor((totalPairs - matchedCount) / 3)),
    recentAvgResponseMs: 1700,
    streak,
  });

  // ── Difficulty sync ──
  React.useEffect(() => {
    setDifficulty(initialDifficulty);
  }, [initialDifficulty]);

  // ── Board appearance animation ──
  React.useEffect(() => {
    if (stage === "active" && !boardReady) {
      const timer = setTimeout(() => setBoardReady(true), 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [stage, boardReady]);

  // ── Timer ──
  React.useEffect(() => {
    if (stage !== "active") return;
    const interval = setInterval(() => {
      setElapsed(Date.now() - startedAtRef.current);
    }, 1000);
    return () => clearInterval(interval);
  }, [stage]);

  // ── Start game run telemetry ──
  React.useEffect(() => {
    startedAtRef.current = Date.now();
    void startGameRun({
      gameSlug: "pixel-pairs",
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

  // ── Complete game run on summary ──
  React.useEffect(() => {
    if (stage !== "summary" || resolvedRef.current) return;
    resolvedRef.current = true;

    const elapsedMs = Date.now() - startedAtRef.current;
    const accuracy = Math.round((matchedCount / totalPairs) * 100);

    recordDailyProgress("pixel-pairs", accuracy >= 70);

    void completeGameRun({
      runId,
      score: matchedCount,
      maxScore: totalPairs,
      accuracy,
      timeMs: elapsedMs,
      mistakes: Math.max(0, moveCount - matchedCount),
      maxCombo: streak,
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
      shareCardVersion: SHARE_CARD_VERSION,
      challengeCode: challengeCode ?? undefined,
      metadata: {
        seed: puzzle.seed,
        puzzleNumber: puzzle.puzzleNumber,
        language,
        mode,
        challengeCode,
        pairCount,
        moveCount,
      },
    }).catch(() => {});
  }, [cefr, challengeCode, difficulty, firstCorrectMs, firstMeaningfulActionMs, governor.state, initialDifficulty, language, matchedCount, mode, moveCount, pairCount, puzzle.puzzleNumber, puzzle.seed, runId, stage, streak, totalPairs]);

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

  // ── Card tap handler ──
  const handleCardTap = React.useCallback(
    (cardId: string) => {
      if (stage !== "active") return;
      if (lockRef.current) return;

      const card = cards.find((c) => c.id === cardId);
      if (!card) return;
      if (card.state === "matched" || card.state === "selected") return;

      const now = Date.now();
      if (firstMeaningfulActionMs === null) {
        setFirstMeaningfulActionMs(now - startedAtRef.current);
      }

      // Flip card face-up
      const nextCards = cards.map((c) =>
        c.id === cardId ? { ...c, state: "selected" as CardState } : c,
      );
      setCards(nextCards);

      const selected = [...selectedRef.current, cardId];
      selectedRef.current = selected;

      if (selected.length < 2) return;

      // Two cards selected — check for match
      lockRef.current = true;
      setMoveCount((prev) => prev + 1);

      const [firstId, secondId] = selected;
      const first = nextCards.find((c) => c.id === firstId);
      const second = nextCards.find((c) => c.id === secondId);

      const isMatch =
        first &&
        second &&
        first.pairId === second.pairId &&
        first.kind !== second.kind;

      if (isMatch) {
        haptic("success");

        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === firstId || c.id === secondId
                ? { ...c, state: "matched" as CardState }
                : c,
            ),
          );

          const newMatched = matchedCount + 1;
          setMatchedCount(newMatched);
          setStreak((prev) => prev + 1);

          setDifficulty((prev) =>
            updateDifficulty({
              currentDifficulty: prev,
              responseMs: 1450,
              isCorrect: true,
              streak: streak + 1,
            }).nextDifficulty,
          );

          if (firstCorrectMs === null) {
            setFirstCorrectMs(now - startedAtRef.current);
          }

          selectedRef.current = [];
          lockRef.current = false;

          // Check win
          if (newMatched >= totalPairs) {
            setTimeout(() => setStage("summary"), 300);
          }
        }, MATCH_DELAY_MS);
      } else {
        haptic("error");
        setStreak(0);

        // Mark as mismatched briefly
        setCards((prev) =>
          prev.map((c) =>
            c.id === firstId || c.id === secondId
              ? { ...c, state: "mismatched" as CardState }
              : c,
          ),
        );

        setDifficulty((prev) =>
          updateDifficulty({
            currentDifficulty: prev,
            responseMs: 2300,
            isCorrect: false,
            streak: 0,
          }).nextDifficulty,
        );

        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === firstId || c.id === secondId
                ? { ...c, state: "facedown" as CardState }
                : c,
            ),
          );
          selectedRef.current = [];
          lockRef.current = false;
        }, MISMATCH_DELAY_MS);
      }
    },
    [cards, firstCorrectMs, firstMeaningfulActionMs, matchedCount, stage, streak, totalPairs],
  );

  // ── Results helpers ──
  function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function getStarCount(): number {
    // Stars based on move efficiency
    const optimal = totalPairs; // perfect memory = pairCount moves
    const ratio = moveCount / Math.max(1, optimal);
    if (ratio <= 1.3) return 3;
    if (ratio <= 2.0) return 2;
    return 1;
  }

  // ═══ RENDER ═══

  // Countdown
  if (stage === "countdown") {
    return (
      <div className={styles.arena}>
        <div className={styles.countdown}>
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
          <p className={styles.countdownHint}>{copy.loadingAction}</p>
        </div>
      </div>
    );
  }

  // Results
  if (stage === "summary") {
    const starCount = getStarCount();
    const totalElapsed = Date.now() - startedAtRef.current;

    return (
      <div className={styles.arena}>
        <div className={styles.results}>
          <div className={styles.resultsHeader}>
            <p className={styles.resultsEmoji}>
              {starCount === 3 ? "🧠" : starCount === 2 ? "👏" : "💪"}
            </p>
            <h2 className={styles.resultsTitle}>
              {starCount === 3
                ? "Perfect Memory!"
                : starCount === 2
                  ? "Sharp recall!"
                  : "All pairs found!"}
            </h2>
            <p className={styles.resultsSubtitle}>{copy.progress}</p>

            {/* Stars */}
            <div className={styles.stars}>
              {[1, 2, 3].map((n) => (
                <span
                  key={n}
                  className={styles.star}
                  data-earned={n <= starCount ? "true" : "false"}
                >
                  ⭐
                </span>
              ))}
            </div>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Moves</p>
              <p className={styles.statValue}>{moveCount}</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Time</p>
              <p className={styles.statValue}>{formatTime(totalElapsed)}</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Pairs</p>
              <p className={styles.statValue}>{matchedCount}/{totalPairs}</p>
            </div>
          </div>

          <SharePanel
            gameSlug="pixel-pairs"
            seed={puzzle.seed}
            mode={mode}
            score={matchedCount}
            streak={streak}
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
    <div className={styles.arena} style={{ opacity: governor.decorOpacity }}>
      {/* HUD */}
      <div className={styles.hud}>
        <div className={styles.hudStat}>
          <span className={styles.hudLabel}>Moves</span>
          <span className={styles.hudValue}>{moveCount}</span>
        </div>
        <div className={styles.hudDivider} />
        <div className={styles.hudStat}>
          <span className={styles.hudLabel}>Pairs</span>
          <span className={styles.hudValue}>
            {matchedCount}/{totalPairs}
          </span>
        </div>
        <div className={styles.hudDivider} />
        <div className={styles.hudStat}>
          <span className={styles.hudLabel}>Time</span>
          <span className={styles.hudValue}>{formatTime(elapsed)}</span>
        </div>
      </div>

      {/* Pairs Progress Dots */}
      <div className={styles.pairsTrack}>
        {Array.from({ length: totalPairs }, (_, i) => (
          <div
            key={i}
            className={styles.pairDot}
            data-found={i < matchedCount ? "true" : "false"}
          />
        ))}
      </div>

      {/* Card Grid */}
      <div
        className={`${styles.board} ${boardReady ? styles.boardEntry : ""}`}
        data-cols={gridCols}
      >
        {cards.map((card) => {
          const isFlipped = card.state !== "facedown";

          return (
            <div
              key={card.id}
              className={styles.card}
              data-flipped={isFlipped ? "true" : "false"}
              data-state={card.state}
              onPointerDown={() => handleCardTap(card.id)}
              style={{ touchAction: "none" }}
            >
              {/* Back (face-down) */}
              <div className={`${styles.cardFace} ${styles.cardBack}`} />

              {/* Front (revealed) */}
              <div className={`${styles.cardFace} ${styles.cardFront}`}>
                {card.value}
              </div>
            </div>
          );
        })}
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
