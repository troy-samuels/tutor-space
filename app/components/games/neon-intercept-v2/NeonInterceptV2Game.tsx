"use client";

import * as React from "react";
import GameButton from "@/components/games/engine/GameButton";
import GameResultCard from "@/components/games/engine/GameResultCard";
import { shareResult } from "@/components/games/engine/share";
import { recordGamePlay } from "@/lib/games/streaks";
import { getLanguageFlag } from "@/lib/games/language-utils";
import { haptic } from "@/lib/games/haptics";
import { isTelegram } from "@/lib/telegram";
import {
  completeGameRun,
  startGameRun,
} from "@/lib/games/runtime/run-lifecycle";
import { createNeonInterceptScene } from "@/lib/games/runtime/neon/scene";
import { getModeConfig, type RuntimeModeConfig } from "@/lib/games/runtime/modes";
import type {
  DeviceClass,
  GameMode,
  NeonRuntimeCompletePayload,
  NeonRuntimeHudState,
} from "@/lib/games/runtime/types";
import type { NeonInterceptPuzzle } from "@/lib/games/data/neon-intercept";
import PhaserHost from "@/components/games/runtime/PhaserHost";
import styles from "./NeonInterceptV2Game.module.css";

const CURVE_VERSION = "neon-v2-phase-2026-02-19-r2";
const UI_VERSION = "neon-ui-lux-2026-02-19-r2";

const HUD_FEEDBACK_COPY: Record<NeonRuntimeHudState["feedback"], string> = {
  idle: "Stay locked in.",
  correct: "Clean hit.",
  wrong: "Missed lane.",
  timeout: "Too late.",
};

const TIER_COPY: Record<NeonRuntimeHudState["tier"], string> = {
  onboarding: "Onboarding",
  foundation: "Foundation",
  pressure: "Pressure",
  mastery: "Mastery",
};

function defaultHud(puzzle: NeonInterceptPuzzle): NeonRuntimeHudState {
  return {
    timeLeftMs: 0,
    score: 0,
    lives: 3,
    combo: 0,
    maxCombo: 0,
    hits: 0,
    misses: 0,
    waveIndex: 0,
    clue: puzzle.waves[0]?.clue || "",
    options: puzzle.waves[0]?.options || ["", "", ""],
    correctIndex: puzzle.waves[0]?.correctIndex || 0,
    isBoss: false,
    isFalseFriend: false,
    tier: "onboarding",
    feedback: "idle",
    speedMs: 0,
  };
}

function getDeviceClass(): DeviceClass {
  if (typeof window === "undefined") return "desktop";
  if (isTelegram()) return "telegram";
  return window.innerWidth < 800 ? "mobile" : "desktop";
}

function formatCountdown(ms: number): string {
  const sec = Math.max(0, Math.ceil(ms / 1000));
  const mins = Math.floor(sec / 60);
  const rem = sec % 60;
  return `${mins}:${String(rem).padStart(2, "0")}`;
}

interface NeonInterceptV2GameProps {
  puzzle: NeonInterceptPuzzle;
  mode: GameMode;
  onGameEnd?: (state: {
    isComplete: boolean;
    isWon: boolean;
    mistakes: number;
    score: number;
    maxCombo: number;
    falseFriendHits: number;
  }) => void;
  onRunStateChange?: (state: "running" | "complete") => void;
}

