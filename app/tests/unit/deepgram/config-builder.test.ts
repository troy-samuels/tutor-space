/**
 * Deepgram Configuration Builder Unit Tests
 *
 * Tests for the Deepgram transcription options builder including
 * code-switching detection and language configuration.
 *
 * @module tests/unit/deepgram/config-builder
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

// =============================================================================
// TYPES & CONSTANTS (mirroring production)
// =============================================================================

type CodeSwitchingMode =
  | "native"
  | "segment_based"
  | "single_language"
  | "disabled";

interface CodeSwitchingConfig {
  enabled: boolean;
  mode: CodeSwitchingMode;
  reason: string;
}

interface TranscriptionOptionsParams {
  nativeLanguage?: string | null;
  targetLanguage?: string | null;
  dialectVariant?: string | null;
}

interface PrerecordedSchema {
  model?: string;
  smart_format?: boolean;
  punctuate?: boolean;
  diarize?: boolean;
  utterances?: boolean;
  paragraphs?: boolean;
  filler_words?: boolean;
  language?: string;
  detect_language?: boolean;
}

/**
 * Languages supported by Nova-3 for native multilingual code-switching.
 */
const NOVA3_MULTI_LANGUAGES = new Set([
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
 */
const NOVA3_SUPPORTED_LANGUAGES = new Set([
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

// =============================================================================
// PURE FUNCTIONS FOR TESTING
// =============================================================================

/**
 * Determine the best code-switching strategy based on student's language pair.
 */
function shouldEnableCodeSwitching(
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

/**
 * Build Deepgram transcription options with optimal language handling.
 */
function buildTranscriptionOptions(params: TranscriptionOptionsParams): PrerecordedSchema {
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
// TESTS
// =============================================================================

describe("Deepgram Configuration", () => {
  describe("NOVA3_MULTI_LANGUAGES", () => {
    it("includes all expected code-switching languages", () => {
      const expected = ["en", "es", "fr", "de", "pt", "it", "nl", "ru", "ja", "hi"];
      for (const lang of expected) {
        assert.ok(NOVA3_MULTI_LANGUAGES.has(lang), `Should include ${lang}`);
      }
    });

    it("has exactly 10 languages", () => {
      assert.equal(NOVA3_MULTI_LANGUAGES.size, 10);
    });

    it("does not include non-supported languages for native switching", () => {
      assert.ok(!NOVA3_MULTI_LANGUAGES.has("ko"), "Korean not in multi");
      assert.ok(!NOVA3_MULTI_LANGUAGES.has("zh"), "Chinese not in multi");
      assert.ok(!NOVA3_MULTI_LANGUAGES.has("ar"), "Arabic not in multi");
    });
  });

  describe("NOVA3_SUPPORTED_LANGUAGES", () => {
    it("includes all multi languages plus additional", () => {
      for (const lang of NOVA3_MULTI_LANGUAGES) {
        assert.ok(
          NOVA3_SUPPORTED_LANGUAGES.has(lang),
          `Supported should include multi language ${lang}`
        );
      }
    });

    it("includes additional non-multi languages", () => {
      const additional = ["ko", "zh", "zh-CN", "zh-TW", "vi", "th", "ar", "tr", "pl"];
      for (const lang of additional) {
        assert.ok(
          NOVA3_SUPPORTED_LANGUAGES.has(lang),
          `Should include additional language ${lang}`
        );
      }
    });

    it("has more languages than multi set", () => {
      assert.ok(
        NOVA3_SUPPORTED_LANGUAGES.size > NOVA3_MULTI_LANGUAGES.size,
        "Supported should be larger than multi"
      );
    });
  });

  describe("shouldEnableCodeSwitching", () => {
    describe("native mode (both languages in multi set)", () => {
      it("enables native code-switching for Spanish-English", () => {
        const result = shouldEnableCodeSwitching("es", "en");
        assert.equal(result.enabled, true);
        assert.equal(result.mode, "native");
        assert.ok(result.reason.includes("es"));
        assert.ok(result.reason.includes("en"));
      });

      it("enables native code-switching for French-English", () => {
        const result = shouldEnableCodeSwitching("fr", "en");
        assert.equal(result.enabled, true);
        assert.equal(result.mode, "native");
      });

      it("enables native code-switching for Japanese-English", () => {
        const result = shouldEnableCodeSwitching("ja", "en");
        assert.equal(result.enabled, true);
        assert.equal(result.mode, "native");
      });

      it("enables native code-switching for German-Spanish", () => {
        const result = shouldEnableCodeSwitching("de", "es");
        assert.equal(result.enabled, true);
        assert.equal(result.mode, "native");
      });

      it("enables native code-switching for Portuguese-Italian", () => {
        const result = shouldEnableCodeSwitching("pt", "it");
        assert.equal(result.enabled, true);
        assert.equal(result.mode, "native");
      });

      it("enables native code-switching for Hindi-English", () => {
        const result = shouldEnableCodeSwitching("hi", "en");
        assert.equal(result.enabled, true);
        assert.equal(result.mode, "native");
      });
    });

    describe("segment_based mode (languages not both in multi set)", () => {
      it("uses segment-based for Korean-English", () => {
        const result = shouldEnableCodeSwitching("ko", "en");
        assert.equal(result.enabled, true);
        assert.equal(result.mode, "segment_based");
      });

      it("uses segment-based for Chinese-English", () => {
        const result = shouldEnableCodeSwitching("zh", "en");
        assert.equal(result.enabled, true);
        assert.equal(result.mode, "segment_based");
      });

      it("uses segment-based for Arabic-English", () => {
        const result = shouldEnableCodeSwitching("ar", "en");
        assert.equal(result.enabled, true);
        assert.equal(result.mode, "segment_based");
      });

      it("uses segment-based for Turkish-German", () => {
        const result = shouldEnableCodeSwitching("tr", "de");
        assert.equal(result.enabled, true);
        assert.equal(result.mode, "segment_based");
      });

      it("uses segment-based for Vietnamese-French", () => {
        const result = shouldEnableCodeSwitching("vi", "fr");
        assert.equal(result.enabled, true);
        assert.equal(result.mode, "segment_based");
      });
    });

    describe("single_language mode (same native and target)", () => {
      it("returns single_language for English-English", () => {
        const result = shouldEnableCodeSwitching("en", "en");
        assert.equal(result.enabled, false);
        assert.equal(result.mode, "single_language");
      });

      it("returns single_language for Spanish-Spanish", () => {
        const result = shouldEnableCodeSwitching("es", "es");
        assert.equal(result.enabled, false);
        assert.equal(result.mode, "single_language");
      });

      it("returns single_language for Japanese-Japanese", () => {
        const result = shouldEnableCodeSwitching("ja", "ja");
        assert.equal(result.enabled, false);
        assert.equal(result.mode, "single_language");
      });
    });

    describe("disabled mode (missing language info)", () => {
      it("returns disabled when native is null", () => {
        const result = shouldEnableCodeSwitching(null, "en");
        assert.equal(result.enabled, false);
        assert.equal(result.mode, "disabled");
      });

      it("returns disabled when target is null", () => {
        const result = shouldEnableCodeSwitching("es", null);
        assert.equal(result.enabled, false);
        assert.equal(result.mode, "disabled");
      });

      it("returns disabled when both are null", () => {
        const result = shouldEnableCodeSwitching(null, null);
        assert.equal(result.enabled, false);
        assert.equal(result.mode, "disabled");
      });

      it("returns disabled when native is undefined", () => {
        const result = shouldEnableCodeSwitching(undefined, "en");
        assert.equal(result.enabled, false);
        assert.equal(result.mode, "disabled");
      });

      it("returns disabled when target is undefined", () => {
        const result = shouldEnableCodeSwitching("es", undefined);
        assert.equal(result.enabled, false);
        assert.equal(result.mode, "disabled");
      });

      it("returns disabled when native is empty string", () => {
        const result = shouldEnableCodeSwitching("", "en");
        assert.equal(result.enabled, false);
        assert.equal(result.mode, "disabled");
      });
    });

    describe("dialect variant handling", () => {
      it("extracts base language from dialect (en-US → en)", () => {
        const result = shouldEnableCodeSwitching("en-US", "es-MX");
        assert.equal(result.mode, "native");
      });

      it("extracts base language from variant (pt-BR → pt)", () => {
        const result = shouldEnableCodeSwitching("pt-BR", "en-GB");
        assert.equal(result.mode, "native");
      });

      it("handles underscore separator (zh_CN)", () => {
        const result = shouldEnableCodeSwitching("zh_CN", "en");
        assert.equal(result.mode, "segment_based"); // zh not in multi
      });

      it("is case insensitive", () => {
        const result = shouldEnableCodeSwitching("ES", "EN");
        assert.equal(result.mode, "native");
      });

      it("handles mixed case with dialect (Es-MX)", () => {
        const result = shouldEnableCodeSwitching("Es-MX", "En-US");
        assert.equal(result.mode, "native");
      });
    });
  });

  describe("buildTranscriptionOptions", () => {
    describe("base options", () => {
      it("always includes nova-3 model", () => {
        const options = buildTranscriptionOptions({ nativeLanguage: "es", targetLanguage: "en" });
        assert.equal(options.model, "nova-3");
      });

      it("always enables diarization", () => {
        const options = buildTranscriptionOptions({ nativeLanguage: "es", targetLanguage: "en" });
        assert.equal(options.diarize, true);
      });

      it("always enables utterances", () => {
        const options = buildTranscriptionOptions({ nativeLanguage: "es", targetLanguage: "en" });
        assert.equal(options.utterances, true);
      });

      it("always enables paragraphs", () => {
        const options = buildTranscriptionOptions({ nativeLanguage: "es", targetLanguage: "en" });
        assert.equal(options.paragraphs, true);
      });

      it("always enables smart_format", () => {
        const options = buildTranscriptionOptions({ nativeLanguage: "es", targetLanguage: "en" });
        assert.equal(options.smart_format, true);
      });

      it("always enables punctuate", () => {
        const options = buildTranscriptionOptions({ nativeLanguage: "es", targetLanguage: "en" });
        assert.equal(options.punctuate, true);
      });

      it("always enables filler_words", () => {
        const options = buildTranscriptionOptions({ nativeLanguage: "es", targetLanguage: "en" });
        assert.equal(options.filler_words, true);
      });
    });

    describe("native code-switching (language=multi)", () => {
      it("uses language=multi for Spanish-English", () => {
        const options = buildTranscriptionOptions({
          nativeLanguage: "es",
          targetLanguage: "en"
        });
        assert.equal(options.language, "multi");
        assert.equal(options.detect_language, undefined);
      });

      it("uses language=multi for French-English", () => {
        const options = buildTranscriptionOptions({
          nativeLanguage: "fr",
          targetLanguage: "en"
        });
        assert.equal(options.language, "multi");
      });

      it("uses language=multi for Japanese-English", () => {
        const options = buildTranscriptionOptions({
          nativeLanguage: "ja",
          targetLanguage: "en"
        });
        assert.equal(options.language, "multi");
      });

      it("uses language=multi for German-Spanish", () => {
        const options = buildTranscriptionOptions({
          nativeLanguage: "de",
          targetLanguage: "es"
        });
        assert.equal(options.language, "multi");
      });
    });

    describe("segment-based detection (detect_language=true)", () => {
      it("uses detect_language for Korean-English", () => {
        const options = buildTranscriptionOptions({
          nativeLanguage: "ko",
          targetLanguage: "en"
        });
        assert.equal(options.detect_language, true);
        assert.equal(options.language, undefined);
      });

      it("uses detect_language for Chinese-English", () => {
        const options = buildTranscriptionOptions({
          nativeLanguage: "zh",
          targetLanguage: "en"
        });
        assert.equal(options.detect_language, true);
      });

      it("uses detect_language for Arabic-French", () => {
        const options = buildTranscriptionOptions({
          nativeLanguage: "ar",
          targetLanguage: "fr"
        });
        assert.equal(options.detect_language, true);
      });
    });

    describe("single language mode", () => {
      it("uses explicit language for English-English", () => {
        const options = buildTranscriptionOptions({
          nativeLanguage: "en",
          targetLanguage: "en"
        });
        assert.equal(options.language, "en");
        assert.equal(options.detect_language, undefined);
      });

      it("uses explicit language for Spanish-Spanish", () => {
        const options = buildTranscriptionOptions({
          nativeLanguage: "es",
          targetLanguage: "es"
        });
        assert.equal(options.language, "es");
      });

      it("prefers dialectVariant over targetLanguage", () => {
        const options = buildTranscriptionOptions({
          nativeLanguage: "en",
          targetLanguage: "en",
          dialectVariant: "en-GB"
        });
        assert.equal(options.language, "en-GB");
      });

      it("ignores empty dialectVariant", () => {
        const options = buildTranscriptionOptions({
          nativeLanguage: "en",
          targetLanguage: "en",
          dialectVariant: ""
        });
        assert.equal(options.language, "en");
      });

      it("ignores whitespace-only dialectVariant", () => {
        const options = buildTranscriptionOptions({
          nativeLanguage: "en",
          targetLanguage: "en",
          dialectVariant: "   "
        });
        assert.equal(options.language, "en");
      });
    });

    describe("disabled mode (fallback)", () => {
      it("uses detect_language when no language info", () => {
        const options = buildTranscriptionOptions({
          nativeLanguage: null,
          targetLanguage: null
        });
        assert.equal(options.detect_language, true);
      });

      it("uses detect_language when native missing", () => {
        const options = buildTranscriptionOptions({
          nativeLanguage: undefined,
          targetLanguage: "en"
        });
        assert.equal(options.detect_language, true);
      });

      it("uses detect_language when target missing", () => {
        const options = buildTranscriptionOptions({
          nativeLanguage: "es",
          targetLanguage: undefined
        });
        assert.equal(options.detect_language, true);
      });
    });

    describe("edge cases", () => {
      it("handles empty params object", () => {
        const options = buildTranscriptionOptions({});
        assert.equal(options.detect_language, true);
        assert.equal(options.model, "nova-3");
      });

      it("handles dialect variants in native language", () => {
        const options = buildTranscriptionOptions({
          nativeLanguage: "pt-BR",
          targetLanguage: "en-US"
        });
        assert.equal(options.language, "multi");
      });

      it("handles unusual but valid language codes", () => {
        const options = buildTranscriptionOptions({
          nativeLanguage: "nl",
          targetLanguage: "de"
        });
        assert.equal(options.language, "multi");
      });
    });
  });

  describe("Integration scenarios", () => {
    it("Japanese student learning English - should use multi", () => {
      const studentProfile = {
        nativeLanguage: "ja",
        targetLanguage: "en",
        dialectVariant: "en-US"
      };

      const options = buildTranscriptionOptions(studentProfile);

      assert.equal(options.model, "nova-3");
      assert.equal(options.language, "multi");
      assert.equal(options.diarize, true);
      assert.equal(options.utterances, true);
      assert.equal(options.paragraphs, true);
    });

    it("Korean student learning English - should use detect_language", () => {
      const studentProfile = {
        nativeLanguage: "ko",
        targetLanguage: "en",
        dialectVariant: null
      };

      const options = buildTranscriptionOptions(studentProfile);

      assert.equal(options.model, "nova-3");
      assert.equal(options.detect_language, true);
      assert.equal(options.language, undefined);
    });

    it("English tutor teaching English - should use explicit language", () => {
      const studentProfile = {
        nativeLanguage: "en",
        targetLanguage: "en",
        dialectVariant: "en-GB"
      };

      const options = buildTranscriptionOptions(studentProfile);

      assert.equal(options.model, "nova-3");
      assert.equal(options.language, "en-GB");
      assert.equal(options.detect_language, undefined);
    });

    it("New student without language profile - should use auto-detect", () => {
      const studentProfile = {
        nativeLanguage: null,
        targetLanguage: null,
        dialectVariant: null
      };

      const options = buildTranscriptionOptions(studentProfile);

      assert.equal(options.model, "nova-3");
      assert.equal(options.detect_language, true);
    });

    it("Spanish student with Brazilian Portuguese target - multi", () => {
      const studentProfile = {
        nativeLanguage: "es-MX",
        targetLanguage: "pt-BR",
        dialectVariant: "pt-BR"
      };

      const options = buildTranscriptionOptions(studentProfile);

      assert.equal(options.language, "multi");
    });

    it("Chinese student learning German - segment-based", () => {
      const studentProfile = {
        nativeLanguage: "zh-CN",
        targetLanguage: "de",
        dialectVariant: null
      };

      const options = buildTranscriptionOptions(studentProfile);

      assert.equal(options.detect_language, true);
    });
  });
});
