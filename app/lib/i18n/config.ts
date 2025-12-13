export const locales = ["en", "es", "fr", "pt", "de", "it", "nl", "ja", "zh", "ko"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

// CJK locale helpers
export const CJK_LOCALES = ["ja", "zh", "ko"] as const;
export type CJKLocale = (typeof CJK_LOCALES)[number];

export function isCJKLocale(locale: string): locale is CJKLocale {
  return CJK_LOCALES.includes(locale as CJKLocale);
}
