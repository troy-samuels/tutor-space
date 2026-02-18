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
    <div className="mb-4 flex justify-center">
      <div className="inline-flex items-center gap-0.5 rounded-xl p-1" style={{ background: "#F5EDE8" }}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => onChange(lang.code)}
            className="rounded-lg px-3 py-2 text-[13px] font-medium transition-all touch-manipulation whitespace-nowrap"
            style={
              selected === lang.code
                ? { background: "#FFFFFF", color: "#2D2A26", boxShadow: "0 1px 3px rgba(45,42,38,0.08)" }
                : { color: "#9C9590" }
            }
          >
            {lang.flag} {lang.name}
          </button>
        ))}
      </div>
    </div>
  );
}
