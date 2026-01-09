/**
 * Short Code Generator for Memorable Classroom URLs
 *
 * Generates language-tutor themed codes like:
 * - fluent-parrot-42
 * - chatty-croissant-17
 * - verb-ninja-99
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// Language-learning themed adjectives
const ADJECTIVES = [
  // Fluency & skill
  "fluent",
  "eloquent",
  "articulate",
  "polished",
  "practiced",
  // Communication
  "chatty",
  "wordy",
  "vocal",
  "verbal",
  "expressive",
  // Sound qualities
  "melodic",
  "rhythmic",
  "smooth",
  "clear",
  "crisp",
  // Personality
  "curious",
  "eager",
  "bright",
  "quick",
  "clever",
  // Language types
  "native",
  "bilingual",
  "spoken",
  "written",
  // Value
  "golden",
  "silver",
] as const;

// Mix of language terms, fun animals, international foods, and characters
const NOUNS = [
  // Language terms
  "verb",
  "noun",
  "accent",
  "idiom",
  "phrase",
  "vowel",
  "syllable",
  "dialect",
  "lexicon",
  "polyglot",
  "grammar",
  "tense",
  "prefix",
  "suffix",
  "tongue",
  // Fun animals (known for communication or international)
  "parrot",
  "penguin",
  "owl",
  "fox",
  "panda",
  "koala",
  "llama",
  "alpaca",
  "otter",
  "toucan",
  // International foods
  "croissant",
  "taco",
  "sushi",
  "pretzel",
  "baguette",
  "dumpling",
  "gelato",
  "churro",
  "ramen",
  "falafel",
  // Fun characters
  "ninja",
  "wizard",
  "maestro",
  "scholar",
  "scribe",
  "bard",
] as const;

/**
 * Generate a random short code (not guaranteed unique)
 * Format: adjective-noun-number (e.g., fluent-parrot-42)
 */
export function generateShortCode(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const number = Math.floor(Math.random() * 99) + 1;
  return `${adjective}-${noun}-${number}`;
}

/**
 * Generate a unique short code by checking against existing codes in the database
 * Retries up to 5 times, then adds timestamp suffix as fallback
 */
export async function generateUniqueShortCode(
  supabase: SupabaseClient
): Promise<string> {
  const maxAttempts = 5;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateShortCode();

    // Check if code already exists
    const { data } = await supabase
      .from("bookings")
      .select("id")
      .eq("short_code", code)
      .maybeSingle();

    if (!data) {
      return code;
    }
  }

  // Fallback: append timestamp to ensure uniqueness
  const baseCode = generateShortCode();
  const timestamp = Date.now() % 10000;
  return `${baseCode}-${timestamp}`;
}

/**
 * Validate a short code format
 * Must match: word-word-number pattern
 */
export function isValidShortCode(code: string): boolean {
  const pattern = /^[a-z]+-[a-z]+-\d{1,4}$/;
  return pattern.test(code);
}

/**
 * Get booking by short code
 */
export async function getBookingByShortCode(
  supabase: SupabaseClient,
  shortCode: string
): Promise<{ id: string } | null> {
  if (!isValidShortCode(shortCode)) {
    return null;
  }

  const { data } = await supabase
    .from("bookings")
    .select("id")
    .eq("short_code", shortCode)
    .maybeSingle();

  return data;
}
