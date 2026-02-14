"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";
import { getSpeechLocale } from "./speech-utils";

interface ListenButtonProps {
  text: string;
  languageCode: string;
}

const springTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
};

function getPreferredVoice(
  voices: SpeechSynthesisVoice[],
  locale: string
): SpeechSynthesisVoice | undefined {
  const exact = voices.find((voice) => voice.lang.toLowerCase() === locale.toLowerCase());
  if (exact) return exact;

  const primaryLocale = locale.split("-")[0]?.toLowerCase();
  return voices.find((voice) =>
    voice.lang.toLowerCase().startsWith(primaryLocale ?? "")
  );
}

export default function ListenButton({ text, languageCode }: ListenButtonProps) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    const syncVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };

    syncVoices();
    window.speechSynthesis.addEventListener("voiceschanged", syncVoices);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", syncVoices);
      window.speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    window.speechSynthesis.cancel();
    const locale = getSpeechLocale(languageCode);
    const utterance = new SpeechSynthesisUtterance(trimmed);
    utterance.lang = locale;
    utterance.rate = 0.95;

    const voice = getPreferredVoice(voices, locale);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      utteranceRef.current = null;
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      utteranceRef.current = null;
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [languageCode, text, voices]);

  return (
    <motion.button
      type="button"
      onClick={speak}
      whileTap={{ scale: 0.85 }}
      transition={springTransition}
      className={`relative h-8 w-8 shrink-0 rounded-full border backdrop-blur-xl transition-all ${
        isSpeaking
          ? "bg-primary/[0.18] border-primary/40 shadow-[0_0_20px_-5px_rgba(232,120,77,0.5)]"
          : "bg-white/[0.05] border-white/[0.1]"
      }`}
      aria-label="Listen to question"
    >
      {isSpeaking && (
        <motion.span
          className="absolute inset-0 rounded-full border border-primary/50"
          animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <span className="relative z-10 flex h-full w-full items-center justify-center">
        <Volume2 className={`h-3.5 w-3.5 ${isSpeaking ? "text-primary" : "text-foreground"}`} />
      </span>
    </motion.button>
  );
}
