"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameButton from "@/components/games/engine/GameButton";
import GameResultCard from "@/components/games/engine/GameResultCard";
import { shareResult } from "@/components/games/engine/share";
import { haptic } from "@/lib/games/haptics";
import { recordGamePlay } from "@/lib/games/streaks";
import { fireConfetti } from "@/lib/games/juice";
import { diagnoseWeakness, type Mistake } from "@/lib/games/scoring";
import { getLanguageFlag } from "@/lib/games/language-utils";
import type { NeonInterceptPuzzle } from "@/lib/games/data/neon-intercept";

const SESSION_MS = 90_000;
const START_LIVES = 3;
const LOOP_INTERVAL_MS = 50;
const RESOLVE_DELAY_MS = 420;
const FALL_DISTANCE_PX = 150;

type LaneIndex = 0 | 1 | 2;
type FeedbackState = "idle" | "correct" | "wrong" | "timeout";

interface UIText {
  time: string;
  score: string;
  hits: string;
  combo: string;
  lives: string;
  wave: string;
  bossWave: string;
  falseFriend: string;
  tapPrompt: string;
  niceCatch: string;
  tooSlow: string;
  almost: string;
  readyContinue: string;
  pausedBody: string;
  continueRun: string;
  runComplete: string;
  goodRun: string;
  shareResult: string;
  copied: string;
  reviewMisses: string;
  hideMisses: string;
  playAgain: string;
  falseFriendsCaught: string;
  topicFalseFriends: string;
  topicSpeedVocabulary: string;
  practiceFocus: string;
  missedInArea: string;
  areaSuffix: string;
  practiceHintPrefix: string;
  expected: string;
  yourPick: string;
}

