"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  TabPlayIcon,
  TabStreakIcon,
  TabChallengeIcon,
  TabLearnIcon,
  TabProfileIcon,
} from "./GameIcons";

interface Tab {
  id: string;
  label: string;
  icon: React.FC<{ active?: boolean; size?: number }>;
  comingSoon?: boolean;
}

const TABS: Tab[] = [
  { id: "play", label: "Play", icon: TabPlayIcon },
  { id: "streak", label: "Streak", icon: TabStreakIcon, comingSoon: true },
  { id: "challenge", label: "Challenge", icon: TabChallengeIcon, comingSoon: true },
  { id: "learn", label: "Learn", icon: TabLearnIcon, comingSoon: true },
  { id: "profile", label: "Profile", icon: TabProfileIcon, comingSoon: true },
];

interface GameTabBarProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

export default function GameTabBar({ activeTab = "play", onTabChange }: GameTabBarProps) {
  const [toastTab, setToastTab] = React.useState<string | null>(null);

  const handleTabClick = React.useCallback(
    (tab: Tab) => {
      if (tab.comingSoon) {
        setToastTab(tab.id);
        setTimeout(() => setToastTab(null), 1500);
        return;
      }
      onTabChange?.(tab.id);
    },
    [onTabChange],
  );

  return (
    <>
      {/* Coming soon toast */}
      {toastTab && (
        <div
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 rounded-lg px-4 py-2 text-xs font-medium animate-pulse"
          style={{
            background: "var(--game-bg-elevated)",
            color: "var(--game-text-secondary)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          Coming soon ✨
        </div>
      )}

      <nav
        className="fixed inset-x-0 bottom-0 z-40"
        role="tablist"
        aria-label="Game navigation"
        style={{
          height: "calc(56px + env(safe-area-inset-bottom, 0px))",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          background: "rgba(15, 21, 32, 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex h-14 items-stretch">
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-current={isActive ? "page" : undefined}
                onClick={() => handleTabClick(tab)}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1",
                  "transition-all duration-200 touch-manipulation select-none",
                )}
              >
                <span
                  className={cn(
                    "leading-none transition-transform duration-200",
                    isActive && "scale-110",
                  )}
                  style={{
                    color: isActive
                      ? "var(--game-text-accent)"
                      : "var(--game-text-muted)",
                  }}
                >
                  <tab.icon active={isActive} size={22} />
                </span>
                <span
                  className="text-[10px] font-medium"
                  style={{
                    color: isActive
                      ? "var(--game-text-accent)"
                      : "var(--game-text-muted)",
                  }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
