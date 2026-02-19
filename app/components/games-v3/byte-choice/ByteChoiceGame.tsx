"use client";

import * as React from "react";
import { haptic } from "@/lib/games/haptics";
import { recordDailyProgress } from "@/lib/games/progress";
import { startGameRun, completeGameRun } from "@/lib/games/runtime/run-lifecycle";
import type { DifficultyTier } from "@/lib/games/runtime/types";
import { getCopy } from "@/lib/games/v3/copy";
import { getByteChoicePuzzle } from "@/lib/games/v3/data/byte-choice";
import {
  buildSkillTrackDeltas,
  calibrateDifficulty,
  getBaselineDifficulty,
  updateDifficulty,
  type CalibrationSample,
  type CefrLevel,
} from "@/lib/games/v3/adaptation/engine";
import { computeCognitiveGovernor } from "@/lib/games/v3/adaptation/cognitive-governor";
import SharePanel from "@/components/games-v3/core/SharePanel";
import styles from "./ByteChoiceGame.module.css";

type ByteChoiceBand = "A1" | "A2" | "B1" | "B2";

function clampCefrToBand(level: CefrLevel | null | undefined): ByteChoiceBand | null {
  if (!level) return null;
  if (level === "A1" || level === "A2" || level === "B1" || level === "B2") return level;
  // C1/C2 → cap at B2
  return "B2";
}

const UI_VERSION = "v3-byte-choice-2";
const CURVE_VERSION = "v3-gentle-ramp-1";
const SHARE_CARD_VERSION = "v3-share-1";

const TIMER_DURATION_MS = 8000; // 8 seconds per question
const FEEDBACK_CORRECT_MS = 400; // Faster pace when winning
const FEEDBACK_WRONG_MS = 600; // More time to see correct answer

interface ByteChoiceGameProps {
  language: "en" | "es";
  mode: "daily" | "practice";
  cefr?: CefrLevel | null;
  challengeCode?: string | null;
  challengeSeed?: number | null;
  challengeDifficulty?: number | null;
}

type Stage = "countdown" | "active" | "summary";

interface RoundResult {
  prompt: string;
  answer: string;
  correct: boolean;
}