const UI_TEXT_BY_LANG: Record<string, UIText> = {
  en: {
    time: "Time",
    score: "Score",
    hits: "Hits",
    combo: "Combo",
    lives: "Lives",
    wave: "Wave",
    bossWave: "Boss Wave",
    falseFriend: "False Friend",
    tapPrompt: "Tap the correct lane before it lands.",
    niceCatch: "Nice catch!",
    tooSlow: "Too slow this time!",
    almost: "Almost. Try the next one!",
    readyContinue: "Ready to continue?",
    pausedBody: "We paused your run while the app was in the background.",
    continueRun: "Continue Run",
    runComplete: "Run complete!",
    goodRun: "Good run!",
    shareResult: "📋 Share Result",
    copied: "✓ Copied!",
    reviewMisses: "Review Misses",
    hideMisses: "Hide Misses",
    playAgain: "🔄 Play Again",
    falseFriendsCaught: "False Friends caught",
    topicFalseFriends: "False Friends",
    topicSpeedVocabulary: "Speed Vocabulary",
    practiceFocus: "Practice focus",
    missedInArea: "You missed",
    areaSuffix: "in this area.",
    practiceHintPrefix: "Next run: slow down on those clues first.",
    expected: "Expected",
    yourPick: "Your pick",
  },
  es: {
    time: "Tiempo",
    score: "Puntos",
    hits: "Aciertos",
    combo: "Combo",
    lives: "Vidas",
    wave: "Ronda",
    bossWave: "Ronda jefa",
    falseFriend: "Falso amigo",
    tapPrompt: "Toca el carril correcto antes de que caiga.",
    niceCatch: "¡Bien hecho!",
    tooSlow: "¡Demasiado lento esta vez!",
    almost: "Casi. Prueba la siguiente.",
    readyContinue: "¿Listo para seguir?",
    pausedBody: "Pausamos tu partida mientras la app estaba en segundo plano.",
    continueRun: "Continuar",
    runComplete: "¡Partida completada!",
    goodRun: "¡Buena partida!",
    shareResult: "📋 Compartir resultado",
    copied: "✓ Copiado!",
    reviewMisses: "Revisar fallos",
    hideMisses: "Ocultar fallos",
    playAgain: "🔄 Jugar otra vez",
    falseFriendsCaught: "Falsos amigos detectados",
    topicFalseFriends: "Falsos amigos",
    topicSpeedVocabulary: "Vocabulario rapido",
    practiceFocus: "Enfoque de practica",
    missedInArea: "Fallaste",
    areaSuffix: "en esta area.",
    practiceHintPrefix: "En la siguiente partida, baja un poco la velocidad en estas pistas.",
    expected: "Esperado",
    yourPick: "Tu opcion",
  },
  fr: {
    time: "Temps",
    score: "Score",
    hits: "Reussites",
    combo: "Combo",
    lives: "Vies",
    wave: "Vague",
    bossWave: "Vague boss",
    falseFriend: "Faux ami",
    tapPrompt: "Appuie sur la bonne voie avant l impact.",
    niceCatch: "Bien vu !",
    tooSlow: "Trop lent cette fois !",
    almost: "Presque. Essaie la suivante.",
    readyContinue: "Pret a continuer ?",
    pausedBody: "La partie a ete mise en pause pendant l arriere-plan.",
    continueRun: "Continuer",
    runComplete: "Partie terminee !",
    goodRun: "Bonne partie !",
    shareResult: "📋 Partager resultat",
    copied: "✓ Copie !",
    reviewMisses: "Voir les erreurs",
    hideMisses: "Masquer erreurs",
    playAgain: "🔄 Rejouer",
    falseFriendsCaught: "Faux amis attrapes",
    topicFalseFriends: "Faux amis",
    topicSpeedVocabulary: "Vocabulaire rapide",
    practiceFocus: "Focus de pratique",
    missedInArea: "Tu as rate",
    areaSuffix: "dans cette zone.",
    practiceHintPrefix: "Au prochain essai, ralentis un peu sur ces indices.",
    expected: "Attendu",
    yourPick: "Ton choix",
  },
  de: {
    time: "Zeit",
    score: "Punkte",
    hits: "Treffer",
    combo: "Combo",
    lives: "Leben",
    wave: "Welle",
    bossWave: "Boss-Welle",
    falseFriend: "Falscher Freund",
    tapPrompt: "Tippe auf die richtige Spur, bevor das Wort landet.",
    niceCatch: "Gut getroffen!",
    tooSlow: "Diesmal zu langsam!",
    almost: "Fast. Versuch die naechste.",
    readyContinue: "Bereit weiterzumachen?",
    pausedBody: "Dein Lauf wurde im Hintergrund pausiert.",
    continueRun: "Weiter",
    runComplete: "Lauf abgeschlossen!",
    goodRun: "Guter Lauf!",
    shareResult: "📋 Ergebnis teilen",
    copied: "✓ Kopiert!",
    reviewMisses: "Fehler ansehen",
    hideMisses: "Fehler ausblenden",
    playAgain: "🔄 Nochmal spielen",
    falseFriendsCaught: "Falsche Freunde erkannt",
    topicFalseFriends: "Falsche Freunde",
    topicSpeedVocabulary: "Schnellvokabeln",
    practiceFocus: "Uebungsfokus",
    missedInArea: "Du hast verpasst",
    areaSuffix: "in diesem Bereich.",
    practiceHintPrefix: "Im naechsten Lauf bei diesen Hinweisen etwas langsamer spielen.",
    expected: "Erwartet",
    yourPick: "Deine Wahl",
  },
};

export interface NeonInterceptEndState {
  isComplete: boolean;
  isWon: boolean;
  mistakes: number;
  score: number;
  maxCombo: number;
  falseFriendHits: number;
}

interface NeonInterceptGameProps {
  puzzle: NeonInterceptPuzzle;
  onGameEnd?: (state: NeonInterceptEndState) => void;
  onPlayAgain?: () => void;
}

interface RuntimeState {
  waveIndex: number;
  score: number;
  lives: number;
  combo: number;
  maxCombo: number;
  hits: number;
  misses: number;
  falseFriendHits: number;
  isComplete: boolean;
  isWon: boolean;
  startTime: number;
  endTime?: number;
  results: boolean[];
  mistakes: Mistake[];
}

function getWaveDurationMs(elapsedMs: number): number {
  const progress = Math.min(elapsedMs / SESSION_MS, 1);
  // Starts forgiving, ends fast enough to feel arcade-like.
  return Math.round(3600 - progress * 1300);
}

