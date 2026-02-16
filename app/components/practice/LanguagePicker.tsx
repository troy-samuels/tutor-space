"use client";

import { motion } from "framer-motion";
import { LANGUAGES } from "@/lib/practice/catalogue-bridge";
import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import LanguageDrawer from "./LanguageDrawer";

interface LanguagePickerProps {
  onSelect: (languageCode: string) => void;
  /** If provided, shows a compact header that opens the drawer */
  currentLanguage?: string;
  /** Mastery progress per language code (0-100) */
  userProgress?: Record<string, number>;
}

// Mock live counts
const liveCounts: Record<string, number> = {
  es: 847,
  fr: 523,
  de: 412,
  pt: 389,
  ja: 651,
  en: 1204,
  zh: 932,
  ko: 476,
  it: 345,
  ar: 289,
  ru: 367,
  hi: 512,
  tr: 198,
  nl: 156,
  pl: 134,
  sv: 112,
};

export default function LanguagePicker({
  onSelect,
  currentLanguage,
  userProgress = {},
}: LanguagePickerProps) {
  const [selected, setSelected] = useState<string | null>(
    currentLanguage || null
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const selectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (selectTimerRef.current) clearTimeout(selectTimerRef.current);
    };
  }, []);

  // If a current language is set, render the compact header + drawer mode
  if (currentLanguage) {
    const lang = LANGUAGES.find((l) => l.code === currentLanguage);
    return (
      <>
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted transition-colors"
        >
          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
            {currentLanguage.toUpperCase()}
          </div>
          <span className="text-sm font-medium text-foreground">
            {lang?.nativeName || currentLanguage}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>

        <LanguageDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          currentLang={currentLanguage}
          onSelect={onSelect}
          userProgress={userProgress}
          languages={LANGUAGES}
        />
      </>
    );
  }

  // Default: full-screen picker (initial language selection)
  const handleSelect = (code: string) => {
    setSelected(code);
    selectTimerRef.current = setTimeout(() => onSelect(code), 400);
  };

  return (
    <div className="flex flex-col min-h-[100dvh] px-6">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-xl font-semibold text-center pt-16 pb-8"
      >
        What do you want to practise?
      </motion.h2>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="grid grid-cols-2 gap-3"
      >
        {LANGUAGES.map((lang, i) => (
          <motion.button
            key={lang.code}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.05, duration: 0.3 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => handleSelect(lang.code)}
            className={`flex flex-col items-center gap-2 py-5 rounded-2xl border transition-all relative overflow-hidden ${
              selected === lang.code
                ? "border-primary shadow-[0_0_30px_-10px_rgba(232,120,77,0.4)]"
                : "border-border bg-card"
            }`}
          >
            {/* Selection pulse */}
            {selected === lang.code && (
              <motion.div
                className="absolute inset-0 bg-primary/10 rounded-2xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.3, 0] }}
                transition={{ duration: 0.6 }}
              />
            )}

            {/* ISO code circle instead of flag */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold relative z-10 transition-colors ${
                selected === lang.code
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {lang.code.toUpperCase()}
            </div>

            <span className="text-sm font-medium relative z-10">
              {lang.nativeName}
            </span>
            <span className="text-xs text-muted-foreground relative z-10">
              {lang.name}
            </span>

            {/* Live count */}
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.05 }}
              className="text-[10px] text-accent flex items-center gap-1 mt-0.5 relative z-10"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              {liveCounts[lang.code] || 0} practising
            </motion.span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
