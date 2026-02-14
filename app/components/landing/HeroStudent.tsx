"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

const LANGUAGES = [
  { name: "Spanish", flag: "🇪🇸", code: "es", greeting: "¡Hola!" },
  { name: "French", flag: "🇫🇷", code: "fr", greeting: "Bonjour!" },
  { name: "Japanese", flag: "🇯🇵", code: "ja", greeting: "こんにちは" },
  { name: "German", flag: "🇩🇪", code: "de", greeting: "Hallo!" },
  { name: "Italian", flag: "🇮🇹", code: "it", greeting: "Ciao!" },
  { name: "Portuguese", flag: "🇵🇹", code: "pt", greeting: "Olá!" },
  { name: "Korean", flag: "🇰🇷", code: "ko", greeting: "안녕하세요" },
  { name: "Mandarin", flag: "🇨🇳", code: "zh", greeting: "你好!" },
  { name: "Arabic", flag: "🇸🇦", code: "ar", greeting: "مرحبًا" },
  { name: "Dutch", flag: "🇳🇱", code: "nl", greeting: "Hallo!" },
  { name: "Russian", flag: "🇷🇺", code: "ru", greeting: "Привет!" },
  { name: "English", flag: "🇬🇧", code: "en", greeting: "Hello!" },
];

const GREETINGS = LANGUAGES.map((l) => l.greeting);

function RotatingGreeting() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % GREETINGS.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="inline-block min-w-[180px] sm:min-w-[240px]">
      <AnimatePresence mode="wait">
        <motion.span
          key={GREETINGS[index]}
          initial={{ y: 24, opacity: 0, filter: "blur(6px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: -24, opacity: 0, filter: "blur(6px)" }}
          transition={{ duration: 0.35, ease: EASE }}
          className="text-primary inline-block"
        >
          {GREETINGS[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

// Subtle floating animation offsets per pill
const FLOAT_OFFSETS = [0, 0.5, 1.2, 0.3, 0.8, 1.5, 0.1, 0.7, 1.0, 0.4, 1.3, 0.6];

export function HeroStudent() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  function handleSelect(code: string) {
    setSelected(code);
    setTimeout(() => {
      router.push(`/practice?lang=${code}`);
    }, 500);
  }

  return (
    <section className="relative min-h-[88vh] flex items-center justify-center overflow-hidden bg-background">
      {/* Giant Mansalva watermark texture */}
      <div
        className="absolute inset-0 -z-10 flex items-center justify-center overflow-hidden select-none pointer-events-none"
        aria-hidden="true"
      >
        <span
          className="text-[18rem] sm:text-[28rem] font-bold text-foreground/[0.025] -rotate-12 whitespace-nowrap"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          speak
        </span>
      </div>

      {/* Subtle gradient orb */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/[0.05] blur-[140px] rounded-full -z-10" aria-hidden="true" />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
        {/* Headline with rotating greeting */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl tracking-tight text-foreground leading-[1.15]">
            Say <RotatingGreeting />
            <br />
            <span className="text-muted-foreground text-3xl sm:text-4xl lg:text-5xl">in your new language.</span>
          </h1>
        </motion.div>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
          className="mt-5 text-base sm:text-lg text-muted-foreground max-w-md mx-auto leading-relaxed"
        >
          Free AI exercises that adapt to your level.
          No signup. Pick a language and start speaking.
        </motion.p>

        {/* Floating language pills — organic, not a rigid grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-10 sm:mt-12 flex flex-wrap justify-center gap-2.5 sm:gap-3 max-w-xl mx-auto"
        >
          {LANGUAGES.map((lang, i) => {
            const isSelected = selected === lang.code;
            return (
              <motion.button
                key={lang.code}
                initial={{ opacity: 0, y: 12, scale: 0.9 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                transition={{
                  opacity: { duration: 0.3, delay: 0.5 + i * 0.05 },
                  y: { duration: 0.3, delay: 0.5 + i * 0.05 },
                  scale: { duration: 0.3, delay: 0.5 + i * 0.05 },
                }}
                onClick={() => handleSelect(lang.code)}
                disabled={selected !== null}
                whileHover={{ scale: 1.08, y: -6 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  inline-flex items-center gap-2 rounded-full px-4 py-2.5 sm:px-5 sm:py-3
                  text-sm sm:text-base font-medium
                  transition-colors duration-200 cursor-pointer
                  ${
                    isSelected
                      ? "bg-primary text-white shadow-lg shadow-primary/30"
                      : "bg-white text-foreground shadow-sm hover:shadow-md border border-border hover:border-primary/30"
                  }
                `}
              >
                <span className="text-lg sm:text-xl">{lang.flag}</span>
                <span>{lang.name}</span>
                {isSelected && (
                  <motion.span
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: "auto", opacity: 1 }}
                    className="text-white/80 text-sm overflow-hidden"
                  >
                    → Let's go!
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Nudge */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-6 text-xs sm:text-sm text-muted-foreground"
        >
          ↑ Tap any language to try a free exercise
        </motion.p>

        {/* Social proof — asymmetric, not centered list */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="mt-8 flex items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground"
        >
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            12,000+ learners
          </span>
          <span className="w-1 h-1 rounded-full bg-border" />
          <span>20 languages</span>
          <span className="w-1 h-1 rounded-full bg-border" />
          <span>100% free</span>
        </motion.div>
      </div>
    </section>
  );
}
