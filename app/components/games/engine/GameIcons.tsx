"use client";

import * as React from "react";

/**
 * Premium game icons — hand-crafted SVGs for TutorLingua games.
 * Each icon is a 40×40 SVG with gradients, depth, and personality.
 * No emoji. No icon libraries. Every pixel intentional.
 */

/* ——— Byte Choice: lightning bolt through answer cards ——— */
export function ByteChoiceIcon({ size = 40 }: { size?: number }) {
  const id = React.useId();
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="40" y2="40">
          <stop stopColor="#24577A" />
          <stop offset="1" stopColor="#1A4060" />
        </linearGradient>
        <linearGradient id={`${id}-bolt`} x1="18" y1="6" x2="24" y2="34">
          <stop stopColor="#F5D76E" />
          <stop offset="1" stopColor="#D9A441" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="36" height="36" rx="10" fill={`url(#${id}-bg)`} />
      {/* Answer bars */}
      <rect x="8" y="10" width="24" height="4" rx="2" fill="white" opacity="0.15" />
      <rect x="8" y="17" width="20" height="4" rx="2" fill="white" opacity="0.12" />
      <rect x="8" y="24" width="22" height="4" rx="2" fill="white" opacity="0.1" />
      {/* Lightning bolt */}
      <path d="M22 6L16 19h5l-3 15 10-16h-5.5L26 6h-4z" fill={`url(#${id}-bolt)`} />
      {/* Highlight gleam */}
      <path d="M21 8l-1 3h2l-0.5 2" stroke="white" strokeWidth="0.5" opacity="0.4" strokeLinecap="round" />
    </svg>
  );
}

/* ——— Pixel Pairs: flipping cards with matching symbols ——— */
export function PixelPairsIcon({ size = 40 }: { size?: number }) {
  const id = React.useId();
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="40" y2="40">
          <stop stopColor="#1A7A6A" />
          <stop offset="1" stopColor="#12594D" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="36" height="36" rx="10" fill={`url(#${id}-bg)`} />
      {/* 2x2 card grid — one flipped */}
      <rect x="7" y="7" width="11.5" height="11.5" rx="3" fill="white" opacity="0.2" />
      <rect x="21.5" y="7" width="11.5" height="11.5" rx="3" fill="white" opacity="0.2" />
      <rect x="7" y="21.5" width="11.5" height="11.5" rx="3" fill="white" opacity="0.2" />
      {/* Flipped card — revealed */}
      <rect x="21.5" y="21.5" width="11.5" height="11.5" rx="3" fill="#D46A4E" opacity="0.9" />
      {/* Match symbols — stars on matching cards */}
      <circle cx="12.75" cy="12.75" r="2.5" fill="white" opacity="0.5" />
      <circle cx="27.25" cy="27.25" r="2.5" fill="white" opacity="0.8" />
      {/* Question marks on hidden cards */}
      <text x="27.25" y="15" fill="white" fontSize="8" fontWeight="700" textAnchor="middle" opacity="0.35" fontFamily="system-ui">?</text>
      <text x="12.75" y="29.5" fill="white" fontSize="8" fontWeight="700" textAnchor="middle" opacity="0.35" fontFamily="system-ui">?</text>
      {/* Connecting sparkle between matches */}
      <path d="M15 15l10 10" stroke="white" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.25" />
    </svg>
  );
}

