/**
 * Deepgram SDK Client
 *
 * Factory pattern for Deepgram speech-to-text client.
 * Used for transcribing lesson recordings with diarization.
 * Supports multilingual code-switching via Nova-3.
 */

import { createClient, type PrerecordedSchema } from "@deepgram/sdk";

// =============================================================================
// CODE-SWITCHING CONFIGURATION
// =============================================================================

/**
 * Languages supported by Nova-3 for native multilingual code-switching.
 * When both native and target languages are in this set, we enable `language=multi`.
 * @see https://developers.deepgram.com/docs/multilingual-code-switching
 */
export const NOVA3_MULTI_LANGUAGES = new Set([
  "en", // English
  "es", // Spanish
  "fr", // French
  "de", // German
  "pt", // Portuguese
  "it", // Italian
  "nl", // Dutch
  "ru", // Russian
  "ja", // Japanese
  "hi", // Hindi
]);

/**
 * Languages supported by Nova-3 for monolingual transcription.
 * Used for segment-based language detection when native code-switching isn't available.
 */
export const NOVA3_SUPPORTED_LANGUAGES = new Set([
  ...NOVA3_MULTI_LANGUAGES,
  "ko",    // Korean
  "zh",    // Chinese (Mandarin)
  "zh-CN", // Chinese Simplified
  "zh-TW", // Chinese Traditional
  "yue",   // Cantonese
  "vi",    // Vietnamese
  "th",    // Thai
  "id",    // Indonesian
  "ms",    // Malay
  "tl",    // Tagalog
  "uk",    // Ukrainian
  "pl",    // Polish
  "cs",    // Czech
  "sv",    // Swedish
  "da",    // Danish
  "no",    // Norwegian
  "fi",    // Finnish
  "tr",    // Turkish
  "ar",    // Arabic
  "he",    // Hebrew
]);

/**
 * Code-switching detection mode
 */
export type CodeSwitchingMode =
  | "native"          // Both languages in NOVA3_MULTI_LANGUAGES - use language=multi
  | "segment_based"   // Different languages, use detect_language for per-segment detection
  | "single_language" // Same language or missing info - use explicit language
  | "disabled";       // No language info available

export interface CodeSwitchingConfig {
  enabled: boolean;
  mode: CodeSwitchingMode;
  reason: string;
}

/**
 * Determine the best code-switching strategy based on student's language pair.
 *
 * Strategies:
 * - native: Both languages supported by Nova-3 multi → use language=multi
 * - segment_based: Different languages but not both in multi set → use detect_language
 * - single_language: Same native/target → use explicit language
 * - disabled: Missing language info → use detect_language as fallback
 */
export function shouldEnableCodeSwitching(
  nativeLanguage: string | null | undefined,
  targetLanguage: string | null | undefined
): CodeSwitchingConfig {
  // Extract base language code (e.g., "en-US" -> "en", "pt-BR" -> "pt")
  const native = nativeLanguage?.split(/[-_]/)[0]?.toLowerCase();
  const target = targetLanguage?.split(/[-_]/)[0]?.toLowerCase();

  if (!native || !target) {
    return {
      enabled: false,
      mode: "disabled",
      reason: "Missing native or target language - using auto-detect"
    };
  }

  if (native === target) {
    return {
      enabled: false,
      mode: "single_language",
      reason: "Same native and target language"
    };
  }

  // Check if both languages support native code-switching
  const nativeSupported = NOVA3_MULTI_LANGUAGES.has(native);
  const targetSupported = NOVA3_MULTI_LANGUAGES.has(target);

  if (nativeSupported && targetSupported) {
    return {
      enabled: true,
      mode: "native",
      reason: `Native code-switching enabled for ${native} ↔ ${target}`
    };
  }

  // Different languages but not both in multi set - use segment-based detection
  return {
    enabled: true,
    mode: "segment_based",
    reason: `Segment-based detection for ${native} ↔ ${target} (auto-detect per utterance)`
  };
}

export interface TranscriptionOptionsParams {
  nativeLanguage?: string | null;
  targetLanguage?: string | null;
  dialectVariant?: string | null;
}

/**
 * Build Deepgram transcription options with optimal language handling.
 *
 * Modes:
 * - Native code-switching: language=multi (best accuracy for supported pairs)
 * - Segment-based: detect_language=true (for Korean, Mandarin, etc.)
 * - Single language: explicit language code
 */
export function buildTranscriptionOptions(params: TranscriptionOptionsParams): PrerecordedSchema {
  const codeSwitching = shouldEnableCodeSwitching(params.nativeLanguage, params.targetLanguage);

  const baseOptions: PrerecordedSchema = {
    model: "nova-3",
    smart_format: true,
    punctuate: true,
    diarize: true,
    utterances: true,
    paragraphs: true,
    filler_words: true,
  };

  // Native code-switching for fully supported pairs
  if (codeSwitching.mode === "native") {
    return { ...baseOptions, language: "multi" };
  }

  // Segment-based detection for Korean, Mandarin, etc.
  // Uses auto-detect to identify language per utterance
  if (codeSwitching.mode === "segment_based") {
    return { ...baseOptions, detect_language: true };
  }

  // Single language mode - use explicit language
  if (codeSwitching.mode === "single_language") {
    const explicitLanguage =
      (typeof params.dialectVariant === "string" && params.dialectVariant.trim().length > 0)
        ? params.dialectVariant
        : params.targetLanguage || "en";
    return { ...baseOptions, language: explicitLanguage };
  }

  // Fallback: auto-detect
  return { ...baseOptions, detect_language: true };
}

// =============================================================================
// DEEPGRAM CLIENT
// =============================================================================

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

if (!DEEPGRAM_API_KEY) {
  console.warn(
    "[Deepgram] DEEPGRAM_API_KEY is not set. Transcription features will be disabled."
  );
}

/**
 * Get the Deepgram client instance.
 * Throws if API key is not configured.
 */
export function getDeepgramClient() {
  if (!DEEPGRAM_API_KEY) {
    throw new Error(
      "Deepgram is not configured. Set DEEPGRAM_API_KEY in your environment."
    );
  }
  return createClient(DEEPGRAM_API_KEY);
}

/**
 * Check if Deepgram is properly configured
 */
export function isDeepgramConfigured(): boolean {
  return !!DEEPGRAM_API_KEY;
}
