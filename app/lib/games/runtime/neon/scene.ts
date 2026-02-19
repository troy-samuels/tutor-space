import type * as PhaserTypes from "phaser";
import type { NeonInterceptPuzzle } from "@/lib/games/data/neon-intercept";
import type {
  NeonRuntimeCompletePayload,
  NeonRuntimeHudState,
} from "@/lib/games/runtime/types";
import {
  computeAdaptiveSpeedMs,
  deriveDifficultyTier,
  type RuntimeModeConfig,
} from "@/lib/games/runtime/modes";
import { buildNeonLayout } from "@/lib/games/runtime/neon/layout";
import { computeWaveScore, computeWaveScoreCeiling } from "@/lib/games/runtime/neon/scoring";

export interface NeonSceneOptions {
  puzzle: NeonInterceptPuzzle;
  modeConfig: RuntimeModeConfig;
  width: number;
  height: number;
  onHudUpdate: (hud: NeonRuntimeHudState) => void;
  onComplete: (payload: NeonRuntimeCompletePayload) => void;
  onFirstSuccess: (ms: number) => void;
  onFirstMeaningfulAction: (ms: number) => void;
  curveVersion: string;
  uiVersion: string;
}

type FeedbackState = "idle" | "correct" | "wrong" | "timeout";

type PhaserModule = typeof PhaserTypes;

const ARENA_COLORS = {
  shell: 0xf7f3ee,
  shellInset: 0xf0ebe3,
  shellStroke: 0x93aec2,
  topBandFill: 0xf3eee7,
  spawnFill: 0xe8eef4,
  laneBackdrop: 0xeff3f6,
  laneIdleFill: 0xf6f8fa,
  laneIdleStroke: 0x95afc1,
  laneGuideFill: 0xe9f1f8,
  laneGuideStroke: 0x4d7897,
  laneSuccessFill: 0xe0f3ea,
  laneSuccessStroke: 0x3f8b67,
  laneErrorFill: 0xfae8e6,
  laneErrorStroke: 0xb8635d,
  clueCore: "#223f52",
  clueBoss: "#6a5228",
  clueFalseFriend: "#5d4472",
  optionInk: "#2d4f67",
  ghostInk: "#5f7381",
} as const;

