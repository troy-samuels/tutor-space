"use client";

import * as React from "react";
import Link from "next/link";
import { getStreakData } from "@/lib/games/streaks";
import { getDailyProgress, type GameStatus } from "@/lib/games/progress";
import { haptic } from "@/lib/games/haptics";

const GAMES = [
  {
    slug: "byte-choice",
    name: "Byte Choice",
    description: "Translate words against the clock",
    emoji: "⚡",
  },
  {
    slug: "pixel-pairs",
    name: "Pixel Pairs",
    description: "Flip cards and match word pairs",
    emoji: "🃏",
  },
  {
    slug: "relay-sprint",
    name: "Relay Sprint",
    description: "Pick the right translation before it drops",
    emoji: "🎯",
  },
] as const;

function statusLabel(status: GameStatus): string {
  if (status === "won") return "Mastered";
  if (status === "played") return "In progress";
  return "New";
}

export default function GameHub() {
  const [streak, setStreak] = React.useState(0);
  const [statuses, setStatuses] = React.useState<Record<string, GameStatus>>({});

  React.useEffect(() => {
    const streakData = getStreakData();
    setStreak(streakData.current);
    setStatuses(getDailyProgress().games);
  }, []);

  const completed = GAMES.filter((game) => {
    const status = statuses[game.slug] ?? "unplayed";
    return status === "played" || status === "won";
  }).length;

  return (
    <div style={{ minHeight: "100dvh", background: "#F7F3EE" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 16px 96px", display: "grid", gap: 16 }}>
        <header style={{ display: "grid", gap: 10 }}>
          <h1 style={{ margin: 0, color: "#1E2B36", fontSize: 38, fontFamily: "'Mansalva', cursive" }}>Language Games</h1>
          <p style={{ margin: 0, color: "#3E4E5C", fontWeight: 600 }}>
            Play daily. Build vocabulary. Track your streak.
          </p>

          <div style={{
            borderRadius: 12,
            border: "1px solid #E2D8CA",
            background: "#EFE8DE",
            padding: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}>
            <p style={{ margin: 0, color: "#1E2B36", fontWeight: 700 }}>
              Progress {completed}/{GAMES.length}
            </p>
            <p style={{ margin: 0, color: "#24577A", fontWeight: 700 }}>Streak {streak}</p>
          </div>
        </header>

        <Link
          href="/games/world-map"
          onClick={() => haptic("tap")}
          style={{
            borderRadius: 14,
            border: "1px solid #24577A",
            background: "#24577A",
            color: "#F7F3EE",
            padding: 14,
            textDecoration: "none",
            fontWeight: 800,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span>Open World Map</span>
          <span>Unlock zones</span>
        </Link>

        <section style={{ display: "grid", gap: 10 }}>
          {GAMES.map((game) => {
            const status = statuses[game.slug] ?? "unplayed";
            return (
              <Link
                key={game.slug}
                href={`/games/${game.slug}`}
                onClick={() => haptic("tap")}
                style={{
                  borderRadius: 14,
                  border: "1px solid #E2D8CA",
                  background: "#FFFFFF",
                  textDecoration: "none",
                  padding: 14,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  color: "#1E2B36",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1 }}>
                  <span style={{ fontSize: 28, lineHeight: 1 }}>{game.emoji}</span>
                  <div style={{ display: "grid", gap: 3 }}>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: 18, fontFamily: "'Mansalva', cursive" }}>{game.name}</p>
                    <p style={{ margin: 0, color: "#697B89", fontWeight: 600, fontSize: 13 }}>{game.description}</p>
                  </div>
                </div>

                <span style={{ fontSize: 12, fontWeight: 700, color: status === "won" ? "#2E7D5A" : "#24577A", flexShrink: 0 }}>
                  {statusLabel(status)}
                </span>
              </Link>
            );
          })}
        </section>
      </div>
    </div>
  );
}
