// Shared AI Practice pricing and allowance constants
// FREEMIUM MODEL: Free tier (Studio-gated) + $5 block add-ons

// FREE TIER (no subscription required - tutor must have Studio)
export const FREE_AUDIO_MINUTES = 45;
export const FREE_TEXT_TURNS = 600;
export const FREE_AUDIO_SECONDS = FREE_AUDIO_MINUTES * 60; // 2700 seconds

// PAID BLOCKS ($5 each via Stripe metered billing)
export const AI_PRACTICE_BLOCK_PRICE_CENTS = 500; // $5 per block
export const BLOCK_AUDIO_MINUTES = 45;
export const BLOCK_TEXT_TURNS = 300;
export const BLOCK_AUDIO_SECONDS = BLOCK_AUDIO_MINUTES * 60; // 2700 seconds

// LEGACY: Base subscription (kept for backwards compatibility)
// @deprecated - Use FREE_* constants for new implementations
export const AI_PRACTICE_BASE_PRICE_CENTS = 800; // $8/month base - DEPRECATED
export const BASE_AUDIO_MINUTES = 100; // DEPRECATED
export const BASE_TEXT_TURNS = 300; // DEPRECATED
export const BASE_AUDIO_SECONDS = BASE_AUDIO_MINUTES * 60; // DEPRECATED
