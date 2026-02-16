/**
 * User store — Telegram user data, preferences, referral tracking.
 */

import { create } from 'zustand';
import { tg } from '@/telegram';
import type { TelegramUser } from '@/telegram';

const STORAGE_KEY = 'tl-user-store';

export interface UserState {
  // Telegram user data
  telegramUser: TelegramUser | null;
  
  // Preferences
  language: string; // Target language: es, fr, de
  difficulty: 'A1' | 'A2' | 'B1' | 'B2';
  notificationsEnabled: boolean;
  hapticEnabled: boolean;
  
  // Referral tracking
  referredBy: number | null; // Telegram user ID
  referralCount: number;
  
  // Onboarding
  hasCompletedOnboarding: boolean;
  
  // Actions
  setTelegramUser: (user: TelegramUser | null) => void;
  setLanguage: (language: string) => void;
  setDifficulty: (difficulty: 'A1' | 'A2' | 'B1' | 'B2') => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setHapticEnabled: (enabled: boolean) => void;
  setReferredBy: (userId: number) => void;
  incrementReferralCount: () => void;
  completeOnboarding: () => void;
}

// Load initial state from localStorage
function loadInitialState(): Partial<UserState> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// Save state to localStorage
function saveState(state: UserState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save user state:', error);
  }
}

const initialState = loadInitialState();

export const useUserStore = create<UserState>()((set) => ({
  telegramUser: null,
  language: initialState.language || 'es',
  difficulty: initialState.difficulty || 'A2',
  notificationsEnabled: initialState.notificationsEnabled ?? true,
  hapticEnabled: initialState.hapticEnabled ?? true,
  referredBy: initialState.referredBy || null,
  referralCount: initialState.referralCount || 0,
  hasCompletedOnboarding: initialState.hasCompletedOnboarding || false,

  setTelegramUser: (user) => {
    set((state) => {
      const newState = { ...state, telegramUser: user };
      saveState(newState);
      return newState;
    });
  },
  
  setLanguage: (language) => {
    set((state) => {
      const newState = { ...state, language };
      saveState(newState);
      return newState;
    });
  },
  
  setDifficulty: (difficulty) => {
    set((state) => {
      const newState = { ...state, difficulty };
      saveState(newState);
      return newState;
    });
  },
  
  setNotificationsEnabled: (enabled) => {
    set((state) => {
      const newState = { ...state, notificationsEnabled: enabled };
      saveState(newState);
      return newState;
    });
  },
  
  setHapticEnabled: (enabled) => {
    set((state) => {
      const newState = { ...state, hapticEnabled: enabled };
      saveState(newState);
      return newState;
    });
  },
  
  setReferredBy: (userId) => {
    set((state) => {
      const newState = { ...state, referredBy: userId };
      saveState(newState);
      return newState;
    });
  },
  
  incrementReferralCount: () => {
    set((state) => {
      const newState = { ...state, referralCount: state.referralCount + 1 };
      saveState(newState);
      return newState;
    });
  },
  
  completeOnboarding: () => {
    set((state) => {
      const newState = { ...state, hasCompletedOnboarding: true };
      saveState(newState);
      return newState;
    });
  },
}));

// Initialize user from Telegram on first load
if (typeof window !== 'undefined') {
  const user = tg.getUser();
  if (user) {
    useUserStore.getState().setTelegramUser(user);
    
    // Set language from Telegram user's language_code if not already set
    const currentLang = useUserStore.getState().language;
    if (!currentLang && user.language_code) {
      const langMap: Record<string, string> = {
        es: 'es',
        fr: 'fr',
        de: 'de',
        it: 'it',
        pt: 'pt',
      };
      const targetLang = langMap[user.language_code] || 'es';
      useUserStore.getState().setLanguage(targetLang);
    }
  }
}
