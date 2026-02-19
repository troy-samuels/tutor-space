import type * as PhaserTypes from "phaser";
import type { RelaySprintPuzzle } from "@/lib/games/v3/data/relay-sprint";

type PhaserModule = typeof PhaserTypes;

export interface RelayHudState {
  score: number;
  streak: number;
  lives: number;
  clue: string;
  waveIndex: number;
  speedMs: number;
  feedback: "idle" | "correct" | "wrong" | "timeout";
}

interface RelaySceneOptions {
  puzzle: RelaySprintPuzzle;
  width: number;
  height: number;
  onHud: (hud: RelayHudState) => void;
  onMeaningfulAction: (ms: number) => void;
  onFirstCorrect: (ms: number) => void;
  onComplete: (payload: {
    score: number;
    mistakes: number;
    maxCombo: number;
    accuracy: number;
    timeMs: number;
  }) => void;
}

// ── Dark arcade palette ──
const BG_COLOR = 0x1a2634;
const LANE_COLOR = 0x1e2b36;
const LANE_BORDER = 0x2a3c4e;
const LANE_CORRECT_HIGHLIGHT = 0x253545;
const TEXT_PRIMARY = 0xf7f3ee;
const TEXT_CLUE = 0xf0a030;
const TEXT_OPTION = 0xc0bdd6;
const CORRECT_FLASH = 0x3da672;
const WRONG_FLASH = 0xe85d4a;

