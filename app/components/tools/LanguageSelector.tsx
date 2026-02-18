"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { TOOL_LANGUAGES, type ToolLang } from "@/lib/tools/types";
import { cn } from "@/lib/utils";

interface LanguageSelectorProps {
  value: ToolLang;
  onChange: (lang: ToolLang) => void;
  variant?: "pills" | "cards";
  className?: string;
}

export function LanguageSelector({
  value,
  onChange,
  variant = "pills",
  className,
}: LanguageSelectorProps) {
  if (variant === "cards") {
    return (
      <div className={cn("grid grid-cols-2 gap-3", className)}>
        {TOOL_LANGUAGES.map((lang) => {
          const active = lang.code === value;
          return (
            <button
              key={lang.code}
              onClick={() => onChange(lang.code)}
              className={cn(
                "flex items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-200 active:scale-[0.97]",
                active
                  ? "border-primary bg-primary/6 shadow-sm"
                  : "border-black/8 bg-white hover:bg-gray-50 hover:border-black/12",
              )}
            >
              <span className="text-2xl">{lang.flag}</span>
              <div className="min-w-0">
                <p
                  className={cn(
                    "font-bold text-sm",
                    active ? "text-primary" : "text-foreground",
                  )}
                >
                  {lang.name}
                </p>
                <p className="text-xs text-foreground/50">{lang.nativeName}</p>
              </div>
              {active && (
                <motion.div
                  layoutId="lang-check"
                  className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0"
                >
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </motion.div>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 p-1 rounded-full",
        "bg-black/5",
        className,
      )}
    >
      {TOOL_LANGUAGES.map((lang) => {
        const active = lang.code === value;
        return (
          <button
            key={lang.code}
            onClick={() => onChange(lang.code)}
            title={lang.name}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200",
              active
                ? "bg-white text-foreground shadow-sm"
                : "text-foreground/50 hover:text-foreground/70",
            )}
          >
            <span>{lang.flag}</span>
            <span className="hidden sm:inline">{lang.nativeName}</span>
          </button>
        );
      })}
    </div>
  );
}

export function ToolLanguageBar({
  lang,
  onChangeLang,
}: {
  lang: ToolLang;
  onChangeLang: (l: ToolLang) => void;
}) {
  const current = TOOL_LANGUAGES.find((l) => l.code === lang)!;

  return (
    <div
      className="rounded-2xl border border-black/8 bg-white p-3 flex flex-col gap-2 shadow-soft"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">
          I&apos;m learning
        </p>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{
            background: "rgba(211,97,53,0.08)",
            color: "var(--primary)",
          }}
        >
          {current.flag} {current.name}
        </span>
      </div>
      <LanguageSelector value={lang} onChange={onChangeLang} variant="pills" />
    </div>
  );
}
