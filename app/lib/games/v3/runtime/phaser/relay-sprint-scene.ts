import type * as PhaserTypes from "phaser";
import type { RelaySprintPuzzle } from "@/lib/games/v3/data/relay-sprint";
import {
  sfxCorrect,
  sfxWrong,
  sfxDrop,
  sfxCombo,
  sfxTimeout,
  sfxGameOver,
} from "./relay-audio";

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
  audioEnabled: boolean;
  onHud: (hud: RelayHudState) => void;
  onMeaningfulAction: (ms: number) => void;
  onFirstCorrect: (ms: number) => void;
  onStreakMilestone: (streak: number) => void;
  onComplete: (payload: {
    score: number;
    mistakes: number;
    maxCombo: number;
    accuracy: number;
    timeMs: number;
  }) => void;
}

// ── Palette ──
const BG_START = 0x1a2634;
const BG_MID = 0x1e1a34;
const BG_END = 0x2a1424;
const CATCHER_BODY = 0x1e2b3a;
const CATCHER_INNER = 0x162230;
const CATCHER_RIM = 0x3a5068;
const CATCHER_HIGHLIGHT = 0x4a6a88;
const AMBER = 0xf0a030;
const AMBER_DIM = 0xb87a20;
const GOLD_PARTICLE = 0xffd060;
const CORAL = 0xe85d4a;
const GREEN = 0x3da672;
const GREEN_BRIGHT = 0x50d890;
const WHITE = 0xf7f3ee;
const MUTED = 0x4a5c6c;
const DUST = 0x3a4c5c;

// ── Layout (360×520) ──
const W = 360;
const H = 520;
const DROP_START_Y = 56;
const CATCHER_TOP_Y = 380;
const CATCHER_W = 98;
const CATCHER_H = 60;
const CATCHER_RIM_H = 8;
const CATCHER_GAP = 12;
const TOTAL_W = 3 * CATCHER_W + 2 * CATCHER_GAP;
const FIRST_CX = (W - TOTAL_W) / 2 + CATCHER_W / 2;
const FLOOR_Y = CATCHER_TOP_Y + CATCHER_H + 50;

// ── Streak milestones ──
const STREAK_MILESTONES = [3, 5, 8, 12];

interface Catcher {
  body: PhaserTypes.GameObjects.Graphics;
  label: PhaserTypes.GameObjects.Text;
  glowRing: PhaserTypes.GameObjects.Graphics;
  hitZone: PhaserTypes.GameObjects.Rectangle;
  cx: number;
  cy: number;
}

