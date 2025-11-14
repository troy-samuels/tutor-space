"use client";

import { useEffect, useState } from "react";

const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Russian",
  "Polish",
  "Mandarin",
  "Hindi",
  "Arabic",
  "Japanese",
];

export function LanguageRolodex() {
  const [position, setPosition] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const interval = setInterval(() => {
      setPosition((prev) => prev + 1);
    }, 3000);

    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) return;

    if (position === LANGUAGES.length) {
      const timeout = setTimeout(() => {
        setIsAnimating(false);
        setPosition(0);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setIsAnimating(true));
        });
      }, 700);

      return () => clearTimeout(timeout);
    }
  }, [position, prefersReducedMotion]);

  const currentIndex = position % LANGUAGES.length;
  const extendedLanguages = [...LANGUAGES, LANGUAGES[0]];

  if (prefersReducedMotion) {
    return (
      <span className="inline-block font-bold text-brand-brown">
        languages
      </span>
    );
  }

  const lineHeight = 1.2;

  return (
    <span
      className="ml-1 inline-flex overflow-hidden align-baseline"
      style={{ height: `${lineHeight}em` }}
      aria-label={`Teaching ${LANGUAGES.join(", ")} and more`}
      aria-live="polite"
    >
      <span
        className="flex flex-col will-change-transform"
        style={{
          transform: `translateY(-${position * 100}%)`,
          transition: isAnimating ? "transform 700ms ease-in-out" : "none",
        }}
      >
        {extendedLanguages.map((language, index) => (
          <span
            key={`${language}-${index}`}
            className="block font-bold text-brand-brown whitespace-nowrap"
            style={{
              height: `${lineHeight}em`,
              lineHeight: `${lineHeight}em`,
            }}
            aria-hidden={index !== currentIndex}
          >
            {language}
          </span>
        ))}
      </span>
    </span>
  );
}
