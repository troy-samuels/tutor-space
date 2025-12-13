/**
 * CJK (Chinese, Japanese, Korean) Language Helpers
 *
 * Duolingo-inspired utilities for proper CJK language support.
 * These helpers ensure consistent handling across all CJK languages.
 */

export const CJK_LOCALES = ["ja", "zh", "ko"] as const;
export type CJKLocale = (typeof CJK_LOCALES)[number];

/**
 * Check if a locale is a CJK language
 */
export function isCJKLocale(locale: string): locale is CJKLocale {
  return CJK_LOCALES.includes(locale as CJKLocale);
}

/**
 * Get appropriate line-height for locale
 * CJK characters need more vertical space (1.8-2.0) vs Latin (1.5-1.6)
 */
export function getLineHeight(locale: string): number {
  return isCJKLocale(locale) ? 1.8 : 1.5;
}

/**
 * Adjust character limits for CJK languages
 * CJK expresses 2-3x more meaning per character than Latin scripts
 *
 * Example: "予約" (2 chars) = "Booking" (7 chars)
 */
export function getCharacterLimit(baseLimit: number, locale: string): number {
  return isCJKLocale(locale) ? Math.ceil(baseLimit * 0.6) : baseLimit;
}

/**
 * Adjust minimum character requirements for CJK
 * A 50-char English bio ≈ 20-30 char CJK bio in meaning
 */
export function getMinCharacterLimit(baseMin: number, locale: string): number {
  return isCJKLocale(locale) ? Math.ceil(baseMin * 0.4) : baseMin;
}

/**
 * Get initials from a name (grapheme-aware for CJK)
 *
 * Latin: "John Smith" → "JS"
 * CJK: "田中太郎" → "田中" (family name + given name first char)
 * CJK: "李明" → "李明" (full 2-char name)
 *
 * Uses spread operator for grapheme-aware splitting
 */
export function getInitials(name: string, maxChars: number = 2): string {
  if (!name) return "";

  const trimmed = name.trim();

  // Check if name contains CJK characters
  const hasCJK = /[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/.test(
    trimmed
  );

  if (hasCJK) {
    // For CJK: use grapheme-aware slicing (spread operator)
    const chars = [...trimmed.replace(/\s/g, "")];
    return chars.slice(0, maxChars).join("");
  }

  // For Latin: use first letter of each word
  const words = trimmed.split(/\s+/);
  return words
    .slice(0, maxChars)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

/**
 * Truncate text safely for CJK
 * Avoids cutting mid-character by using grapheme-aware slicing
 */
export function truncateText(
  text: string,
  maxLength: number,
  locale: string,
  ellipsis: string = "..."
): string {
  if (!text) return "";

  // Adjust max length for CJK
  const adjustedMax = isCJKLocale(locale)
    ? Math.ceil(maxLength * 0.6)
    : maxLength;

  const chars = [...text]; // Grapheme-aware split

  if (chars.length <= adjustedMax) {
    return text;
  }

  return chars.slice(0, adjustedMax - ellipsis.length).join("") + ellipsis;
}

/**
 * Check if text contains CJK characters
 */
export function containsCJK(text: string): boolean {
  // CJK Unified Ideographs (Chinese/Japanese Kanji)
  // Hiragana (Japanese)
  // Katakana (Japanese)
  // Hangul (Korean)
  return /[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/.test(text);
}

/**
 * Get CJK-appropriate font family CSS value
 */
export function getCJKFontFamily(locale: string): string {
  switch (locale) {
    case "ja":
      return '"Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif';
    case "zh":
      return '"Noto Sans SC", "Microsoft YaHei", "PingFang SC", sans-serif';
    case "ko":
      return '"Noto Sans KR", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
    default:
      return "inherit";
  }
}

/**
 * Get locale-specific date format pattern
 * CJK locales use Year-Month-Day order
 */
export function getDateFormatPattern(locale: string): string {
  switch (locale) {
    case "ja":
      return "yyyy年MM月dd日"; // 2024年01月15日
    case "zh":
      return "yyyy年MM月dd日"; // 2024年01月15日
    case "ko":
      return "yyyy년 MM월 dd일"; // 2024년 01월 15일
    default:
      return "PPP"; // Let date-fns handle it
  }
}

/**
 * Get time format preference
 * CJK regions typically prefer 24-hour format
 */
export function getTimeFormat(locale: string): "12h" | "24h" {
  return isCJKLocale(locale) ? "24h" : "12h";
}

/**
 * CJK-aware string comparison for sorting
 * Uses Intl.Collator for proper locale-aware sorting
 */
export function createCJKCollator(locale: string): Intl.Collator {
  const localeMap: Record<string, string> = {
    ja: "ja-JP",
    zh: "zh-CN",
    ko: "ko-KR",
  };

  return new Intl.Collator(localeMap[locale] || locale, {
    sensitivity: "base",
    numeric: true,
  });
}

/**
 * Validate that a name meets minimum requirements for the locale
 */
export function isValidName(name: string, locale: string): boolean {
  if (!name || !name.trim()) return false;

  const trimmed = name.trim();
  const chars = [...trimmed];

  // CJK names can be as short as 2 characters (e.g., "李明")
  // Latin names typically need at least 2 characters
  const minLength = isCJKLocale(locale) ? 2 : 2;

  return chars.length >= minLength;
}
