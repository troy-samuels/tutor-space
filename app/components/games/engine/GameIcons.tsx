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

/* ——— Strands: letter grid / word search ——— */
export function StrandsIcon({ size = 40 }: { size?: number }) {
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
        <linearGradient id={`${id}-sg`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#818cf8" />
          <stop offset="0.5" stopColor="#6366f1" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
        <linearGradient id={`${id}-sh`} x1="8" y1="8" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#c084fc" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      {/* Background rounded square */}
      <rect x="4" y="4" width="32" height="32" rx="8" fill={`url(#${id}-sg)`} opacity="0.15" />
      {/* 3×3 letter grid */}
      <text x="12" y="16" fill={`url(#${id}-sh)`} fontSize="9" fontWeight="700" fontFamily="system-ui" textAnchor="middle">A</text>
      <text x="20" y="16" fill="rgba(255,255,255,0.3)" fontSize="9" fontWeight="600" fontFamily="system-ui" textAnchor="middle">R</text>
      <text x="28" y="16" fill={`url(#${id}-sh)`} fontSize="9" fontWeight="700" fontFamily="system-ui" textAnchor="middle">T</text>
      <text x="12" y="25" fill="rgba(255,255,255,0.3)" fontSize="9" fontWeight="600" fontFamily="system-ui" textAnchor="middle">E</text>
      <text x="20" y="25" fill={`url(#${id}-sh)`} fontSize="9" fontWeight="700" fontFamily="system-ui" textAnchor="middle">N</text>
      <text x="28" y="25" fill="rgba(255,255,255,0.3)" fontSize="9" fontWeight="600" fontFamily="system-ui" textAnchor="middle">D</text>
      <text x="12" y="34" fill="rgba(255,255,255,0.3)" fontSize="9" fontWeight="600" fontFamily="system-ui" textAnchor="middle">L</text>
      <text x="20" y="34" fill={`url(#${id}-sh)`} fontSize="9" fontWeight="700" fontFamily="system-ui" textAnchor="middle">S</text>
      <text x="28" y="34" fill="rgba(255,255,255,0.3)" fontSize="9" fontWeight="600" fontFamily="system-ui" textAnchor="middle">O</text>
      {/* Highlight path connecting A-N-T-S */}
      <path d="M12 13 L20 22 L28 13" stroke={`url(#${id}-sh)`} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
    </svg>
  );
}

/* ——— Spell Cast: honeycomb hexagon ——— */
export function SpellCastIcon({ size = 40 }: { size?: number }) {
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
        <linearGradient id={`${id}-hg`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fbbf24" />
          <stop offset="0.5" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id={`${id}-hg2`} x1="0" y1="40" x2="40" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fde68a" />
          <stop offset="1" stopColor="#fbbf24" />
        </linearGradient>
      </defs>
      {/* Central hexagon */}
      <polygon
        points="20,6 31,13 31,27 20,34 9,27 9,13"
        fill={`url(#${id}-hg)`}
        opacity="0.9"
      />
      {/* Inner hexagon */}
      <polygon
        points="20,12 26,16 26,24 20,28 14,24 14,16"
        fill={`url(#${id}-hg2)`}
        opacity="0.4"
      />
      {/* Center letter */}
      <text
        x="20"
        y="24"
        fill="rgba(0,0,0,0.7)"
        fontSize="12"
        fontWeight="800"
        fontFamily="system-ui"
        textAnchor="middle"
      >
        W
      </text>
    </svg>
  );
}

