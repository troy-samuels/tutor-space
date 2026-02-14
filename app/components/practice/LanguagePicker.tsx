"use client";

import { motion } from "framer-motion";
import { LANGUAGES } from "@/lib/practice/catalogue-bridge";
import { useState } from "react";

interface LanguagePickerProps {
  onSelect: (languageCode: string) => void;
}

const springTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
};

// Mock live counts (different per language)
const liveCounts: Record<string, number> = {
  es: 847,
  fr: 523,
  de: 412,
  pt: 389,
  ja: 651,
  en: 1204,
};

export default function LanguagePicker({ onSelect }: LanguagePickerProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (code: string) => {
    setSelected(code);
    // Auto-advance after 400ms
    setTimeout(() => {
      onSelect(code);
    }, 400);
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
            className={`flex flex-col items-center gap-2 py-6 rounded-2xl backdrop-blur-md bg-white/[0.04] border transition-all relative overflow-hidden ${
              selected === lang.code
                ? "border-primary shadow-[0_0_30px_-10px_rgba(232,120,77,0.4)]"
                : "border-white/[0.08]"
            }`}
            style={{ transition: "all 0.3s ease" }}
          >
            {/* Selection pulse effect */}
            {selected === lang.code && (
              <motion.div
                className="absolute inset-0 bg-primary/10 rounded-2xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.3, 0] }}
                transition={{ duration: 0.6 }}
              />
            )}

            <span className="text-4xl relative z-10">{lang.flag}</span>
            <span className="text-sm font-medium relative z-10">
              {lang.name}
            </span>
            <span className="text-xs text-muted-foreground relative z-10">
              {lang.nativeName}
            </span>

            {/* Live count */}
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="text-[10px] text-accent flex items-center gap-1 mt-1 relative z-10"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              {liveCounts[lang.code]} practicing
            </motion.span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