export default function NeonInterceptV2Game({
  puzzle,
  mode,
  onGameEnd,
  onRunStateChange,
}: NeonInterceptV2GameProps) {
  const [sessionNonce, setSessionNonce] = React.useState(0);
  const [hud, setHud] = React.useState<NeonRuntimeHudState>(() => defaultHud(puzzle));
  const [result, setResult] = React.useState<NeonRuntimeCompletePayload | null>(null);
  const [runId, setRunId] = React.useState<string>("local-boot");
  const [copied, setCopied] = React.useState(false);
  const [firstSuccessMs, setFirstSuccessMs] = React.useState<number | null>(null);
  const [firstMeaningfulActionMs, setFirstMeaningfulActionMs] = React.useState<number | null>(null);

  const runIdRef = React.useRef(runId);
  const runLiveRef = React.useRef(false);
  const resultRef = React.useRef<HTMLDivElement>(null);
  const copyTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    runIdRef.current = runId;
  }, [runId]);

  const clearCopyTimer = React.useCallback(() => {
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = null;
    }
  }, []);

  React.useEffect(() => clearCopyTimer, [clearCopyTimer]);

  const modeConfig: RuntimeModeConfig = React.useMemo(() => getModeConfig(mode), [mode]);
  const remainingRatio = Math.max(0, Math.min(1, hud.timeLeftMs / modeConfig.sessionMs));
  const accuracy = hud.hits + hud.misses === 0
    ? 100
    : Math.round((hud.hits / (hud.hits + hud.misses)) * 100);
  const lives = Array.from({ length: modeConfig.lives });

  const sceneKey = React.useMemo(
    () => `${puzzle.language}-${puzzle.number}-${mode}-${sessionNonce}`,
    [puzzle.language, puzzle.number, mode, sessionNonce],
  );

  React.useEffect(() => {
    let mounted = true;

    setResult(null);
    setFirstSuccessMs(null);
    setFirstMeaningfulActionMs(null);
    runLiveRef.current = false;
    setHud(defaultHud(puzzle));

    void startGameRun({
      gameSlug: "neon-intercept",
      mode,
      language: puzzle.language as "en" | "es" | "fr" | "de",
      deviceClass: getDeviceClass(),
    })
      .then((response) => {
        if (!mounted) return;
        setRunId(response.runId);
      })
      .catch(() => {
        if (!mounted) return;
        setRunId(`local-${crypto.randomUUID()}`);
      });

    return () => {
      mounted = false;
    };
  }, [sceneKey, puzzle, mode]);

  const handleComplete = React.useCallback(
    (payload: NeonRuntimeCompletePayload) => {
      setResult(payload);
      onRunStateChange?.("complete");
      runLiveRef.current = false;

      if (payload.isWon) {
        recordGamePlay("neon-intercept");
        haptic("success");
      } else {
        haptic("gameOver");
      }

      onGameEnd?.({
        isComplete: true,
        isWon: payload.isWon,
        mistakes: payload.mistakes,
        score: payload.score,
        maxCombo: payload.maxCombo,
        falseFriendHits: payload.falseFriendHits,
      });

      void completeGameRun({
        runId: runIdRef.current,
        score: payload.score,
        maxScore: payload.maxScore,
        accuracy: payload.accuracy,
        timeMs: payload.timeMs,
        mistakes: payload.mistakes,
        maxCombo: payload.maxCombo,
        falseFriendHits: payload.falseFriendHits,
        firstCorrectMs: payload.firstCorrectMs,
        firstMeaningfulActionMs: payload.firstMeaningfulActionMs,
        curveVersion: payload.curveVersion,
        uiVersion: payload.uiVersion,
        replayed: payload.replayed,
        tierReached: payload.tierReached,
        metadata: {
          puzzleNumber: puzzle.number,
          language: puzzle.language,
          mode,
        },
      }).catch(() => {
        // Local fallback is intentional when auth/service role is unavailable.
      });

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 220);
    },
    [mode, onGameEnd, onRunStateChange, puzzle.language, puzzle.number],
  );

  const sceneFactory = React.useCallback(
    (Phaser: typeof import("phaser")) => createNeonInterceptScene(Phaser, {
      puzzle,
      modeConfig,
      width: 360,
      height: 520,
      onHudUpdate: setHud,
      onComplete: handleComplete,
      onFirstSuccess: (ms) => setFirstSuccessMs(ms),
      onFirstMeaningfulAction: (ms) => {
        setFirstMeaningfulActionMs(ms);
        if (!runLiveRef.current) {
          runLiveRef.current = true;
          onRunStateChange?.("running");
        }
      },
      curveVersion: CURVE_VERSION,
      uiVersion: UI_VERSION,
    }),
    [handleComplete, modeConfig, onRunStateChange, puzzle],
  );

  const handleReplay = React.useCallback(() => {
    setSessionNonce((prev) => prev + 1);
  }, []);

  const handleShare = React.useCallback(async () => {
    if (!result) return;

    const flag = getLanguageFlag(puzzle.language);
    const text = [
      `Neon Intercept #${puzzle.number} ${flag}`,
      `${modeConfig.label} · Score ${result.score} · Accuracy ${result.accuracy}%`,
      `Combo ${result.maxCombo}x · False Friends ${result.falseFriendHits}`,
      `First action: ${firstMeaningfulActionMs ?? "n/a"}ms · First success: ${firstSuccessMs ?? "n/a"}ms`,
      "",
      "tutorlingua.co/games/neon-intercept",
    ].join("\n");

    await shareResult(text, "Neon Intercept", setCopied, copyTimeoutRef);
  }, [result, puzzle.language, puzzle.number, modeConfig.label, firstMeaningfulActionMs, firstSuccessMs]);

  return (
    <div className={styles.shell}>
      <section className={styles.controlPanel} data-testid="neon-v2-hud">
        <div className={styles.headerRow}>
          <span className={styles.modeTag}>{modeConfig.label}</span>
          <span className={styles.tierTag}>{TIER_COPY[hud.tier]}</span>
        </div>

        <div className={styles.progressTrack} aria-hidden>
          <div className={styles.progressFill} style={{ width: `${Math.round(remainingRatio * 100)}%` }} />
        </div>

        <div className={styles.metricGrid}>
          <div className={cnMetric(styles.metricCard, styles.metricPrimary)}>
            <p className={styles.metricLabel}>Time</p>
            <p className={styles.metricValue}>{formatCountdown(hud.timeLeftMs)}</p>
          </div>
          <div className={cnMetric(styles.metricCard, styles.metricSecondary)}>
            <p className={styles.metricLabel}>Score</p>
            <p className={styles.metricValueSecondary}>{hud.score}</p>
          </div>
          <div className={cnMetric(styles.metricCard, styles.metricSecondary)}>
            <p className={styles.metricLabel}>Combo</p>
            <p className={styles.metricValueAccent}>{hud.combo}x</p>
          </div>
          <div className={cnMetric(styles.metricCard, styles.metricPrimary)}>
            <p className={styles.metricLabel}>Lives</p>
            <div className={styles.livesRow} aria-label={`${hud.lives} lives remaining`}>
              {lives.map((_, i) => (
                <span key={i} className={styles.lifeDot} data-active={i < hud.lives ? "true" : "false"} />
              ))}
            </div>
          </div>
        </div>

        <div className={styles.feedbackRow}>
          <p className={styles.feedbackText} data-feedback={hud.feedback} aria-live="polite">
            {HUD_FEEDBACK_COPY[hud.feedback]}
          </p>
          <p className={styles.feedbackMeta}>
            Wave {hud.waveIndex + 1} · {Math.round(hud.speedMs)}ms
          </p>
        </div>
      </section>

      <section className={styles.viewportPanel}>
        <PhaserHost
          sceneFactory={sceneFactory}
          sceneKey={sceneKey}
          width={360}
          height={520}
          className={styles.viewportHost}
        />
      </section>

      {result && (
        <section ref={resultRef} className={styles.resultSection}>
          <GameResultCard
            emoji={result.isWon ? "🏆" : "⚡"}
            heading={result.isWon ? "Run Complete" : "Run Over"}
            subtext={`Score ${result.score} · Accuracy ${result.accuracy}% · Tier ${result.tierReached}`}
            timeSeconds={Math.floor(result.timeMs / 1000)}
          />

          <div className={styles.resultStats}>
            <Stat label="Accuracy" value={`${result.accuracy}%`} />
            <Stat label="False Friends" value={String(result.falseFriendHits)} />
            <Stat label="Top Combo" value={`${result.maxCombo}x`} />
            <Stat label="First Action" value={firstMeaningfulActionMs === null ? "--" : `${firstMeaningfulActionMs}ms`} />
          </div>

          <div className={styles.actionRow}>
            <GameButton
              onClick={handleShare}
              variant="accent"
              data-testid="neon-v2-share"
              fullWidth={false}
              className={styles.actionButton}
            >
              {copied ? "Copied" : "Share Run"}
            </GameButton>
            <GameButton
              onClick={handleReplay}
              variant="outline"
              data-testid="neon-v2-replay"
              fullWidth={false}
              className={styles.actionButton}
            >
              Replay
            </GameButton>
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.resultStat}>
      <p className={styles.resultStatLabel}>{label}</p>
      <p className={styles.resultStatValue}>{value}</p>
    </div>
  );
}

function cnMetric(base: string, extra?: string): string {
  return extra ? `${base} ${extra}` : base;
}