/* ——— Relay Sprint: falling words with speed lines ——— */
export function RelaySprintIcon({ size = 40 }: { size?: number }) {
  const id = React.useId();
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="40" y2="40">
          <stop stopColor="#304B78" />
          <stop offset="1" stopColor="#223560" />
        </linearGradient>
        <linearGradient id={`${id}-word`} x1="12" y1="8" x2="28" y2="16">
          <stop stopColor="#A8E063" />
          <stop offset="1" stopColor="#88B948" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="36" height="36" rx="10" fill={`url(#${id}-bg)`} />
      {/* Three lanes */}
      <line x1="15" y1="5" x2="15" y2="35" stroke="white" strokeWidth="0.5" opacity="0.1" />
      <line x1="25" y1="5" x2="25" y2="35" stroke="white" strokeWidth="0.5" opacity="0.1" />
      {/* Falling word block */}
      <rect x="11" y="10" width="18" height="7" rx="3" fill={`url(#${id}-word)`} />
      <rect x="13.5" y="12" width="13" height="3" rx="1.5" fill="white" opacity="0.3" />
      {/* Speed lines */}
      <line x1="20" y1="19" x2="20" y2="24" stroke="#88B948" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="16" y1="20" x2="16" y2="23" stroke="#88B948" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
      <line x1="24" y1="19" x2="24" y2="22" stroke="#88B948" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
      {/* Catch zone */}
      <rect x="8" y="30" width="24" height="4" rx="2" fill="white" opacity="0.12" />
      <rect x="14" y="30" width="12" height="4" rx="2" fill="#88B948" opacity="0.3" />
    </svg>
  );
}

/* ——— Connections: four coloured tiles with link lines ——— */
export function ConnectionsIcon({ size = 40 }: { size?: number }) {
  const id = React.useId();
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="40" y2="40">
          <stop stopColor="#C49835" />
          <stop offset="1" stopColor="#A37E28" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="36" height="36" rx="10" fill={`url(#${id}-bg)`} />
      {/* 2x2 category tiles */}
      <rect x="7" y="7" width="11" height="11" rx="3" fill="white" opacity="0.3" />
      <rect x="22" y="7" width="11" height="11" rx="3" fill="white" opacity="0.22" />
      <rect x="7" y="22" width="11" height="11" rx="3" fill="white" opacity="0.22" />
      <rect x="22" y="22" width="11" height="11" rx="3" fill="white" opacity="0.18" />
      {/* Connection lines */}
      <path d="M18 12.5h4M12.5 18v4M27.5 18v4M18 27.5h4" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      {/* Inner dots — represent words */}
      <circle cx="12.5" cy="12.5" r="1.8" fill="white" opacity="0.6" />
      <circle cx="27.5" cy="12.5" r="1.8" fill="white" opacity="0.6" />
      <circle cx="12.5" cy="27.5" r="1.8" fill="white" opacity="0.6" />
      <circle cx="27.5" cy="27.5" r="1.8" fill="white" opacity="0.6" />
    </svg>
  );
}

/* ——— Daily Decode: cipher lock with keyhole ——— */
export function DailyDecodeIcon({ size = 40 }: { size?: number }) {
  const id = React.useId();
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="40" y2="40">
          <stop stopColor="#D36135" />
          <stop offset="1" stopColor="#B14E28" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="36" height="36" rx="10" fill={`url(#${id}-bg)`} />
      {/* Lock body */}
      <rect x="12" y="18" width="16" height="13" rx="3" fill="white" opacity="0.25" />
      {/* Shackle */}
      <path d="M15 18v-4a5 5 0 0 1 10 0v4" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.4" />
      {/* Keyhole */}
      <circle cx="20" cy="24" r="2" fill="white" opacity="0.7" />
      <rect x="19.2" y="25" width="1.6" height="3" rx="0.8" fill="white" opacity="0.7" />
      {/* Floating cipher letters */}
      <text x="9" y="13" fill="white" fontSize="7" fontWeight="700" fontFamily="system-ui" opacity="0.5">A</text>
      <text x="29" y="11" fill="white" fontSize="6" fontWeight="700" fontFamily="system-ui" opacity="0.35">Z</text>
      <text x="19" y="10" fill="white" fontSize="8" fontWeight="800" fontFamily="system-ui" opacity="0.3">?</text>
    </svg>
  );
}

