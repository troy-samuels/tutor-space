/**
 * Deterministic cipher generation for Daily Decode.
 * Uses a seeded RNG so the same puzzle always gets the same cipher.
 */

import { seededRandom } from "../../daily-seed";
import type { CipherMap } from "./types";

/**
 * Generate a deterministic letter substitution cipher.
 * Guarantees: no letter maps to itself (a derangement).
 */
export function generateCipher(seed: number, language: string): CipherMap {
  const alphabets: Record<string, string[]> = {
    es: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
    fr: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
    de: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
  };

  const alphabet = alphabets[language] || alphabets.es;
  const rng = seededRandom(seed);

  // Generate a derangement (permutation where no element maps to itself)
  const shuffled = derangement(alphabet, rng);

  const encrypt: Record<string, string> = {};
  const decrypt: Record<string, string> = {};

  for (let i = 0; i < alphabet.length; i++) {
    encrypt[alphabet[i]] = shuffled[i];
    decrypt[shuffled[i]] = alphabet[i];
  }

  return { encrypt, decrypt };
}

/**
 * Generate a derangement of the given array using the provided RNG.
 * A derangement is a permutation where no element appears in its original position.
 */
function derangement(arr: string[], rng: () => number): string[] {
  const n = arr.length;
  let result: string[];
  let attempts = 0;
  const maxAttempts = 1000;

  do {
    // Fisher-Yates shuffle with seeded RNG
    result = [...arr];
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    attempts++;
  } while (!isDerangement(arr, result) && attempts < maxAttempts);

  // If we somehow failed (extremely unlikely), fix it manually
  if (!isDerangement(arr, result)) {
    result = manualDerangement(arr);
  }

  return result;
}

/**
 * Check if `perm` is a derangement of `original`.
 */
function isDerangement(original: string[], perm: string[]): boolean {
  for (let i = 0; i < original.length; i++) {
    if (original[i] === perm[i]) return false;
  }
  return true;
}

/**
 * Fallback: create a simple derangement by shifting all elements by 1.
 */
function manualDerangement(arr: string[]): string[] {
  const result = [...arr];
  // Shift everything by 1
  const first = result[0];
  for (let i = 0; i < result.length - 1; i++) {
    result[i] = result[i + 1];
  }
  result[result.length - 1] = first;
  return result;
}

/**
 * Encrypt a plaintext string using the cipher.
 * Preserves spaces, punctuation, and special characters.
 * Accented characters are mapped via their base letter.
 */
export function encryptText(plaintext: string, cipher: CipherMap): string {
  return plaintext
    .split("")
    .map((ch) => {
      const upper = ch.toUpperCase();
      const base = stripAccent(upper);
      if (cipher.encrypt[base]) {
        // Preserve original case
        const encrypted = cipher.encrypt[base];
        return ch === ch.toLowerCase() ? encrypted.toLowerCase() : encrypted;
      }
      return ch; // punctuation, spaces, etc.
    })
    .join("");
}

/**
 * Get all unique letters (base, uppercase) in a string.
 */
export function getUniqueLetters(text: string): string[] {
  const seen = new Set<string>();
  for (const ch of text) {
    const base = stripAccent(ch.toUpperCase());
    if (/[A-Z]/.test(base)) {
      seen.add(base);
    }
  }
  return Array.from(seen).sort();
}

/**
 * Strip accent from a character, returning the base letter.
 */
export function stripAccent(ch: string): string {
  const map: Record<string, string> = {
    "Á": "A", "À": "A", "Â": "A", "Ä": "A", "Ã": "A",
    "É": "E", "È": "E", "Ê": "E", "Ë": "E",
    "Í": "I", "Î": "I", "Ï": "I",
    "Ó": "O", "Ô": "O", "Ö": "O", "Õ": "O",
    "Ú": "U", "Û": "U", "Ü": "U",
    "Ñ": "N",
    "Ç": "C",
    "ß": "S",
    "á": "a", "à": "a", "â": "a", "ä": "a", "ã": "a",
    "é": "e", "è": "e", "ê": "e", "ë": "e",
    "í": "i", "î": "i", "ï": "i",
    "ó": "o", "ô": "o", "ö": "o", "õ": "o",
    "ú": "u", "û": "u", "ü": "u",
    "ñ": "n",
    "ç": "c",
  };
  return map[ch] || ch;
}
