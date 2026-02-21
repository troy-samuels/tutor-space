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
const BG = 0x1a2634;
const CATCHER_FILL = 0x1e2b36;
const CATCHER_BORDER = 0x2a3c4e;
const CATCHER_WALL = 0x344a5e;
const TEXT_CLUE = 0xf0a030;
const TEXT_OPTION = 0xc0bdd6;
const CORRECT_COLOR = 0x3da672;
const WRONG_COLOR = 0xe85d4a;
const GUIDE_COLOR = 0x2a3c4e;
const GLOW_BG = 0x3a2a10;

// ── Layout constants (360×520) ──
const W = 360;
const CLUE_Y = 42;
const DROP_START_Y = 80;
const CATCHER_TOP_Y = 370;
const CATCHER_W = 100;
const CATCHER_H = 70;
const CATCHER_GAP = 12;
const TOTAL_CATCHERS_W = 3 * CATCHER_W + 2 * CATCHER_GAP; // 324
const FIRST_CATCHER_X = (W - TOTAL_CATCHERS_W) / 2 + CATCHER_W / 2; // 68
const WALL_THICKNESS = 6;
const WALL_HEIGHT = 14;

interface CatcherGroup {
  base: PhaserTypes.GameObjects.Rectangle;
  wallL: PhaserTypes.GameObjects.Rectangle;
  wallR: PhaserTypes.GameObjects.Rectangle;
  floor: PhaserTypes.GameObjects.Rectangle;
  label: PhaserTypes.GameObjects.Text;
  hintGlow: PhaserTypes.GameObjects.Rectangle;
  hitZone: PhaserTypes.GameObjects.Rectangle;
  cx: number;
  cy: number;
}