/* ——— Speed Clash: lightning bolt / timer ——— */
export function SpeedClashIcon({ size = 40 }: { size?: number }) {
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
        <linearGradient id={`${id}-zg`} x1="12" y1="4" x2="28" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f43f5e" />
          <stop offset="0.5" stopColor="#e11d48" />
          <stop offset="1" stopColor="#be123c" />
        </linearGradient>
        <linearGradient id={`${id}-zg2`} x1="20" y1="4" x2="20" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fda4af" />
          <stop offset="1" stopColor="#f43f5e" />
        </linearGradient>
      </defs>
      {/* Shield shape */}
      <path
        d="M20 4 L33 10 L33 22 C33 30 20 37 20 37 C20 37 7 30 7 22 L7 10 Z"
        fill={`url(#${id}-zg)`}
        opacity="0.2"
      />
      {/* Lightning bolt */}
      <path
        d="M22 6 L14 21 H19 L17 35 L28 18 H22 Z"
        fill={`url(#${id}-zg2)`}
      />
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

/* ——— Tab bar icons (Lucide-style stroke icons with luxury feel) ——— */

export function TabPlayIcon({ active, size = 22 }: { active?: boolean; size?: number }) {
  const id = React.useId();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      {active && (
        <defs>
          <linearGradient id={`${id}-tp`} x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
            <stop stopColor="#60a5fa" />
            <stop offset="1" stopColor="#818cf8" />
          </linearGradient>
        </defs>
      )}
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke={active ? `url(#${id}-tp)` : "currentColor"} strokeWidth="1.8" fill={active ? "rgba(96,165,250,0.15)" : "none"} />
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke={active ? `url(#${id}-tp)` : "currentColor"} strokeWidth="1.8" fill={active ? "rgba(129,140,248,0.15)" : "none"} />
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke={active ? `url(#${id}-tp)` : "currentColor"} strokeWidth="1.8" fill={active ? "rgba(129,140,248,0.15)" : "none"} />
      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke={active ? `url(#${id}-tp)` : "currentColor"} strokeWidth="1.8" fill={active ? "rgba(96,165,250,0.15)" : "none"} />
    </svg>
  );
}