export function createRelaySprintScene(
  Phaser: PhaserModule,
  options: RelaySceneOptions,
): PhaserTypes.Scene {
  const audio = options.audioEnabled;

  class RelayScene extends Phaser.Scene {
    // ── Game objects ──
    private catchers: Catcher[] = [];
    private dropWord?: PhaserTypes.GameObjects.Text;
    private dropShadow?: PhaserTypes.GameObjects.Ellipse;
    private dropTrail: PhaserTypes.GameObjects.Ellipse[] = [];
    private bgRect?: PhaserTypes.GameObjects.Rectangle;
    private dustParticles: PhaserTypes.GameObjects.Ellipse[] = [];
    private dangerVignette?: PhaserTypes.GameObjects.Graphics;
    private clueLabel?: PhaserTypes.GameObjects.Text;
    private clueBg?: PhaserTypes.GameObjects.Graphics;
    private waveProgress?: PhaserTypes.GameObjects.Graphics;

    // ── State ──
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
    private hintWavesRemaining = 2;
    private trailTimer = 0;
    private lastMilestoneStreak = 0;

    private get wave() {
      return options.puzzle.waves[this.waveIndex % options.puzzle.waves.length];
    }

    private get waveProgress01() {
      return this.waveIndex / Math.max(1, options.puzzle.waves.length - 1);
    }

    create() {
      this.startedAt = this.time.now;

      // ── Background ──
      this.bgRect = this.add.rectangle(W / 2, H / 2, W, H, BG_START);

      // ── Atmospheric dust particles ──
      for (let i = 0; i < 20; i++) {
        const x = Phaser.Math.Between(10, W - 10);
        const y = Phaser.Math.Between(10, H - 10);
        const r = Phaser.Math.FloatBetween(1, 2.5);
        const dot = this.add.ellipse(x, y, r, r, DUST, 0.15);
        this.dustParticles.push(dot);
        // Drift upward slowly
        this.tweens.add({
          targets: dot,
          y: y - Phaser.Math.Between(40, 100),
          alpha: { from: 0.15, to: 0 },
          duration: Phaser.Math.Between(4000, 8000),
          ease: "Sine.easeInOut",
          repeat: -1,
          yoyo: true,
        });
      }

      // ── Danger vignette (intensifies as waves progress) ──
      this.dangerVignette = this.add.graphics();
      this.drawVignette(0);

      // ── Wave progress bar (thin line at very top) ──
      this.waveProgress = this.add.graphics();
      this.drawWaveProgress();

      // ── Clue zone ──
      this.clueBg = this.add.graphics();
      this.clueBg.fillStyle(0x141c24, 0.7);
      this.clueBg.fillRoundedRect(24, 18, W - 48, 36, 8);
      this.clueBg.lineStyle(1, AMBER, 0.15);
      this.clueBg.strokeRoundedRect(24, 18, W - 48, 36, 8);

      this.clueLabel = this.add
        .text(W / 2, 36, "", {
          color: "#f0a030",
          fontFamily: "'Plus Jakarta Sans', Geist, sans-serif",
          fontSize: "12px",
          fontStyle: "700",
        })
        .setOrigin(0.5)
        .setAlpha(0.7);

      // ── Build 3 catchers ──
      for (let i = 0; i < 3; i++) {
        const cx = FIRST_CX + i * (CATCHER_W + CATCHER_GAP);
        const cy = CATCHER_TOP_Y + CATCHER_H / 2;

        // Glow ring (behind everything)
        const glowRing = this.add.graphics();
        glowRing.setAlpha(0);

        // Catcher body (drawn as graphics for trapezoid cup shape)
        const body = this.add.graphics();
        this.drawCatcher(body, cx, cy, CATCHER_BODY, CATCHER_RIM, 1);

        // Option label
        const label = this.add
          .text(cx, cy + 6, "", {
            color: "#c0bdd6",
            fontFamily: "'Plus Jakarta Sans', Geist, sans-serif",
            fontSize: "14px",
            fontStyle: "700",
            align: "center",
            wordWrap: { width: CATCHER_W - 18 },
          })
          .setOrigin(0.5);

        // Hit zone
        const hitZone = this.add
          .rectangle(cx, cy, CATCHER_W + 10, CATCHER_H + 20, 0x000000, 0)
          .setInteractive({ useHandCursor: true });
        hitZone.on("pointerdown", () => this.resolve(i as 0 | 1 | 2));

        this.catchers.push({ body, label, glowRing, hitZone, cx, cy });
      }

      // ── Drop shadow (on the "floor" below catchers) ──
      this.dropShadow = this.add.ellipse(W / 2, CATCHER_TOP_Y - 6, 50, 8, 0x000000, 0.12);

      // ── Trail particles (pre-allocated pool) ──
      for (let i = 0; i < 8; i++) {
        const dot = this.add.ellipse(0, 0, 4, 4, AMBER, 0).setDepth(5);
        this.dropTrail.push(dot);
      }

      // ── Falling word ──
      this.dropWord = this.add
        .text(W / 2, DROP_START_Y, "", {
          color: "#f0a030",
          fontFamily: "'Plus Jakarta Sans', Geist, sans-serif",
          fontSize: "26px",
          fontStyle: "800",
          shadow: {
            offsetX: 0,
            offsetY: 0,
            color: "rgba(240,160,48,0.35)",
            blur: 12,
            stroke: false,
            fill: true,
          },
        })
        .setOrigin(0.5)
        .setDepth(10);

      this.spawnWave();
    }

    update(_time: number, delta: number) {
      if (!this.dropWord || this.locked || this.lives <= 0) return;

      // ── Fall ──
      const targetY = FLOOR_Y;
      const distance = targetY - DROP_START_Y;
      const pxPerMs = distance / this.speedMs;
      this.dropY += pxPerMs * delta;

      this.dropWord.setY(this.dropY);

      // ── Trail ──
      this.trailTimer += delta;
      if (this.trailTimer > 40) {
        this.trailTimer = 0;
        this.emitTrailDot(this.dropWord.x, this.dropY);
      }

      // ── Shadow scales with proximity ──
      if (this.dropShadow) {
        const progress = Math.min(1, (this.dropY - DROP_START_Y) / (CATCHER_TOP_Y - DROP_START_Y));
        this.dropShadow.setScale(0.4 + progress * 0.8, 0.3 + progress * 0.5);
        this.dropShadow.setAlpha(0.05 + progress * 0.15);
        this.dropShadow.setX(this.dropWord.x);
      }

      // ── Danger proximity glow on catchers ──
      if (this.dropY > CATCHER_TOP_Y - 80) {
        const proximity = Math.min(1, (this.dropY - (CATCHER_TOP_Y - 80)) / 80);
        // Word colour shifts to danger
        const r = Math.round(240 + (232 - 240) * proximity);
        const g = Math.round(160 - 160 * proximity * 0.6);
        const b = Math.round(48 + (74 - 48) * proximity);
        this.dropWord.setColor(`rgb(${r},${g},${b})`);

        // Correct catcher glows to hint
        if (this.hintWavesRemaining > 0) {
          const correctIdx = this.wave.correctIndex;
          const c = this.catchers[correctIdx];
          this.drawCatcherGlow(c.glowRing, c.cx, c.cy, GREEN, proximity * 0.3);
          c.glowRing.setAlpha(proximity * 0.5);
        }
      } else {
        this.dropWord.setColor("#f0a030");
      }

      // ── Timeout ──
      if (this.dropY >= targetY) {
        this.resolve(null);
      }
    }

    // ── Trail dot from pool ──
    private trailIdx = 0;
    private emitTrailDot(x: number, y: number) {
      const dot = this.dropTrail[this.trailIdx % this.dropTrail.length];
      this.trailIdx++;
      dot.setPosition(x + Phaser.Math.FloatBetween(-3, 3), y - 8);
      dot.setAlpha(0.4);
      dot.setScale(1);
      this.tweens.add({
        targets: dot,
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        y: y - 24,
        duration: 350,
        ease: "Quad.easeOut",
      });
    }

    // ── Draw catcher as a cup/bucket shape ──
    private drawCatcher(
      g: PhaserTypes.GameObjects.Graphics,
      cx: number,
      cy: number,
      fillColor: number,
      rimColor: number,
      alpha: number,
    ) {
      g.clear();
      const hw = CATCHER_W / 2;
      const hh = CATCHER_H / 2;
      const topInset = 4; // top is slightly narrower than bottom for cup feel
      const rimH = CATCHER_RIM_H;

      // Cup body (slightly tapered)
      g.fillStyle(fillColor, alpha * 0.95);
      g.beginPath();
      g.moveTo(cx - hw + topInset, cy - hh);
      g.lineTo(cx + hw - topInset, cy - hh);
      g.lineTo(cx + hw, cy + hh);
      g.lineTo(cx - hw, cy + hh);
      g.closePath();
      g.fill();

      // Inner shadow (darker)
      g.fillStyle(CATCHER_INNER, alpha * 0.8);
      g.beginPath();
      g.moveTo(cx - hw + topInset + 4, cy - hh + rimH);
      g.lineTo(cx + hw - topInset - 4, cy - hh + rimH);
      g.lineTo(cx + hw - 4, cy + hh - 4);
      g.lineTo(cx - hw + 4, cy + hh - 4);
      g.closePath();
      g.fill();

      // Rim (top edge, slightly lighter)
      g.fillStyle(rimColor, alpha);
      g.fillRoundedRect(cx - hw + topInset - 2, cy - hh - 2, CATCHER_W - topInset * 2 + 4, rimH, 3);

      // Rim highlight (thin bright line)
      g.fillStyle(CATCHER_HIGHLIGHT, alpha * 0.6);
      g.fillRect(cx - hw + topInset + 6, cy - hh - 1, CATCHER_W - topInset * 2 - 12, 2);

      // Subtle bottom highlight (depth cue)
      g.fillStyle(0x2a3c50, alpha * 0.4);
      g.fillRect(cx - hw + 6, cy + hh - 3, CATCHER_W - 12, 2);
    }

    // ── Catcher glow ring ──
    private drawCatcherGlow(
      g: PhaserTypes.GameObjects.Graphics,
      cx: number,
      cy: number,
      color: number,
      alpha: number,
    ) {
      g.clear();
      g.lineStyle(3, color, alpha);
      const hw = CATCHER_W / 2 + 3;
      const hh = CATCHER_H / 2 + 3;
      g.strokeRoundedRect(cx - hw, cy - hh, hw * 2, hh * 2, 8);
    }

    // ── Danger vignette ──
    private drawVignette(intensity: number) {
      if (!this.dangerVignette) return;
      this.dangerVignette.clear();
      if (intensity <= 0) return;
      // Red gradient from edges
      const alpha = Math.min(0.25, intensity * 0.25);
      this.dangerVignette.fillStyle(CORAL, alpha);
      // Top edge
      this.dangerVignette.fillRect(0, 0, W, 3);
      // Bottom edge
      this.dangerVignette.fillRect(0, H - 3, W, 3);
      // Side edges
      this.dangerVignette.fillRect(0, 0, 3, H);
      this.dangerVignette.fillRect(W - 3, 0, 3, H);
    }

    // ── Wave progress bar ──
    private drawWaveProgress() {
      if (!this.waveProgress) return;
      this.waveProgress.clear();
      // Background track
      this.waveProgress.fillStyle(0x0a1018, 0.6);
      this.waveProgress.fillRect(0, 0, W, 3);
      // Fill
      const fillW = W * this.waveProgress01;
      this.waveProgress.fillStyle(AMBER, 0.7);
      this.waveProgress.fillRect(0, 0, fillW, 3);
    }

    // ── Background colour lerp based on wave progress ──
    private updateBackground() {
      if (!this.bgRect) return;
      const p = this.waveProgress01;
      const color = p < 0.5
        ? Phaser.Display.Color.Interpolate.ColorWithColor(
            Phaser.Display.Color.IntegerToColor(BG_START),
            Phaser.Display.Color.IntegerToColor(BG_MID),
            100,
            Math.round(p * 2 * 100),
          )
        : Phaser.Display.Color.Interpolate.ColorWithColor(
            Phaser.Display.Color.IntegerToColor(BG_MID),
            Phaser.Display.Color.IntegerToColor(BG_END),
            100,
            Math.round((p - 0.5) * 2 * 100),
          );
      this.bgRect.setFillStyle(
        Phaser.Display.Color.GetColor(
          Math.round(color.r),
          Math.round(color.g),
          Math.round(color.b),
        ),
      );
    }

    // ── Spawn wave ──
    private spawnWave() {
      if (!this.dropWord) return;
      this.locked = false;
      this.feedback = "idle";
      this.dropY = DROP_START_Y;

      // Update background + progress
      this.updateBackground();
      this.drawWaveProgress();
      this.drawVignette(this.waveProgress01 * 0.6);

      // Clue
      if (this.clueLabel) {
        this.clueLabel.setText(`TRANSLATE:  ${this.wave.clue.toUpperCase()}`);
      }

      // Drop word — entrance animation
      this.dropWord.setText(this.wave.clue);
      this.dropWord.setPosition(W / 2, DROP_START_Y - 20);
      this.dropWord.setAlpha(0);
      this.dropWord.setScale(0.6);
      this.dropWord.setColor("#f0a030");

      this.tweens.add({
        targets: this.dropWord,
        y: DROP_START_Y,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        duration: 250,
        ease: "Back.easeOut",
        onComplete: () => {
          if (audio) sfxDrop();
        },
      });

      // Shadow reset
      if (this.dropShadow) {
        this.dropShadow.setAlpha(0);
        this.dropShadow.setX(W / 2);
      }

      // Update catchers
      this.wave.options.forEach((option, idx) => {
        const c = this.catchers[idx];
        c.label.setText(option);
        c.label.setColor("#c0bdd6");
        c.label.setAlpha(1);
        this.drawCatcher(c.body, c.cx, c.cy, CATCHER_BODY, CATCHER_RIM, 1);
        c.glowRing.clear();
        c.glowRing.setAlpha(0);
      });

      // Onboarding hint — subtle glow on correct for first few waves
      if (this.hintWavesRemaining > 0 && this.combo === 0) {
        const correct = this.catchers[this.wave.correctIndex];
        this.tweens.add({
          targets: correct.glowRing,
          alpha: { from: 0, to: 0.35 },
          duration: 1200,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
          onUpdate: () => {
            this.drawCatcherGlow(
              correct.glowRing,
              correct.cx,
              correct.cy,
              GREEN,
              correct.glowRing.alpha * 0.5,
            );
          },
        });
      }

      this.emitHud();
    }

    // ── Resolve answer ──
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
        // ── TIMEOUT ──
        this.feedback = "timeout";
        this.misses++;
        this.combo = 0;
        this.lives--;
        this.speedMs = Math.min(2800, this.speedMs + 80);
        if (audio) sfxTimeout();

        // Word crashes through floor
        if (this.dropWord) {
          this.tweens.add({
            targets: this.dropWord,
            y: H + 40,
            alpha: 0,
            scaleX: 0.5,
            scaleY: 1.5,
            duration: 300,
            ease: "Quad.easeIn",
          });
        }

        // Flash correct catcher
        this.flashCatcher(correctIdx, GREEN, GREEN_BRIGHT, 600);
        this.shakeScreen(3, 80);
        this.emitHud();
        this.advanceOrEnd();
        return;
      }

      const tapped = this.catchers[choice];

      if (correct) {
        // ── CORRECT ──
        this.feedback = "correct";
        this.score++;
        this.combo++;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        this.hits++;
        this.speedMs = Math.max(1400, this.speedMs - 75);
        if (audio) sfxCorrect();

        if (this.hintWavesRemaining > 0) this.hintWavesRemaining--;

        if (!this.firstCorrectFired) {
          this.firstCorrectFired = true;
          options.onFirstCorrect(this.time.now - this.startedAt);
        }

        // Animate word into catcher
        if (this.dropWord) {
          this.tweens.add({
            targets: this.dropWord,
            x: tapped.cx,
            y: tapped.cy + 4,
            scaleX: 0.75,
            scaleY: 0.75,
            duration: 140,
            ease: "Quad.easeIn",
            onComplete: () => {
              // Settle bounce
              if (this.dropWord) {
                this.tweens.add({
                  targets: this.dropWord,
                  scaleX: 0.7,
                  scaleY: 0.7,
                  y: tapped.cy + 6,
                  alpha: 0,
                  duration: 300,
                  ease: "Bounce.easeOut",
                });
              }
              // Gold particle burst
              this.burstParticles(tapped.cx, tapped.cy - 10, GOLD_PARTICLE, 12);
              this.burstParticles(tapped.cx, tapped.cy - 10, GREEN_BRIGHT, 6);
            },
          });
        }

        // Flash catcher green + glow
        this.flashCatcher(choice, GREEN, GREEN_BRIGHT, 400);

        // Streak milestones
        for (const milestone of STREAK_MILESTONES) {
          if (this.combo === milestone && this.lastMilestoneStreak < milestone) {
            this.lastMilestoneStreak = milestone;
            if (audio) sfxCombo(this.combo);
            options.onStreakMilestone(this.combo);
            this.streakFlash();
            break;
          }
        }
      } else {
        // ── WRONG ──
        this.feedback = "wrong";
        this.misses++;
        this.combo = 0;
        this.lastMilestoneStreak = 0;
        this.lives--;
        this.speedMs = Math.min(2800, this.speedMs + 80);
        if (audio) sfxWrong();

        // Word shatters
        if (this.dropWord) {
          this.tweens.add({
            targets: this.dropWord,
            x: tapped.cx,
            y: tapped.cy,
            duration: 120,
            ease: "Quad.easeIn",
            onComplete: () => {
              // Shatter effect
              this.burstParticles(tapped.cx, tapped.cy, CORAL, 10);
              if (this.dropWord) {
                this.dropWord.setAlpha(0);
              }
            },
          });
        }

        // Flash wrong red, correct green
        this.flashCatcher(choice, CORAL, CORAL, 400);
        this.shakeCatcher(choice);
        this.flashCatcher(correctIdx, GREEN, GREEN_BRIGHT, 600);
        this.shakeScreen(5, 120);
      }

      this.emitHud();
      this.advanceOrEnd();
    }

    // ── Particle burst ──
    private burstParticles(x: number, y: number, color: number, count: number) {
      for (let i = 0; i < count; i++) {
        const size = Phaser.Math.FloatBetween(2, 5);
        const p = this.add.ellipse(x, y, size, size, color, 0.8).setDepth(15);
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const speed = Phaser.Math.FloatBetween(40, 120);
        const dx = Math.cos(angle) * speed;
        const dy = Math.sin(angle) * speed - 30; // bias upward

        this.tweens.add({
          targets: p,
          x: x + dx,
          y: y + dy,
          alpha: 0,
          scaleX: 0.1,
          scaleY: 0.1,
          duration: Phaser.Math.Between(300, 600),
          ease: "Quad.easeOut",
          onComplete: () => p.destroy(),
        });
      }
    }

    // ── Flash catcher colour ──
    private flashCatcher(idx: number, color: number, brightColor: number, duration: number) {
      const c = this.catchers[idx];

      // Redraw catcher with flash colour
      this.drawCatcher(c.body, c.cx, c.cy, color, brightColor, 1);

      // Glow ring
      this.drawCatcherGlow(c.glowRing, c.cx, c.cy, brightColor, 0.6);
      c.glowRing.setAlpha(0.8);

      // Label colour
      const hex = `#${brightColor.toString(16).padStart(6, "0")}`;
      c.label.setColor(hex);

      // Revert after duration
      this.time.delayedCall(duration, () => {
        this.drawCatcher(c.body, c.cx, c.cy, CATCHER_BODY, CATCHER_RIM, 1);
        c.glowRing.setAlpha(0);
        c.label.setColor("#c0bdd6");
      });
    }

    // ── Shake individual catcher ──
    private shakeCatcher(idx: number) {
      const c = this.catchers[idx];
      const origX = c.cx;
      this.tweens.add({
        targets: [c.body, c.label, c.hitZone, c.glowRing],
        x: `+=${5}`,
        duration: 40,
        yoyo: true,
        repeat: 4,
        ease: "Sine.easeInOut",
        onComplete: () => {
          c.body.setX(0);
          c.label.setX(origX);
          c.hitZone.setX(origX);
          c.glowRing.setX(0);
        },
      });
    }

    // ── Screen shake ──
    private shakeScreen(intensity: number, duration: number) {
      this.cameras.main.shake(duration, intensity / 1000);
    }

    // ── Full-width streak flash ──
    private streakFlash() {
      const flash = this.add
        .rectangle(W / 2, H / 2, W, H, AMBER, 0.08)
        .setDepth(20);
      this.tweens.add({
        targets: flash,
        alpha: 0,
        duration: 400,
        ease: "Quad.easeOut",
        onComplete: () => flash.destroy(),
      });
    }

    // ── Advance or end ──
    private advanceOrEnd() {
      if (this.lives <= 0) {
        if (audio) sfxGameOver();
        this.endGame();
        return;
      }

      if (this.waveIndex >= options.puzzle.waves.length - 1) {
        this.endGame();
        return;
      }

      this.waveIndex++;
      this.time.delayedCall(350, () => {
        if (this.dropWord) {
          this.dropWord.setX(W / 2);
          this.dropWord.setScale(1);
          this.dropWord.setAlpha(1);
        }
        this.spawnWave();
      });
    }

    private endGame() {
      const total = this.hits + this.misses;
      const accuracy = total === 0 ? 0 : Math.round((this.hits / total) * 100);

      this.time.delayedCall(600, () => {
        options.onComplete({
          score: this.score,
          mistakes: this.misses,
          maxCombo: this.maxCombo,
          accuracy,
          timeMs: this.time.now - this.startedAt,
        });
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
