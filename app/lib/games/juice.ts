/**
 * @module lib/games/juice
 * "Game Juice" — visual feedback helpers.
 *
 * NOTE: Haptic feedback lives in lib/games/haptics.ts — use `haptic()` from there.
 * This module is for non-haptic juice effects (confetti, etc.).
 */

/* ——— Confetti Helper ——— */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let confettiFn: ((opts?: Record<string, unknown>) => void) | null = null;

/** Lazy-load and fire confetti */
export async function fireConfetti(
  opts: Record<string, unknown> = {},
) {
  if (!confettiFn) {
    const mod = await import("canvas-confetti");
    // canvas-confetti exports the fire function as default
    confettiFn = (mod.default ?? mod) as unknown as (opts?: Record<string, unknown>) => void;
  }
  confettiFn(opts);
}
