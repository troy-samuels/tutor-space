"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mic } from "lucide-react";
import { getSpeechLocale, normalizeSpeechText } from "./speech-utils";

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlternativeLike;
  length: number;
}

interface SpeechRecognitionResultListLike {
  [index: number]: SpeechRecognitionResultLike;
  length: number;
}

interface SpeechRecognitionEventLike extends Event {
  results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

interface VoiceInputToggleProps {
  languageCode: string;
  expectedAnswers: string[];
  onMatch: (heardText: string) => void;
  disabled?: boolean;
  className?: string;
}

const springTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
};

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") {
    return null;
  }

  const windowWithRecognition = window as Window & {
    webkitSpeechRecognition?: SpeechRecognitionCtor;
    SpeechRecognition?: SpeechRecognitionCtor;
  };

  return (
    windowWithRecognition.webkitSpeechRecognition ??
    windowWithRecognition.SpeechRecognition ??
    null
  );
}

function flattenTranscript(results: SpeechRecognitionResultListLike): string {
  const chunks: string[] = [];
  for (let index = 0; index < results.length; index += 1) {
    const chunk = results[index]?.[0]?.transcript;
    if (chunk) {
      chunks.push(chunk.trim());
    }
  }
  return chunks.join(" ").replace(/\s+/g, " ").trim();
}

export default function VoiceInputToggle({
  languageCode,
  expectedAnswers,
  onMatch,
  disabled = false,
  className = "",
}: VoiceInputToggleProps) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptRef = useRef("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const hideToastRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const normalizedExpected = useMemo(
    () =>
      expectedAnswers
        .map((answer) => normalizeSpeechText(answer))
        .filter((answer) => answer.length > 0),
    [expectedAnswers]
  );

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, []);

  const stopRecognition = useCallback(() => {
    clearTimer();
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsRecording(false);
  }, [clearTimer]);

  const showToast = useCallback((message: string) => {
    if (hideToastRef.current) {
      clearTimeout(hideToastRef.current);
    }
    setToastMessage(message);
    hideToastRef.current = setTimeout(() => {
      setToastMessage(null);
      hideToastRef.current = undefined;
    }, 2600);
  }, []);

  const startRecognition = useCallback(() => {
    if (disabled || normalizedExpected.length === 0) {
      return;
    }

    const SpeechRecognition = getSpeechRecognitionCtor();
    if (!SpeechRecognition) {
      showToast("Voice input not supported in this browser");
      return;
    }

    setInfoMessage(null);
    setTranscript("");
    transcriptRef.current = "";
    clearTimer();

    const recognition = new SpeechRecognition();
    recognition.lang = getSpeechLocale(languageCode);
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      const heardText = flattenTranscript(event.results);
      transcriptRef.current = heardText;
      setTranscript(heardText);

      const normalizedHeard = normalizeSpeechText(heardText);
      if (!normalizedHeard) {
        return;
      }

      const matched = normalizedExpected.some(
        (expected) => normalizedHeard === expected
      );

      if (matched) {
        stopRecognition();
        onMatch(heardText);
      }
    };

    recognition.onerror = () => {
      stopRecognition();
      setInfoMessage("Voice capture stopped. Tap mic to retry.");
    };

    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);

    timeoutRef.current = setTimeout(() => {
      const heardText = transcriptRef.current;
      stopRecognition();
      if (heardText) {
        setInfoMessage(`Heard "${heardText}". No match yet - tap mic to retry.`);
      } else {
        setInfoMessage("No speech detected. Tap mic to retry.");
      }
    }, 5000);
  }, [
    clearTimer,
    disabled,
    languageCode,
    normalizedExpected,
    onMatch,
    showToast,
    stopRecognition,
  ]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecognition();
      return;
    }
    startRecognition();
  }, [isRecording, startRecognition, stopRecognition]);

  useEffect(() => {
    if (disabled && isRecording) {
      stopRecognition();
    }
  }, [disabled, isRecording, stopRecognition]);

  useEffect(() => {
    return () => {
      clearTimer();
      if (hideToastRef.current) {
        clearTimeout(hideToastRef.current);
      }
      recognitionRef.current?.stop();
    };
  }, [clearTimer]);

  const showTranscriptionBar = isRecording || transcript.length > 0 || !!infoMessage;

  return (
    <>
      <motion.button
        type="button"
        onClick={toggleRecording}
        whileTap={{ scale: 0.85 }}
        transition={springTransition}
        className={`relative h-9 w-9 rounded-full border backdrop-blur-xl ${
          isRecording
            ? "bg-[#C4563F]/[0.25] border-[#C4563F]/40 shadow-[0_0_20px_-6px_rgba(196,86,63,0.55)]"
            : "bg-white/[0.05] border-white/[0.1]"
        } ${className}`}
        aria-label={isRecording ? "Stop voice input" : "Start voice input"}
        disabled={disabled}
      >
        {isRecording && (
          <motion.span
            className="absolute inset-0 rounded-full border border-[#C4563F]/45"
            animate={{ scale: [1, 1.22, 1], opacity: [0.65, 0, 0.65] }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <span className="relative z-10 flex h-full w-full items-center justify-center">
          <Mic className={`h-4 w-4 ${isRecording ? "text-[#C4563F]" : "text-foreground"}`} />
        </span>
      </motion.button>

      <AnimatePresence>
        {showTranscriptionBar && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={springTransition}
            onClick={() => {
              if (!isRecording) {
                setTranscript("");
                setInfoMessage(null);
              }
            }}
            className="absolute bottom-4 left-4 right-4 z-40 rounded-2xl border border-white/[0.1] bg-white/[0.05] px-4 py-2.5 text-left backdrop-blur-xl"
          >
            <p className="text-[11px] text-muted-foreground">
              {isRecording ? "Listening..." : "Voice input"}
            </p>
            <p className="mt-0.5 text-sm text-foreground">
              {isRecording
                ? transcript || "Speak now..."
                : infoMessage || transcript || "Tap mic to start again."}
            </p>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={springTransition}
            className="absolute left-1/2 top-2 z-50 -translate-x-1/2 rounded-full border border-white/[0.1] bg-white/[0.06] px-4 py-1.5 text-xs text-foreground backdrop-blur-xl"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
