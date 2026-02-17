/**
 * @module lib/games/juice
 * "Game Juice" — haptics, sound triggers, and interaction feedback.
 * Wraps Telegram WebApp HapticFeedback with safe fallbacks.
 */

import { isTelegram } from "@/lib/telegram";

/* ——— Types ——— */
type ImpactStyle = "light" | "medium" | "heavy" | "rigid" | "soft";
type NotificationType = "error" | "success" | "warning";

/* ——— Safe Telegram Haptic Access ——— */
function getHaptic() {
  if (typeof window === "undefined") return null;
  if (!isTelegram()) return null;
  const tg = (window as unknown as { Telegram?: { WebApp?: { HapticFeedback?: {
    impactOccurred: (style: ImpactStyle) => void;
    notificationOccurred: (type: NotificationType) => void;
    selectionChanged: () => void;
  } } } }).Telegram;
  return tg?.WebApp?.HapticFeedback ?? null;
}

/* ——— Haptic Primitives ——— */

/** Light click — tile tap, selection toggle */
export function hapticTap() {
  getHaptic()?.impactOccurred("light");
}

/** Medium impact — word found, action confirmed */
export function hapticPop() {
  getHaptic()?.impactOccurred("medium");
}

/** Heavy slam — pangram, big achievement */
export function hapticSlam() {
  getHaptic()?.impactOccurred("heavy");
}

/** Soft pulse — timer heartbeat */
export function hapticPulse() {
  getHaptic()?.impactOccurred("soft");
}

/** Selection changed — keyboard/list navigation */
export function hapticSelect() {
  getHaptic()?.selectionChanged();
}

/** Success — correct answer, category found */
export function hapticSuccess() {
  getHaptic()?.notificationOccurred("success");
}

/** Error — wrong guess */
export function hapticError() {
  getHaptic()?.notificationOccurred("error");
}

/** Warning — false friend detected, close but wrong */
export function hapticWarning() {
  getHaptic()?.notificationOccurred("warning");
}

/* ——— Composed Feedback ——— */

/** Streak milestone — triple pulse */
export function hapticStreak() {
  const h = getHaptic();
  if (!h) return;
  h.impactOccurred("heavy");
  setTimeout(() => h.impactOccurred("heavy"), 100);
  setTimeout(() => h.impactOccurred("heavy"), 200);
}

/** Game complete — double thump */
export function hapticComplete() {
  const h = getHaptic();
  if (!h) return;
  h.notificationOccurred("success");
  setTimeout(() => h.notificationOccurred("success"), 150);
}

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
