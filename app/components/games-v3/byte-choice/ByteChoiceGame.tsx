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

const UI_VERSION = "v3-byte-choice-2";
const CURVE_VERSION = "v3-gentle-ramp-1";
const SHARE_CARD_VERSION = "v3-share-1";

const TIMER_DURATION_MS = 8000; // 8 seconds per question
const FEEDBACK_DELAY_MS = 650; // Show answer before moving on

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
  const puzzle = React.useMemo(
    () => getByteChoicePuzzle(language, challengeSeed),
    [challengeSeed, language],
  );
  const initialDifficulty = React.useMemo(
    () => challengeDifficulty ?? getBaselineDifficulty(cefr),
    [cefr, challengeDifficulty],
  );

  const [stage, setStage] = React.useState<Stage>("countdown");
  const [countdownValue, setCountdownValue] = React.useState<number | null>(null);
  const [questionIndex, setQuestionIndex] = React.useState(0);
  const [score, setScore] = React.useState(0);
  const [streak, setStreak] = React.useState(0);
  const [bestStreak, setBestStreak] = React.useState(0);
  const [difficulty, setDifficulty] = React.useState(initialDifficulty);
  const [selection, setSelection] = React.useState<number | null>(null);
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

  // ── Per-question timer ──
  React.useEffect(() => {
    if (stage !== "active" || selection !== null) {
      cancelAnimationFrame(timerFrameRef.current);
      return;
    }

    questionStartRef.current = Date.now();
    setTimerPercent(100);

    const tick = () => {
      const elapsed = Date.now() - questionStartRef.current;
      const remaining = Math.max(0, 100 - (elapsed / TIMER_DURATION_MS) * 100);
      setTimerPercent(remaining);

      if (remaining > 0) {
        timerFrameRef.current = requestAnimationFrame(tick);
      }
      // Timer expiry doesn't auto-advance — just visual urgency
    };

    timerFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(timerFrameRef.current);
  }, [stage, questionIndex, selection]);

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

      // Advance after feedback delay
      setTimeout(() => {
        setSelection(null);
        if (questionIndex + 1 >= totalQuestions) {
          setStage("summary");
          return;
        }
        setQuestionIndex((prev) => prev + 1);
      }, FEEDBACK_DELAY_MS);
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
                <p className={styles.briefIcon}>⚡</p>
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
    const isExcellent = accuracyPct >= 90;
    const WORDS_COLLAPSED_LIMIT = 6;
    const hasOverflow = roundResults.length > WORDS_COLLAPSED_LIMIT;

    return (
      <div className={styles.arena}>
        <div className={styles.results}>
          {/* Confetti burst for excellent results */}
          {isExcellent && (
            <div className={styles.confettiContainer} aria-hidden="true">
              {Array.from({ length: 24 }, (_, i) => (
                <span
                  key={i}
                  className={styles.confettiPiece}
                  style={{
                    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                    ["--ci" as string]: i,
                    left: `${4 + (i * 17) % 92}%`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Header — stagger 1 */}
          <div className={styles.resultsHeader} data-excellent={isExcellent ? "true" : "false"}>
            <div className={styles.resultsHeaderGlow} aria-hidden="true" />
            <p className={styles.resultsEmoji}>{getResultEmoji()}</p>
            <h2 className={styles.resultsTitle}>{getResultTitle()}</h2>
            <p className={styles.resultsSubtitle}>{copy.progress}</p>
          </div>

          {/* Stats Grid — stagger 2 */}
          <div className={styles.statsGrid}>
            {/* Accuracy — radial gauge */}
            <div className={styles.statCard} data-variant="gauge">
              <div className={styles.gaugeWrap}>
                <svg className={styles.gaugeSvg} viewBox="0 0 80 80">
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    fill="none"
                    stroke="#E2D8CA"
                    strokeWidth="6"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    fill="none"
                    stroke={accuracyPct >= 70 ? "var(--bc-green)" : "var(--bc-gold)"}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${(accuracyPct / 100) * 213.6} 213.6`}
                    className={styles.gaugeArc}
                    transform="rotate(-90 40 40)"
                  />
                </svg>
                <span className={styles.gaugeValue}>{accuracyPct}%</span>
              </div>
              <p className={styles.statLabel}>Accuracy</p>
            </div>

            {/* Best Streak */}
            <div className={styles.statCard}>
              <p className={styles.statValueLg} data-accent="gold">
                {bestStreak}<span className={styles.statIcon}>🔥</span>
              </p>
              <p className={styles.statLabel}>Best Streak</p>
            </div>

            {/* Time */}
            <div className={styles.statCard}>
              <p className={styles.statValueLg}>{formatTime(elapsedTotal)}</p>
              <p className={styles.statLabel}>Time</p>
            </div>

            {/* Score */}
            <div className={styles.statCard}>
              <p className={styles.statValueLg}>
                {score}<span className={styles.statDenom}>/{totalQuestions}</span>
              </p>
              <p className={styles.statLabel}>Score</p>
            </div>
          </div>

          {/* Words Learned — stagger 3 */}
          {roundResults.length > 0 && (
            <WordsSection results={roundResults} limit={WORDS_COLLAPSED_LIMIT} hasOverflow={hasOverflow} />
          )}

          {/* CTAs — stagger 4 */}
          <div className={styles.ctaStack}>
            {/* Primary: Play Again */}
            <button
              type="button"
              className={styles.ctaPrimary}
              onPointerDown={() => location.reload()}
            >
              Play Again
            </button>

            {/* Secondary: Try Another Game */}
            <a href="/games" className={styles.ctaSecondary}>
              Try Another Game
            </a>

            {/* Share Panel */}
            <div className={styles.shareSection}>
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

            {/* Soft conversion CTA */}
            <a href="/signup" className={styles.tutorCta}>
              <span className={styles.tutorCtaBrand}>TutorLingua</span>
              <span className={styles.tutorCtaText}>
                Want a tutor who teaches like this?
              </span>
              <span className={styles.tutorCtaArrow}>→</span>
            </a>
          </div>
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

      {/* Prompt */}
      {question && (
        <>
          <div className={styles.promptSection}>
            <p className={styles.promptLabel}>Translate</p>
            <p className={styles.promptWord}>{question.prompt}</p>
          </div>

          {/* Option Cards */}
          <div className={styles.options}>
            {question.options.map((option, index) => {
              let state: string;
              if (selection === null) {
                state = "idle";
              } else if (index === question.correctIndex) {
                state = "correct";
              } else if (index === selection) {
                state = "wrong";
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
        </>
      )}
    </div>
  );
}

/* ── Collapsible words sub-component ── */
function WordsSection({
  results,
  limit,
  hasOverflow,
}: {
  results: RoundResult[];
  limit: number;
  hasOverflow: boolean;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const visible = expanded ? results : results.slice(0, limit);

  return (
    <div className={styles.wordsLearned}>
      <p className={styles.wordsLearnedTitle}>Words This Round</p>
      <div className={styles.wordChips}>
        {visible.map((r, i) => (
          <span
            key={`${r.prompt}-${i}`}
            className={styles.wordChip}
            data-correct={r.correct ? "true" : "false"}
          >
            <span className={styles.wordChipPrompt}>{r.prompt}</span>
            <span className={styles.wordChipSep}>→</span>
            <span className={styles.wordChipAnswer}>{r.answer}</span>
          </span>
        ))}
      </div>
      {hasOverflow && !expanded && (
        <button
          type="button"
          className={styles.showAllBtn}
          onPointerDown={() => setExpanded(true)}
        >
          Show all {results.length} words
        </button>
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
