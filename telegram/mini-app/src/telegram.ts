/**
 * Telegram WebApp SDK wrapper with graceful fallback for development.
 */

import WebApp from '@twa-dev/sdk';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export interface TelegramTheme {
  bg_color: string;
  text_color: string;
  hint_color: string;
  link_color: string;
  button_color: string;
  button_text_color: string;
  secondary_bg_color: string;
  header_bg_color?: string;
  accent_text_color?: string;
  section_bg_color?: string;
  section_header_text_color?: string;
  subtitle_text_color?: string;
  destructive_text_color?: string;
}

const IS_TELEGRAM = typeof window !== 'undefined' && (window as any).Telegram?.WebApp;

class TelegramService {
  private _isReady = false;
  private _listenersRegistered = false;
  private _mainButtonHandler?: () => void;
  private _backButtonHandler?: () => void;

  /**
   * Initialize Telegram WebApp SDK.
   * Call this once on app start.
   */
  init(): void {
    if (this._isReady) return;

    if (!IS_TELEGRAM) {
      console.warn('[Telegram] Not running inside Telegram WebApp. Using fallback mode.');
      this._isReady = true;
      this.applyTheme();
      this.applySafeArea();
      return;
    }

    try {
      WebApp.ready();
      WebApp.expand();

      // Force dark appearance — we control the palette
      WebApp.setHeaderColor('#2C2C40');
      WebApp.setBackgroundColor('#1A1A2E');
      
      // Request fullscreen mode (available in Telegram 8.0+)
      if (WebApp.requestFullscreen) {
        WebApp.requestFullscreen();
      }

      // Disable vertical swipes to prevent accidental close during games
      if (WebApp.disableVerticalSwipes) {
        WebApp.disableVerticalSwipes();
      }

      this.applyTheme();
      this.applySafeArea();

      if (!this._listenersRegistered) {
        WebApp.onEvent('themeChanged', () => this.applyTheme());
        WebApp.onEvent('safeAreaChanged', () => this.applySafeArea());
        WebApp.onEvent('contentSafeAreaChanged', () => this.applySafeArea());
        this._listenersRegistered = true;
      }

      this._isReady = true;
      console.log('[Telegram] WebApp initialized');
    } catch (error) {
      console.error('[Telegram] Initialization failed:', error);
      this._isReady = true; // Continue in fallback mode
    }
  }

  /**
   * Get current Telegram user data.
   */
  getUser(): TelegramUser | null {
    if (!IS_TELEGRAM) {
      // Return mock user for development
      return {
        id: 123456789,
        first_name: 'Dev',
        last_name: 'User',
        username: 'dev_user',
        language_code: 'en',
      };
    }

    const user = WebApp.initDataUnsafe.user;
    return user || null;
  }

  /**
   * Get start parameter from deep link (e.g., t.me/bot?start=c3)
   * Returns "c3" if opened from that link.
   */
  getStartParam(): string | null {
    if (!IS_TELEGRAM) return null;
    return WebApp.initDataUnsafe.start_param || null;
  }

  /**
   * Get Telegram theme colours.
   */
  getTheme(): TelegramTheme {
    if (!IS_TELEGRAM) {
      // Return dark theme as default
      return {
        bg_color: '#212121',
        text_color: '#ffffff',
        hint_color: '#7a7a7a',
        link_color: '#8774e1',
        button_color: '#8774e1',
        button_text_color: '#ffffff',
        secondary_bg_color: '#2c2c2c',
      };
    }

    return WebApp.themeParams as TelegramTheme;
  }

  /**
   * Apply theme colours to CSS variables.
   */
  applyTheme(): void {
    const theme = this.getTheme();
    const root = document.documentElement;

    Object.entries(theme).forEach(([key, value]) => {
      if (value) {
        root.style.setProperty(`--tg-theme-${key.replace(/_/g, '-')}`, value);
        // Extract RGB values for glow effects
        if (key === 'button_color' && value.startsWith('#')) {
          const hex = value.slice(1);
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          root.style.setProperty('--tg-theme-button-color-rgb', `${r} ${g} ${b}`);
        }
      }
    });
  }

  /**
   * Apply safe area insets to CSS variables.
   */
  applySafeArea(): void {
    const root = document.documentElement;
    const safeArea = IS_TELEGRAM
      ? WebApp.safeAreaInset
      : { top: 0, right: 0, bottom: 0, left: 0 };
    const contentSafeArea = IS_TELEGRAM
      ? WebApp.contentSafeAreaInset
      : { top: 0, right: 0, bottom: 0, left: 0 };

    root.style.setProperty('--tg-safe-area-top', `${safeArea.top}px`);
    root.style.setProperty('--tg-safe-area-right', `${safeArea.right}px`);
    root.style.setProperty('--tg-safe-area-bottom', `${safeArea.bottom}px`);
    root.style.setProperty('--tg-safe-area-left', `${safeArea.left}px`);
    root.style.setProperty('--tg-content-safe-area-top', `${contentSafeArea.top}px`);
    root.style.setProperty('--tg-content-safe-area-right', `${contentSafeArea.right}px`);
    root.style.setProperty('--tg-content-safe-area-bottom', `${contentSafeArea.bottom}px`);
    root.style.setProperty('--tg-content-safe-area-left', `${contentSafeArea.left}px`);
  }