/* ——— Word Ladder: ascending steps with letter blocks ——— */
export function WordLadderIcon({ size = 40 }: { size?: number }) {
  const id = React.useId();
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="40" y2="40">
          <stop stopColor="#3E5641" />
          <stop offset="1" stopColor="#2D4030" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="36" height="36" rx="10" fill={`url(#${id}-bg)`} />
      {/* Staircase blocks ascending */}
      <rect x="7" y="27" width="10" height="6" rx="2" fill="white" opacity="0.2" />
      <rect x="15" y="21" width="10" height="6" rx="2" fill="white" opacity="0.25" />
      <rect x="23" y="15" width="10" height="6" rx="2" fill="white" opacity="0.3" />
      {/* Arrow ascending */}
      <path d="M30 13V8M30 8l-2.5 2.5M30 8l2.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      {/* Letter slots */}
      <rect x="9" y="29" width="3" height="2.5" rx="0.5" fill="white" opacity="0.4" />
      <rect x="13" y="29" width="3" height="2.5" rx="0.5" fill="white" opacity="0.4" />
      <rect x="17" y="23" width="3" height="2.5" rx="0.5" fill="white" opacity="0.4" />
      <rect x="21" y="23" width="3" height="2.5" rx="0.5" fill="white" opacity="0.4" />
      <rect x="25" y="17" width="3" height="2.5" rx="0.5" fill="white" opacity="0.4" />
      <rect x="29" y="17" width="3" height="2.5" rx="0.5" fill="white" opacity="0.4" />
    </svg>
  );
}

/* ——— Synonym Spiral: ascending spiral tower ——— */
export function SynonymSpiralIcon({ size = 40 }: { size?: number }) {
  const id = React.useId();
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="40" y2="40">
          <stop stopColor="#8B5CB5" />
          <stop offset="1" stopColor="#6B3F95" />
        </linearGradient>
        <linearGradient id={`${id}-path`} x1="8" y1="34" x2="20" y2="6">
          <stop stopColor="white" stopOpacity="0.15" />
          <stop offset="1" stopColor="white" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="36" height="36" rx="10" fill={`url(#${id}-bg)`} />
      {/* Spiral path */}
      <path d="M10 33Q10 25 20 25Q30 25 30 17Q30 10 20 10Q14 10 14 6" stroke={`url(#${id}-path)`} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Dots along spiral */}
      <circle cx="10" cy="33" r="2.5" fill="white" opacity="0.25" />
      <circle cx="20" cy="25" r="2.5" fill="white" opacity="0.4" />
      <circle cx="30" cy="17" r="2.5" fill="white" opacity="0.55" />
      <circle cx="20" cy="10" r="2.5" fill="white" opacity="0.7" />
      {/* Star at apex */}
      <circle cx="14" cy="6" r="3" fill="#F5D76E" opacity="0.9" />
    </svg>
  );
}

/* ——— Missing Piece: sentence with glowing gap ——— */
export function MissingPieceIcon({ size = 40 }: { size?: number }) {
  const id = React.useId();
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="40" y2="40">
          <stop stopColor="#5A8AB5" />
          <stop offset="1" stopColor="#3E6E95" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="36" height="36" rx="10" fill={`url(#${id}-bg)`} />
      {/* Text line with gap */}
      <rect x="7" y="12" width="8" height="3" rx="1.5" fill="white" opacity="0.25" />
      {/* The gap — highlighted */}
      <rect x="17" y="10" width="10" height="7" rx="2.5" fill="white" opacity="0.15" />
      <rect x="17" y="10" width="10" height="7" rx="2.5" stroke="white" strokeWidth="1.2" strokeDasharray="2.5 1.5" opacity="0.6" />
      <text x="22" y="16" fill="white" fontSize="7" fontWeight="700" textAnchor="middle" opacity="0.7" fontFamily="system-ui">?</text>
      {/* More text */}
      <rect x="29" y="12" width="5" height="3" rx="1.5" fill="white" opacity="0.25" />
      {/* Answer options */}
      <rect x="7" y="24" width="12" height="6" rx="2.5" fill="white" opacity="0.3" />
      <rect x="21" y="24" width="12" height="6" rx="2.5" fill="white" opacity="0.15" />
      {/* Checkmark on correct answer */}
      <path d="M11 27l1.5 1.5L16 25.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
    </svg>
  );
}

