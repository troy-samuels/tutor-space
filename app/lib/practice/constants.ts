// Shared AI Practice pricing and allowance constants
// HYBRID MODEL: Free / Basic included + student-paid Unlimited/Solo upgrades

// === STUDENT PRACTICE TIERS ===

// FREE TIER (any student, tutor-linked or solo)
export const FREE_SESSIONS_PER_MONTH = 3;
export const FREE_TEXT_TURNS_PER_SESSION = 20;
export const FREE_AUDIO_ENABLED = false;

// BASIC TIER (tutor-linked students on Pro/Studio tutor plans)
export const BASIC_SESSIONS_PER_MONTH = 10;
export const BASIC_TEXT_TURNS_PER_SESSION = 40;
export const BASIC_AUDIO_ENABLED = false; // text only

// UNLIMITED TIER ($4.99/mo - student pays directly)
export const UNLIMITED_PRICE_CENTS = 499;
export const UNLIMITED_SESSIONS_PER_MONTH = -1; // unlimited
export const UNLIMITED_TEXT_TURNS_PER_SESSION = -1; // unlimited
export const UNLIMITED_AUDIO_ENABLED = true;
export const UNLIMITED_ADAPTIVE_ENABLED = true;
export const UNLIMITED_VOICE_INPUT_ENABLED = true;

// SOLO TIER ($9.99/mo - students with no tutor)
export const SOLO_PRICE_CENTS = 999;
// Same feature envelope as Unlimited
export const SOLO_SESSIONS_PER_MONTH = -1;
export const SOLO_TEXT_TURNS_PER_SESSION = -1;
export const SOLO_AUDIO_ENABLED = true;

// LEGACY (keep for backwards compatibility, mapped to new tiers)
export const AI_PRACTICE_BLOCK_PRICE_CENTS = 500; // deprecated
export const FREE_AUDIO_SECONDS = 2700; // deprecated
export const FREE_TEXT_TURNS = 600; // deprecated

// Additional legacy constants retained for existing flows that still read them.
// @deprecated - New code should use tier constants above.
export const FREE_AUDIO_MINUTES = 45;
export const BLOCK_AUDIO_MINUTES = 45;
export const BLOCK_TEXT_TURNS = 300;
export const BLOCK_AUDIO_SECONDS = BLOCK_AUDIO_MINUTES * 60;
export const AI_PRACTICE_BASE_PRICE_CENTS = 800;
export const BASE_AUDIO_MINUTES = 100;
export const BASE_TEXT_TURNS = 300;
export const BASE_AUDIO_SECONDS = BASE_AUDIO_MINUTES * 60;