export function TabStreakIcon({ active, size = 22 }: { active?: boolean; size?: number }) {
  const id = React.useId();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      {active && (
        <defs>
          <linearGradient id={`${id}-ts`} x1="8" y1="2" x2="16" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fbbf24" />
            <stop offset="1" stopColor="#f97316" />
          </linearGradient>
        </defs>
      )}
      <path
        d="M12 2C12 2 8 8 8 12C8 14.21 9.79 16 12 16C14.21 16 16 14.21 16 12C16 8 12 2 12 2Z"
        stroke={active ? `url(#${id}-ts)` : "currentColor"}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? "rgba(251,191,36,0.15)" : "none"}
      />
      <path
        d="M12 16V22"
        stroke={active ? `url(#${id}-ts)` : "currentColor"}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M8 22H16"
        stroke={active ? `url(#${id}-ts)` : "currentColor"}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function TabChallengeIcon({ active, size = 22 }: { active?: boolean; size?: number }) {
  const id = React.useId();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      {active && (
        <defs>
          <linearGradient id={`${id}-tc`} x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f43f5e" />
            <stop offset="1" stopColor="#e11d48" />
          </linearGradient>
        </defs>
      )}
      <path
        d="M8 21H16M12 17V21M6 3H18L17 7C17 9.76 14.76 12 12 12C9.24 12 7 9.76 7 7L6 3Z"
        stroke={active ? `url(#${id}-tc)` : "currentColor"}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? "rgba(244,63,94,0.12)" : "none"}
      />
      <path
        d="M18 3L21 5L20 8L17 7"
        stroke={active ? `url(#${id}-tc)` : "currentColor"}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M6 3L3 5L4 8L7 7"
        stroke={active ? `url(#${id}-tc)` : "currentColor"}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function TabLearnIcon({ active, size = 22 }: { active?: boolean; size?: number }) {
  const id = React.useId();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      {active && (
        <defs>
          <linearGradient id={`${id}-tl`} x1="2" y1="3" x2="22" y2="21" gradientUnits="userSpaceOnUse">
            <stop stopColor="#34d399" />
            <stop offset="1" stopColor="#10b981" />
          </linearGradient>
        </defs>
      )}
      <path
        d="M4 19.5V4.5A2.5 2.5 0 016.5 2H20V17H6.5A2.5 2.5 0 004 19.5Z"
        stroke={active ? `url(#${id}-tl)` : "currentColor"}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? "rgba(52,211,153,0.1)" : "none"}
      />
      <path
        d="M4 19.5A2.5 2.5 0 016.5 17H20V22H6.5A2.5 2.5 0 014 19.5Z"
        stroke={active ? `url(#${id}-tl)` : "currentColor"}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <line x1="9" y1="7" x2="16" y2="7" stroke={active ? `url(#${id}-tl)` : "currentColor"} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="9" y1="11" x2="14" y2="11" stroke={active ? `url(#${id}-tl)` : "currentColor"} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function TabProfileIcon({ active, size = 22 }: { active?: boolean; size?: number }) {
  const id = React.useId();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      {active && (
        <defs>
          <linearGradient id={`${id}-tu`} x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#c084fc" />
            <stop offset="1" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      )}
      <circle
        cx="12"
        cy="8"
        r="4"
        stroke={active ? `url(#${id}-tu)` : "currentColor"}
        strokeWidth="1.8"
        fill={active ? "rgba(192,132,252,0.12)" : "none"}
      />
      <path
        d="M20 21C20 17.13 16.42 14 12 14C7.58 14 4 17.13 4 21"
        stroke={active ? `url(#${id}-tu)` : "currentColor"}
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/* ——— Stats section icons ——— */

export function StatBrainIcon({ size = 24 }: { size?: number }) {
  const id = React.useId();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <defs>
        <linearGradient id={`${id}-sb`} x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#818cf8" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <path
        d="M12 2C8 2 5 5 5 8.5C5 12 7 13 7 16H17C17 13 19 12 19 8.5C19 5 16 2 12 2Z"
        stroke={`url(#${id}-sb)`}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="rgba(99,102,241,0.12)"
      />
      <path d="M9 21H15" stroke={`url(#${id}-sb)`} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10 18H14" stroke={`url(#${id}-sb)`} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

export function StatWordsIcon({ size = 24 }: { size?: number }) {
  const id = React.useId();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <defs>
        <linearGradient id={`${id}-sw`} x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#60a5fa" />
          <stop offset="1" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="7" height="18" rx="1" stroke={`url(#${id}-sw)`} strokeWidth="1.8" fill="rgba(59,130,246,0.08)" />
      <rect x="14" y="3" width="7" height="18" rx="1" stroke={`url(#${id}-sw)`} strokeWidth="1.8" fill="rgba(59,130,246,0.12)" />
      <line x1="5" y1="7" x2="8" y2="7" stroke={`url(#${id}-sw)`} strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
      <line x1="5" y1="10" x2="8" y2="10" stroke={`url(#${id}-sw)`} strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />
      <line x1="16" y1="7" x2="19" y2="7" stroke={`url(#${id}-sw)`} strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
      <line x1="16" y1="10" x2="19" y2="10" stroke={`url(#${id}-sw)`} strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />
    </svg>
  );
}

export function StatStreakIcon({ size = 24 }: { size?: number }) {
  const id = React.useId();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <defs>
        <linearGradient id={`${id}-sf`} x1="8" y1="1" x2="16" y2="23" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fbbf24" />
          <stop offset="0.5" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#f97316" />
        </linearGradient>
      </defs>
      <path
        d="M12 2L8 12H11L9 22L18 10H14L17 2H12Z"
        fill={`url(#${id}-sf)`}
        opacity="0.9"
      />
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
  strands: StrandsIcon,
  "spell-cast": SpellCastIcon,
  "speed-clash": SpeedClashIcon,
  "daily-decode": DailyDecodeIcon,
  "word-ladder": WordLadderIcon,
  "odd-one-out": OddOneOutIcon,
  "missing-piece": MissingPieceIcon,
  "synonym-spiral": SynonymSpiralIcon,
};
