"use client";

import * as React from "react";
import Link from "next/link";
import { getStreakData } from "@/lib/games/streaks";
import { getDailyProgress, type GameStatus } from "@/lib/games/progress";
import { haptic } from "@/lib/games/haptics";
import { GAME_ICON_MAP } from "./GameIcons";

/* ——————————————————————————————————————————————
   Game definitions — live + coming soon
   —————————————————————————————————————————————— */

interface GameDef {
  slug: string;
  name: string;
  description: string;
  colour: string;
  colourLight: string;
  live: boolean;
}

const GAMES: GameDef[] = [
  {
    slug: "byte-choice",
    name: "Byte Choice",
    description: "Translate words against the clock",
    colour: "#24577A",
    colourLight: "rgba(36,87,122,0.08)",
    live: true,
  },
  {
    slug: "pixel-pairs",
    name: "Pixel Pairs",
    description: "Flip cards and match word pairs",
    colour: "#1A7A6A",
    colourLight: "rgba(26,122,106,0.08)",
    live: true,
  },
  {
    slug: "relay-sprint",
    name: "Relay Sprint",
    description: "Pick the right translation before it drops",
    colour: "#304B78",
    colourLight: "rgba(48,75,120,0.08)",
    live: true,
  },
  {
    slug: "connections",
    name: "Connections",
    description: "Group four words that share a hidden link",
    colour: "#D4A843",
    colourLight: "rgba(212,168,67,0.08)",
    live: true,
  },
  {
    slug: "daily-decode",
    name: "Daily Decode",
    description: "Crack the cipher to reveal a quote",
    colour: "#D36135",
    colourLight: "rgba(211,97,53,0.08)",
    live: true,
  },
  {
    slug: "word-ladder",
    name: "Word Ladder",
    description: "Change one letter at a time to reach the target",
    colour: "#3E5641",
    colourLight: "rgba(62,86,65,0.08)",
    live: true,
  },
  {
    slug: "synonym-spiral",
    name: "Synonym Spiral",
    description: "Climb the tower by finding synonyms",
    colour: "#8B5CB5",
    colourLight: "rgba(139,92,181,0.08)",
    live: true,
  },
  {
    slug: "missing-piece",
    name: "Missing Piece",
    description: "Fill the gap in the sentence",
    colour: "#5A8AB5",
    colourLight: "rgba(90,138,181,0.08)",
    live: true,
  },
  {
    slug: "odd-one-out",
    name: "Odd One Out",
    description: "Find the word that doesn't belong",
    colour: "#D36135",
    colourLight: "rgba(211,97,53,0.08)",
    live: true,
  },
  {
    slug: "neon-intercept",
    name: "Neon Intercept",
    description: "Intercept translations in neon lanes",
    colour: "#D36135",
    colourLight: "rgba(211,97,53,0.08)",
    live: true,
  },
  {
    slug: "grammar-rush",
    name: "Grammar Rush",
    description: "Race through grammar challenges",
    colour: "#B0A99F",
    colourLight: "rgba(176,169,159,0.06)",
    live: false,
  },
  {
    slug: "accent-match",
    name: "Accent Match",
    description: "Match words to their correct pronunciation",
    colour: "#B0A99F",
    colourLight: "rgba(176,169,159,0.06)",
    live: false,
  },
  {
    slug: "idiom-hunt",
    name: "Idiom Hunt",
    description: "Discover hidden idioms in the word grid",
    colour: "#B0A99F",
    colourLight: "rgba(176,169,159,0.06)",
    live: false,
  },
  {
    slug: "tense-twist",
    name: "Tense Twist",
    description: "Transform sentences between tenses",
    colour: "#B0A99F",
    colourLight: "rgba(176,169,159,0.06)",
    live: false,
  },
];

/* ——————————————————————————————————————————————
   Helpers
   —————————————————————————————————————————————— */

function statusText(status: GameStatus): string {
  if (status === "won") return "Mastered";
  if (status === "played") return "Played";
  return "";
}

function statusDot(status: GameStatus, colour: string): React.CSSProperties {
  if (status === "won") return { background: "#2E7D5A" };
  if (status === "played") return { background: colour };
  return { background: "transparent", border: "2px solid #E2D8CA" };
}

/* ——————————————————————————————————————————————
   Keyframe injection (once)
   —————————————————————————————————————————————— */

const KEYFRAMES_ID = "game-hub-keyframes";

function injectKeyframes() {
  if (typeof document === "undefined") return;
  if (document.getElementById(KEYFRAMES_ID)) return;
  const style = document.createElement("style");
  style.id = KEYFRAMES_ID;
  style.textContent = `
    @keyframes hub-card-enter {
      from { opacity: 0; transform: translateY(14px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes hub-shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes hub-breathe {
      0%, 100% { opacity: 0.55; }
      50% { opacity: 0.85; }
    }
    @keyframes hub-pulse-ring {
      0%, 100% { box-shadow: 0 0 0 0 rgba(212,168,67,0.3); }
      50% { box-shadow: 0 0 0 6px rgba(212,168,67,0); }
    }
    @keyframes hub-streak-glow {
      0%, 100% { text-shadow: 0 0 4px rgba(212,164,65,0.4); }
      50% { text-shadow: 0 0 12px rgba(212,164,65,0.7); }
    }
  `;
  document.head.appendChild(style);
}

