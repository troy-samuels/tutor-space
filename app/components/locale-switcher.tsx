"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { setLocale } from "@/lib/i18n/actions";
import { locales } from "@/lib/i18n/config";

const LABELS: Record<string, string> = {
  en: "English",
  es: "Español",
};

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-border bg-background/90 px-3 py-1.5 shadow-lg backdrop-blur">
      <label htmlFor="locale-switcher" className="text-xs font-medium text-muted-foreground">
        {t("language")}
      </label>
      <select
        id="locale-switcher"
        className="rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
        value={locale}
        onChange={(event) => {
          const nextLocale = event.target.value;
          startTransition(async () => {
            await setLocale(nextLocale);
            router.refresh();
          });
        }}
        disabled={isPending}
      >
        {locales.map((value) => (
          <option key={value} value={value}>
            {LABELS[value] ?? value.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );
}
