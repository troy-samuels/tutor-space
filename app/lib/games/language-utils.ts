/**
 * Language utilities for script-agnostic game support.
 * Handles writing system detection, RTL support, and adaptive rendering.
 */

export type WritingSystem =
  | "latin"
  | "cjk"
  | "arabic"
  | "devanagari"
  | "thai"
  | "hangul"
  | "cyrillic";

export type TextDirection = "ltr" | "rtl";

export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  writingSystem: WritingSystem;
  direction: TextDirection;
  /** Whether the language uses spaces between words */
  usesWordSpaces: boolean;
  /** Whether the language is agglutinative (suffix-heavy) */
  isAgglutinative: boolean;
  /** Whether word ladder ("change one letter") mechanic works */
  supportsWordLadder: boolean;
  /** Whether substitution cipher mechanic works */
  supportsSubstitutionCipher: boolean;
  /** Font size adjustment factor for game tiles (CJK chars are wider) */
  tileFontScale: number;
}

export const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
  en: {
    code: "en",
    name: "English",
    nativeName: "EN",
    flag: "🇬🇧",
    writingSystem: "latin",
    direction: "ltr",
    usesWordSpaces: true,
    isAgglutinative: false,
    supportsWordLadder: true,
    supportsSubstitutionCipher: true,
    tileFontScale: 1,
  },
  es: {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
    writingSystem: "latin",
    direction: "ltr",
    usesWordSpaces: true,
    isAgglutinative: false,
    supportsWordLadder: true,
    supportsSubstitutionCipher: true,
    tileFontScale: 1,
  },
  fr: {
    code: "fr",
    name: "French",
    nativeName: "Français",
    flag: "🇫🇷",
    writingSystem: "latin",
    direction: "ltr",
    usesWordSpaces: true,
    isAgglutinative: false,
    supportsWordLadder: true,
    supportsSubstitutionCipher: true,
    tileFontScale: 1,
  },
  de: {
    code: "de",
    name: "German",
    nativeName: "Deutsch",
    flag: "🇩🇪",
    writingSystem: "latin",
    direction: "ltr",
    usesWordSpaces: true,
    isAgglutinative: false,
    supportsWordLadder: true,
    supportsSubstitutionCipher: true,
    tileFontScale: 1,
  },
  it: {
    code: "it",
    name: "Italian",
    nativeName: "Italiano",
    flag: "🇮🇹",
    writingSystem: "latin",
    direction: "ltr",
    usesWordSpaces: true,
    isAgglutinative: false,
    supportsWordLadder: true,
    supportsSubstitutionCipher: true,
    tileFontScale: 1,
  },
  pt: {
    code: "pt",
    name: "Portuguese",
    nativeName: "Português",
    flag: "🇧🇷",
    writingSystem: "latin",
    direction: "ltr",
    usesWordSpaces: true,
    isAgglutinative: false,
    supportsWordLadder: true,
    supportsSubstitutionCipher: true,
    tileFontScale: 1,
  },
  ja: {
    code: "ja",
    name: "Japanese",
    nativeName: "日本語",
    flag: "🇯🇵",
    writingSystem: "cjk",
    direction: "ltr",
    usesWordSpaces: false,
    isAgglutinative: true,
    supportsWordLadder: false,
    supportsSubstitutionCipher: false,
    tileFontScale: 0.9,
  },
  ko: {
    code: "ko",
    name: "Korean",
    nativeName: "한국어",
    flag: "🇰🇷",
    writingSystem: "hangul",
    direction: "ltr",
    usesWordSpaces: true,
    isAgglutinative: true,
    supportsWordLadder: false,
    supportsSubstitutionCipher: false,
    tileFontScale: 0.9,
  },
  zh: {
    code: "zh",
    name: "Chinese",
    nativeName: "中文",
    flag: "🇨🇳",
    writingSystem: "cjk",
    direction: "ltr",
    usesWordSpaces: false,
    isAgglutinative: false,
    supportsWordLadder: false,
    supportsSubstitutionCipher: false,
    tileFontScale: 0.9,
  },
  ar: {
    code: "ar",
    name: "Arabic",
    nativeName: "العربية",
    flag: "🇸🇦",
    writingSystem: "arabic",
    direction: "rtl",
    usesWordSpaces: true,
    isAgglutinative: false,
    supportsWordLadder: false,
    supportsSubstitutionCipher: true,
    tileFontScale: 1,
  },
  he: {
    code: "he",
    name: "Hebrew",
    nativeName: "עברית",
    flag: "🇮🇱",
    writingSystem: "arabic",
    direction: "rtl",
    usesWordSpaces: true,
    isAgglutinative: false,
    supportsWordLadder: false,
    supportsSubstitutionCipher: true,
    tileFontScale: 1,
  },
  hi: {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    flag: "🇮🇳",
    writingSystem: "devanagari",
    direction: "ltr",
    usesWordSpaces: true,
    isAgglutinative: false,
    supportsWordLadder: false,
    supportsSubstitutionCipher: true,
    tileFontScale: 1,
  },
  th: {
    code: "th",
    name: "Thai",
    nativeName: "ไทย",
    flag: "🇹🇭",
    writingSystem: "thai",
    direction: "ltr",
    usesWordSpaces: false,
    isAgglutinative: false,
    supportsWordLadder: false,
    supportsSubstitutionCipher: true,
    tileFontScale: 1,
  },
  tr: {
    code: "tr",
    name: "Turkish",
    nativeName: "Türkçe",
    flag: "🇹🇷",
    writingSystem: "latin",
    direction: "ltr",
    usesWordSpaces: true,
    isAgglutinative: true,
    supportsWordLadder: true,
    supportsSubstitutionCipher: true,
    tileFontScale: 1,
  },
  fi: {
    code: "fi",
    name: "Finnish",
    nativeName: "Suomi",
    flag: "🇫🇮",
    writingSystem: "latin",
    direction: "ltr",
    usesWordSpaces: true,
    isAgglutinative: true,
    supportsWordLadder: true,
    supportsSubstitutionCipher: true,
    tileFontScale: 1,
  },
  ru: {
    code: "ru",
    name: "Russian",
    nativeName: "Русский",
    flag: "🇷🇺",
    writingSystem: "cyrillic",
    direction: "ltr",
    usesWordSpaces: true,
    isAgglutinative: false,
    supportsWordLadder: true,
    supportsSubstitutionCipher: true,
    tileFontScale: 1,
  },
};

