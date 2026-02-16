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

  /**
   * Initialize Telegram WebApp SDK.
   * Call this once on app start.
   */
  init(): void {
    if (!IS_TELEGRAM) {
      console.warn('[Telegram] Not running inside Telegram WebApp. Using fallback mode.');
      this._isReady = true;
      return;
    }

    try {
      WebApp.ready();
      WebApp.expand();
      
      // Request fullscreen mode (available in Telegram 8.0+)
      if (WebApp.requestFullscreen) {
        WebApp.requestFullscreen();
      }

      // Disable vertical swipes to prevent accidental close during games
      if (WebApp.disableVerticalSwipes) {
        WebApp.disableVerticalSwipes();
      }

      // Enable closing confirmation for games in progress
      WebApp.enableClosingConfirmation();

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
      }
    });
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
    
    // Use inline query share (shows contact/group picker)
    WebApp.switchInlineQuery(shareText, ['users', 'groups', 'channels']);
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

    WebApp.MainButton.setText(text);
    WebApp.MainButton.show();
    WebApp.MainButton.onClick(onClick);
  }

  /**
   * Hide main button.
   */
  hideMainButton(): void {
    if (!IS_TELEGRAM) return;
    WebApp.MainButton.hide();
  }

  /**
   * Show back button (top-left).
   */
  showBackButton(onClick: () => void): void {
    if (!IS_TELEGRAM) return;

    WebApp.BackButton.show();
    WebApp.BackButton.onClick(onClick);
  }

  /**
   * Hide back button.
   */
  hideBackButton(): void {
    if (!IS_TELEGRAM) return;
    WebApp.BackButton.hide();
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
  tg.applyTheme();
}