/* ——————————————————————————————————————————————
   Game Card
   —————————————————————————————————————————————— */

function GameCard({
  game,
  status,
  index,
}: {
  game: GameDef;
  status: GameStatus;
  index: number;
}) {
  const IconComponent = GAME_ICON_MAP[game.slug];
  const isComingSoon = !game.live;
  const [pressed, setPressed] = React.useState(false);

  const cardStyle: React.CSSProperties = {
    position: "relative",
    borderRadius: 16,
    border: `1px solid ${isComingSoon ? "#E2D8CA" : "#E2D8CA"}`,
    borderLeft: `3px solid ${isComingSoon ? "#D5D0CA" : game.colour}`,
    background: isComingSoon ? "#F2EDE7" : "#FFFFFF",
    padding: "16px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    textDecoration: "none",
    color: "#1E2B36",
    cursor: isComingSoon ? "default" : "pointer",
    opacity: isComingSoon ? 0.55 : 1,
    filter: isComingSoon ? "saturate(0.3)" : "none",
    transform: pressed ? "scale(0.97)" : "scale(1)",
    transition: "transform 80ms ease-out, box-shadow 80ms ease-out",
    boxShadow: pressed
      ? "none"
      : "0 1px 3px rgba(30,43,54,0.06), 0 1px 2px rgba(30,43,54,0.04)",
    animation: `hub-card-enter 300ms cubic-bezier(0.16, 1, 0.3, 1) ${index * 60}ms both`,
    overflow: "hidden",
    WebkitTapHighlightColor: "transparent",
    touchAction: "manipulation",
  };

  /* Shimmer overlay for live cards */
  const shimmerOverlay: React.CSSProperties = !isComingSoon
    ? {
        position: "absolute",
        inset: 0,
        borderRadius: 16,
        background: `linear-gradient(110deg, transparent 30%, ${game.colourLight} 50%, transparent 70%)`,
        backgroundSize: "200% 100%",
        animation: "hub-shimmer 4s ease-in-out infinite",
        pointerEvents: "none",
      }
    : {};

  const inner = (
    <div
      style={cardStyle}
      onPointerDown={() => !isComingSoon && setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
    >
      {/* Shimmer overlay */}
      {!isComingSoon && <div style={shimmerOverlay} />}

      {/* Top row: icon + status */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
        {/* Icon */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {IconComponent ? <IconComponent size={48} /> : <div style={{ width: 48, height: 48, borderRadius: 12, background: game.colourLight }} />}
        </div>

        {/* Status indicator or Coming Soon badge */}
        {isComingSoon ? (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#9C9590",
              background: "#E8E2DA",
              padding: "3px 8px",
              borderRadius: 9999,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            Coming Soon
          </span>
        ) : status !== "unplayed" ? (
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 9999,
                ...statusDot(status, game.colour),
              }}
            />
            <span style={{ fontSize: 11, fontWeight: 600, color: status === "won" ? "#2E7D5A" : game.colour }}>
              {statusText(status)}
            </span>
          </div>
        ) : null}
      </div>

      {/* Name + description */}
      <div style={{ display: "grid", gap: 3, position: "relative" }}>
        <p
          style={{
            margin: 0,
            fontWeight: 800,
            fontSize: 16,
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            color: isComingSoon ? "#9C9590" : "#1E2B36",
            lineHeight: 1.25,
          }}
        >
          {game.name}
        </p>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 500,
            color: isComingSoon ? "#B0A99F" : "#697B89",
            lineHeight: 1.4,
          }}
        >
          {game.description}
        </p>
      </div>
    </div>
  );

  if (isComingSoon) return inner;

  return (
    <Link
      href={`/games/${game.slug}`}
      onClick={() => haptic("tap")}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      {inner}
    </Link>
  );
}

/* ——————————————————————————————————————————————
   Streak Fire
   —————————————————————————————————————————————— */

function StreakDisplay({ streak }: { streak: number }) {
  if (streak < 1) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        animation: streak >= 3 ? "hub-streak-glow 2s ease-in-out infinite" : undefined,
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 2C12 2 4 10 4 15a8 8 0 0 0 16 0c0-5-8-13-8-13z"
          fill="#D9A441"
          opacity="0.9"
        />
        <path
          d="M12 10c0 0-3 3.5-3 5.5a3 3 0 0 0 6 0c0-2-3-5.5-3-5.5z"
          fill="#F5D76E"
          opacity="0.8"
        />
      </svg>
      <span
        style={{
          fontSize: 18,
          fontWeight: 800,
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          color: "#D9A441",
        }}
      >
        {streak}
      </span>
    </div>
  );
}

/* ——————————————————————————————————————————————
   Save Progress / Login CTA
   —————————————————————————————————————————————— */

