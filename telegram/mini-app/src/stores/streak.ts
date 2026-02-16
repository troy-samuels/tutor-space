/**
 * Streak store — wraps streak functions with Zustand for reactivity.
 */

import { create } from 'zustand';
import { getStreakData, recordGamePlay, getStreakTier } from '@/lib/streaks';
import type { StreakData } from '@/lib/streaks';

export interface StreakState extends StreakData {
  tier: ReturnType<typeof getStreakTier>;
  
  // Actions
  recordGame: (gameSlug: string) => void;
  refresh: () => void;
}

export const useStreakStore = create<StreakState>()((set, get) => {
  const initial = getStreakData();
  const tier = getStreakTier(initial.current);

  return {
    ...initial,
    tier,

    recordGame: (gameSlug: string) => {
      const newData = recordGamePlay(gameSlug);
      const newTier = getStreakTier(newData.current);
      set({ ...newData, tier: newTier });
    },

    refresh: () => {
      const data = getStreakData();
      const tier = getStreakTier(data.current);
      set({ ...data, tier });
    },
  };
});

// Refresh streak data every 5 minutes (to catch day changes)
if (typeof window !== 'undefined') {
  setInterval(() => {
    useStreakStore.getState().refresh();
  }, 5 * 60 * 1000);
}
