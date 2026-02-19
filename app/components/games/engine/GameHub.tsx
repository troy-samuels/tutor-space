"use client";

import * as React from "react";
import Link from "next/link";
import { getStreakData } from "@/lib/games/streaks";
import { getDailyProgress, type GameStatus } from "@/lib/games/progress";
import { haptic } from "@/lib/games/haptics";
import {
  getTokenState,
  unlockGame,
  getNextUnlockable,
  getCurrentPrizeTier,
  getNextPrizeTier,
  awardEmailSignup,
  GAME_UNLOCK_COSTS,
  TOKEN_REWARDS,
  PRIZE_TIERS,
  type TokenState,
} from "@/lib/games/tokens";
import { GAME_ICON_MAP } from "./GameIcons";

/* ——————————————————————————————————————————————
   Game definitions
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
  { slug: "byte-choice", name: "Byte Choice", description: "Translate words against the clock", colour: "#24577A", colourLight: "rgba(36,87,122,0.08)", live: true },
  { slug: "pixel-pairs", name: "Pixel Pairs", description: "Flip cards and match word pairs", colour: "#1A7A6A", colourLight: "rgba(26,122,106,0.08)", live: true },
  { slug: "relay-sprint", name: "Relay Sprint", description: "Pick the right translation before it drops", colour: "#304B78", colourLight: "rgba(48,75,120,0.08)", live: true },
  { slug: "connections", name: "Connections", description: "Group four words that share a hidden link", colour: "#D4A843", colourLight: "rgba(212,168,67,0.08)", live: true },
  { slug: "daily-decode", name: "Daily Decode", description: "Crack the cipher to reveal a quote", colour: "#D36135", colourLight: "rgba(211,97,53,0.08)", live: true },
  { slug: "word-ladder", name: "Word Ladder", description: "Change one letter at a time to reach the target", colour: "#3E5641", colourLight: "rgba(62,86,65,0.08)", live: true },
  { slug: "synonym-spiral", name: "Synonym Spiral", description: "Climb the tower by finding synonyms", colour: "#8B5CB5", colourLight: "rgba(139,92,181,0.08)", live: true },
  { slug: "missing-piece", name: "Missing Piece", description: "Fill the gap in the sentence", colour: "#5A8AB5", colourLight: "rgba(90,138,181,0.08)", live: true },
  { slug: "odd-one-out", name: "Odd One Out", description: "Find the word that doesn't belong", colour: "#D36135", colourLight: "rgba(211,97,53,0.08)", live: true },
  { slug: "neon-intercept", name: "Neon Intercept", description: "Intercept translations in neon lanes", colour: "#D36135", colourLight: "rgba(211,97,53,0.08)", live: true },
  { slug: "grammar-rush", name: "Grammar Rush", description: "Race through grammar challenges", colour: "#B0A99F", colourLight: "rgba(176,169,159,0.06)", live: false },
  { slug: "accent-match", name: "Accent Match", description: "Match words to their correct pronunciation", colour: "#B0A99F", colourLight: "rgba(176,169,159,0.06)", live: false },
  { slug: "idiom-hunt", name: "Idiom Hunt", description: "Discover hidden idioms in the word grid", colour: "#B0A99F", colourLight: "rgba(176,169,159,0.06)", live: false },
  { slug: "tense-twist", name: "Tense Twist", description: "Transform sentences between tenses", colour: "#B0A99F", colourLight: "rgba(176,169,159,0.06)", live: false },
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
   Keyframe injection
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
    @keyframes hub-streak-glow {
      0%, 100% { text-shadow: 0 0 4px rgba(212,164,65,0.4); }
      50% { text-shadow: 0 0 12px rgba(212,164,65,0.7); }
    }
    @keyframes hub-token-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.08); }
    }
    @keyframes hub-unlock-pop {
      0% { transform: scale(0.9); opacity: 0; }
      60% { transform: scale(1.05); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes hub-lock-breathe {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 0.7; }
    }
  `;
  document.head.appendChild(style);
}

/* ——————————————————————————————————————————————
   Token display icon (coin SVG)
   —————————————————————————————————————————————— */

function CoinIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="9" fill="#D9A441" />
      <circle cx="10" cy="10" r="7" fill="#F5D76E" opacity="0.4" />
      <circle cx="10" cy="10" r="6" stroke="#D9A441" strokeWidth="1" fill="none" opacity="0.6" />
      <text x="10" y="13.5" fill="#A37E28" fontSize="9" fontWeight="800" textAnchor="middle" fontFamily="system-ui">T</text>
    </svg>
  );
}

function LockIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="4" y="9" width="12" height="9" rx="2.5" fill="#9C9590" opacity="0.5" />
      <path d="M7 9V7a3 3 0 0 1 6 0v2" stroke="#9C9590" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6" />
      <circle cx="10" cy="13" r="1.2" fill="white" opacity="0.6" />
    </svg>
  );
}

/* ——————————————————————————————————————————————
   Game Card
   —————————————————————————————————————————————— */

function GameCard({
  game,
  status,
  index,
  isUnlocked,
  unlockCost,
  tokenBalance,
  onUnlock,
}: {
  game: GameDef;
  status: GameStatus;
  index: number;
  isUnlocked: boolean;
  unlockCost: number;
  tokenBalance: number;
  onUnlock: (slug: string) => void;
}) {
  const IconComponent = GAME_ICON_MAP[game.slug];
  const isComingSoon = !game.live;
  const isLocked = !isComingSoon && !isUnlocked;
  const canAfford = tokenBalance >= unlockCost;
  const [pressed, setPressed] = React.useState(false);

  const cardStyle: React.CSSProperties = {
    position: "relative",
    borderRadius: 16,
    border: `1px solid ${isComingSoon || isLocked ? "#E2D8CA" : "#E2D8CA"}`,
    background: isComingSoon ? "#F2EDE7" : isLocked ? "#F5F0EA" : "#FFFFFF",
    padding: "16px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    textDecoration: "none",
    color: "#1E2B36",
    cursor: isComingSoon ? "default" : isLocked ? "pointer" : "pointer",
    opacity: isComingSoon ? 0.55 : isLocked ? 0.75 : 1,
    filter: isComingSoon ? "saturate(0.3)" : isLocked ? "saturate(0.5)" : "none",
    transform: pressed ? "scale(0.97)" : "scale(1)",
    transition: "transform 80ms ease-out, box-shadow 80ms ease-out, opacity 250ms ease-out",
    boxShadow: pressed
      ? "none"
      : "0 1px 3px rgba(30,43,54,0.06), 0 1px 2px rgba(30,43,54,0.04)",
    animation: `hub-card-enter 300ms cubic-bezier(0.16, 1, 0.3, 1) ${index * 60}ms both`,
    overflow: "hidden",
    WebkitTapHighlightColor: "transparent",
    touchAction: "manipulation",
  };

  /* Shimmer overlay for unlocked live cards */
  const shimmerOverlay: React.CSSProperties = !isComingSoon && isUnlocked
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

  const handleUnlockClick = (e: React.MouseEvent) => {
    if (isLocked && canAfford) {
      e.preventDefault();
      haptic("tap");
      onUnlock(game.slug);
    }
  };

  const inner = (
    <div
      style={cardStyle}
      onPointerDown={() => !isComingSoon && setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onClick={isLocked ? handleUnlockClick : undefined}
    >
      {/* Shimmer */}
      {!isComingSoon && isUnlocked && <div style={shimmerOverlay} />}

      {/* Top row: icon + badge */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {IconComponent ? <IconComponent size={48} /> : <div style={{ width: 48, height: 48, borderRadius: 12, background: game.colourLight }} />}
        </div>

        {/* Badge: Coming Soon / Locked / Status */}
        {isComingSoon ? (
          <span style={{
            fontSize: 10, fontWeight: 700, color: "#9C9590", background: "#E8E2DA",
            padding: "3px 8px", borderRadius: 9999, letterSpacing: "0.04em", textTransform: "uppercase", whiteSpace: "nowrap",
          }}>
            Coming Soon
          </span>
        ) : isLocked ? (
          <div style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "3px 8px", borderRadius: 9999,
            background: canAfford ? "rgba(217,164,65,0.12)" : "rgba(156,149,144,0.1)",
            border: canAfford ? "1px solid rgba(217,164,65,0.3)" : "1px solid rgba(156,149,144,0.2)",
            animation: isLocked ? "hub-lock-breathe 3s ease-in-out infinite" : undefined,
          }}>
            <CoinIcon size={12} />
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: canAfford ? "#D9A441" : "#9C9590",
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            }}>
              {unlockCost}
            </span>
          </div>
        ) : status !== "unplayed" ? (
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 9999, ...statusDot(status, game.colour) }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: status === "won" ? "#2E7D5A" : game.colour }}>
              {statusText(status)}
            </span>
          </div>
        ) : null}
      </div>

      {/* Name + description */}
      <div style={{ display: "grid", gap: 3, position: "relative" }}>
        <p style={{
          margin: 0, fontWeight: 800, fontSize: 16, lineHeight: 1.25,
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          color: isComingSoon ? "#9C9590" : isLocked ? "#7A7470" : "#1E2B36",
        }}>
          {game.name}
        </p>
        <p style={{
          margin: 0, fontSize: 12, fontWeight: 500, lineHeight: 1.4,
          color: isComingSoon ? "#B0A99F" : isLocked ? "#9C9590" : "#697B89",
        }}>
          {game.description}
        </p>
      </div>

      {/* Unlock button for locked, affordable games */}
      {isLocked && canAfford && (
        <button
          onClick={handleUnlockClick}
          style={{
            marginTop: 2, padding: "8px 0", borderRadius: 10,
            border: "none", cursor: "pointer",
            background: "linear-gradient(135deg, #D9A441, #C49835)",
            color: "#FFFFFF", fontSize: 12, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            touchAction: "manipulation", WebkitTapHighlightColor: "transparent",
          }}
        >
          <CoinIcon size={14} />
          Unlock for {unlockCost}
        </button>
      )}

      {/* Lock overlay for locked, can't-afford games */}
      {isLocked && !canAfford && (
        <div style={{
          marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
          padding: "6px 0", borderRadius: 10,
          background: "rgba(156,149,144,0.08)", border: "1px dashed #D5D0CA",
        }}>
          <LockIcon size={14} />
          <span style={{ fontSize: 11, fontWeight: 600, color: "#9C9590" }}>
            {unlockCost - tokenBalance} more to unlock
          </span>
        </div>
      )}
    </div>
  );

  // Coming soon — not clickable
  if (isComingSoon) return inner;

  // Locked — clicking triggers unlock (handled in the div)
  if (isLocked) return inner;

  // Unlocked — link to game
  return (
    <Link href={`/games/${game.slug}`} onClick={() => haptic("tap")} style={{ textDecoration: "none", color: "inherit" }}>
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
    <div style={{ display: "flex", alignItems: "center", gap: 4, animation: streak >= 3 ? "hub-streak-glow 2s ease-in-out infinite" : undefined }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 2C12 2 4 10 4 15a8 8 0 0 0 16 0c0-5-8-13-8-13z" fill="#D9A441" opacity="0.9" />
        <path d="M12 10c0 0-3 3.5-3 5.5a3 3 0 0 0 6 0c0-2-3-5.5-3-5.5z" fill="#F5D76E" opacity="0.8" />
      </svg>
      <span style={{ fontSize: 18, fontWeight: 800, fontFamily: "'JetBrains Mono', ui-monospace, monospace", color: "#D9A441" }}>
        {streak}
      </span>
    </div>
  );
}