/* ——— Odd One Out: three matching + one different ——— */
export function OddOneOutIcon({ size = 40 }: { size?: number }) {
  const id = React.useId();
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="40" y2="40">
          <stop stopColor="#D36135" />
          <stop offset="1" stopColor="#B84E28" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="36" height="36" rx="10" fill={`url(#${id}-bg)`} />
      {/* Three matching circles */}
      <circle cx="13" cy="14" r="5" fill="white" opacity="0.25" />
      <circle cx="27" cy="14" r="5" fill="white" opacity="0.25" />
      <circle cx="13" cy="27" r="5" fill="white" opacity="0.25" />
      {/* The odd one — different shape */}
      <rect x="22" y="22" width="10" height="10" rx="2.5" fill="white" opacity="0.5" />
      {/* Subtle ticks on matching */}
      <path d="M11 14l1.2 1.2L15 13" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <path d="M25 14l1.2 1.2L29 13" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <path d="M11 27l1.2 1.2L15 26" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      {/* Question mark on odd */}
      <text x="27" y="29.5" fill="white" fontSize="7" fontWeight="800" textAnchor="middle" opacity="0.8" fontFamily="system-ui">?</text>
    </svg>
  );
}

/* ——— Neon Intercept: neon lanes with crosshair ——— */
export function NeonInterceptIcon({ size = 40 }: { size?: number }) {
  const id = React.useId();
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="40" y2="40">
          <stop stopColor="#D36135" />
          <stop offset="1" stopColor="#9E3F1E" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="36" height="36" rx="10" fill={`url(#${id}-bg)`} />
      {/* Lane dividers */}
      <line x1="15" y1="6" x2="15" y2="34" stroke="white" strokeWidth="0.6" opacity="0.15" />
      <line x1="25" y1="6" x2="25" y2="34" stroke="white" strokeWidth="0.6" opacity="0.15" />
      {/* Falling word block */}
      <rect x="16" y="9" width="8" height="5" rx="2" fill="white" opacity="0.35" />
      <rect x="17.5" y="10.5" width="5" height="2" rx="1" fill="white" opacity="0.2" />
      {/* Speed lines */}
      <line x1="20" y1="16" x2="20" y2="21" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.35" />
      <line x1="17" y1="17" x2="17" y2="20" stroke="white" strokeWidth="0.8" strokeLinecap="round" opacity="0.2" />
      <line x1="23" y1="16" x2="23" y2="19" stroke="white" strokeWidth="0.8" strokeLinecap="round" opacity="0.2" />
      {/* Catch zone */}
      <rect x="7" y="29" width="26" height="5" rx="2.5" fill="white" opacity="0.12" />
      <rect x="14" y="29" width="12" height="5" rx="2.5" fill="white" opacity="0.25" />
      {/* Crosshair glow */}
      <circle cx="20" cy="31.5" r="1.5" fill="white" opacity="0.6" />
    </svg>
  );
}

/* ——— Grammar Rush: racing clock with grammar symbols ——— */
export function GrammarRushIcon({ size = 40 }: { size?: number }) {
  const id = React.useId();
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="40" y2="40">
          <stop stopColor="#B0A99F" />
          <stop offset="1" stopColor="#8F8880" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="36" height="36" rx="10" fill={`url(#${id}-bg)`} />
      {/* Clock face */}
      <circle cx="20" cy="19" r="10" fill="white" opacity="0.15" stroke="white" strokeWidth="1.5" />
      {/* Clock hands */}
      <line x1="20" y1="19" x2="20" y2="12" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <line x1="20" y1="19" x2="25" y2="19" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
      <circle cx="20" cy="19" r="1.2" fill="white" opacity="0.7" />
      {/* Grammar symbols */}
      <text x="12" y="35" fill="white" fontSize="7" fontWeight="700" fontFamily="system-ui" opacity="0.4">Aa</text>
      <text x="26" y="35" fill="white" fontSize="6" fontWeight="600" fontFamily="system-ui" opacity="0.3">→</text>
    </svg>
  );
}