export function createRelaySprintScene(Phaser: PhaserModule, options: RelaySceneOptions): PhaserTypes.Scene {
  class RelayScene extends Phaser.Scene {
    private lanes: PhaserTypes.GameObjects.Rectangle[] = [];
    private labels: PhaserTypes.GameObjects.Text[] = [];
    private dropText?: PhaserTypes.GameObjects.Text;
    private clueBar?: PhaserTypes.GameObjects.Rectangle;

    private waveIndex = 0;
    private lives = 3;
    private score = 0;
    private combo = 0;
    private maxCombo = 0;
    private hits = 0;
    private misses = 0;
    private speedMs = 2600;
    private feedback: RelayHudState["feedback"] = "idle";
    private dropY = 0;
    private startedAt = 0;
    private firstActionFired = false;
    private firstCorrectFired = false;
    private locked = false;

    private get wave() {
      return options.puzzle.waves[this.waveIndex % options.puzzle.waves.length];
    }

    create() {
      this.startedAt = this.time.now;

      // Full dark background
      this.add.rectangle(
        options.width / 2,
        options.height / 2,
        options.width,
        options.height,
        BG_COLOR,
        1,
      );

      // Clue bar at top — amber accent zone
      this.clueBar = this.add
        .rectangle(options.width / 2, 36, options.width - 16, 44, LANE_COLOR, 1)
        .setStrokeStyle(1, TEXT_CLUE, 0.2);

      // Subtle centre line
      this.add.rectangle(options.width / 2, 280, 1, 340, LANE_BORDER, 0.15);

      const laneWidth = 96;
      const laneGap = 10;
      const totalWidth = 3 * laneWidth + 2 * laneGap;
      const firstX = (options.width - totalWidth) / 2 + laneWidth / 2;

      for (let i = 0; i < 3; i++) {
        const x = firstX + i * (laneWidth + laneGap);

        // Lane background
        const lane = this.add
          .rectangle(x, 310, laneWidth, 360, LANE_COLOR, 0.92)
          .setStrokeStyle(1, LANE_BORDER, 0.5)
          .setInteractive({ useHandCursor: true });
        lane.on("pointerdown", () => this.resolve(i as 0 | 1 | 2));
        this.lanes.push(lane);

        // Option text at bottom of lane
        const label = this.add
          .text(x, 475, "", {
            color: `#${TEXT_OPTION.toString(16).padStart(6, "0")}`,
            fontFamily: "Geist, Manrope, sans-serif",
            fontSize: "15px",
            fontStyle: "700",
            align: "center",
            wordWrap: { width: laneWidth - 8 },
          })
          .setOrigin(0.5);
        this.labels.push(label);
      }

      // Falling clue word
      this.dropText = this.add
        .text(options.width / 2, 80, "", {
          color: `#${TEXT_CLUE.toString(16).padStart(6, "0")}`,
          fontFamily: "Geist, Manrope, sans-serif",
          fontSize: "32px",
          fontStyle: "800",
        })
        .setOrigin(0.5);

      this.spawnWave();
    }

    update(_time: number, delta: number) {
      if (!this.dropText || this.locked || this.lives <= 0) return;

      const targetY = 438;
      const distance = targetY - 80;
      const pxPerMs = distance / this.speedMs;
      this.dropY += pxPerMs * delta;
      this.dropText.setY(this.dropY);

      // Approaching danger zone — text turns red
      if (this.dropY > 380) {
        this.dropText.setColor(
          `#${WRONG_FLASH.toString(16).padStart(6, "0")}`,
        );
      } else {
        this.dropText.setColor(
          `#${TEXT_CLUE.toString(16).padStart(6, "0")}`,
        );
      }

      if (this.dropY >= targetY) {
        this.resolve(null);
      }
    }

    private spawnWave() {
      if (!this.dropText) return;
      this.locked = false;
      this.feedback = "idle";
      this.dropY = 80;
      this.dropText.setText(this.wave.clue);
      this.dropText.setY(this.dropY);
      this.dropText.setAlpha(1);

      this.wave.options.forEach((option, index) => {
        this.labels[index].setText(option);
        this.labels[index].setColor(
          `#${TEXT_OPTION.toString(16).padStart(6, "0")}`,
        );
      });

      // Subtle hint on first combo-break (streak=0)
      this.lanes.forEach((lane, index) => {
        const guided = this.combo === 0 && index === this.wave.correctIndex;
        lane.setFillStyle(guided ? LANE_CORRECT_HIGHLIGHT : LANE_COLOR, 0.92);
        lane.setStrokeStyle(
          1,
          guided ? CORRECT_FLASH : LANE_BORDER,
          guided ? 0.35 : 0.5,
        );
      });

      this.emitHud();
    }

    private resolve(choice: 0 | 1 | 2 | null) {
      if (this.locked || this.lives <= 0) return;
      this.locked = true;

      if (!this.firstActionFired) {
        this.firstActionFired = true;
        options.onMeaningfulAction(this.time.now - this.startedAt);
      }

      const correct = choice !== null && choice === this.wave.correctIndex;

      if (correct) {
        this.feedback = "correct";
        this.score += 1;
        this.combo += 1;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        this.hits += 1;
        this.speedMs = Math.max(1400, this.speedMs - 75);

        // Flash correct lane
        if (choice !== null) {
          this.lanes[choice].setStrokeStyle(2, CORRECT_FLASH, 1);
          this.labels[choice].setColor(
            `#${CORRECT_FLASH.toString(16).padStart(6, "0")}`,
          );
          this.time.delayedCall(250, () => {
            if (this.lanes[choice]) {
              this.lanes[choice].setStrokeStyle(1, LANE_BORDER, 0.5);
            }
          });
        }

        if (!this.firstCorrectFired) {
          this.firstCorrectFired = true;
          options.onFirstCorrect(this.time.now - this.startedAt);
        }
      } else {
        this.feedback = choice === null ? "timeout" : "wrong";
        this.misses += 1;
        this.combo = 0;
        this.lives -= 1;
        this.speedMs = Math.min(2800, this.speedMs + 80);

        // Flash wrong lane
        if (choice !== null) {
          this.lanes[choice].setStrokeStyle(2, WRONG_FLASH, 1);
          this.labels[choice].setColor(
            `#${WRONG_FLASH.toString(16).padStart(6, "0")}`,
          );
          this.time.delayedCall(250, () => {
            if (this.lanes[choice]) {
              this.lanes[choice].setStrokeStyle(1, LANE_BORDER, 0.5);
            }
          });
        }

        // Highlight correct answer briefly
        const correctIdx = this.wave.correctIndex;
        this.labels[correctIdx].setColor(
          `#${CORRECT_FLASH.toString(16).padStart(6, "0")}`,
        );
        this.time.delayedCall(350, () => {
          this.labels[correctIdx].setColor(
            `#${TEXT_OPTION.toString(16).padStart(6, "0")}`,
          );
        });
      }

      this.emitHud();

      if (this.lives <= 0 || this.waveIndex >= options.puzzle.waves.length - 1) {
        // Fade out clue text
        if (this.dropText) {
          this.tweens.add({
            targets: this.dropText,
            alpha: 0,
            duration: 300,
          });
        }

        const total = this.hits + this.misses;
        const accuracy = total === 0 ? 0 : Math.round((this.hits / total) * 100);

        this.time.delayedCall(400, () => {
          options.onComplete({
            score: this.score,
            mistakes: this.misses,
            maxCombo: this.maxCombo,
            accuracy,
            timeMs: this.time.now - this.startedAt,
          });
        });
        return;
      }

      this.waveIndex += 1;
      this.time.delayedCall(280, () => this.spawnWave());
    }

    private emitHud() {
      options.onHud({
        score: this.score,
        streak: this.combo,
        lives: this.lives,
        clue: this.wave.clue,
        waveIndex: this.waveIndex,
        speedMs: this.speedMs,
        feedback: this.feedback,
      });
    }
  }

  return new RelayScene();
}