/* ——————————————————————————————————————————————
   Token Balance Display
   —————————————————————————————————————————————— */

function TokenBalanceBar({ tokens, nextUnlock }: { tokens: TokenState; nextUnlock: { slug: string; unlockCost: number } | null }) {
  const gameName = nextUnlock ? GAMES.find((g) => g.slug === nextUnlock.slug)?.name ?? "Next game" : null;
  const progress = nextUnlock ? Math.min(100, (tokens.balance / nextUnlock.unlockCost) * 100) : 100;

  return (
    <div style={{
      borderRadius: 14, padding: "14px 16px",
      background: "linear-gradient(135deg, #1E2B36 0%, #2A3A48 100%)",
      display: "grid", gap: 10, position: "relative", overflow: "hidden",
    }}>
      {/* Gold accent */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, #D9A441, transparent)" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ animation: "hub-token-pulse 2s ease-in-out infinite" }}>
            <CoinIcon size={22} />
          </div>
          <div>
            <span style={{
              fontSize: 22, fontWeight: 800, color: "#F5D76E",
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            }}>
              {tokens.balance}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#697B89", marginLeft: 6 }}>tokens</span>
          </div>
        </div>

        {/* Share bonus callout */}
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          padding: "4px 10px", borderRadius: 9999,
          background: "rgba(217,164,65,0.12)", border: "1px solid rgba(217,164,65,0.2)",
        }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M4 8l4-6v4h4l-4 6V8H4z" fill="#D9A441" />
          </svg>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#D9A441", letterSpacing: "0.02em" }}>
            +{TOKEN_REWARDS.SHARE_BONUS} per share
          </span>
        </div>
      </div>

      {/* Next unlock progress */}
      {nextUnlock && (
        <div style={{ display: "grid", gap: 5 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#697B89" }}>
              Next unlock: {gameName}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#D9A441", fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
              {tokens.balance}/{nextUnlock.unlockCost}
            </span>
          </div>
          <div style={{ height: 5, borderRadius: 9999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${progress}%`, borderRadius: 9999,
              background: progress >= 100 ? "linear-gradient(90deg, #D9A441, #F5D76E)" : "linear-gradient(90deg, #D9A441, #C49835)",
              transition: "width 500ms cubic-bezier(0.16, 1, 0.3, 1)",
            }} />
          </div>
        </div>
      )}

      {/* Earn tokens hint */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {[
          { label: "Play", value: `+${TOKEN_REWARDS.GAME_COMPLETE}` },
          { label: "Master", value: `+${TOKEN_REWARDS.GAME_MASTERED}` },
          { label: "Share", value: `+${TOKEN_REWARDS.SHARE_BONUS}` },
          { label: "Email", value: `+${TOKEN_REWARDS.EMAIL_SIGNUP}` },
        ].map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 500, color: "#697B89" }}>{item.label}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#F5D76E", fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ——————————————————————————————————————————————
   Email Signup — earns tokens + saves progress
   —————————————————————————————————————————————— */

function EmailSignupBanner({ emailClaimed, onEmailClaimed }: { emailClaimed: boolean; onEmailClaimed: () => void }) {
  const [email, setEmail] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState("");

  if (emailClaimed || submitted) {
    return (
      <div style={{
        borderRadius: 12, padding: "12px 16px",
        background: "rgba(46,125,90,0.06)", border: "1px solid rgba(46,125,90,0.15)",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
          <circle cx="10" cy="10" r="9" fill="#2E7D5A" opacity="0.15" />
          <path d="M6.5 10.5l2.5 2.5 5-5" stroke="#2E7D5A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#2E7D5A" }}>
            +{TOKEN_REWARDS.EMAIL_SIGNUP} tokens earned!
          </p>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 500, color: "#697B89" }}>
            Progress saved. You&apos;ll get notified about new games &amp; prizes.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Enter a valid email");
      return;
    }
    setError("");

    // TODO: POST to /api/games/meta/email or similar
    // For now, just award tokens locally
    awardEmailSignup();
    setSubmitted(true);
    haptic("success");
    onEmailClaimed();
  };

  return (
    <div style={{
      borderRadius: 12,
      background: "linear-gradient(135deg, rgba(217,164,65,0.06) 0%, rgba(36,87,122,0.06) 100%)",
      border: "1px solid #E2D8CA", padding: "14px 16px",
      display: "grid", gap: 10,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "grid", gap: 2 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1E2B36" }}>
            Add your email for +{TOKEN_REWARDS.EMAIL_SIGNUP} tokens
          </p>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 500, color: "#697B89" }}>
            Save progress, unlock prizes, and get notified about new games
          </p>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 3,
          padding: "3px 8px", borderRadius: 9999,
          background: "rgba(217,164,65,0.12)", border: "1px solid rgba(217,164,65,0.25)",
          flexShrink: 0,
        }}>
          <CoinIcon size={12} />
          <span style={{ fontSize: 11, fontWeight: 800, color: "#D9A441", fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
            +{TOKEN_REWARDS.EMAIL_SIGNUP}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          placeholder="your@email.com"
          style={{
            flex: 1, padding: "10px 14px", borderRadius: 10,
            border: error ? "1.5px solid #A34C44" : "1px solid #E2D8CA",
            background: "#FFFFFF", fontSize: 14, fontWeight: 500,
            color: "#1E2B36", outline: "none",
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "10px 20px", borderRadius: 10, border: "none", cursor: "pointer",
            background: "linear-gradient(135deg, #D9A441, #C49835)",
            color: "#FFFFFF", fontSize: 13, fontWeight: 700,
            touchAction: "manipulation", WebkitTapHighlightColor: "transparent",
            whiteSpace: "nowrap",
          }}
        >
          Claim
        </button>
      </form>
      {error && <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#A34C44" }}>{error}</p>}
    </div>
  );
}

/* ——————————————————————————————————————————————
   Prize Tiers
   —————————————————————————————————————————————— */

function PrizeTiersSection({ tokens }: { tokens: TokenState }) {
  const currentTier = getCurrentPrizeTier(tokens);
  const nextTier = getNextPrizeTier(tokens);

  return (
    <div style={{
      borderRadius: 14, padding: "16px",
      background: "#FFFFFF", border: "1px solid #E2D8CA",
      display: "grid", gap: 12,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#1E2B36", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
          Prizes &amp; Rewards
        </h2>
        {currentTier && (
          <span style={{
            fontSize: 11, fontWeight: 700, color: "#D9A441",
            padding: "3px 8px", borderRadius: 9999,
            background: "rgba(217,164,65,0.1)", border: "1px solid rgba(217,164,65,0.2)",
          }}>
            {currentTier.emoji} {currentTier.name}
          </span>
        )}
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {PRIZE_TIERS.map((tier) => {
          const reached = tokens.totalEarned >= tier.threshold;
          const isCurrent = currentTier?.threshold === tier.threshold;
          const isNext = nextTier?.threshold === tier.threshold;
          const progress = Math.min(100, (tokens.totalEarned / tier.threshold) * 100);

          return (
            <div
              key={tier.threshold}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 12px", borderRadius: 10,
                background: reached ? "rgba(46,125,90,0.04)" : isNext ? "rgba(217,164,65,0.04)" : "rgba(0,0,0,0.01)",
                border: isCurrent ? "1px solid rgba(46,125,90,0.2)" : isNext ? "1px solid rgba(217,164,65,0.15)" : "1px solid transparent",
                opacity: reached ? 1 : 0.7,
              }}
            >
              {/* Emoji */}
              <span style={{ fontSize: 22, width: 32, textAlign: "center", filter: reached ? "none" : "grayscale(0.8)" }}>
                {tier.emoji}
              </span>

              {/* Info */}
              <div style={{ flex: 1, display: "grid", gap: 3 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{
                    fontSize: 13, fontWeight: 700,
                    color: reached ? "#2E7D5A" : "#1E2B36",
                  }}>
                    {tier.name}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    color: reached ? "#2E7D5A" : "#9C9590",
                  }}>
                    {reached ? "✓ Unlocked" : `${tier.threshold} tokens`}
                  </span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 500, color: "#697B89" }}>
                  {tier.description}
                </span>
                {/* Progress bar for next tier */}
                {isNext && !reached && (
                  <div style={{ height: 3, borderRadius: 9999, background: "#E2D8CA", overflow: "hidden", marginTop: 2 }}>
                    <div style={{
                      height: "100%", width: `${progress}%`, borderRadius: 9999,
                      background: "linear-gradient(90deg, #D9A441, #F5D76E)",
                      transition: "width 500ms cubic-bezier(0.16, 1, 0.3, 1)",
                    }} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ——————————————————————————————————————————————
   Main Hub
   —————————————————————————————————————————————— */

export default function GameHub() {
  const [streak, setStreak] = React.useState(0);
  const [statuses, setStatuses] = React.useState<Record<string, GameStatus>>({});
  const [tokens, setTokens] = React.useState<TokenState>(() => ({
    totalEarned: 0, balance: 0, unlockedGames: ["byte-choice", "pixel-pairs", "relay-sprint"], shareLog: {}, emailClaimed: false,
  }));

  React.useEffect(() => {
    injectKeyframes();
    setStreak(getStreakData().current);
    setStatuses(getDailyProgress().games);
    setTokens(getTokenState());
  }, []);

  const liveGames = GAMES.filter((g) => g.live);
  const completed = liveGames.filter((g) => {
    const s = statuses[g.slug] ?? "unplayed";
    return s === "played" || s === "won";
  }).length;

  const nextUnlockable = getNextUnlockable(tokens);
  const nextUnlock = nextUnlockable.length > 0 ? nextUnlockable[0] : null;

  const handleUnlock = React.useCallback((slug: string) => {
    const success = unlockGame(slug);
    if (success) {
      haptic("success");
      setTokens(getTokenState());
    }
  }, []);

  return (
    <div style={{ minHeight: "100dvh", background: "#F7F3EE" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 16px 96px", display: "grid", gap: 20 }}>

        {/* ——— Header ——— */}
        <header style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ margin: 0, color: "#1E2B36", fontSize: 32, fontFamily: "'Mansalva', cursive", lineHeight: 1.1 }}>
              Language Games
            </h1>
            <StreakDisplay streak={streak} />
          </div>
          <p style={{ margin: 0, color: "#3E4E5C", fontWeight: 500, fontSize: 14, lineHeight: 1.4 }}>
            Play daily. Build vocabulary. Track your streak.
          </p>

          {/* Progress bar */}
          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#697B89" }}>Today&apos;s progress</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#24577A", fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
                {completed}/{liveGames.length}
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 9999, background: "#E2D8CA", overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${liveGames.length > 0 ? (completed / liveGames.length) * 100 : 0}%`, borderRadius: 9999,
                background: "linear-gradient(90deg, #24577A, #2E7D5A)", transition: "width 500ms cubic-bezier(0.16, 1, 0.3, 1)",
              }} />
            </div>
          </div>
        </header>

        {/* ——— Token Balance ——— */}
        <TokenBalanceBar tokens={tokens} nextUnlock={nextUnlock} />

        {/* ——— Email Signup for Bonus Tokens ——— */}
        <EmailSignupBanner
          emailClaimed={tokens.emailClaimed}
          onEmailClaimed={() => setTokens(getTokenState())}
        />

        {/* ——— Game Grid ——— */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
          {GAMES.map((game, i) => {
            const unlockDef = GAME_UNLOCK_COSTS.find((g) => g.slug === game.slug);
            const unlockCost = unlockDef?.unlockCost ?? 0;
            const isUnlocked = tokens.unlockedGames.includes(game.slug);

            return (
              <GameCard
                key={game.slug}
                game={game}
                status={statuses[game.slug] ?? "unplayed"}
                index={i}
                isUnlocked={isUnlocked}
                unlockCost={unlockCost}
                tokenBalance={tokens.balance}
                onUnlock={handleUnlock}
              />
            );
          })}
        </section>

        {/* ——— Prizes & Rewards ——— */}
        <PrizeTiersSection tokens={tokens} />
      </div>
    </div>
  );
}