/* ——— Accent Match: sound waves with accent marks ——— */
export function AccentMatchIcon({ size = 40 }: { size?: number }) {
  const id = React.useId();
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="40" y2="40">
          <stop stopColor="#B0A99F" />
          <stop offset="1" stopColor="#8F8880" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="36" height="36" rx="10" fill={`url(#${id}-bg)`} />
      {/* Sound wave arcs */}
      <path d="M14 20a6 6 0 0 1 0-8" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.25" />
      <path d="M11 22a10 10 0 0 1 0-12" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.18" />
      <path d="M17 18a3 3 0 0 1 0-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.35" />
      {/* Speaker dot */}
      <circle cx="19" cy="16" r="2" fill="white" opacity="0.5" />
      {/* Accent marks */}
      <text x="26" y="15" fill="white" fontSize="12" fontWeight="700" fontFamily="serif" opacity="0.5">é</text>
      <text x="27" y="30" fill="white" fontSize="10" fontWeight="600" fontFamily="serif" opacity="0.35">ñ</text>
    </svg>
  );
}

/* ——— Idiom Hunt: magnifying glass over word grid ——— */
export function IdiomHuntIcon({ size = 40 }: { size?: number }) {
  const id = React.useId();
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="40" y2="40">
          <stop stopColor="#B0A99F" />
          <stop offset="1" stopColor="#8F8880" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="36" height="36" rx="10" fill={`url(#${id}-bg)`} />
      {/* Word grid lines */}
      <rect x="7" y="8" width="16" height="3" rx="1" fill="white" opacity="0.15" />
      <rect x="7" y="13" width="14" height="3" rx="1" fill="white" opacity="0.12" />
      <rect x="7" y="18" width="18" height="3" rx="1" fill="white" opacity="0.15" />
      <rect x="7" y="23" width="12" height="3" rx="1" fill="white" opacity="0.1" />
      {/* Highlighted idiom */}
      <rect x="9" y="18" width="12" height="3" rx="1" fill="white" opacity="0.2" stroke="white" strokeWidth="0.8" />
      {/* Magnifying glass */}
      <circle cx="28" cy="26" r="6" fill="white" opacity="0.08" stroke="white" strokeWidth="1.8" />
      <line x1="32.5" y1="30.5" x2="35" y2="33" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      {/* Lens highlight */}
      <path d="M25.5 23.5a3 3 0 0 1 2 0" stroke="white" strokeWidth="0.8" strokeLinecap="round" opacity="0.3" />
    </svg>
  );
}

/* ——— Tense Twist: arrow between tense forms ——— */
export function TenseTwistIcon({ size = 40 }: { size?: number }) {
  const id = React.useId();
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="40" y2="40">
          <stop stopColor="#B0A99F" />
          <stop offset="1" stopColor="#8F8880" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="36" height="36" rx="10" fill={`url(#${id}-bg)`} />
      {/* Past tense block */}
      <rect x="6" y="10" width="12" height="8" rx="3" fill="white" opacity="0.2" />
      <text x="12" y="16" fill="white" fontSize="5.5" fontWeight="700" textAnchor="middle" opacity="0.5" fontFamily="system-ui">was</text>
      {/* Transformation arrow */}
      <path d="M20 14h6M26 14l-2-2M26 14l-2 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      {/* Future tense block */}
      <rect x="22" y="22" width="12" height="8" rx="3" fill="white" opacity="0.3" />
      <text x="28" y="28" fill="white" fontSize="5" fontWeight="700" textAnchor="middle" opacity="0.6" fontFamily="system-ui">will be</text>
      {/* Twist spiral */}
      <path d="M17 20Q20 18 20 22Q20 26 23 24" stroke="white" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.3" />
    </svg>
  );
}

/* ——— Map slug → icon component ——— */
export const GAME_ICON_MAP: Record<string, React.FC<{ size?: number }>> = {
  "byte-choice": ByteChoiceIcon,
  "pixel-pairs": PixelPairsIcon,
  "relay-sprint": RelaySprintIcon,
  connections: ConnectionsIcon,
  "daily-decode": DailyDecodeIcon,
  "word-ladder": WordLadderIcon,
  "synonym-spiral": SynonymSpiralIcon,
  "missing-piece": MissingPieceIcon,
  "odd-one-out": OddOneOutIcon,
  "neon-intercept": NeonInterceptIcon,
  "grammar-rush": GrammarRushIcon,
  "accent-match": AccentMatchIcon,
  "idiom-hunt": IdiomHuntIcon,
  "tense-twist": TenseTwistIcon,
};
