// Shared AI Practice pricing and allowance constants
export const AI_PRACTICE_BASE_PRICE_CENTS = 800; // $8/month base
export const AI_PRACTICE_BLOCK_PRICE_CENTS = 500; // $5 per add-on block

// Base tier allowances
export const BASE_AUDIO_MINUTES = 100;
export const BASE_TEXT_TURNS = 300;

// Block allowances
export const BLOCK_AUDIO_MINUTES = 60;
export const BLOCK_TEXT_TURNS = 200;

// Derived seconds for audio calculations
export const BASE_AUDIO_SECONDS = BASE_AUDIO_MINUTES * 60;
export const BLOCK_AUDIO_SECONDS = BLOCK_AUDIO_MINUTES * 60;