/**
 * Get language config with fallback for unknown languages.
 */
export function getLanguageConfig(code: string): LanguageConfig {
  return (
    LANGUAGE_CONFIGS[code] ?? {
      code,
      name: code.toUpperCase(),
      nativeName: code.toUpperCase(),
      flag: "🌐",
      writingSystem: "latin" as WritingSystem,
      direction: "ltr" as TextDirection,
      usesWordSpaces: true,
      isAgglutinative: false,
      supportsWordLadder: true,
      supportsSubstitutionCipher: true,
      tileFontScale: 1,
    }
  );
}

/**
 * Get the language label for display (code only, no flag — flag is in selector).
 */
export function getLanguageLabel(code: string): string {
  return code.toUpperCase();
}

/**
 * Check if a language uses RTL direction.
 */
export function isRtl(code: string): boolean {
  return getLanguageConfig(code).direction === "rtl";
}

/**
 * Get adaptive font size class for game tiles based on language.
 * CJK characters need slightly different sizing.
 */
export function getTileFontClass(code: string, baseSize: string = "text-sm"): string {
  const config = getLanguageConfig(code);
  if (config.writingSystem === "cjk" || config.writingSystem === "hangul") {
    // CJK: larger base size but allow wrapping
    return baseSize === "text-sm" ? "text-base" : baseSize === "text-base" ? "text-lg" : baseSize;
  }
  if (config.writingSystem === "arabic" || config.writingSystem === "devanagari") {
    // Arabic/Devanagari: slightly larger for readability
    return baseSize === "text-sm" ? "text-base" : baseSize;
  }
  return baseSize;
}
