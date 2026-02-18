"use client";

import * as React from "react";

/**
 * Premium game icons — warm palette, crafted for light background (#FDF8F5).
 * Each icon is a 40×40 SVG designed to visually represent its game mechanic.
 * Palette: #D36135 (orange), #2D2A26 (dark), #3E5641 (green),
 *          #5A8AB5 (blue), #8B5CB5 (purple), #D4A843 (gold), #F5EDE8 (cream)
 */

/* ——— Connections: four coloured tiles with subtle link lines ——— */
export function ConnectionsIcon({ size = 40 }: { size?: number }) {
  const id = React.useId();
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <defs>
        <linearGradient id={`${id}-a`} x1="4" y1="4" x2="18" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D4A843" />
          <stop offset="1" stopColor="#C49835" />
        </linearGradient>
        <linearGradient id={`${id}-b`} x1="22" y1="4" x2="36" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3E5641" />
          <stop offset="1" stopColor="#2D4533" />
        </linearGradient>
        <linearGradient id={`${id}-c`} x1="4" y1="22" x2="18" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5A8AB5" />
          <stop offset="1" stopColor="#4A7AA5" />
        </linearGradient>
        <linearGradient id={`${id}-d`} x1="22" y1="22" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B5CB5" />
          <stop offset="1" stopColor="#7B4CA5" />
        </linearGradient>
      </defs>
      {/* Four category tiles */}
      <rect x="4" y="4" width="14" height="14" rx="3.5" fill={`url(#${id}-a)`} />
      <rect x="22" y="4" width="14" height="14" rx="3.5" fill={`url(#${id}-b)`} />
      <rect x="4" y="22" width="14" height="14" rx="3.5" fill={`url(#${id}-c)`} />
      <rect x="22" y="22" width="14" height="14" rx="3.5" fill={`url(#${id}-d)`} />
      {/* Subtle connection lines between tiles */}
      <path d="M18 11h4M11 18v4M29 18v4M18 29h4" stroke="#2D2A26" strokeWidth="1.2" strokeLinecap="round" opacity="0.2" />
      {/* Inner tile detail — small dots */}
      <circle cx="11" cy="11" r="1.5" fill="white" opacity="0.4" />
      <circle cx="29" cy="11" r="1.5" fill="white" opacity="0.4" />
      <circle cx="11" cy="29" r="1.5" fill="white" opacity="0.4" />
      <circle cx="29" cy="29" r="1.5" fill="white" opacity="0.4" />
    </svg>
  );
}

/* ——— Word Ladder: ascending steps with letter slots ——— */
export function WordLadderIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      {/* Ascending staircase blocks */}
      <rect x="6" y="28" width="12" height="7" rx="2" fill="#3E5641" />
      <rect x="14" y="21" width="12" height="7" rx="2" fill="#5A8AB5" />
      <rect x="22" y="14" width="12" height="7" rx="2" fill="#D36135" />
      {/* Arrow ascending */}
      <path d="M30 12V6M30 6l-3 3M30 6l3 3" stroke="#D4A843" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {/* Letter slots on steps */}
      <rect x="8" y="30" width="3.5" height="3" rx="0.5" fill="white" opacity="0.35" />
      <rect x="12.5" y="30" width="3.5" height="3" rx="0.5" fill="white" opacity="0.35" />
      <rect x="16" y="23" width="3.5" height="3" rx="0.5" fill="white" opacity="0.35" />
      <rect x="20.5" y="23" width="3.5" height="3" rx="0.5" fill="white" opacity="0.35" />
      <rect x="24" y="16" width="3.5" height="3" rx="0.5" fill="white" opacity="0.35" />
      <rect x="28.5" y="16" width="3.5" height="3" rx="0.5" fill="white" opacity="0.35" />
    </svg>
  );
}

/* ——— Daily Decode: cipher lock with keyhole ——— */
export function DailyDecodeIcon({ size = 40 }: { size?: number }) {
  const id = React.useId();
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <defs>
        <linearGradient id={`${id}-lock`} x1="10" y1="12" x2="30" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D4A843" />
          <stop offset="1" stopColor="#B8922F" />
        </linearGradient>
      </defs>
      {/* Lock body */}
      <rect x="8" y="17" width="24" height="18" rx="4" fill={`url(#${id}-lock)`} />
      {/* Shackle */}
      <path d="M14 17V12a6 6 0 0 1 12 0v5" stroke="#2D2A26" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Keyhole */}
      <circle cx="20" cy="25" r="2.5" fill="#2D2A26" />
      <rect x="19" y="26" width="2" height="4" rx="1" fill="#2D2A26" />
      {/* Cipher letters floating */}
      <text x="6" y="10" fill="#D36135" fontSize="7" fontWeight="700" fontFamily="'Plus Jakarta Sans', system-ui" opacity="0.7">A</text>
      <text x="32" y="10" fill="#5A8AB5" fontSize="6" fontWeight="700" fontFamily="'Plus Jakarta Sans', system-ui" opacity="0.5">Z</text>
      <text x="17" y="8" fill="#8B5CB5" fontSize="5" fontWeight="600" fontFamily="'Plus Jakarta Sans', system-ui" opacity="0.4">?</text>
    </svg>
  );
}

