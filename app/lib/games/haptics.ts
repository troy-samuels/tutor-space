/**
 * Haptic Feedback utility for TutorLingua Games.
 * Wraps navigator.vibrate with game-specific patterns.
 * Falls back silently on unsupported devices.
 */

type HapticPattern = "tap" | "success" | "error" | "gameOver" | "streak";

const PATTERNS: Record<HapticPattern, number | number[]> = {
  tap: 10,
  success: [20, 30, 20],
  error: [50, 30, 50],
  gameOver: [100, 50, 200],
  streak: [10, 20, 10, 20, 50],
};

/**
 * Trigger haptic feedback if supported.
 * Safe to call server-side (no-ops).
 */
export function haptic(pattern: HapticPattern): void {
  if (typeof window === "undefined") return;
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
  return "vibrate" in navigator;
}
