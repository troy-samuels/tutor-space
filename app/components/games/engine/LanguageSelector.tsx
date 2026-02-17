"use client";

import * as React from "react";
import { isTelegram } from "@/lib/telegram";

interface Language {
  code: string;
  name: string;
  flag: string;
}

interface LanguageSelectorProps {
  languages: readonly Language[];
  selected: string;
  onChange: (code: string) => void;
}

/**
 * Language selector that renders as a Telegram-native segmented control
 * inside Telegram, and as pill buttons on the web.
 */
export default function LanguageSelector({
  languages,
  selected,
  onChange,
}: LanguageSelectorProps) {
  const inTg = React.useMemo(() => typeof window !== "undefined" && isTelegram(), []);

  if (inTg) {
    return (
      <div className="mb-4 flex justify-center">
        <div className="tg-segmented-control">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => onChange(lang.code)}
              data-active={selected === lang.code ? "true" : "false"}
              className="touch-manipulation"
            >
              {lang.flag} {lang.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 flex justify-center gap-1.5 flex-wrap">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => onChange(lang.code)}
          className={`rounded-full px-3 py-2 text-sm font-medium transition-all min-h-[44px] touch-manipulation ${
            selected === lang.code
              ? "bg-primary text-primary-foreground shadow-lg"
              : "bg-white/[0.05] text-muted-foreground hover:bg-white/[0.1]"
          }`}
        >
          {lang.flag} {lang.name}
        </button>
      ))}
    </div>
  );
}