/* ——— Odd One Out: three matching + one different ——— */
export function OddOneOutIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      {/* Three matching circles */}
      <circle cx="12" cy="13" r="6" fill="#3E5641" />
      <circle cx="28" cy="13" r="6" fill="#3E5641" />
      <circle cx="12" cy="28" r="6" fill="#3E5641" />
      {/* The odd one — different shape AND colour */}
      <rect x="22" y="22" width="12" height="12" rx="3" fill="#D36135" />
      {/* Tick marks on matching ones */}
      <path d="M10 13l1.5 1.5L14 12" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      <path d="M26 13l1.5 1.5L30 12" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      <path d="M10 28l1.5 1.5L14 27" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      {/* Question mark on the odd one */}
      <text x="28" y="30.5" fill="white" fontSize="8" fontWeight="800" fontFamily="'Plus Jakarta Sans', system-ui" textAnchor="middle" opacity="0.7">?</text>
    </svg>
  );
}

/* ——— Missing Piece: sentence with glowing gap ——— */
export function MissingPieceIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      {/* Text lines */}
      <rect x="5" y="10" width="11" height="3" rx="1.5" fill="#2D2A26" opacity="0.2" />
      {/* Gap — highlighted */}
      <rect x="18" y="8" width="10" height="7" rx="2" fill="#D36135" opacity="0.15" />
      <rect x="18" y="8" width="10" height="7" rx="2" stroke="#D36135" strokeWidth="1.5" strokeDasharray="2.5 1.5" />
      <text x="23" y="14" fill="#D36135" fontSize="7" fontWeight="700" fontFamily="'Plus Jakarta Sans', system-ui" textAnchor="middle">?</text>
      {/* More text */}
      <rect x="30" y="10" width="5" height="3" rx="1.5" fill="#2D2A26" opacity="0.2" />
      {/* Second line */}
      <rect x="5" y="20" width="14" height="3" rx="1.5" fill="#2D2A26" opacity="0.15" />
      <rect x="21" y="20" width="9" height="3" rx="1.5" fill="#2D2A26" opacity="0.15" />
      {/* Answer options below */}
      <rect x="5" y="28" width="13" height="7" rx="2.5" fill="#3E5641" opacity="0.9" />
      <rect x="22" y="28" width="13" height="7" rx="2.5" fill="#5A8AB5" opacity="0.4" />
      {/* Checkmark on selected option */}
      <path d="M9.5 31.5l1.5 1.5L14 30" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ——— Synonym Spiral: ascending spiral path ——— */
export function SynonymSpiralIcon({ size = 40 }: { size?: number }) {
  const id = React.useId();
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <defs>
        <linearGradient id={`${id}-spiral`} x1="8" y1="36" x2="32" y2="4" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B5CB5" opacity="0.3" />
          <stop offset="0.5" stopColor="#8B5CB5" opacity="0.6" />
          <stop offset="1" stopColor="#8B5CB5" />
        </linearGradient>
      </defs>
      {/* Spiral path ascending */}
      <path
        d="M8 34 Q8 26 20 26 Q32 26 32 18 Q32 10 20 10 Q12 10 12 6"
        stroke={`url(#${id}-spiral)`}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* Dots along the spiral at each level */}
      <circle cx="8" cy="34" r="2.5" fill="#8B5CB5" opacity="0.3" />
      <circle cx="20" cy="26" r="2.5" fill="#8B5CB5" opacity="0.5" />
      <circle cx="32" cy="18" r="2.5" fill="#8B5CB5" opacity="0.7" />
      <circle cx="20" cy="10" r="2.5" fill="#8B5CB5" opacity="0.85" />
      {/* Star at apex */}
      <circle cx="12" cy="5" r="3" fill="#D4A843" />
      <path d="M12 2.5l0.7 1.5h1.6l-1.3 1 0.5 1.5L12 5.5 10.5 6.5l0.5-1.5-1.3-1h1.6z" fill="white" opacity="0.6" />
    </svg>
  );
}

/* ——— Neon Intercept: three lanes with falling word and crosshair ——— */
export function NeonInterceptIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      {/* Three lane dividers */}
      <line x1="14" y1="4" x2="14" y2="36" stroke="#2D2A26" strokeWidth="0.8" opacity="0.12" />
      <line x1="27" y1="4" x2="27" y2="36" stroke="#2D2A26" strokeWidth="0.8" opacity="0.12" />
      {/* Falling word block in middle lane */}
      <rect x="16" y="8" width="9" height="5" rx="1.5" fill="#D36135" />
      <rect x="17" y="9.5" width="7" height="2" rx="1" fill="white" opacity="0.35" />
      {/* Lane tap zone highlights */}
      <rect x="2" y="28" width="10" height="8" rx="2.5" fill="#5A8AB5" opacity="0.12" />
      <rect x="15" y="28" width="10" height="8" rx="2.5" fill="#D36135" opacity="0.2" />
      <rect x="28" y="28" width="10" height="8" rx="2.5" fill="#3E5641" opacity="0.12" />
      {/* Active tap indicator on middle lane */}
      <circle cx="20" cy="32" r="2" fill="#D36135" opacity="0.6" />
      {/* Speed lines */}
      <line x1="20" y1="14" x2="20" y2="18" stroke="#D36135" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
      <line x1="20" y1="20" x2="20" y2="23" stroke="#D36135" strokeWidth="1" strokeLinecap="round" opacity="0.25" />
      {/* Combo sparkle */}
      <path d="M33 8l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" fill="#D4A843" opacity="0.6" />
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
  "neon-intercept": NeonInterceptIcon,
};
