/**
 * Haptic Feedback utility for TutorLingua Games.
 * Design Bible Phase 5A — full haptic vocabulary.
 *
 * Prefers Telegram's native HapticFeedback API when available,
 * falls back to navigator.vibrate with game-specific patterns.
 * Falls back silently on unsupported devices.
 */

import { tgHaptic, isTelegram } from "@/lib/telegram";

type HapticPattern =
  | "tap"
  | "success"
  | "error"
  | "gameOver"
  | "streak"
  | "pangram"
  | "falseFriend"
  | "streakMilestone"
  | "heartbeat"
  | "shareGenerated";

/** Vibration patterns for navigator.vibrate fallback */
const PATTERNS: Record<HapticPattern, number | number[]> = {
  tap: 10,
  success: [20, 30, 20],
  error: [50, 30, 50],
  gameOver: [100, 50, 200],
  streak: [10, 20, 10, 20, 50],
  pangram: [40, 20, 40, 20, 80],            // BOOM — double hit feel
  falseFriend: [30, 40, 30],                 // Ironic wobble
  streakMilestone: [15, 15, 15, 15, 15, 15], // Triple pulse — celebration
  heartbeat: [20, 80, 20],                   // Heartbeat for timer running low
  shareGenerated: 8,                         // Gentle — "here you go"
};

/**
 * Telegram-native haptic dispatch.
 * Maps each game pattern to the specific Telegram haptic calls
 * defined in the Design Bible.
 */
function fireTelegramHaptic(pattern: HapticPattern): boolean {
  switch (pattern) {
    case "tap":
      return tgHaptic("selection");                  // selectionChanged()
    case "success":
      return tgHaptic("success");                    // notificationOccurred('success')
    case "error":
      return tgHaptic("error");                      // notificationOccurred('error')
    case "gameOver":
      // Double thump — success × 2
      tgHaptic("success");
      setTimeout(() => tgHaptic("success"), 120);
      return true;
    case "streak":
      return tgHaptic("success");
    case "pangram":
      // Design Bible: impactOccurred('heavy') + notificationOccurred('success') — BOOM
      tgHaptic("heavy");
      setTimeout(() => tgHaptic("success"), 80);
      return true;
    case "falseFriend":
      return tgHaptic("warning");                    // notificationOccurred('warning')
    case "streakMilestone":
      // Design Bible: impactOccurred('heavy') × 3 rapid — triple pulse
      tgHaptic("heavy");
      setTimeout(() => tgHaptic("heavy"), 100);
      setTimeout(() => tgHaptic("heavy"), 200);
      return true;
    case "heartbeat":
      // Design Bible: impactOccurred('soft') — single pulse
      return tgHaptic("soft");
    case "shareGenerated":
      // impactOccurred('light') — gentle
      return tgHaptic("tap");
    default:
      return tgHaptic("tap");
  }
}

/**
 * Trigger haptic feedback if supported.
 * Uses Telegram native haptics when inside Telegram, otherwise navigator.vibrate.
 * Safe to call server-side (no-ops).
 */
export function haptic(pattern: HapticPattern): void {
  if (typeof window === "undefined") return;

  // Try Telegram haptics first
  if (isTelegram()) {
    const fired = fireTelegramHaptic(pattern);
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
