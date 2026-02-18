"use client";

/**
 * Tab bar placeholder — removed for now.
 * Only "Play" was functional; other tabs (Streak, Challenge, Learn, Profile)
 * were "Coming soon" and made the app look unfinished.
 *
 * Re-add when at least 2 tabs have real functionality.
 */

interface GameTabBarProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

export default function GameTabBar(_props: GameTabBarProps) {
  return null;
}
