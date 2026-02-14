export const LANGUAGE_LOCALE_MAP: Record<string, string> = {
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  pt: "pt-PT",
  ja: "ja-JP",
  en: "en-US",
};

export function getSpeechLocale(languageCode: string): string {
  return LANGUAGE_LOCALE_MAP[languageCode] ?? "en-US";
}

export function normalizeSpeechText(text: string): string {
  return text.trim().toLowerCase();
}
