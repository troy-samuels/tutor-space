/**
 * Haptic Feedback utility for TutorLingua Games.
 *
 * Prefers Telegram's native HapticFeedback API when available,
 * falls back to navigator.vibrate with game-specific patterns.
 * Falls back silently on unsupported devices.
 */

import { tgHaptic, isTelegram } from "@/lib/telegram";

type HapticPattern = "tap" | "success" | "error" | "gameOver" | "streak";

const PATTERNS: Record<HapticPattern, number | number[]> = {
  tap: 10,
  success: [20, 30, 20],
  error: [50, 30, 50],
  gameOver: [100, 50, 200],
  streak: [10, 20, 10, 20, 50],
};

/** Map game haptic patterns to Telegram haptic types */
const TG_MAP: Record<HapticPattern, Parameters<typeof tgHaptic>[0]> = {
  tap: "tap",
  success: "success",
  error: "error",
  gameOver: "error",
  streak: "success",
};

/**
 * Trigger haptic feedback if supported.
 * Uses Telegram native haptics when inside Telegram, otherwise navigator.vibrate.
 * Safe to call server-side (no-ops).
 */
export function haptic(pattern: HapticPattern): void {
  if (typeof window === "undefined") return;

  // Try Telegram haptics first
  if (isTelegram()) {
    const fired = tgHaptic(TG_MAP[pattern]);
    if (fired) return;
  }

  // Fallback to navigator.vibrate
  if (!("vibrate" in navigator)) return;
  try {
    navigator.vibrate(PATTERNS[pattern]);
  } catch {
    // Silently fail on unsupported devices
  }
}

/**
 * Check if haptics are available on the current device.
 */
export function hasHaptics(): boolean {
  if (typeof window === "undefined") return false;
  if (isTelegram()) return true;
  return "vibrate" in navigator;
}
