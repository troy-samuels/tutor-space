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
  /** When true, all buttons are visually dimmed and non-interactive */
  disabled?: boolean;
}

/**
 * Language selector that renders as a Telegram-native segmented control
 * inside Telegram, and as pill buttons on the web.
 */
export default function LanguageSelector({
  languages,
  selected,
  onChange,
  disabled = false,
}: LanguageSelectorProps) {
  const inTg = React.useMemo(() => typeof window !== "undefined" && isTelegram(), []);

  if (inTg) {
    return (
      <div className="mb-4 flex justify-center" style={disabled ? { opacity: 0.4, pointerEvents: "none" } : undefined}>
        <div className="tg-segmented-control">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => !disabled && onChange(lang.code)}
              disabled={disabled}
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
    <div
      className="mb-3 flex justify-center transition-opacity duration-200"
      style={disabled ? { opacity: 0.4, pointerEvents: "none" } : undefined}
    >
      <div className="inline-flex items-center gap-0.5 rounded-lg p-0.5" style={{ background: "#F5EDE8" }}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => !disabled && onChange(lang.code)}
            disabled={disabled}
            className="rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-all touch-manipulation whitespace-nowrap min-h-[40px]"
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