function SaveProgressBanner() {
  return (
    <div
      style={{
        borderRadius: 12,
        background: "linear-gradient(135deg, rgba(36,87,122,0.06) 0%, rgba(212,168,67,0.06) 100%)",
        border: "1px solid #E2D8CA",
        padding: "12px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div style={{ display: "grid", gap: 2 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1E2B36" }}>
          Save your progress
        </p>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 500, color: "#697B89" }}>
          Sign in to track scores and compete on leaderboards
        </p>
      </div>
      <Link
        href="/login"
        onClick={() => haptic("tap")}
        style={{
          padding: "8px 16px",
          borderRadius: 9999,
          background: "#24577A",
          color: "#F7F3EE",
          fontSize: 12,
          fontWeight: 700,
          textDecoration: "none",
          whiteSpace: "nowrap",
          flexShrink: 0,
          touchAction: "manipulation",
        }}
      >
        Sign in
      </Link>
    </div>
  );
}

/* ——————————————————————————————————————————————
   Leaderboard Teaser
   —————————————————————————————————————————————— */

function LeaderboardTeaser() {
  return (
    <Link
      href="/games/world-map"
      onClick={() => haptic("tap")}
      style={{
        borderRadius: 12,
        border: "1px solid #E2D8CA",
        background: "#FFFFFF",
        padding: "14px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        textDecoration: "none",
        color: "#1E2B36",
        touchAction: "manipulation",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Trophy icon */}
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
          <path d="M7 5h14v8a7 7 0 0 1-14 0V5z" fill="#D9A441" opacity="0.2" />
          <path d="M7 5h14v8a7 7 0 0 1-14 0V5z" stroke="#D9A441" strokeWidth="1.5" fill="none" />
          <path d="M7 7H4a2 2 0 0 0-2 2v1a4 4 0 0 0 4 4h1" stroke="#D9A441" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.5" />
          <path d="M21 7h3a2 2 0 0 1 2 2v1a4 4 0 0 1-4 4h-1" stroke="#D9A441" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.5" />
          <rect x="11" y="19" width="6" height="3" rx="1" fill="#D9A441" opacity="0.3" />
          <rect x="9" y="22" width="10" height="2" rx="1" fill="#D9A441" opacity="0.2" />
        </svg>
        <div style={{ display: "grid", gap: 1 }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Leaderboards &amp; World Map</span>
          <span style={{ fontSize: 11, fontWeight: 500, color: "#697B89" }}>See how you compare to other learners</span>
        </div>
      </div>
      {/* Arrow */}
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M6 3l5 5-5 5" stroke="#9C9590" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}

/* ——————————————————————————————————————————————
   Main Hub
   —————————————————————————————————————————————— */

export default function GameHub() {
  const [streak, setStreak] = React.useState(0);
  const [statuses, setStatuses] = React.useState<Record<string, GameStatus>>({});

  React.useEffect(() => {
    injectKeyframes();
    const streakData = getStreakData();
    setStreak(streakData.current);
    setStatuses(getDailyProgress().games);
  }, []);

  const liveGames = GAMES.filter((g) => g.live);
  const completed = liveGames.filter((g) => {
    const s = statuses[g.slug] ?? "unplayed";
    return s === "played" || s === "won";
  }).length;

  return (
    <div style={{ minHeight: "100dvh", background: "#F7F3EE" }}>
      <div
        style={{
          maxWidth: 760,
          margin: "0 auto",
          padding: "24px 16px 96px",
          display: "grid",
          gap: 20,
        }}
      >
        {/* ——— Header ——— */}
        <header style={{ display: "grid", gap: 14 }}>
          {/* Title row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1
              style={{
                margin: 0,
                color: "#1E2B36",
                fontSize: 32,
                fontFamily: "'Mansalva', cursive",
                lineHeight: 1.1,
              }}
            >
              Language Games
            </h1>
            <StreakDisplay streak={streak} />
          </div>

          {/* Subtitle */}
          <p style={{ margin: 0, color: "#3E4E5C", fontWeight: 500, fontSize: 14, lineHeight: 1.4 }}>
            Play daily. Build vocabulary. Track your streak.
          </p>

          {/* Progress bar */}
          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#697B89" }}>
                Today&apos;s progress
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#24577A",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                }}
              >
                {completed}/{liveGames.length}
              </span>
            </div>
            <div
              style={{
                height: 6,
                borderRadius: 9999,
                background: "#E2D8CA",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${(completed / liveGames.length) * 100}%`,
                  borderRadius: 9999,
                  background: "linear-gradient(90deg, #24577A, #2E7D5A)",
                  transition: "width 500ms cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              />
            </div>
          </div>
        </header>

        {/* ——— Save Progress CTA ——— */}
        <SaveProgressBanner />

        {/* ——— Game Grid ——— */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 12,
          }}
        >
          {GAMES.map((game, i) => (
            <GameCard
              key={game.slug}
              game={game}
              status={statuses[game.slug] ?? "unplayed"}
              index={i}
            />
          ))}
        </section>

        {/* ——— Leaderboard Teaser ——— */}
        <LeaderboardTeaser />
      </div>
    </div>
  );
}