function formatCountdown(ms: number): string {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  const mins = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${mins}:${String(sec).padStart(2, "0")}`;
}

function getFeedbackText(state: FeedbackState, ui: UIText): string {
  if (state === "correct") return ui.niceCatch;
  if (state === "timeout") return ui.tooSlow;
  if (state === "wrong") return ui.almost;
  return ui.tapPrompt;
}

export default function NeonInterceptGame({
  puzzle,
  onGameEnd,
  onPlayAgain,
}: NeonInterceptGameProps) {
  const [runtime, setRuntime] = React.useState<RuntimeState>({
    waveIndex: 0,
    score: 0,
    lives: START_LIVES,
    combo: 0,
    maxCombo: 0,
    hits: 0,
    misses: 0,
    falseFriendHits: 0,
    isComplete: false,
    isWon: false,
    startTime: Date.now(),
    results: [],
    mistakes: [],
  });
  const [nowMs, setNowMs] = React.useState(Date.now());
  const [feedback, setFeedback] = React.useState<FeedbackState>("idle");
  const [selectedLane, setSelectedLane] = React.useState<LaneIndex | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [showReview, setShowReview] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const [showResumeCard, setShowResumeCard] = React.useState(false);

  const nextWaveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasNotifiedRef = React.useRef(false);
  const hasCompletedRef = React.useRef(false);
  const resultRef = React.useRef<HTMLDivElement>(null);
  const pausedStartedAtRef = React.useRef<number | null>(null);
  const pausedAccumulatedRef = React.useRef(0);
  const waveStartElapsedRef = React.useRef(0);

  const pauseCompensationMs =
    isPaused && pausedStartedAtRef.current
      ? nowMs - pausedStartedAtRef.current
      : 0;

  const elapsedMs = Math.max(
    0,
    nowMs - runtime.startTime - pausedAccumulatedRef.current - pauseCompensationMs,
  );
  const timeLeftMs = Math.max(0, SESSION_MS - elapsedMs);
  const waveDurationMs = getWaveDurationMs(elapsedMs);
  const waveElapsedMs = Math.max(0, elapsedMs - waveStartElapsedRef.current);
  const waveProgress = Math.min(1, waveElapsedMs / Math.max(1, waveDurationMs));
  const currentWave = puzzle.waves[runtime.waveIndex % puzzle.waves.length];
  const canInteract = !runtime.isComplete && !isPaused && feedback === "idle";
  const weakness = diagnoseWeakness(runtime.mistakes);
  const ui = React.useMemo(
    () => UI_TEXT_BY_LANG[puzzle.language] ?? UI_TEXT_BY_LANG.en,
    [puzzle.language],
  );

  const clearPendingTimers = React.useCallback(() => {
    if (nextWaveTimeoutRef.current) clearTimeout(nextWaveTimeoutRef.current);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
  }, []);

  React.useEffect(() => {
    return () => clearPendingTimers();
  }, [clearPendingTimers]);

  const completeGame = React.useCallback((won: boolean) => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;

    setRuntime((prev) => {
      if (prev.isComplete) return prev;
      if (won) recordGamePlay("neon-intercept");
      return {
        ...prev,
        isComplete: true,
        isWon: won,
        endTime: Date.now(),
      };
    });
    haptic(won ? "success" : "gameOver");
  }, []);

  const queueNextWave = React.useCallback((elapsedAtResolve: number) => {
    if (nextWaveTimeoutRef.current) clearTimeout(nextWaveTimeoutRef.current);
    nextWaveTimeoutRef.current = setTimeout(() => {
      let advanced = false;
      setRuntime((prev) => {
        if (prev.isComplete) return prev;
        advanced = true;
        return {
          ...prev,
          waveIndex: prev.waveIndex + 1,
        };
      });
      if (!advanced) return;
      waveStartElapsedRef.current = elapsedAtResolve + RESOLVE_DELAY_MS;
      setSelectedLane(null);
      setFeedback("idle");
    }, RESOLVE_DELAY_MS);
  }, []);

  const resolveWave = React.useCallback((lane: LaneIndex | null, source: "tap" | "timeout") => {
    if (runtime.isComplete || isPaused || feedback !== "idle") return;

    const isCorrect = lane !== null && lane === currentWave.correctIndex;
    const nextLives = isCorrect ? runtime.lives : runtime.lives - 1;
    const outOfLives = nextLives <= 0;

    const basePoints = 10;
    const comboBonus = isCorrect ? Math.min(runtime.combo, 6) * 2 : 0;
    const bossBonus = isCorrect && currentWave.kind === "boss" ? 10 : 0;
    const falseFriendBonus = isCorrect && currentWave.kind === "false-friend" ? 5 : 0;
    const points = basePoints + comboBonus + bossBonus + falseFriendBonus;

    const topic =
      currentWave.kind === "false-friend"
        ? ui.topicFalseFriends
        : ui.topicSpeedVocabulary;

    setSelectedLane(lane);
    setFeedback(
      isCorrect
        ? "correct"
        : source === "timeout"
          ? "timeout"
          : "wrong",
    );
    haptic(
      isCorrect
        ? currentWave.kind === "false-friend"
          ? "falseFriend"
          : "success"
        : source === "timeout"
          ? "error"
          : "error",
    );

    setRuntime((prev) => ({
      ...prev,
      score: isCorrect ? prev.score + points : prev.score,
      lives: Math.max(0, nextLives),
      combo: isCorrect ? prev.combo + 1 : 0,
      maxCombo: isCorrect ? Math.max(prev.maxCombo, prev.combo + 1) : prev.maxCombo,
      hits: isCorrect ? prev.hits + 1 : prev.hits,
      misses: isCorrect ? prev.misses : prev.misses + 1,
      falseFriendHits:
        isCorrect && currentWave.kind === "false-friend"
          ? prev.falseFriendHits + 1
          : prev.falseFriendHits,
      results: [...prev.results, isCorrect],
      mistakes: isCorrect
        ? prev.mistakes
        : [
            ...prev.mistakes,
            {
              item: currentWave.falseFriendWord || currentWave.clue,
              expected: currentWave.options[currentWave.correctIndex],
              actual: lane === null ? "(timeout)" : currentWave.options[lane],
              topic,
              cefrLevel: currentWave.cefrLevel,
              explanation: currentWave.explanation,
            },
          ],
    }));

    if (outOfLives) {
      completeGame(false);
      return;
    }

    queueNextWave(elapsedMs);
  }, [
    runtime,
    isPaused,
    feedback,
    currentWave,
    ui,
    queueNextWave,
    elapsedMs,
    completeGame,
  ]);

  // Main tick loop
  React.useEffect(() => {
    if (runtime.isComplete) return;
    const interval = setInterval(() => {
      if (!isPaused) setNowMs(Date.now());
    }, LOOP_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [runtime.isComplete, isPaused]);

  // Visibility pause/resume for frictionless mobile behavior.
  React.useEffect(() => {
    const onVisibilityChange = () => {
      if (runtime.isComplete) return;

      if (document.hidden) {
        if (!isPaused) {
          pausedStartedAtRef.current = Date.now();
          setIsPaused(true);
          setShowResumeCard(false);
        }
        return;
      }

      if (isPaused && pausedStartedAtRef.current) {
        pausedAccumulatedRef.current += Date.now() - pausedStartedAtRef.current;
        pausedStartedAtRef.current = null;
        setShowResumeCard(true);
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [runtime.isComplete, isPaused]);

  // Time-out ends the session.
  React.useEffect(() => {
    if (runtime.isComplete || isPaused) return;
    if (timeLeftMs <= 0) {
      completeGame(runtime.lives > 0 && runtime.hits > 0);
    }
  }, [runtime.isComplete, runtime.lives, runtime.hits, isPaused, timeLeftMs, completeGame]);

  // Wave timeout
  React.useEffect(() => {
    if (runtime.isComplete || isPaused || feedback !== "idle") return;
    if (waveProgress >= 1) {
      resolveWave(null, "timeout");
    }
  }, [runtime.isComplete, isPaused, feedback, waveProgress, resolveWave]);

  // Notify parent exactly once
  React.useEffect(() => {
    if (!runtime.isComplete || hasNotifiedRef.current) return;
    hasNotifiedRef.current = true;
    onGameEnd?.({
      isComplete: runtime.isComplete,
      isWon: runtime.isWon,
      mistakes: runtime.misses,
      score: runtime.score,
      maxCombo: runtime.maxCombo,
      falseFriendHits: runtime.falseFriendHits,
    });
  }, [runtime, onGameEnd]);

  // Result scroll + confetti
  React.useEffect(() => {
    if (!runtime.isComplete) return;
    const scrollTimer = setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 250);

    let confettiTimer: ReturnType<typeof setTimeout> | null = null;
    if (runtime.isWon) {
      confettiTimer = setTimeout(() => {
        void fireConfetti({
          particleCount: 80,
          spread: 90,
          startVelocity: 30,
          gravity: 0.75,
          ticks: 90,
          origin: { y: 0.45 },
          colors: ["#D36135", "#3E5641", "#D4A843", "#5A8AB5", "#FFFFFF"],
        });
      }, 220);
    }

    return () => {
      clearTimeout(scrollTimer);
      if (confettiTimer) clearTimeout(confettiTimer);
    };
  }, [runtime.isComplete, runtime.isWon]);

  const handleShare = React.useCallback(async () => {
    const langFlag = getLanguageFlag(puzzle.language);
    const emojiCells = runtime.results.slice(0, 18).map((ok) => (ok ? "🟩" : "🟥"));
    const rowOne = emojiCells.slice(0, 9).join("");
    const rowTwo = emojiCells.slice(9, 18).join("");
    const text = [
      `Neon Intercept #${puzzle.number} ${langFlag}`,
      `${ui.score}: ${runtime.score} · ${ui.combo}: ${runtime.maxCombo}x · ${ui.lives}: ${runtime.lives}`,
      `${ui.falseFriendsCaught}: ${runtime.falseFriendHits}`,
      "",
      rowOne,
      rowTwo,
      "",
      "tutorlingua.co/games/neon-intercept",
    ].join("\n");

    await shareResult(text, "Neon Intercept", setCopied, copyTimeoutRef);
  }, [runtime, puzzle.number, puzzle.language, ui]);

  const fallingOffsetPx = Math.round(waveProgress * FALL_DISTANCE_PX);
  const isDanger = timeLeftMs < 10_000;

  return (
    <div className="space-y-4">
      <div
        data-testid="neon-hud"
        className="rounded-2xl border px-4 py-3"
        style={{
          background: "var(--game-bg-surface)",
          borderColor: "rgba(45, 42, 38, 0.10)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="rounded-xl px-2 py-2" style={{ background: "var(--game-bg-elevated)" }}>
            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--game-text-muted)" }}>
              {ui.time}
            </p>
            <p
              className="text-lg font-bold tabular-nums"
              style={{ color: isDanger ? "var(--game-wrong)" : "var(--game-text-primary)" }}
            >
              {formatCountdown(timeLeftMs)}
            </p>
          </div>

          <div className="rounded-xl px-2 py-2" style={{ background: "var(--game-bg-elevated)" }}>
            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--game-text-muted)" }}>
              {ui.score}
            </p>
            <p className="text-lg font-bold tabular-nums" style={{ color: "var(--game-text-primary)" }}>
              {runtime.score}
            </p>
          </div>

          <div className="rounded-xl px-2 py-2" style={{ background: "var(--game-bg-elevated)" }}>
            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--game-text-muted)" }}>
              {ui.combo}
            </p>
            <p className="text-lg font-bold tabular-nums" style={{ color: "var(--game-streak)" }}>
              {runtime.combo}x
            </p>
          </div>

          <div className="rounded-xl px-2 py-2" style={{ background: "var(--game-bg-elevated)" }}>
            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--game-text-muted)" }}>
              {ui.lives}
            </p>
            <p className="text-lg font-bold tracking-tight" style={{ color: "var(--game-text-primary)" }}>
              {Array.from({ length: START_LIVES }).map((_, i) => (
                <span key={i}>{i < runtime.lives ? "❤️" : "🖤"}</span>
              ))}
            </p>
          </div>
        </div>
      </div>

      {!runtime.isComplete && (
      <div
        data-testid="neon-clue-card"
        className="rounded-2xl border px-4 py-3"
        style={{
          background: "var(--game-bg-surface)",
          borderColor: "rgba(45, 42, 38, 0.10)",
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className="rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wide"
            style={{
              background:
                currentWave.kind === "boss"
                  ? "rgba(211,97,53,0.14)"
                  : currentWave.kind === "false-friend"
                    ? "rgba(210, 73, 54, 0.12)"
                    : "rgba(62,86,65,0.12)",
              color:
                currentWave.kind === "boss"
                  ? "var(--game-streak)"
                  : currentWave.kind === "false-friend"
                    ? "var(--game-wrong)"
                    : "var(--game-correct)",
            }}
          >
            {currentWave.kind === "boss"
              ? ui.bossWave
              : currentWave.kind === "false-friend"
                ? ui.falseFriend
                : `CEFR ${currentWave.cefrLevel}`}
          </span>

          <span className="text-[12px] tabular-nums font-semibold" style={{ color: "var(--game-text-muted)" }}>
            {ui.wave} {(runtime.waveIndex % puzzle.waves.length) + 1}
          </span>
        </div>

        <p className="mt-2 text-[18px] font-bold leading-tight" style={{ color: "var(--game-text-primary)" }}>
          {currentWave.clue}
        </p>
      </div>
      )}

      {!runtime.isComplete && (
      <div
        data-testid="neon-arena"
        className="relative h-64 overflow-hidden rounded-2xl border"
        style={{
          background:
            "linear-gradient(180deg, rgba(90,138,181,0.08) 0%, rgba(245,237,232,0.75) 52%, rgba(245,237,232,1) 100%)",
          borderColor: "rgba(45, 42, 38, 0.10)",
        }}
      >
        <div className="absolute inset-x-3 top-2 h-2 rounded-full" style={{ background: "rgba(45,42,38,0.10)" }}>
          <div
            className="h-full rounded-full transition-[width] duration-75"
            style={{
              width: `${Math.max(0, 100 - waveProgress * 100)}%`,
              background: isDanger ? "var(--game-wrong)" : "var(--brand-primary)",
            }}
          />
        </div>

        <div className="absolute inset-x-3 top-6 grid h-36 grid-cols-3 gap-2">
          {currentWave.options.map((option, laneIndex) => {
            const isCorrectLane = laneIndex === currentWave.correctIndex;
            const isSelectedLane = selectedLane === laneIndex;
            const showSuccess = feedback === "correct" && isCorrectLane;
            const showFailure = feedback !== "idle" && isSelectedLane && !isCorrectLane;

            return (
              <div key={`falling-${laneIndex}`} className="relative overflow-hidden rounded-xl border"
                style={{
                  borderColor: "rgba(45,42,38,0.12)",
                  background: "rgba(255,255,255,0.65)",
                }}
              >
                <div
                  className="absolute inset-x-1 top-2 rounded-lg border px-1 py-2 text-center text-[12px] font-semibold leading-tight"
                  style={{
                    transform: `translate3d(0, ${fallingOffsetPx}px, 0)`,
                    transition: `transform ${LOOP_INTERVAL_MS}ms linear`,
                    willChange: "transform",
                    borderColor: showSuccess
                      ? "rgba(62,86,65,0.45)"
                      : showFailure
                        ? "rgba(162,73,54,0.45)"
                        : "rgba(45,42,38,0.14)",
                    background: showSuccess
                      ? "rgba(62,86,65,0.14)"
                      : showFailure
                        ? "rgba(162,73,54,0.14)"
                        : "rgba(255,255,255,0.92)",
                    color: "var(--game-text-primary)",
                  }}
                >
                  {option}
                </div>
              </div>
            );
          })}
        </div>

        <div className="absolute inset-x-3 bottom-3 grid grid-cols-3 gap-2">
          {currentWave.options.map((option, laneIndex) => (
            <button
              key={`lane-${laneIndex}`}
              onClick={() => resolveWave(laneIndex as LaneIndex, "tap")}
              data-testid={`lane-${laneIndex}`}
              disabled={!canInteract}
              className="min-h-[56px] rounded-xl border px-2 text-center text-[14px] font-semibold leading-snug touch-manipulation transition-all disabled:opacity-45"
              style={{
                borderColor: "rgba(45,42,38,0.14)",
                background: "var(--game-bg-surface)",
                color: "var(--game-text-primary)",
              }}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      )}

      {!runtime.isComplete && (
      <p
        className="rounded-xl px-3 py-2 text-center text-sm font-semibold"
        style={{
          background:
            feedback === "correct"
              ? "rgba(62,86,65,0.10)"
              : feedback === "idle"
                ? "rgba(45,42,38,0.06)"
                : "rgba(162,73,54,0.10)",
          color:
            feedback === "correct"
              ? "var(--game-correct)"
              : feedback === "idle"
                ? "var(--game-text-secondary)"
                : "var(--game-wrong)",
        }}
      >
        {getFeedbackText(feedback, ui)}
      </p>
      )}

      <AnimatePresence>
        {showResumeCard && !runtime.isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="rounded-2xl border p-4"
            style={{
              background: "var(--game-bg-surface)",
              borderColor: "rgba(45,42,38,0.12)",
            }}
          >
            <p className="text-sm font-semibold" style={{ color: "var(--game-text-primary)" }}>
              {ui.readyContinue}
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--game-text-muted)" }}>
              {ui.pausedBody}
            </p>
            <div className="mt-3">
              <GameButton
                variant="accent"
                onClick={() => {
                  setIsPaused(false);
                  setShowResumeCard(false);
                  setNowMs(Date.now());
                }}
              >
                {ui.continueRun}
              </GameButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {runtime.isComplete && (
          <div ref={resultRef} data-testid="neon-result" className="mt-5 space-y-3">
            <GameResultCard
              emoji={runtime.isWon ? "🚀" : "💪"}
              heading={runtime.isWon ? ui.runComplete : ui.goodRun}
              subtext={`${ui.score} ${runtime.score} · ${ui.hits} ${runtime.hits} · Max ${ui.combo.toLowerCase()} ${runtime.maxCombo}x`}
              timeSeconds={Math.floor(((runtime.endTime ?? Date.now()) - runtime.startTime) / 1000)}
            >
              <div className="text-xs font-medium" style={{ color: "var(--game-text-secondary)" }}>
                {ui.falseFriendsCaught}: {runtime.falseFriendHits}
              </div>
            </GameResultCard>

            {weakness && (
              <div
                className="rounded-xl border px-4 py-3 text-sm"
                style={{
                  background: "rgba(211,97,53,0.06)",
                  borderColor: "rgba(211,97,53,0.20)",
                  color: "var(--game-text-primary)",
                }}
              >
                <p className="font-semibold">{ui.practiceFocus}: {weakness.topic}</p>
                <p className="mt-1 text-xs" style={{ color: "var(--game-text-secondary)" }}>
                  {ui.missedInArea} {weakness.count} {ui.areaSuffix} {ui.practiceHintPrefix}
                </p>
              </div>
            )}

            <GameButton onClick={handleShare} data-testid="neon-share-button" variant="accent">
              {copied ? ui.copied : ui.shareResult}
            </GameButton>

            <GameButton
              onClick={() => setShowReview((prev) => !prev)}
              data-testid="neon-review-button"
              variant="outline"
            >
              {showReview ? ui.hideMisses : ui.reviewMisses}
            </GameButton>

            <AnimatePresence>
              {showReview && runtime.mistakes.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  {runtime.mistakes.slice(-6).map((mistake, idx) => (
                    <div
                      key={`${mistake.item}-${idx}`}
                      className="rounded-xl border px-3 py-2 text-xs"
                      style={{
                        background: "rgba(162,73,54,0.07)",
                        borderColor: "rgba(162,73,54,0.20)",
                      }}
                    >
                      <p className="font-semibold" style={{ color: "var(--game-text-primary)" }}>
                        {mistake.item}
                      </p>
                      <p style={{ color: "var(--game-text-secondary)" }}>
                        {ui.expected}: {mistake.expected}
                      </p>
                      <p style={{ color: "var(--game-text-muted)" }}>
                        {ui.yourPick}: {mistake.actual}
                      </p>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {onPlayAgain && (
              <GameButton onClick={onPlayAgain} data-testid="neon-play-again" variant="secondary">
                {ui.playAgain}
              </GameButton>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
