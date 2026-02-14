import type { Language } from "./types";

const RAW_LANGUAGES: Language[] = [
  {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
    levels: ["beginner", "elementary", "intermediate", "upper-intermediate", "advanced"],
  },
  {
    code: "fr",
    name: "French",
    nativeName: "Français",
    flag: "🇫🇷",
    levels: ["beginner", "elementary", "intermediate", "upper-intermediate", "advanced"],
  },
  {
    code: "de",
    name: "German",
    nativeName: "Deutsch",
    flag: "🇩🇪",
    levels: ["beginner", "elementary", "intermediate", "upper-intermediate", "advanced"],
  },
  {
    code: "it",
    name: "Italian",
    nativeName: "Italiano",
    flag: "🇮🇹",
    levels: ["beginner", "elementary", "intermediate", "upper-intermediate", "advanced"],
  },
  {
    code: "pt",
    name: "Portuguese",
    nativeName: "Português",
    flag: "🇵🇹",
    levels: ["beginner", "elementary", "intermediate", "upper-intermediate", "advanced"],
  },
  {
    code: "ja",
    name: "Japanese",
    nativeName: "日本語",
    flag: "🇯🇵",
    levels: ["beginner", "elementary", "intermediate", "upper-intermediate", "advanced"],
  },
  {
    code: "ko",
    name: "Korean",
    nativeName: "한국어",
    flag: "🇰🇷",
    levels: ["beginner", "elementary", "intermediate", "upper-intermediate", "advanced"],
  },
  {
    code: "zh",
    name: "Mandarin Chinese",
    nativeName: "中文",
    flag: "🇨🇳",
    levels: ["beginner", "elementary", "intermediate", "upper-intermediate", "advanced"],
  },
  {
    code: "ar",
    name: "Arabic",
    nativeName: "العربية",
    flag: "🇸🇦",
    rtl: true,
    levels: ["beginner", "elementary", "intermediate", "upper-intermediate", "advanced"],
  },
  {
    code: "nl",
    name: "Dutch",
    nativeName: "Nederlands",
    flag: "🇳🇱",
    levels: ["beginner", "elementary", "intermediate", "upper-intermediate", "advanced"],
  },
  {
    code: "ru",
    name: "Russian",
    nativeName: "Русский",
    flag: "🇷🇺",
    levels: ["beginner", "elementary", "intermediate", "upper-intermediate", "advanced"],
  },
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇬🇧",
    levels: ["beginner", "elementary", "intermediate", "upper-intermediate", "advanced"],
  },
];

function freezeLanguage(language: Language): Readonly<Language> {
  return Object.freeze({
    ...language,
    levels: Object.freeze([...language.levels]),
  });
}

export const LANGUAGES = Object.freeze(RAW_LANGUAGES.map(freezeLanguage)) as readonly Readonly<Language>[];

const LANGUAGE_BY_CODE = new Map<string, Readonly<Language>>(
  LANGUAGES.map((language) => [language.code, language])
);

const LANGUAGE_CODES = Object.freeze(LANGUAGES.map((language) => language.code));

export function getLanguageByCode(code: string): Language | undefined {
  return LANGUAGE_BY_CODE.get(code) as Language | undefined;
}

export function getAvailableLanguageCodes(): string[] {
  return [...LANGUAGE_CODES];
}
