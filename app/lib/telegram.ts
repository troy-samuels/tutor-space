/**
 * Telegram WebApp SDK integration layer for TutorLingua Games.
 *
 * Detects if running inside Telegram's WebView, provides typed
 * helpers for haptics, BackButton, MainButton/BottomButton,
 * SecondaryButton, fullscreen, safe areas, and theme params.
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
  section_separator_color?: string;
  subtitle_text_color?: string;
  destructive_text_color?: string;
  bottom_bar_bg_color?: string;
}

interface TgSafeAreaInset {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface TgContentSafeAreaInset {
  top: number;
  bottom: number;
  left: number;
  right: number;
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

interface TgBottomButton {
  text: string;
  color: string;
  textColor: string;
  isVisible: boolean;
  isActive: boolean;
  isProgressVisible: boolean;
  setText: (text: string) => TgBottomButton;
  show: () => TgBottomButton;
  hide: () => TgBottomButton;
  enable: () => TgBottomButton;
  disable: () => TgBottomButton;
  showProgress: (leaveActive?: boolean) => TgBottomButton;
  hideProgress: () => TgBottomButton;
  onClick: (cb: () => void) => TgBottomButton;
  offClick: (cb: () => void) => TgBottomButton;
  setParams: (params: {
    text?: string;
    color?: string;
    text_color?: string;
    is_active?: boolean;
    is_visible?: boolean;
    has_shine_effect?: boolean;
  }) => TgBottomButton;
}

interface TgWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  requestFullscreen?: () => void;
  exitFullscreen?: () => void;
  isFullscreen?: boolean;
  disableVerticalSwipes?: () => void;
  enableVerticalSwipes?: () => void;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  colorScheme: "light" | "dark";
  themeParams: TgThemeParams;
  HapticFeedback: TgHapticFeedback;
  BackButton: TgBackButton;
  MainButton: TgBottomButton;
  SecondaryButton?: TgBottomButton;
  safeAreaInset?: TgSafeAreaInset;
  contentSafeAreaInset?: TgContentSafeAreaInset;
  platform: string;
  version: string;
  initData: string;
  initDataUnsafe: Record<string, unknown>;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  setBottomBarColor?: (color: string) => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  onEvent: (eventType: string, cb: (...args: unknown[]) => void) => void;
  offEvent: (eventType: string, cb: (...args: unknown[]) => void) => void;
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

  // Disable vertical swipes to prevent pull-to-close during gameplay
  try {
    wa.disableVerticalSwipes?.();
  } catch {
    // Older SDK versions may not support this
  }

  // Request fullscreen to go edge-to-edge (hides Telegram header)
  try {
    wa.requestFullscreen?.();
  } catch {
    // Older SDK versions may not support this
  }

  // Match header & background colour to the actual Telegram theme
  const bgColor = wa.themeParams.bg_color || "#1c1c1d";
  try {
    wa.setHeaderColor(bgColor);
    wa.setBackgroundColor(bgColor);
  } catch {
    // Older SDK versions may not support these
  }

  // Set bottom bar colour to match theme
  try {
    const bottomBarColor = wa.themeParams.bottom_bar_bg_color || wa.themeParams.secondary_bg_color || bgColor;
    wa.setBottomBarColor?.(bottomBarColor);
  } catch {
    // Older SDK versions may not support this
  }
}

/* ——— Fullscreen helpers ——— */

export function requestFullscreen(): void {
  try {
    getWebApp()?.requestFullscreen?.();
  } catch {
    // Not supported
  }
}

export function exitFullscreen(): void {
  try {
    getWebApp()?.exitFullscreen?.();
  } catch {
    // Not supported
  }
}

export function isFullscreen(): boolean {
  return getWebApp()?.isFullscreen ?? false;
}

/* ——— Safe Area helpers ——— */

export function getSafeAreaInset(): TgSafeAreaInset {
  return getWebApp()?.safeAreaInset ?? { top: 0, bottom: 0, left: 0, right: 0 };
}

export function getContentSafeAreaInset(): TgContentSafeAreaInset {
  return getWebApp()?.contentSafeAreaInset ?? { top: 0, bottom: 0, left: 0, right: 0 };
}

/* ——— Closing confirmation helpers ——— */

export function enableClosingConfirmation(): void {
  try {
    getWebApp()?.enableClosingConfirmation();
  } catch {
    // Older SDK versions may not support this
  }
}

export function disableClosingConfirmation(): void {
  try {
    getWebApp()?.disableClosingConfirmation();
  } catch {
    // Older SDK versions may not support this
  }
}

/* ——— Bottom bar color helper ——— */

export function setBottomBarColor(color: string): void {
  try {
    getWebApp()?.setBottomBarColor?.(color);
  } catch {
    // Not supported
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

/* ——— MainButton / BottomButton helpers ——— */

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
  setParams(params: {
    text?: string;
    color?: string;
    text_color?: string;
    is_active?: boolean;
    is_visible?: boolean;
    has_shine_effect?: boolean;
  }) {
    getWebApp()?.MainButton.setParams(params);
  },
};

/* ——— SecondaryButton helpers ——— */

export const tgSecondaryButton = {
  show(text: string, cb: () => void) {
    const sb = getWebApp()?.SecondaryButton;
    if (!sb) return;
    sb.setText(text).onClick(cb).show();
  },
  hide() {
    getWebApp()?.SecondaryButton?.hide();
  },
  offClick(cb: () => void) {
    getWebApp()?.SecondaryButton?.offClick(cb);
  },
  isAvailable(): boolean {
    return !!getWebApp()?.SecondaryButton;
  },
};

/* ——— Event helpers ——— */

export function onTgEvent(eventType: string, cb: (...args: unknown[]) => void): void {
  getWebApp()?.onEvent(eventType, cb);
}

export function offTgEvent(eventType: string, cb: (...args: unknown[]) => void): void {
  getWebApp()?.offEvent(eventType, cb);
}

/* ——— Theme helpers ——— */

export function tgThemeParams(): TgThemeParams | undefined {
  return getWebApp()?.themeParams;
}

export function tgColorScheme(): "light" | "dark" | undefined {
  return getWebApp()?.colorScheme;
}
