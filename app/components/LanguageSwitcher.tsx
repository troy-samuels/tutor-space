"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";

const locales = ["en", "es", "fr", "pt"] as const;
type Locale = (typeof locales)[number];

const languageNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  pt: "Português",
};

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();

  const handleLocaleChange = async (newLocale: Locale) => {
    // Set locale cookie
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;

    // Refresh the page to apply the new locale
    router.refresh();
  };

  return (
    <div className="relative inline-block">
      <button
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
        onClick={() => {
          const currentIndex = locales.indexOf(locale);
          const nextIndex = (currentIndex + 1) % locales.length;
          handleLocaleChange(locales[nextIndex]);
        }}
        aria-label="Change language"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{languageNames[locale]}</span>
        <span className="sm:hidden">{locale.toUpperCase()}</span>
      </button>
    </div>
  );
}