export default function ByteChoiceGame({
  language,
  mode,
  cefr = "A2",
  challengeCode = null,
  challengeSeed = null,
  challengeDifficulty = null,
}: ByteChoiceGameProps) {
  const copy = React.useMemo(() => getCopy(language), [language]);
  const cefrBand = React.useMemo(() => clampCefrToBand(cefr), [cefr]);
  const puzzle = React.useMemo(
    () => getByteChoicePuzzle(language, challengeSeed, cefrBand),
    [challengeSeed, language, cefrBand],
  );
  const initialDifficulty = React.useMemo(
    () => challengeDifficulty ?? getBaselineDifficulty(cefr),
    [cefr, challengeDifficulty],
  );

  const [stage, setStage] = React.useState<Stage>("countdown");
  const [countdownValue, setCountdownValue] = React.useState<number | null>(null);
  const [questionIndex, setQuestionIndex] = React.useState(0);
  const [questionKey, setQuestionKey] = React.useState(0);
  const [score, setScore] = React.useState(0);
  const [streak, setStreak] = React.useState(0);
  const [bestStreak, setBestStreak] = React.useState(0);
  const [difficulty, setDifficulty] = React.useState(initialDifficulty);
  const [selection, setSelection] = React.useState<number | null>(null);
  const [timedOut, setTimedOut] = React.useState(false);
  const [runId, setRunId] = React.useState("local-boot");
  const [firstMeaningfulActionMs, setFirstMeaningfulActionMs] = React.useState<number | null>(null);
  const [firstCorrectMs, setFirstCorrectMs] = React.useState<number | null>(null);
  const [samples, setSamples] = React.useState<CalibrationSample[]>([]);
  const [recentResponses, setRecentResponses] = React.useState<number[]>([]);
  const [recentErrors, setRecentErrors] = React.useState(0);
  const [timerPercent, setTimerPercent] = React.useState(100);
  const [roundResults, setRoundResults] = React.useState<RoundResult[]>([]);

  const startedAtRef = React.useRef<number>(Date.now());
  const questionStartRef = React.useRef<number>(Date.now());
  const resolvedRef = React.useRef(false);
  const timerFrameRef = React.useRef<number>(0);
  const timeoutHandledRef = React.useRef(false);

  const question = puzzle.questions[questionIndex];
  const totalQuestions = puzzle.questions.length;

  const governor = computeCognitiveGovernor({
    recentErrors,
    recentAvgResponseMs: recentResponses.length
      ? recentResponses.reduce((sum, value) => sum + value, 0) / recentResponses.length
      : 1600,
    streak,
  });

  // ── Difficulty sync ──
  React.useEffect(() => {
    setDifficulty(initialDifficulty);
  }, [initialDifficulty]);

  // ── Start game run telemetry ──
  React.useEffect(() => {
    startedAtRef.current = Date.now();
    void startGameRun({
      gameSlug: "byte-choice",
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

  // ── Handle timeout (timer expiry = auto-wrong) ──
  const handleTimeout = React.useCallback(() => {
    if (timeoutHandledRef.current) return;
    timeoutHandledRef.current = true;

    haptic("error");
    setSelection(-1); // Special timeout state
    setTimedOut(true);
    setStreak(0);
    setRecentErrors((prev) => prev + 1);

    // Record as wrong
    setRoundResults((prev) => [
      ...prev,
      {
        prompt: question.prompt,
        answer: question.options[question.correctIndex],
        correct: false,
      },
    ]);

    // Advance after delay
    setTimeout(() => {
      setSelection(null);
      setTimedOut(false);
      timeoutHandledRef.current = false;
      if (questionIndex + 1 >= totalQuestions) {
        setStage("summary");
        return;
      }
      setQuestionIndex((prev) => prev + 1);
      setQuestionKey((prev) => prev + 1);
    }, FEEDBACK_WRONG_MS);
  }, [question, questionIndex, totalQuestions]);

  // ── Per-question timer ──
  React.useEffect(() => {
    if (stage !== "active" || selection !== null) {
      cancelAnimationFrame(timerFrameRef.current);
      return;
    }

    questionStartRef.current = Date.now();
    timeoutHandledRef.current = false;
    setTimerPercent(100);

    const tick = () => {
      const elapsed = Date.now() - questionStartRef.current;
      const remaining = Math.max(0, 100 - (elapsed / TIMER_DURATION_MS) * 100);
      setTimerPercent(remaining);

      if (remaining > 0) {
        timerFrameRef.current = requestAnimationFrame(tick);
      } else {
        // Timer expired — auto-wrong
        handleTimeout();
      }
    };

    timerFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(timerFrameRef.current);
  }, [stage, questionIndex, selection, handleTimeout]);

  // ── Complete game run on summary ──
  React.useEffect(() => {
    if (stage !== "summary" || resolvedRef.current) return;
    resolvedRef.current = true;

    const elapsed = Date.now() - startedAtRef.current;
    const total = questionIndex;
    const accuracy = total <= 0 ? 0 : Math.round((score / total) * 100);

    recordDailyProgress("byte-choice", accuracy >= 70);

    void completeGameRun({
      runId,
      score,
      maxScore: totalQuestions,
      accuracy,
      timeMs: elapsed,
      mistakes: Math.max(0, total - score),
      maxCombo: bestStreak,
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
      skillTrackDeltas: buildSkillTrackDeltas({
        isCorrect: accuracy >= 70,
        responseMs: 1200,
        track: "recognition",
      }),
      cognitiveLoadState: governor.state,
      ahaSpike: accuracy >= 90,
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
  }, [bestStreak, cefr, challengeCode, difficulty, firstCorrectMs, firstMeaningfulActionMs, governor.state, initialDifficulty, language, mode, puzzle.puzzleNumber, puzzle.seed, questionIndex, runId, score, stage, totalQuestions]);

  // ── Countdown ──
  const handleStartTap = React.useCallback(() => {
    if (countdownValue !== null) return; // already counting
    haptic("tap");
    setCountdownValue(3);
  }, [countdownValue]);

  // Animated countdown 3 → 2 → 1 → GO
  React.useEffect(() => {
    if (countdownValue === null || stage !== "countdown") return;
    if (countdownValue <= 0) {
      setStage("active");
      return;
    }
    const timer = setTimeout(() => {
      haptic("tap");
      setCountdownValue(countdownValue - 1);
    }, 700);
    return () => clearTimeout(timer);
  }, [countdownValue, stage]);

  // ── Answer handler ──
  const handleAnswer = React.useCallback(
    (index: number) => {
      if (stage !== "active") return;
      if (selection !== null) return;

      const now = Date.now();
      const elapsedMs = now - startedAtRef.current;
      const responseMs = now - questionStartRef.current;

      if (firstMeaningfulActionMs === null) {
        setFirstMeaningfulActionMs(elapsedMs);
      }

      const correct = index === question.correctIndex;
      setSelection(index);
      setTimedOut(false);
      setRecentResponses((prev) => [...prev.slice(-4), responseMs]);

      // Record round result
      setRoundResults((prev) => [
        ...prev,
        { prompt: question.prompt, answer: question.options[question.correctIndex], correct },
      ]);

      // Calibration
      const nextSamples =
        samples.length < 6
          ? [...samples, { responseMs, isCorrect: correct, usedHint: false }]
          : samples;

      if (samples.length < 6) {
        setSamples(nextSamples);
        setDifficulty((prev) => calibrateDifficulty(prev, nextSamples));
      }

      const update = updateDifficulty({
        currentDifficulty: difficulty,
        responseMs,
        isCorrect: correct,
        streak,
      });

      setDifficulty(update.nextDifficulty);

      if (correct) {
        haptic("success");
        setScore((prev) => prev + 1);
        const newStreak = streak + 1;
        setStreak(newStreak);
        setBestStreak((prev) => Math.max(prev, newStreak));
        setRecentErrors(0);
        if (firstCorrectMs === null) {
          setFirstCorrectMs(elapsedMs);
        }
      } else {
        haptic("error");
        setStreak(0);
        setRecentErrors((prev) => prev + 1);
      }

      // Advance after feedback delay — faster for correct, slower for wrong
      const delay = correct ? FEEDBACK_CORRECT_MS : FEEDBACK_WRONG_MS;
      setTimeout(() => {
        setSelection(null);
        setTimedOut(false);
        if (questionIndex + 1 >= totalQuestions) {
          setStage("summary");
          return;
        }
        setQuestionIndex((prev) => prev + 1);
        setQuestionKey((prev) => prev + 1);
      }, delay);
    },
    [difficulty, firstCorrectMs, firstMeaningfulActionMs, question, questionIndex, samples, selection, stage, streak, totalQuestions],
  );

  // ── Results data ──
  const elapsedTotal = Date.now() - startedAtRef.current;
  const accuracyPct = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function getResultEmoji(): string {
    if (accuracyPct >= 90) return "🏆";
    if (accuracyPct >= 70) return "🔥";
    if (accuracyPct >= 50) return "💪";
    return "📚";
  }

  function getResultTitle(): string {
    if (accuracyPct >= 90) return "Outstanding!";
    if (accuracyPct >= 70) return "Great run!";
    if (accuracyPct >= 50) return "Solid effort";
    return "Keep practising";
  }

  // ═══ RENDER ═══

  // Countdown
  if (stage === "countdown") {
    return (
      <div className={styles.arena}>
        <div className={styles.countdown}>
          {countdownValue === null ? (
            <>
              <div className={styles.countdownBrief}>
                <p className={styles.briefIcon}>🎯</p>
                <p className={styles.briefTitle}>Translate the word</p>
                <p className={styles.briefDesc}>Pick the correct translation from three options. {totalQuestions} rounds, 8 seconds each.</p>
              </div>
              <button
                type="button"
                className={styles.playButton}
                onPointerDown={handleStartTap}
              >
                Tap to Play
              </button>
            </>
          ) : (
            <div className={styles.countdownTimer}>
              <p className={styles.countdownNumber} key={countdownValue}>
                {countdownValue > 0 ? countdownValue : "GO!"}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Summary / Results
  if (stage === "summary") {
    const CEFR_BANDS: Array<"A1" | "A2" | "B1" | "B2"> = ["A1", "A2", "B1", "B2"];
    const currentBand = cefrBand ?? "A2";
    const bandIndex = CEFR_BANDS.indexOf(currentBand);
    const didWell = score >= 7;
    const struggled = score < 5;

    // Determine level-up / level-down target
    let suggestedBand: "A1" | "A2" | "B1" | "B2" | null = null;
    if (didWell && bandIndex < CEFR_BANDS.length - 1) {
      suggestedBand = CEFR_BANDS[bandIndex + 1];
    } else if (struggled && bandIndex > 0) {
      suggestedBand = CEFR_BANDS[bandIndex - 1];
    }

    return (
      <div className={styles.arena}>
        <div className={styles.results}>
          {/* Header */}
          <div className={styles.resultsHeader}>
            <p className={styles.resultsEmoji}>{getResultEmoji()}</p>
            <h2 className={styles.resultsTitle}>{getResultTitle()}</h2>
            <p className={styles.resultsSubtitle}>{copy.progress}</p>
          </div>

          {/* Two stats: Score + Time */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <p className={styles.statValueLg}>
                {score}<span className={styles.statDenom}>/{totalQuestions}</span>
              </p>
              <p className={styles.statLabel}>Score</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statValueLg}>{formatTime(elapsedTotal)}</p>
              <p className={styles.statLabel}>Time</p>
            </div>
          </div>

          {/* Level nudge */}
          {suggestedBand && (
            <div
              className={styles.levelNudge}
              data-direction={didWell ? "up" : "down"}
            >
              <p className={styles.levelNudgeText}>
                {didWell
                  ? `🚀 Ready for harder words? You crushed ${currentBand}!`
                  : `💡 Try an easier level? Build up from ${suggestedBand}.`}
              </p>
            </div>
          )}

          {/* CTA buttons */}
          <div className={styles.ctaStack}>
            <button
              type="button"
              className={styles.ctaPrimary}
              onPointerDown={() => location.reload()}
            >
              Play Again
            </button>

            {suggestedBand && (
              <a
                href={`/games/byte-choice?cefr=${suggestedBand}`}
                className={styles.ctaSecondary}
              >
                Try {suggestedBand} {didWell ? "→" : "←"}
              </a>
            )}

            <a href="/games" className={styles.ctaTextLink}>
              More Games
            </a>
          </div>

          {/* Share */}
          <SharePanel
            gameSlug="byte-choice"
            seed={puzzle.seed}
            mode={mode}
            score={score}
            streak={bestStreak}
            difficultyBand={difficulty}
            locale={language}
            shareWin={copy.shareWin}
            shareStumble={copy.shareStumble}
            uiVersion={UI_VERSION}
            curveVersion={CURVE_VERSION}
          />
        </div>
      </div>
    );
  }

  // Active game
  return (
    <div className={styles.arena} style={{ opacity: governor.decorOpacity }}>
      {/* Round Progress */}
      <div className={styles.progressTrack}>
        {Array.from({ length: totalQuestions }, (_, i) => {
          let status: string;
          if (i < questionIndex) {
            const result = roundResults[i];
            status = result?.correct ? "correct" : "wrong";
          } else if (i === questionIndex) {
            status = "current";
          } else {
            status = "pending";
          }
          return <div key={i} className={styles.progressPip} data-status={status} />;
        })}
      </div>

      {/* Timer Bar */}
      <div className={styles.timerTrack}>
        <div
          className={styles.timerFill}
          data-urgent={timerPercent < 25 ? "true" : "false"}
          style={{ width: `${timerPercent}%` }}
        />
      </div>

      {/* Streak Fire */}
      <div className={styles.streakBar} data-active={streak >= 2 ? "true" : "false"}>
        <span className={styles.streakEmoji}>🔥</span>
        <span className={styles.streakText} data-hot={streak >= 5 ? "true" : "false"}>
          {streak}× streak{streak >= 5 ? "!" : ""}
        </span>
      </div>

      {/* Timeout Indicator */}
      {timedOut && (
        <div className={styles.timeoutIndicator}>
          <span className={styles.timeoutText}>⏰ Time&apos;s up!</span>
        </div>
      )}

      {/* Prompt + Options with transition */}
      {question && (
        <div key={questionKey} className={styles.questionTransition}>
          <div className={styles.promptSection}>
            <p className={styles.promptLabel}>Translate</p>
            <p className={styles.promptWord}>{question.prompt}</p>
            {question.band && (
              <span className={styles.cefrBadge}>{question.band}</span>
            )}
          </div>

          {/* Option Cards */}
          <div className={styles.options}>
            {question.options.map((option, index) => {
              let state: string;
              if (selection === null) {
                state = "idle";
              } else if (index === question.correctIndex) {
                // Always reveal correct answer
                state = "correct";
              } else if (index === selection && selection !== question.correctIndex) {
                // Player picked this wrong option
                state = "wrong";
              } else if (selection === -1) {
                // Timeout: dim everything except correct
                state = "dimmed";
              } else if (selection !== null) {
                // Other non-picked, non-correct options
                state = "dimmed";
              } else {
                state = "idle";
              }

              return (
                <button
                  key={`${question.prompt}-${option}-${index}`}
                  type="button"
                  className={styles.optionCard}
                  data-state={state}
                  onPointerDown={() => handleAnswer(index)}
                  disabled={selection !== null}
                  style={{ touchAction: "none" }}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function resolveTier(difficulty: number): DifficultyTier {
  if (difficulty < 35) return "onboarding";
  if (difficulty < 60) return "foundation";
  if (difficulty < 82) return "pressure";
  return "mastery";
}