export function createRelaySprintScene(
  Phaser: PhaserModule,
  options: RelaySceneOptions,
): PhaserTypes.Scene {
  class RelayScene extends Phaser.Scene {
    private catchers: CatcherGroup[] = [];
    private dropText?: PhaserTypes.GameObjects.Text;
    private dropGlow?: PhaserTypes.GameObjects.Rectangle;
    private clueLabel?: PhaserTypes.GameObjects.Text;
    private guideLine?: PhaserTypes.GameObjects.Rectangle;

    private waveIndex = 0;
    private lives = 3;
    private score = 0;
    private combo = 0;
    private maxCombo = 0;
    private hits = 0;
    private misses = 0;
    private speedMs = 2600;
    private feedback: RelayHudState["feedback"] = "idle";
    private dropY = DROP_START_Y;
    private startedAt = 0;
    private firstActionFired = false;
    private firstCorrectFired = false;
    private locked = false;
    private hintWavesRemaining = 3;

    private get wave() {
      return options.puzzle.waves[this.waveIndex % options.puzzle.waves.length];
    }

    create() {
      this.startedAt = this.time.now;

      // Full dark background
      this.add.rectangle(W / 2, options.height / 2, W, options.height, BG, 1);

      // ── Clue zone: subtle bar + label ──
      this.add
        .rectangle(W / 2, CLUE_Y, W - 24, 40, CATCHER_FILL, 0.8)
        .setStrokeStyle(1, TEXT_CLUE, 0.15);

      this.clueLabel = this.add
        .text(W / 2, CLUE_Y, "", {
          color: "#f0a030",
          fontFamily: "Geist, Manrope, sans-serif",
          fontSize: "13px",
          fontStyle: "700",
        })
        .setOrigin(0.5)
        .setAlpha(0.6);

      // ── Subtle vertical guide line ──
      this.guideLine = this.add.rectangle(
        W / 2,
        (DROP_START_Y + CATCHER_TOP_Y) / 2,
        1,
        CATCHER_TOP_Y - DROP_START_Y - 20,
        GUIDE_COLOR,
        0.12,
      );

      // ── Build 3 catchers ──
      for (let i = 0; i < 3; i++) {
        const cx = FIRST_CATCHER_X + i * (CATCHER_W + CATCHER_GAP);
        const cy = CATCHER_TOP_Y + CATCHER_H / 2;

        // Hint glow (behind everything, pulsing for onboarding)
        const hintGlow = this.add
          .rectangle(cx, cy, CATCHER_W + 6, CATCHER_H + 6, CORRECT_COLOR, 0)
          .setStrokeStyle(2, CORRECT_COLOR, 0);

        // Main base (the "cup" body)
        const base = this.add.rectangle(
          cx,
          cy,
          CATCHER_W,
          CATCHER_H,
          CATCHER_FILL,
          0.95,
        );
        base.setStrokeStyle(1.5, CATCHER_BORDER, 0.6);

        // Floor highlight (slightly brighter bottom to give depth)
        const floor = this.add.rectangle(
          cx,
          cy + CATCHER_H / 2 - 3,
          CATCHER_W - WALL_THICKNESS * 2,
          6,
          CATCHER_BORDER,
          0.3,
        );

        // Left wall (raised above the base top)
        const wallL = this.add.rectangle(
          cx - CATCHER_W / 2 + WALL_THICKNESS / 2,
          cy - CATCHER_H / 2 - WALL_HEIGHT / 2 + 2,
          WALL_THICKNESS,
          WALL_HEIGHT,
          CATCHER_WALL,
          0.9,
        );

        // Right wall
        const wallR = this.add.rectangle(
          cx + CATCHER_W / 2 - WALL_THICKNESS / 2,
          cy - CATCHER_H / 2 - WALL_HEIGHT / 2 + 2,
          WALL_THICKNESS,
          WALL_HEIGHT,
          CATCHER_WALL,
          0.9,
        );

        // Option label (centred in catcher)
        const label = this.add
          .text(cx, cy + 4, "", {
            color: `#${TEXT_OPTION.toString(16).padStart(6, "0")}`,
            fontFamily: "Geist, Manrope, sans-serif",
            fontSize: "14px",
            fontStyle: "700",
            align: "center",
            wordWrap: { width: CATCHER_W - 14 },
          })
          .setOrigin(0.5);

        // Invisible interactive hit zone (covers catcher + walls)
        const hitZone = this.add
          .rectangle(cx, cy - 4, CATCHER_W + 8, CATCHER_H + WALL_HEIGHT + 8, 0x000000, 0)
          .setInteractive({ useHandCursor: true });
        hitZone.on("pointerdown", () => this.resolve(i as 0 | 1 | 2));

        this.catchers.push({ base, wallL, wallR, floor, label, hintGlow, hitZone, cx, cy });
      }

      // ── Falling word (amber glow + text) ──
      this.dropGlow = this.add
        .rectangle(W / 2, DROP_START_Y, 10, 36, GLOW_BG, 0.5)
        .setOrigin(0.5);

      this.dropText = this.add
        .text(W / 2, DROP_START_Y, "", {
          color: "#f0a030",
          fontFamily: "Geist, Manrope, sans-serif",
          fontSize: "28px",
          fontStyle: "800",
        })
        .setOrigin(0.5);

      this.spawnWave();
    }

    update(_time: number, delta: number) {
      if (!this.dropText || !this.dropGlow || this.locked || this.lives <= 0) return;

      // Gravity-like fall
      const targetY = CATCHER_TOP_Y + CATCHER_H + 40; // past catchers = timeout
      const distance = targetY - DROP_START_Y;
      const pxPerMs = distance / this.speedMs;
      this.dropY += pxPerMs * delta;

      this.dropText.setY(this.dropY);
      this.dropGlow.setY(this.dropY);

      // Approaching danger — text goes red
      if (this.dropY > CATCHER_TOP_Y - 20) {
        this.dropText.setColor("#e85d4a");
      } else {
        this.dropText.setColor("#f0a030");
      }

      if (this.dropY >= targetY) {
        this.resolve(null); // timeout
      }
    }

    private spawnWave() {
      if (!this.dropText || !this.dropGlow) return;
      this.locked = false;
      this.feedback = "idle";
      this.dropY = DROP_START_Y;

      // Set clue label
      if (this.clueLabel) {
        this.clueLabel.setText(`translate: ${this.wave.clue}`);
      }

      // Set drop text
      this.dropText.setText(this.wave.clue);
      this.dropText.setY(this.dropY);
      this.dropText.setAlpha(1);
      this.dropText.setScale(1);
      this.dropText.setColor("#f0a030");

      // Size the glow behind the text
      const tw = this.dropText.width + 24;
      this.dropGlow.setSize(tw, 38);
      this.dropGlow.setY(this.dropY);
      this.dropGlow.setAlpha(0.5);

      // Update catchers
      this.wave.options.forEach((option, idx) => {
        const c = this.catchers[idx];
        c.label.setText(option);
        c.label.setColor(`#${TEXT_OPTION.toString(16).padStart(6, "0")}`);
        c.base.setFillStyle(CATCHER_FILL, 0.95);
        c.base.setStrokeStyle(1.5, CATCHER_BORDER, 0.6);
      });

      // Onboarding hints: pulse the correct catcher
      this.updateHints();
      this.emitHud();
    }

    private updateHints() {
      const showHint = this.hintWavesRemaining > 0 && this.combo === 0;
      for (let i = 0; i < 3; i++) {
        const c = this.catchers[i];
        if (showHint && i === this.wave.correctIndex) {
          // Subtle pulsing glow on correct catcher
          c.hintGlow.setStrokeStyle(2, CORRECT_COLOR, 0.35);
          this.tweens.add({
            targets: c.hintGlow,
            alpha: { from: 0.2, to: 0.5 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
          });
        } else {
          this.tweens.killTweensOf(c.hintGlow);
          c.hintGlow.setAlpha(0);
          c.hintGlow.setStrokeStyle(2, CORRECT_COLOR, 0);
        }
      }
    }

    private resolve(choice: 0 | 1 | 2 | null) {
      if (this.locked || this.lives <= 0) return;
      this.locked = true;

      if (!this.firstActionFired) {
        this.firstActionFired = true;
        options.onMeaningfulAction(this.time.now - this.startedAt);
      }

      const correct = choice !== null && choice === this.wave.correctIndex;
      const correctIdx = this.wave.correctIndex;

      if (choice === null) {
        // ── TIMEOUT: word falls through ──
        this.feedback = "timeout";
        this.misses += 1;
        this.combo = 0;
        this.lives -= 1;
        this.speedMs = Math.min(2800, this.speedMs + 80);

        // Word falls off screen
        if (this.dropText && this.dropGlow) {
          this.tweens.add({
            targets: [this.dropText, this.dropGlow],
            y: options.height + 40,
            alpha: 0,
            duration: 400,
            ease: "Quad.easeIn",
          });
        }

        // Flash correct catcher green briefly
        this.flashCatcher(correctIdx, CORRECT_COLOR, 400);
        this.emitHud();
        this.advanceOrEnd();
        return;
      }

      const tappedCatcher = this.catchers[choice];

      if (correct) {
        // ── CORRECT: word accelerates into catcher and lands ──
        this.feedback = "correct";
        this.score += 1;
        this.combo += 1;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        this.hits += 1;
        this.speedMs = Math.max(1400, this.speedMs - 75);

        // Reduce hint count
        if (this.hintWavesRemaining > 0) {
          this.hintWavesRemaining -= 1;
        }

        if (!this.firstCorrectFired) {
          this.firstCorrectFired = true;
          options.onFirstCorrect(this.time.now - this.startedAt);
        }

        // Animate word into catcher centre
        const landY = tappedCatcher.cy + 4;
        if (this.dropText && this.dropGlow) {
          // Word flies to catcher
          this.tweens.add({
            targets: this.dropText,
            x: tappedCatcher.cx,
            y: landY - 6, // slight overshoot for bounce
            duration: 150,
            ease: "Quad.easeIn",
            onComplete: () => {
              // Bounce settle
              if (this.dropText) {
                this.tweens.add({
                  targets: this.dropText,
                  y: landY,
                  scaleX: 0.85,
                  scaleY: 0.85,
                  duration: 120,
                  ease: "Bounce.easeOut",
                });
              }
            },
          });

          // Fade glow during flight
          this.tweens.add({
            targets: this.dropGlow,
            x: tappedCatcher.cx,
            y: landY,
            alpha: 0,
            duration: 150,
            ease: "Quad.easeIn",
          });
        }

        // Flash catcher green
        this.flashCatcher(choice, CORRECT_COLOR, 350);

      } else {
        // ── WRONG: word hits wrong catcher and breaks apart ──
        this.feedback = "wrong";
        this.misses += 1;
        this.combo = 0;
        this.lives -= 1;
        this.speedMs = Math.min(2800, this.speedMs + 80);

        // Word flies to wrong catcher
        const landY = tappedCatcher.cy;
        if (this.dropText && this.dropGlow) {
          this.tweens.add({
            targets: this.dropText,
            x: tappedCatcher.cx,
            y: landY,
            duration: 130,
            ease: "Quad.easeIn",
            onComplete: () => {
              // "Break apart" — scale down and fade
              if (this.dropText) {
                this.tweens.add({
                  targets: this.dropText,
                  scaleX: 1.3,
                  scaleY: 0.2,
                  alpha: 0,
                  duration: 200,
                  ease: "Quad.easeOut",
                });
              }
            },
          });

          this.tweens.add({
            targets: this.dropGlow,
            x: tappedCatcher.cx,
            y: landY,
            alpha: 0,
            duration: 130,
            ease: "Quad.easeIn",
          });
        }

        // Flash wrong catcher red, correct catcher green
        this.flashCatcher(choice, WRONG_COLOR, 350);
        this.shakeCatcher(choice);
        this.flashCatcher(correctIdx, CORRECT_COLOR, 500);
      }

      this.emitHud();
      this.advanceOrEnd();
    }

    private flashCatcher(idx: number, color: number, duration: number) {
      const c = this.catchers[idx];
      c.base.setStrokeStyle(2.5, color, 1);
      c.base.setFillStyle(color, 0.15);
      c.label.setColor(`#${color.toString(16).padStart(6, "0")}`);
      this.time.delayedCall(duration, () => {
        c.base.setStrokeStyle(1.5, CATCHER_BORDER, 0.6);
        c.base.setFillStyle(CATCHER_FILL, 0.95);
        c.label.setColor(`#${TEXT_OPTION.toString(16).padStart(6, "0")}`);
      });
    }

    private shakeCatcher(idx: number) {
      const c = this.catchers[idx];
      const origX = c.cx;
      this.tweens.add({
        targets: [c.base, c.wallL, c.wallR, c.floor, c.label, c.hitZone],
        x: { from: origX - 4, to: origX + 4 },
        duration: 50,
        yoyo: true,
        repeat: 3,
        ease: "Sine.easeInOut",
        onComplete: () => {
          // Reset positions
          c.base.setX(origX);
          c.label.setX(origX);
          c.hitZone.setX(origX);
          c.floor.setX(origX);
          c.wallL.setX(origX - CATCHER_W / 2 + WALL_THICKNESS / 2);
          c.wallR.setX(origX + CATCHER_W / 2 - WALL_THICKNESS / 2);
        },
      });
    }

    private advanceOrEnd() {
      if (this.lives <= 0 || this.waveIndex >= options.puzzle.waves.length - 1) {
        const total = this.hits + this.misses;
        const accuracy = total === 0 ? 0 : Math.round((this.hits / total) * 100);

        this.time.delayedCall(500, () => {
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
      this.time.delayedCall(280, () => {
        // Reset drop position for new wave
        if (this.dropText) {
          this.dropText.setX(W / 2);
          this.dropText.setScale(1);
          this.dropText.setAlpha(1);
        }
        if (this.dropGlow) {
          this.dropGlow.setX(W / 2);
          this.dropGlow.setAlpha(0.5);
        }
        this.spawnWave();
      });
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