export function createNeonInterceptScene(
  Phaser: PhaserModule,
  options: NeonSceneOptions,
): PhaserTypes.Scene {
  const laneCount = 3;
  const layout = buildNeonLayout({
    width: options.width,
    height: options.height,
    laneCount,
  });

  class NeonInterceptScene extends Phaser.Scene {
    private laneRects: PhaserTypes.GameObjects.Rectangle[] = [];
    private laneLabels: PhaserTypes.GameObjects.Text[] = [];
    private dropText?: PhaserTypes.GameObjects.Text;
    private cluePlate?: PhaserTypes.GameObjects.Rectangle;
    private ghostCue?: PhaserTypes.GameObjects.Text;

    private waveIndex = 0;
    private lives = options.modeConfig.lives;
    private score = 0;
    private combo = 0;
    private maxCombo = 0;
    private hits = 0;
    private misses = 0;
    private falseFriendHits = 0;
    private maxScore = 0;
    private startedAt = 0;
    private firstCorrectMs: number | null = null;
    private firstMeaningfulActionMs: number | null = null;
    private replayed = false;
    private currentFeedback: FeedbackState = "idle";
    private currentSpeedMs = options.modeConfig.startSpeedMs;
    private isComplete = false;
    private onboardingLocked = true;
    private waveLocked = false;

    private currentWave = options.puzzle.waves[0];
    private currentDropY = layout.dropStartY;

    create() {
      this.startedAt = this.time.now;

      this.add.rectangle(
        options.width / 2,
        options.height / 2,
        options.width,
        options.height,
        ARENA_COLORS.shell,
        1,
      );

      this.add.rectangle(
        options.width / 2,
        options.height / 2,
        options.width - 10,
        options.height - 10,
        ARENA_COLORS.shellInset,
        1,
      ).setStrokeStyle(1, ARENA_COLORS.shellStroke, 0.24);

      this.add.rectangle(
        options.width / 2,
        (layout.topBandTop + layout.topBandBottom) / 2,
        options.width - 28,
        layout.topBandBottom - layout.topBandTop,
        ARENA_COLORS.topBandFill,
        0.66,
      ).setStrokeStyle(1, ARENA_COLORS.shellStroke, 0.22);

      this.cluePlate = this.add.rectangle(
        options.width / 2,
        (layout.spawnBandTop + layout.spawnBandBottom) / 2,
        options.width - 48,
        layout.spawnBandBottom - layout.spawnBandTop,
        ARENA_COLORS.spawnFill,
        0.74,
      ).setStrokeStyle(1, ARENA_COLORS.shellStroke, 0.32);

      this.add.rectangle(
        options.width / 2,
        layout.playfieldTop + layout.laneHeight / 2,
        options.width - 22,
        layout.laneHeight + 16,
        ARENA_COLORS.laneBackdrop,
        0.32,
      ).setStrokeStyle(1, ARENA_COLORS.shellStroke, 0.2);

      for (let i = 0; i < laneCount; i++) {
        const lane = layout.lanes[i];
        const y = layout.playfieldTop + layout.laneHeight / 2;
        const laneRect = this.add.rectangle(
          lane.x,
          y,
          lane.width,
          layout.laneHeight,
          ARENA_COLORS.laneIdleFill,
          0.96,
        )
          .setStrokeStyle(1, ARENA_COLORS.laneIdleStroke, 0.44)
          .setInteractive({ useHandCursor: true });

        laneRect.on("pointerdown", () => this.handleLaneTap(i as 0 | 1 | 2));
        this.laneRects.push(laneRect);

        const label = this.add.text(lane.x, layout.optionBaselineY, "", {
          color: ARENA_COLORS.optionInk,
          fontFamily: "Manrope, sans-serif",
          fontSize: "15px",
          fontStyle: "700",
          align: "center",
          wordWrap: { width: lane.width - 10 },
        }).setOrigin(0.5);
        this.laneLabels.push(label);
      }

      this.dropText = this.add.text(options.width / 2, layout.dropStartY, "", {
        color: ARENA_COLORS.clueCore,
        fontFamily: "Manrope, sans-serif",
        fontStyle: "700",
        fontSize: "24px",
        align: "center",
        wordWrap: { width: options.width - 44 },
      })
        .setOrigin(0.5)
        .setShadow(0, 2, "#f7f3ee", 8, false, true)
        .setDepth(3);

      this.ghostCue = this.add.text(options.width / 2, layout.optionBaselineY + 24, "Tap highlighted lane", {
        color: ARENA_COLORS.ghostInk,
        fontFamily: "Manrope, sans-serif",
        fontSize: "12px",
      }).setOrigin(0.5);

      this.spawnWave();

      this.time.addEvent({
        delay: 100,
        loop: true,
        callback: () => {
          if (this.isComplete) return;
          this.emitHud();
          const elapsedMs = this.time.now - this.startedAt;
          if (elapsedMs >= options.modeConfig.sessionMs) {
            this.finishRun(this.lives > 0 && this.hits > 0);
          }
        },
      });
    }

    update(_time: number, delta: number) {
      if (this.isComplete || this.waveLocked || !this.dropText) return;

      const elapsedMs = this.time.now - this.startedAt;
      const accuracy = this.hits + this.misses === 0 ? 1 : this.hits / (this.hits + this.misses);
      this.currentSpeedMs = computeAdaptiveSpeedMs({
        modeConfig: options.modeConfig,
        elapsedMs,
        accuracy,
        combo: this.combo,
      });

      const distance = layout.dropEndY - layout.dropStartY;
      const pxPerMs = distance / this.currentSpeedMs;
      this.currentDropY += pxPerMs * delta;
      this.dropText.setY(this.currentDropY);

      if (this.currentDropY >= layout.dropEndY) {
        this.resolveWave(null, "timeout");
      }
    }

    private spawnWave() {
      this.currentWave = options.puzzle.waves[this.waveIndex % options.puzzle.waves.length];
      this.currentDropY = layout.dropStartY;
      this.currentFeedback = "idle";
      this.waveLocked = false;

      const kind = this.currentWave.kind ?? "core";

      if (this.dropText) {
        this.dropText.setText(this.currentWave.clue);
        this.dropText.setY(layout.dropStartY);
        const clueColor = kind === "boss"
          ? ARENA_COLORS.clueBoss
          : kind === "false-friend"
            ? ARENA_COLORS.clueFalseFriend
            : ARENA_COLORS.clueCore;
        this.dropText.setColor(clueColor);
      }

      if (this.cluePlate) {
        const plateFill = kind === "boss"
          ? 0xf6ecdb
          : kind === "false-friend"
            ? 0xefe6f6
            : ARENA_COLORS.spawnFill;
        const plateStroke = kind === "boss"
          ? 0xb78f4b
          : kind === "false-friend"
            ? 0x8a6aa3
            : ARENA_COLORS.shellStroke;
        this.cluePlate.setFillStyle(plateFill, 0.94);
        this.cluePlate.setStrokeStyle(1, plateStroke, 0.36);
      }

      this.currentWave.options.forEach((option, idx) => {
        this.laneLabels[idx].setText(option);
      });

      this.laneRects.forEach((laneRect, idx) => {
        const isCorrectLane = idx === this.currentWave.correctIndex;
        const glow = this.onboardingLocked && isCorrectLane;
        laneRect.setScale(1);
        laneRect.setFillStyle(glow ? ARENA_COLORS.laneGuideFill : ARENA_COLORS.laneIdleFill, 0.96);
        laneRect.setStrokeStyle(1, glow ? ARENA_COLORS.laneGuideStroke : ARENA_COLORS.laneIdleStroke, glow ? 0.74 : 0.44);
      });

      if (this.ghostCue) {
        this.ghostCue.setVisible(this.onboardingLocked);
      }

      this.emitHud();
    }

    private handleLaneTap(index: 0 | 1 | 2) {
      if (this.waveLocked) return;
      this.resolveWave(index, "tap");
    }

    private resolveWave(index: 0 | 1 | 2 | null, source: "tap" | "timeout") {
      if (this.isComplete || this.waveLocked) return;

      if (source === "tap" && this.firstMeaningfulActionMs === null) {
        this.firstMeaningfulActionMs = this.time.now - this.startedAt;
        options.onFirstMeaningfulAction(this.firstMeaningfulActionMs);
      }

      const isCorrect = index !== null && index === this.currentWave.correctIndex;

      if (this.onboardingLocked && !isCorrect) {
        this.currentFeedback = source === "timeout" ? "timeout" : "wrong";
        this.combo = 0;
        this.waveLocked = true;
        this.waveIndex += 1;
        this.emitHud();

        this.time.delayedCall(260, () => {
          if (!this.isComplete) this.spawnWave();
        });
        return;
      }

      this.waveLocked = true;

      if (isCorrect) {
        if (index !== null) {
          this.pulseLane(index, true);
        }

        this.hits += 1;
        this.combo += 1;
        this.maxCombo = Math.max(this.maxCombo, this.combo);

        const points = computeWaveScore({
          combo: this.combo,
          kind: this.currentWave.kind ?? "core",
          modeConfig: options.modeConfig,
        });
        this.score += points;

        if (this.currentWave.kind === "false-friend") {
          this.falseFriendHits += 1;
        }

        if (this.firstCorrectMs === null) {
          this.firstCorrectMs = this.time.now - this.startedAt;
          options.onFirstSuccess(this.firstCorrectMs);
        }

        this.onboardingLocked = false;
        this.currentFeedback = "correct";
      } else {
        if (index !== null) {
          this.pulseLane(index, false);
        } else {
          this.pulseLane(this.currentWave.correctIndex, false);
        }
        this.misses += 1;
        this.combo = 0;
        this.currentFeedback = source === "timeout" ? "timeout" : "wrong";
        this.lives -= 1;
      }

      this.maxScore += computeWaveScoreCeiling(options.modeConfig);

      if (this.lives <= 0) {
        this.finishRun(false);
        return;
      }

      this.waveIndex += 1;
      this.time.delayedCall(260, () => {
        if (!this.isComplete) this.spawnWave();
      });
    }

    private pulseLane(index: number, isSuccess: boolean) {
      const laneRect = this.laneRects[index];
      if (!laneRect) return;

      if (isSuccess) {
        laneRect.setFillStyle(ARENA_COLORS.laneSuccessFill, 1);
        laneRect.setStrokeStyle(1, ARENA_COLORS.laneSuccessStroke, 0.78);
      } else {
        laneRect.setFillStyle(ARENA_COLORS.laneErrorFill, 1);
        laneRect.setStrokeStyle(1, ARENA_COLORS.laneErrorStroke, 0.72);
      }

      this.tweens.add({
        targets: laneRect,
        scaleX: 1.01,
        scaleY: 1.004,
        duration: 72,
        yoyo: true,
        ease: "Quad.out",
      });
    }

    private finishRun(isWon: boolean) {
      if (this.isComplete) return;
      this.isComplete = true;
      this.waveLocked = true;

      const elapsedMs = this.time.now - this.startedAt;
      const total = this.hits + this.misses;
      const accuracy = total === 0 ? 0 : Math.round((this.hits / total) * 100);
      const tier = deriveDifficultyTier({
        elapsedMs,
        sessionMs: options.modeConfig.sessionMs,
        accuracy: accuracy / 100,
        combo: this.maxCombo,
      });

      options.onComplete({
        score: this.score,
        maxScore: Math.max(this.maxScore, this.score),
        accuracy,
        mistakes: this.misses,
        maxCombo: this.maxCombo,
        falseFriendHits: this.falseFriendHits,
        timeMs: elapsedMs,
        isWon,
        replayed: this.replayed,
        tierReached: tier,
        firstCorrectMs: this.firstCorrectMs,
        firstMeaningfulActionMs: this.firstMeaningfulActionMs,
        curveVersion: options.curveVersion,
        uiVersion: options.uiVersion,
      });

      this.emitHud();
    }

    private emitHud() {
      const elapsedMs = this.time.now - this.startedAt;
      const total = this.hits + this.misses;
      const accuracy = total === 0 ? 1 : this.hits / total;
      const tier = deriveDifficultyTier({
        elapsedMs,
        sessionMs: options.modeConfig.sessionMs,
        accuracy,
        combo: this.combo,
      });

      options.onHudUpdate({
        timeLeftMs: Math.max(0, options.modeConfig.sessionMs - elapsedMs),
        score: this.score,
        lives: Math.max(0, this.lives),
        combo: this.combo,
        maxCombo: this.maxCombo,
        hits: this.hits,
        misses: this.misses,
        waveIndex: this.waveIndex,
        clue: this.currentWave.clue,
        options: this.currentWave.options,
        correctIndex: this.currentWave.correctIndex,
        isBoss: this.currentWave.kind === "boss",
        isFalseFriend: this.currentWave.kind === "false-friend",
        tier,
        feedback: this.currentFeedback,
        speedMs: this.currentSpeedMs,
      });
    }
  }

  return new NeonInterceptScene();
}
