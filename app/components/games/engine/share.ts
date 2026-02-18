import { isTelegram, tgShareInline } from "@/lib/telegram";
import { haptic } from "@/lib/games/haptics";

/**
 * Shared share utility for all TutorLingua games.
 *
 * Priority order:
 *   1. Telegram-native share (tgShareInline) — if running inside Telegram
 *   2. Web Share API (navigator.share) — mobile native sheet
 *   3. Clipboard fallback — sets `copied` state via `setCopied`
 *
 * Ref-based timeout is handled here so callers don't need to manage it.
 */
export async function shareResult(
  text: string,
  title: string,
  setCopied: (v: boolean) => void,
  copyTimeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
): Promise<void> {
  haptic("shareGenerated");

  // 1. Telegram-native share
  if (isTelegram()) {
    const shared = tgShareInline(text);
    if (shared) return;
  }

  // 2. Web Share API
  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({ title, text });
      return;
    }
  } catch {
    // user cancelled or not supported — fall through to clipboard
  }

  // 3. Clipboard fallback
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // clipboard write failed silently
  }

  if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
  setCopied(true);
  copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
}
