/**
 * Telegram WebApp SDK integration layer for TutorLingua Games.
 *
 * Detects if running inside Telegram's WebView, provides typed
 * helpers for haptics, BackButton, MainButton, and theme params.
 * Falls back silently outside Telegram.
 */

/* ——— Type declarations for Telegram WebApp SDK ——— */

interface TgThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
  header_bg_color?: string;
  accent_text_color?: string;
  section_bg_color?: string;
  section_header_text_color?: string;
  subtitle_text_color?: string;
  destructive_text_color?: string;
}

interface TgHapticFeedback {
  impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
  notificationOccurred: (type: "error" | "success" | "warning") => void;
  selectionChanged: () => void;
}

interface TgBackButton {
  isVisible: boolean;
  show: () => void;
  hide: () => void;
  onClick: (cb: () => void) => void;
  offClick: (cb: () => void) => void;
}

interface TgMainButton {
  text: string;
  color: string;
  textColor: string;
  isVisible: boolean;
  isActive: boolean;
  isProgressVisible: boolean;
  setText: (text: string) => TgMainButton;
  show: () => TgMainButton;
  hide: () => TgMainButton;
  enable: () => TgMainButton;
  disable: () => TgMainButton;
  showProgress: (leaveActive?: boolean) => TgMainButton;
  hideProgress: () => TgMainButton;
  onClick: (cb: () => void) => TgMainButton;
  offClick: (cb: () => void) => TgMainButton;
  setParams: (params: {
    text?: string;
    color?: string;
    text_color?: string;
    is_active?: boolean;
    is_visible?: boolean;
  }) => TgMainButton;
}

interface TgWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  colorScheme: "light" | "dark";
  themeParams: TgThemeParams;
  HapticFeedback: TgHapticFeedback;
  BackButton: TgBackButton;
  MainButton: TgMainButton;
  platform: string;
  version: string;
  initData: string;
  initDataUnsafe: Record<string, unknown>;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  onEvent: (eventType: string, cb: () => void) => void;
  offEvent: (eventType: string, cb: () => void) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TgWebApp;
    };
  }
}

/* ——— SDK helpers ——— */

/** Get the Telegram WebApp instance, or undefined if not in Telegram. */
function getWebApp(): TgWebApp | undefined {
  if (typeof window === "undefined") return undefined;
  return window.Telegram?.WebApp;
}

/** Check if currently running inside Telegram WebView. */
export function isTelegram(): boolean {
  return !!getWebApp();
}

/**
 * Initialise the Telegram WebApp.
 * Call once on mount (e.g. in the games layout).
 * Safe to call outside Telegram (no-ops).
 */
export function initTelegram(): void {
  const wa = getWebApp();
  if (!wa) return;
  wa.ready();
  wa.expand();
  // Match header colour to the Telegram bg
  try {
    wa.setHeaderColor(wa.themeParams.bg_color || "#1c1c1d");
    wa.setBackgroundColor(wa.themeParams.bg_color || "#1c1c1d");
  } catch {
    // Older SDK versions may not support these
  }
}

/* ——— Haptic helpers ——— */

export type TgHapticType = "tap" | "success" | "error" | "warning" | "selection";

/**
 * Trigger Telegram-native haptic feedback.
 * Returns `true` if Telegram haptics fired, `false` otherwise.
 * The caller can fall back to navigator.vibrate when this returns false.
 */
export function tgHaptic(type: TgHapticType): boolean {
  const wa = getWebApp();
  if (!wa?.HapticFeedback) return false;

  try {
    switch (type) {
      case "tap":
        wa.HapticFeedback.impactOccurred("light");
        break;
      case "success":
        wa.HapticFeedback.notificationOccurred("success");
        break;
      case "error":
        wa.HapticFeedback.notificationOccurred("error");
        break;
      case "warning":
        wa.HapticFeedback.notificationOccurred("warning");
        break;
      case "selection":
        wa.HapticFeedback.selectionChanged();
        break;
    }
    return true;
  } catch {
    return false;
  }
}

/* ——— BackButton helpers ——— */

export const tgBackButton = {
  show() {
    getWebApp()?.BackButton.show();
  },
  hide() {
    getWebApp()?.BackButton.hide();
  },
  onClick(cb: () => void) {
    getWebApp()?.BackButton.onClick(cb);
  },
  offClick(cb: () => void) {
    getWebApp()?.BackButton.offClick(cb);
  },
};

/* ——— MainButton helpers ——— */

export const tgMainButton = {
  show(text: string, cb: () => void) {
    const mb = getWebApp()?.MainButton;
    if (!mb) return;
    mb.setText(text).onClick(cb).show();
  },
  hide() {
    getWebApp()?.MainButton.hide();
  },
  offClick(cb: () => void) {
    getWebApp()?.MainButton.offClick(cb);
  },
};

/* ——— Theme helpers ——— */

export function tgThemeParams(): TgThemeParams | undefined {
  return getWebApp()?.themeParams;
}

export function tgColorScheme(): "light" | "dark" | undefined {
  return getWebApp()?.colorScheme;
}
