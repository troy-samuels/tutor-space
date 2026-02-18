"use client";

import * as React from "react";

/**
 * Luxury game icons with gradient fills.
 * Each icon is a 40×40 SVG with unique colour palette,
 * designed to feel premium and polished at any size.
 */

const iconStyle: React.CSSProperties = {
  flexShrink: 0,
  filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))",
};

/* ——— Connections: interlocking nodes/network ——— */
export function ConnectionsIcon({ size = 40 }: { size?: number }) {
  const id = React.useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      style={iconStyle}
      aria-hidden
    >
      <defs>
        <linearGradient id={`${id}-cg`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#facc15" />
          <stop offset="0.5" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id={`${id}-cg2`} x1="0" y1="40" x2="40" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22c55e" />
          <stop offset="1" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      {/* Grid of 4 connected dots */}
      <circle cx="12" cy="12" r="5" fill={`url(#${id}-cg)`} />
      <circle cx="28" cy="12" r="5" fill={`url(#${id}-cg2)`} />
      <circle cx="12" cy="28" r="5" fill={`url(#${id}-cg2)`} />
      <circle cx="28" cy="28" r="5" fill={`url(#${id}-cg)`} />
      {/* Connecting lines */}
      <line x1="17" y1="12" x2="23" y2="12" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="17" x2="12" y2="23" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="28" y1="17" x2="28" y2="23" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="17" y1="28" x2="23" y2="28" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" />
      {/* Diagonal cross-links */}
      <line x1="16" y1="16" x2="24" y2="24" stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeLinecap="round" />
      <line x1="24" y1="16" x2="16" y2="24" stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

/* ——— Daily Decode: book / scroll with mystery ——— */
export function DailyDecodeIcon({ size = 40 }: { size?: number }) {
  const id = React.useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      style={iconStyle}
      aria-hidden
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2dd4bf" />
          <stop offset="0.5" stopColor="#14b8a6" />
          <stop offset="1" stopColor="#0d9488" />
        </linearGradient>
        <linearGradient id={`${id}-bg2`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5eead4" />
          <stop offset="1" stopColor="#2dd4bf" />
        </linearGradient>
      </defs>
      {/* Book spine */}
      <path
        d="M8 7 C8 7 20 5 20 5 L20 35 C20 35 8 33 8 33 Z"
        fill={`url(#${id}-bg)`}
        opacity="0.8"
      />
      {/* Book cover right */}
      <path
        d="M20 5 C20 5 32 7 32 7 L32 33 C32 33 20 35 20 35 Z"
        fill={`url(#${id}-bg2)`}
        opacity="0.6"
      />
      {/* Text lines on right page */}
      <line x1="23" y1="13" x2="29" y2="13" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="23" y1="17" x2="28" y2="17" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="23" y1="21" x2="27" y2="21" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" strokeLinecap="round" />
      {/* Mystery blank (gap) */}
      <rect x="23" y="24" width="6" height="2" rx="1" fill="rgba(255,255,255,0.5)" />
      {/* Question mark */}
      <text
        x="14"
        y="23"
        fill="rgba(255,255,255,0.5)"
        fontSize="12"
        fontWeight="700"
        fontFamily="system-ui"
        textAnchor="middle"
      >
        ?
      </text>
    </svg>
  );
}

/* ——— Word Ladder: ascending steps ——— */
export function WordLadderIcon({ size = 40 }: { size?: number }) {
  const id = React.useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      style={iconStyle}
      aria-hidden
    >
      <defs>
        <linearGradient id={`${id}-wl`} x1="0" y1="40" x2="40" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10B981" />
          <stop offset="1" stopColor="#34D399" />
        </linearGradient>
      </defs>
      {/* Ladder rails */}
      <line x1="13" y1="6" x2="13" y2="34" stroke={`url(#${id}-wl)`} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="27" y1="6" x2="27" y2="34" stroke={`url(#${id}-wl)`} strokeWidth="2.5" strokeLinecap="round" />
      {/* Rungs */}
      <line x1="13" y1="11" x2="27" y2="11" stroke={`url(#${id}-wl)`} strokeWidth="2" strokeLinecap="round" opacity="0.9" />
      <line x1="13" y1="18" x2="27" y2="18" stroke={`url(#${id}-wl)`} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <line x1="13" y1="25" x2="27" y2="25" stroke={`url(#${id}-wl)`} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <line x1="13" y1="32" x2="27" y2="32" stroke={`url(#${id}-wl)`} strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      {/* Star at top */}
      <circle cx="20" cy="6" r="3" fill={`url(#${id}-wl)`} opacity="0.8" />
    </svg>
  );
}

/* ——— Odd One Out: one different circle among similar ones ——— */
export function OddOneOutIcon({ size = 40 }: { size?: number }) {
  const id = React.useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      style={iconStyle}
      aria-hidden
    >
      <defs>
        <linearGradient id={`${id}-oo`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F59E0B" />
          <stop offset="1" stopColor="#FBBF24" />
        </linearGradient>
      </defs>
      {/* 3 matching circles */}
      <circle cx="12" cy="14" r="6" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
      <circle cx="28" cy="14" r="6" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
      <circle cx="12" cy="28" r="6" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
      {/* Odd one — highlighted */}
      <circle cx="28" cy="28" r="6" fill={`url(#${id}-oo)`} opacity="0.9" />
      <text x="28" y="31" fill="rgba(0,0,0,0.6)" fontSize="8" fontWeight="800" fontFamily="system-ui" textAnchor="middle">!</text>
    </svg>
  );
}

/* ——— Missing Piece: puzzle piece with gap ——— */
export function MissingPieceIcon({ size = 40 }: { size?: number }) {
  const id = React.useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      style={iconStyle}
      aria-hidden
    >
      <defs>
        <linearGradient id={`${id}-mp`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#EC4899" />
          <stop offset="1" stopColor="#F472B6" />
        </linearGradient>
      </defs>
      {/* Text line with gap */}
      <line x1="6" y1="14" x2="16" y2="14" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" />
      <rect x="18" y="11" width="10" height="6" rx="2" stroke={`url(#${id}-mp)`} strokeWidth="1.5" strokeDasharray="3 2" fill="rgba(236,72,153,0.1)" />
      <line x1="30" y1="14" x2="34" y2="14" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" />
      {/* Second line */}
      <line x1="6" y1="22" x2="22" y2="22" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" />
      <line x1="24" y1="22" x2="34" y2="22" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" />
      {/* Third line */}
      <line x1="6" y1="30" x2="18" y2="30" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeLinecap="round" />
      {/* Question mark in gap */}
      <text x="23" y="16" fill={`url(#${id}-mp)`} fontSize="7" fontWeight="700" fontFamily="system-ui" textAnchor="middle">?</text>
    </svg>
  );
}

/* ——— Synonym Spiral: ascending spiral tower ——— */
export function SynonymSpiralIcon({ size = 40 }: { size?: number }) {
  const id = React.useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      style={iconStyle}
      aria-hidden
    >
      <defs>
        <linearGradient id={`${id}-ss`} x1="10" y1="36" x2="30" y2="4" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B5CF6" />
          <stop offset="0.5" stopColor="#A78BFA" />
          <stop offset="1" stopColor="#C4B5FD" />
        </linearGradient>
      </defs>
      {/* Spiral tower — concentric arcs ascending */}
      <path d="M10 32 Q10 26 20 26 Q30 26 30 20" stroke={`url(#${id}-ss)`} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.4" />
      <path d="M30 20 Q30 14 20 14 Q10 14 10 8" stroke={`url(#${id}-ss)`} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.7" />
      <path d="M10 8 Q10 4 16 4" stroke={`url(#${id}-ss)`} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="1" />
      {/* Star at top */}
      <circle cx="18" cy="4" r="2.5" fill={`url(#${id}-ss)`} />
      {/* Base */}
      <line x1="6" y1="34" x2="34" y2="34" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ——— Map slug → icon component ——— */
export const GAME_ICON_MAP: Record<string, React.FC<{ size?: number }>> = {
  connections: ConnectionsIcon,
  "daily-decode": DailyDecodeIcon,
  "word-ladder": WordLadderIcon,
  "odd-one-out": OddOneOutIcon,
  "missing-piece": MissingPieceIcon,
  "synonym-spiral": SynonymSpiralIcon,
};
