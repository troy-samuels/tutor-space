/**
 * @module lib/games/animations
 * Shared GSAP animation configs for TutorLingua games.
 * "Supercell Feel" — tactile, deep, alive.
 */

/* ——— Easing Curves ——— */
export const EASE = {
  /** Bouncy — celebrations, badge pop-ins */
  elastic: "elastic.out(1, 0.5)",
  /** Tile selection, snappy feedback */
  snap: "back.out(1.7)",
  /** Page transitions, smooth movement */
  smooth: "power3.out",
  /** Quick deceleration */
  out: "power2.out",
  /** Spring — satisfying settle */
  spring: "elastic.out(1, 0.75)",
  /** Button press — fast in */
  press: "power1.out",
} as const;

/* ——— Duration Constants ——— */
export const DURATION = {
  /** Instant feedback */
  instant: 0.1,
  /** Quick response */
  quick: 0.15,
  /** Standard interaction */
  normal: 0.3,
  /** Noticeable transition */
  medium: 0.5,
  /** Dramatic reveal */
  dramatic: 0.8,
  /** Full sequence */
  sequence: 1.2,
} as const;

/* ——— Reusable Animation Configs ——— */

/** Button/tile press — scale down and back */
export const PRESS_ANIM = {
  scale: 0.95,
  duration: DURATION.instant,
  ease: EASE.press,
} as const;

/** Card entrance — slide up with overshoot */
export const CARD_ENTRANCE = {
  y: 100,
  opacity: 0,
  stagger: 0.1,
  ease: EASE.snap,
  duration: DURATION.medium,
} as const;

/** Wrong guess shake */
export const SHAKE_ANIM = {
  keyframes: [
    { x: 0 },
    { x: -8 },
    { x: 8 },
    { x: -4 },
    { x: 4 },
    { x: 0 },
  ],
  duration: 0.4,
  ease: EASE.smooth,
} as const;

/** Score popup — flies up and fades */
export const SCORE_POPUP = {
  y: -40,
  opacity: 0,
  scale: 1.2,
  duration: DURATION.dramatic,
  ease: EASE.smooth,
} as const;

/** Tile hop — before merge */
export const TILE_HOP = {
  y: -10,
  duration: DURATION.normal,
  ease: EASE.spring,
} as const;

/** Flip animation — for false friend reveal */
export const FLIP_ANIM = {
  rotateY: 180,
  duration: DURATION.dramatic,
  ease: EASE.smooth,
} as const;

/* ——— Confetti Presets ——— */
export const CONFETTI_SOLVE = {
  particleCount: 25,
  spread: 60,
  startVelocity: 25,
  gravity: 0.8,
  ticks: 60,
  origin: { y: 0.6 },
  colors: ["#FDE047", "#4ADE80", "#60A5FA", "#C084FC"],
} as const;

export const CONFETTI_PANGRAM = {
  particleCount: 80,
  spread: 100,
  startVelocity: 35,
  gravity: 0.7,
  ticks: 100,
  origin: { y: 0.5 },
  colors: ["#FFD700", "#FF6B35", "#FF1744", "#FCD34D"],
} as const;
