"use client";

import * as React from "react";
import Link from "next/link";
import { haptic } from "@/lib/games/haptics";
import { getDailyProgress, type GameStatus } from "@/lib/games/progress";
import { getStreakData } from "@/lib/games/streaks";

/* ── Zone data ── */
const ZONES = [
  {
    id: "byte-choice",
    name: "Byte Choice",
    region: "Translation Valley",
    description: "Translate words against the clock",
    icon: "⚡",
    href: "/games/byte-choice",
    colour: "#D9A441",
    unlockCost: 0,
  },
  {
    id: "pixel-pairs",
    name: "Pixel Pairs",
    region: "Memory Ridge",
    description: "Flip cards and match word pairs",
    icon: "🃏",
    href: "/games/pixel-pairs",
    colour: "#6C5CE7",
    unlockCost: 0,
  },
  {
    id: "relay-sprint",
    name: "Relay Sprint",
    region: "Speed Falls",
    description: "Intercept translations before they drop",
    icon: "🎯",
    href: "/games/relay-sprint",
    colour: "#F0A030",
    unlockCost: 0,
  },
] as const;

function statusForGame(status: GameStatus): { label: string; badge: string } {
  if (status === "won") return { label: "Mastered", badge: "✓" };
  if (status === "played") return { label: "Played", badge: "~" };
  return { label: "Ready", badge: "→" };
}

export default function WorldMap() {
  const [statuses, setStatuses] = React.useState<Record<string, GameStatus>>({});
  const [streak, setStreak] = React.useState(0);
  const [totalXp, setTotalXp] = React.useState(0);

  React.useEffect(() => {
    const progress = getDailyProgress();
    setStatuses(progress.games);
    const streakData = getStreakData();
    setStreak(streakData.current);

    // Calculate rough XP from game history
    const played = Object.values(progress.games).filter(
      (s) => s === "played" || s === "won",
    ).length;
    const won = Object.values(progress.games).filter((s) => s === "won").length;
    setTotalXp(played * 10 + won * 15 + streakData.current * 5);
  }, []);

  const completedToday = Object.values(statuses).filter(
    (s) => s === "played" || s === "won",
  ).length;
  const masteredToday = Object.values(statuses).filter(
    (s) => s === "won",
  ).length;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* ── Player Stats Banner ── */}
      <div
        style={{
          background: "#1E2B36",
          borderRadius: 16,
          padding: "20px 18px",
          display: "grid",
          gap: 14,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Gold accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: "linear-gradient(90deg, transparent, #D9A441, transparent)",
          }}
        />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ margin: 0, color: "#F7F3EE", fontSize: 18, fontFamily: "'Mansalva', cursive" }}>
              Your Journey
            </p>
            <p style={{ margin: "4px 0 0", color: "#697B89", fontSize: 13, fontWeight: 600 }}>
              {completedToday === 0
                ? "Start your first game today"
                : completedToday === ZONES.length
                  ? "All zones completed today!"
                  : `${completedToday}/${ZONES.length} zones explored today`}
            </p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 10,
              background: "rgba(217, 164, 65, 0.15)",
              border: "1px solid rgba(217, 164, 65, 0.25)",
            }}
          >
            <span style={{ fontSize: 18 }}>🔥</span>
            <span style={{ color: "#D9A441", fontSize: 16, fontWeight: 800 }}>
              {streak}
            </span>
          </div>
        </div>

        {/* Stat row */}
        <div style={{ display: "flex", gap: 12 }}>
          <div
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 10,
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#697B89" }}>
              XP Today
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 800, color: "#F7F3EE", fontVariantNumeric: "tabular-nums" }}>
              {totalXp}
            </p>
          </div>
          <div
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 10,
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#697B89" }}>
              Mastered
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 800, color: masteredToday > 0 ? "#2E7D5A" : "#F7F3EE", fontVariantNumeric: "tabular-nums" }}>
              {masteredToday}/{ZONES.length}
            </p>
          </div>
          <div
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 10,
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#697B89" }}>
              Streak
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 800, color: streak > 0 ? "#D9A441" : "#F7F3EE", fontVariantNumeric: "tabular-nums" }}>
              {streak} day{streak !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* ── Zone Map Path ── */}
      <div style={{ display: "grid", gap: 0, position: "relative" }}>
        {ZONES.map((zone, index) => {
          const status = statuses[zone.id] ?? "unplayed";
          const { label, badge } = statusForGame(status);
          const isLast = index === ZONES.length - 1;
          const mastered = status === "won";
          const played = status === "played" || mastered;

          return (
            <React.Fragment key={zone.id}>
              <Link
                href={zone.href}
                onClick={() => haptic("tap")}
                style={{
                  textDecoration: "none",
                  display: "grid",
                  gridTemplateColumns: "56px 1fr auto",
                  gap: 14,
                  alignItems: "center",
                  padding: "16px 14px",
                  borderRadius: 14,
                  border: `2px solid ${mastered ? "#2E7D5A" : played ? zone.colour : "#E2D8CA"}`,
                  background: mastered
                    ? "rgba(46, 125, 90, 0.06)"
                    : played
                      ? `rgba(${zone.id === "byte-choice" ? "217,164,65" : zone.id === "pixel-pairs" ? "108,92,231" : "240,160,48"}, 0.06)`
                      : "#FFFFFF",
                  transition: "transform 0.12s ease, box-shadow 0.15s ease",
                }}
              >
                {/* Zone icon */}
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    background: mastered ? "#2E7D5A" : zone.colour,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 28,
                    boxShadow: `0 4px 12px ${mastered ? "rgba(46,125,90,0.25)" : "rgba(0,0,0,0.1)"}`,
                  }}
                >
                  {mastered ? "✓" : zone.icon}
                </div>

                {/* Zone info */}
                <div style={{ display: "grid", gap: 2 }}>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: mastered ? "#2E7D5A" : zone.colour }}>
                    {zone.region}
                  </p>
                  <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#1E2B36", fontFamily: "'Mansalva', cursive" }}>
                    {zone.name}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: "#697B89" }}>
                    {zone.description}
                  </p>
                </div>

                {/* Status badge */}
                <div
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    background: mastered
                      ? "#2E7D5A"
                      : played
                        ? zone.colour
                        : "#EFE8DE",
                    color: mastered || played ? "#FFFFFF" : "#697B89",
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: "0.04em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </div>
              </Link>

              {/* Path connector */}
              {!isLast && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    padding: "4px 0",
                  }}
                >
                  <div
                    style={{
                      width: 3,
                      height: 24,
                      borderRadius: 2,
                      background: played ? zone.colour : "#E2D8CA",
                      opacity: played ? 0.5 : 0.3,
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ── Daily Challenge CTA ── */}
      <div
        style={{
          padding: "16px 18px",
          borderRadius: 14,
          border: "1px solid rgba(217, 164, 65, 0.25)",
          background: "linear-gradient(135deg, rgba(217, 164, 65, 0.08), rgba(217, 164, 65, 0.02))",
          textAlign: "center",
          display: "grid",
          gap: 8,
        }}
      >
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1E2B36" }}>
          {completedToday === ZONES.length
            ? "🏆 All games completed today!"
            : `Complete all ${ZONES.length} games to keep your streak alive`}
        </p>
        <p style={{ margin: 0, fontSize: 12, color: "#697B89", fontWeight: 500 }}>
          {completedToday === ZONES.length
            ? "Come back tomorrow for fresh puzzles"
            : `${ZONES.length - completedToday} game${ZONES.length - completedToday !== 1 ? "s" : ""} remaining today`}
        </p>
      </div>
    </div>
  );
}
