/**
 * Language to flag emoji mapping for the Cultural Banner hero layout.
 * Used to display flag emojis next to language names in the tutor profile.
 */
export const LANGUAGE_FLAGS: Record<string, string> = {
  // English variants
  en: "🇬🇧",
  english: "🇬🇧",
  "en-us": "🇺🇸",
  "en-gb": "🇬🇧",
  "american english": "🇺🇸",
  "british english": "🇬🇧",

  // Spanish variants
  es: "🇪🇸",
  spanish: "🇪🇸",
  "es-mx": "🇲🇽",
  "mexican spanish": "🇲🇽",
  "latin american spanish": "🇲🇽",

  // French
  fr: "🇫🇷",
  french: "🇫🇷",
  "fr-ca": "🇨🇦",
  "canadian french": "🇨🇦",

  // German
  de: "🇩🇪",
  german: "🇩🇪",

  // Portuguese variants
  pt: "🇵🇹",
  portuguese: "🇵🇹",
  "pt-br": "🇧🇷",
  "brazilian portuguese": "🇧🇷",

  // Italian
  it: "🇮🇹",
  italian: "🇮🇹",

  // Chinese variants
  zh: "🇨🇳",
  chinese: "🇨🇳",
  mandarin: "🇨🇳",
  "zh-cn": "🇨🇳",
  "zh-tw": "🇹🇼",
  cantonese: "🇭🇰",

  // Japanese
  ja: "🇯🇵",
  japanese: "🇯🇵",

  // Korean
  ko: "🇰🇷",
  korean: "🇰🇷",

  // Arabic
  ar: "🇸🇦",
  arabic: "🇸🇦",

  // Russian
  ru: "🇷🇺",
  russian: "🇷🇺",

  // Hindi
  hi: "🇮🇳",
  hindi: "🇮🇳",

  // Dutch
  nl: "🇳🇱",
  dutch: "🇳🇱",

  // Polish
  pl: "🇵🇱",
  polish: "🇵🇱",

  // Turkish
  tr: "🇹🇷",
  turkish: "🇹🇷",

  // Vietnamese
  vi: "🇻🇳",
  vietnamese: "🇻🇳",

  // Thai
  th: "🇹🇭",
  thai: "🇹🇭",

  // Indonesian
  id: "🇮🇩",
  indonesian: "🇮🇩",

  // Greek
  el: "🇬🇷",
  greek: "🇬🇷",

  // Hebrew
  he: "🇮🇱",
  hebrew: "🇮🇱",

  // Swedish
  sv: "🇸🇪",
  swedish: "🇸🇪",

  // Norwegian
  no: "🇳🇴",
  norwegian: "🇳🇴",

  // Danish
  da: "🇩🇰",
  danish: "🇩🇰",

  // Finnish
  fi: "🇫🇮",
  finnish: "🇫🇮",

  // Czech
  cs: "🇨🇿",
  czech: "🇨🇿",

  // Hungarian
  hu: "🇭🇺",
  hungarian: "🇭🇺",

  // Romanian
  ro: "🇷🇴",
  romanian: "🇷🇴",

  // Ukrainian
  uk: "🇺🇦",
  ukrainian: "🇺🇦",

  // Tagalog/Filipino
  tl: "🇵🇭",
  tagalog: "🇵🇭",
  filipino: "🇵🇭",

  // Swahili
  sw: "🇰🇪",
  swahili: "🇰🇪",

  // Persian/Farsi
  fa: "🇮🇷",
  persian: "🇮🇷",
  farsi: "🇮🇷",

  // Bengali
  bn: "🇧🇩",
  bengali: "🇧🇩",

  // Urdu
  ur: "🇵🇰",
  urdu: "🇵🇰",
};

export type LanguageWithFlag = {
  name: string;
  flag: string;
};

/**
 * Parse languages from profile and return with flag emojis.
 * Handles both string (comma-separated) and array formats.
 */
export function parseLanguagesWithFlags(
  languages: string | string[] | undefined | null
): LanguageWithFlag[] {
  if (!languages) return [];

  const langArray = Array.isArray(languages)
    ? languages
    : languages.split(",").map((l) => l.trim()).filter(Boolean);

  return langArray.map((lang) => {
    const normalized = lang.trim().toLowerCase();
    const flag = LANGUAGE_FLAGS[normalized] || "🌐";
    return { name: lang.trim(), flag };
  });
}

/**
 * Get a single flag for a language code or name.
 */
export function getLanguageFlag(language: string): string {
  const normalized = language.trim().toLowerCase();
  return LANGUAGE_FLAGS[normalized] || "🌐";
}