  /**
   * Share text/link via Telegram.
   */
  async share(text: string, url?: string): Promise<void> {
    if (!IS_TELEGRAM) {
      // Fallback to Web Share API or clipboard
      if (navigator.share) {
        await navigator.share({ text, url });
      } else {
        await navigator.clipboard.writeText(`${text}\n${url || ''}`);
        alert('Copied to clipboard!');
      }
      return;
    }

    const shareText = url ? `${text}\n${url}` : text;
    const shareLink = `https://t.me/share/url?url=${encodeURIComponent(
      url || ''
    )}&text=${encodeURIComponent(text)}`;

    // Use inline query share (shows contact/group picker)
    if (typeof WebApp.switchInlineQuery === 'function') {
      try {
        WebApp.switchInlineQuery(shareText, ['users', 'groups', 'channels']);
        return;
      } catch (error) {
        console.warn('[Telegram] Inline share failed, falling back to share link.', error);
      }
    }

    WebApp.openTelegramLink(shareLink);
  }

  /**
   * Open a link externally.
   */
  openLink(url: string): void {
    if (!IS_TELEGRAM) {
      window.open(url, '_blank');
      return;
    }

    WebApp.openLink(url);
  }

  /**
   * Open Telegram link (t.me/...)
   */
  openTelegramLink(url: string): void {
    if (!IS_TELEGRAM) {
      window.open(url, '_blank');
      return;
    }

    WebApp.openTelegramLink(url);
  }

  /**
   * Show main button (for CTAs at bottom of screen).
   */
  showMainButton(text: string, onClick: () => void): void {
    if (!IS_TELEGRAM) return;

    if (this._mainButtonHandler) {
      WebApp.MainButton.offClick(this._mainButtonHandler);
    }

    WebApp.MainButton.setText(text);
    WebApp.MainButton.show();
    WebApp.MainButton.onClick(onClick);
    this._mainButtonHandler = onClick;
  }

  /**
   * Hide main button.
   */
  hideMainButton(): void {
    if (!IS_TELEGRAM) return;
    if (this._mainButtonHandler) {
      WebApp.MainButton.offClick(this._mainButtonHandler);
      this._mainButtonHandler = undefined;
    }
    WebApp.MainButton.hide();
  }

  /**
   * Show back button (top-left).
   */
  showBackButton(onClick: () => void): void {
    if (!IS_TELEGRAM) return;

    if (this._backButtonHandler) {
      WebApp.BackButton.offClick(this._backButtonHandler);
    }

    WebApp.BackButton.show();
    WebApp.BackButton.onClick(onClick);
    this._backButtonHandler = onClick;
  }

  /**
   * Hide back button.
   */
  hideBackButton(): void {
    if (!IS_TELEGRAM) return;
    if (this._backButtonHandler) {
      WebApp.BackButton.offClick(this._backButtonHandler);
      this._backButtonHandler = undefined;
    }
    WebApp.BackButton.hide();
  }

  /**
   * Enable closing confirmation prompt.
   */
  enableClosingConfirmation(): void {
    if (!IS_TELEGRAM) return;
    WebApp.enableClosingConfirmation();
  }

  /**
   * Disable closing confirmation prompt.
   */
  disableClosingConfirmation(): void {
    if (!IS_TELEGRAM) return;
    WebApp.disableClosingConfirmation();
  }

  /**
   * Close the Mini App.
   */
  close(): void {
    if (!IS_TELEGRAM) {
      window.close();
      return;
    }

    WebApp.close();
  }

  /**
   * Haptic feedback: light tap.
   */
  hapticLight(): void {
    if (!IS_TELEGRAM) return;
    WebApp.HapticFeedback.impactOccurred('light');
  }

  /**
   * Haptic feedback: medium tap.
   */
  hapticMedium(): void {
    if (!IS_TELEGRAM) return;
    WebApp.HapticFeedback.impactOccurred('medium');
  }

  /**
   * Haptic feedback: heavy tap.
   */
  hapticHeavy(): void {
    if (!IS_TELEGRAM) return;
    WebApp.HapticFeedback.impactOccurred('heavy');
  }

  /**
   * Haptic feedback: success.
   */
  hapticSuccess(): void {
    if (!IS_TELEGRAM) return;
    WebApp.HapticFeedback.notificationOccurred('success');
  }

  /**
   * Haptic feedback: error.
   */
  hapticError(): void {
    if (!IS_TELEGRAM) return;
    WebApp.HapticFeedback.notificationOccurred('error');
  }

  /**
   * Haptic feedback: warning.
   */
  hapticWarning(): void {
    if (!IS_TELEGRAM) return;
    WebApp.HapticFeedback.notificationOccurred('warning');
  }

  /**
   * Haptic feedback: selection changed.
   */
  hapticSelectionChanged(): void {
    if (!IS_TELEGRAM) return;
    WebApp.HapticFeedback.selectionChanged();
  }

  /**
   * Check if running inside Telegram.
   */
  get isTelegram(): boolean {
    return !!IS_TELEGRAM;
  }

  /**
   * Check if SDK is ready.
   */
  get isReady(): boolean {
    return this._isReady;
  }

  /**
   * Get viewport height (accounts for Telegram UI).
   */
  get viewportHeight(): number {
    if (!IS_TELEGRAM) return window.innerHeight;
    return WebApp.viewportHeight;
  }

  /**
   * Get viewport stable height (doesn't change when keyboard appears).
   */
  get viewportStableHeight(): number {
    if (!IS_TELEGRAM) return window.innerHeight;
    return WebApp.viewportStableHeight;
  }
}

// Export singleton instance
export const tg = new TelegramService();

// Auto-initialize when module loads
if (typeof window !== 'undefined') {
  tg.init();
}
