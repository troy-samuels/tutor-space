"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import type { RecapVocabWord, RecapUIStrings } from "@/lib/recap/types";
import { DEFAULT_UI_STRINGS } from "@/lib/recap/types";

type VocabCardsProps = {
  vocabulary: RecapVocabWord[];
  language: string;
  onContinue: () => void;
  uiStrings?: RecapUIStrings;
};

/** Map common language names to BCP-47 locale codes for speech synthesis */
function getLocaleForLanguage(language: string): string {
  const lower = language.toLowerCase();
  const map: Record<string, string> = {
    spanish: "es-ES",
    french: "fr-FR",
    german: "de-DE",
    portuguese: "pt-PT",
    italian: "it-IT",
    japanese: "ja-JP",
    chinese: "zh-CN",
    korean: "ko-KR",
    english: "en-US",
    dutch: "nl-NL",
    russian: "ru-RU",
    arabic: "ar-SA",
  };
  return map[lower] ?? "en-US";
}

function speakWord(word: string, language: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = getLocaleForLanguage(language);
  utterance.rate = 0.85;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export default function VocabCards({
  vocabulary,
  language,
  onContinue,
  uiStrings,
}: VocabCardsProps) {
  const ui = { ...DEFAULT_UI_STRINGS, ...uiStrings };
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const [direction, setDirection] = useState(0);

  const word = vocabulary[currentIndex];
  const isFlipped = flipped.has(currentIndex);
  const canContinue = flipped.size >= Math.min(2, vocabulary.length);

  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= vocabulary.length) return;
      setDirection(index > currentIndex ? 1 : -1);
      setCurrentIndex(index);
    },
    [currentIndex, vocabulary.length]
  );

  const handleFlip = useCallback(() => {
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(currentIndex)) {
        next.delete(currentIndex);
      } else {
        next.add(currentIndex);
      }
      return next;
    });
  }, [currentIndex]);

  if (!word) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      {/* Header */}
      <div className="mb-8 flex w-full max-w-sm items-center justify-between">
        <span className="text-lg font-semibold text-foreground">
          {ui.keyVocabulary}
        </span>
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1}/{vocabulary.length}
        </span>
      </div>

      {/* Card */}
      <div
        className="relative w-full max-w-sm"
        style={{ perspective: "1000px" }}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`${currentIndex}-${isFlipped ? "back" : "front"}`}
            custom={direction}
            initial={{ opacity: 0, x: direction * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -60 }}
            transition={{ duration: 0.25 }}
          >
            <button
              onClick={handleFlip}
              className={cn(
                "flex w-full min-h-[200px] cursor-pointer flex-col items-center justify-center",
                "rounded-2xl border bg-card p-8 text-left transition-shadow hover:shadow-lg",
              )}
              style={{ borderColor: "rgba(245, 242, 239, 0.08)" }}
            >
              {!isFlipped ? (
                <>
                  <span className="text-2xl font-bold text-foreground">
                    {word.word}
                  </span>
                  <span className="mt-2 text-sm text-muted-foreground">
                    {word.phonetic}
                  </span>
                  <span className="mt-6 text-xs text-muted-foreground/60">
                    {ui.tapToReveal}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xl font-bold text-foreground">
                    {word.translation}
                  </span>
                  {word.partOfSpeech && (
                    <span className="mt-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                      {word.partOfSpeech}
                    </span>
                  )}
                  <span className="mt-3 text-center text-sm italic leading-relaxed text-foreground/70">
                    &ldquo;{word.example}&rdquo;
                  </span>
                  {word.collocations && word.collocations.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center justify-center gap-1">
                      {word.collocations.map((c, ci) => (
                        <span
                          key={ci}
                          className="rounded-md bg-foreground/5 px-2 py-0.5 text-[11px] text-foreground/60"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      speakWord(word.word, language);
                    }}
                    className="mt-3 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
                  >
                    {ui.listen}
                  </button>
                </>
              )}
            </button>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation arrows */}
      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={() => goTo(currentIndex - 1)}
          disabled={currentIndex === 0}
          className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
        >
          {ui.prev}
        </button>
        <button
          onClick={() => goTo(currentIndex + 1)}
          disabled={currentIndex === vocabulary.length - 1}
          className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
        >
          {ui.next}
        </button>
      </div>

      {/* Dots */}
      <div className="mt-4 flex gap-2">
        {vocabulary.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={cn(
              "h-2 w-2 rounded-full transition-colors",
              i === currentIndex ? "bg-primary" : "bg-muted-foreground/30"
            )}
          />
        ))}
      </div>

      {/* Continue button */}
      <motion.button
        onClick={onContinue}
        className={cn(
          "mt-8 w-full max-w-sm rounded-xl bg-primary py-3 font-semibold text-white",
          "transition-all hover:brightness-110 active:scale-[0.98]",
          !canContinue && "cursor-not-allowed opacity-50"
        )}
        disabled={!canContinue}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {ui.iKnowThese}
      </motion.button>

      {/* Footer */}
      <div className="mt-4 flex justify-center opacity-40">
        <Logo variant="wordmark" className="h-5 invert" />
      </div>
    </div>
  );
}
