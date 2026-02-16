"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useCallback, useRef } from "react";
import type { Language } from "@/components/practice/mock-data";

interface LanguageDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: string;
  onSelect: (lang: string) => void;
  userProgress: Record<string, number>;
  languages: Language[];
}

export default function LanguageDrawer({
  isOpen,
  onClose,
  currentLang,
  onSelect,
  userProgress,
  languages,
}: LanguageDrawerProps) {
  const prevOverflowRef = useRef<string>("");

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      prevOverflowRef.current = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = prevOverflowRef.current;
    };
  }, [isOpen, handleEscape]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="language-drawer-title"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-card border-t border-border p-6 max-h-[85vh] overflow-y-auto"
          >
            {/* Drag handle */}
            <div className="w-12 h-1.5 bg-muted-foreground/20 rounded-full mx-auto mb-6" />

            <h2 id="language-drawer-title" className="text-2xl font-bold text-center mb-6">
              Pick your path
            </h2>

            <div className="grid grid-cols-2 gap-4">
              {languages.map((lang) => {
                const isActive = currentLang === lang.code;
                const progress = Math.max(0, Math.min(100, userProgress[lang.code] ?? 0));

                return (
                  <button
                    key={lang.code}
                    onClick={() => {
                      onSelect(lang.code);
                      onClose();
                    }}
                    className={`
                      relative flex flex-col items-center p-4 rounded-2xl border transition-all min-h-[120px]
                      ${
                        isActive
                          ? "bg-primary/10 border-primary shadow-[0_0_15px_-3px_rgba(211,97,53,0.3)]"
                          : "bg-background border-border hover:border-muted-foreground/30"
                      }
                    `}
                  >
                    {/* ISO Code Circle */}
                    <div
                      className={`
                        w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold mb-3 transition-colors
                        ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }
                      `}
                    >
                      {lang.code.toUpperCase()}
                    </div>

                    <span className="font-semibold text-sm text-foreground">
                      {lang.nativeName}
                    </span>
                    <span className="text-xs text-muted-foreground mb-3">
                      {lang.name}
                    </span>

                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="h-full bg-accent rounded-full"
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom safe area */}
            <div className="h-8" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
