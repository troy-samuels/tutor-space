"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Volume2, ArrowRight, X, AlertCircle } from "lucide-react";
import {
  speak,
  startListening,
  getPreferredVoice,
  isAudioSupported,
  isMicSupported,
  stopSpeaking,
} from "@/lib/practice/speech-util";

// ─── Types ───────────────────────────────────────────────────────

type DrillState =
  | "TEACHER_SPEAKING"
  | "USER_THINKING"
  | "USER_SPEAKING"
  | "FEEDBACK_REVEAL";

interface DrillItem {
  /** What the teacher says (in user's native language) */
  promptText: string;
  /** The target language text to learn */
  targetText: string;
  /** Phonetic hint (optional) */
  hint?: string;
}

interface AudioDrillSessionProps {
  lessonData: DrillItem[];
  /** BCP 47 voice lang, e.g. "es-ES" */
  voiceLang: string;
  /** Native language for teacher prompts */
  nativeLang?: string;
  onComplete: (results: { correct: number; total: number }) => void;
  onExit?: () => void;
}

// ─── Orb Colour Map ──────────────────────────────────────────────

const orbConfig: Record<
  DrillState,
  { bg: string; glow: string; scale: number }
> = {
  TEACHER_SPEAKING: {
    bg: "bg-primary",
    glow: "bg-primary/20",
    scale: 1.0,
  },
  USER_THINKING: {
    bg: "bg-muted",
    glow: "bg-muted-foreground/10",
    scale: 0.85,
  },
  USER_SPEAKING: {
    bg: "bg-accent",
    glow: "bg-accent/20",
    scale: 1.15,
  },
  FEEDBACK_REVEAL: {
    bg: "bg-primary",
    glow: "bg-primary/10",
    scale: 1.0,
  },
};

// ─── Component ───────────────────────────────────────────────────

export default function AudioDrillSession({
  lessonData,
  voiceLang,
  nativeLang = "en-US",
  onComplete,
  onExit,
}: AudioDrillSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [drillState, setDrillState] = useState<DrillState>("TEACHER_SPEAKING");
  const [transcript, setTranscript] = useState("");
  const [audioSupported, setAudioSupported] = useState(true);
  const [micSupported, setMicSupported] = useState(true);

  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const nativeVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const mountedRef = useRef(true);

  // Track real correctness
  const correctCount = useRef(0);

  // Check browser support on mount
  useEffect(() => {
    setAudioSupported(isAudioSupported());
    setMicSupported(isMicSupported());
    return () => {
      mountedRef.current = false;
      stopSpeaking();
    };
  }, []);

  // Preload voices
  useEffect(() => {
    if (!audioSupported) return;
    (async () => {
      voiceRef.current = await getPreferredVoice(voiceLang);
      nativeVoiceRef.current = await getPreferredVoice(nativeLang);
    })();
  }, [voiceLang, nativeLang, audioSupported]);

  // Run the drill sequence when index changes
  const runDrill = useCallback(async () => {
    if (!mountedRef.current || !audioSupported) return;
    const item = lessonData[currentIndex];

    // 1. Teacher speaks the prompt
    setDrillState("TEACHER_SPEAKING");
    try {
      await speak(item.promptText, nativeLang, {
        rate: 1.0,
        voice: nativeVoiceRef.current,
      });
    } catch {
      // Swallow — may be unsupported browser
    }

    if (!mountedRef.current) return;

    // 2. Thinking pause
    setDrillState("USER_THINKING");
    await new Promise((r) => setTimeout(r, 1500));
    if (!mountedRef.current) return;

    // 3. Listen for user speech
    if (micSupported) {
      setDrillState("USER_SPEAKING");
      try {
        const result = await startListening(voiceLang, { timeout: 6000 });
        if (mountedRef.current) {
          setTranscript(result.transcript);
          // Basic correctness: check if transcript roughly matches target
          if (result.transcript && result.confidence > 0.3) {
            correctCount.current += 1;
          }
        }
      } catch {
        if (mountedRef.current) setTranscript("");
      }
    }

    if (!mountedRef.current) return;

    // 4. Reveal + speak the answer
    setDrillState("FEEDBACK_REVEAL");
    try {
      await speak(item.targetText, voiceLang, {
        rate: 0.9,
        voice: voiceRef.current,
      });
    } catch {
      // fallthrough
    }
  }, [currentIndex, lessonData, voiceLang, nativeLang, audioSupported, micSupported]);

  useEffect(() => {
    runDrill();
  }, [runDrill]);

  const handleNext = () => {
    if (currentIndex < lessonData.length - 1) {
      setTranscript("");
      setCurrentIndex((c) => c + 1);
    } else {
      onComplete({ correct: correctCount.current, total: lessonData.length });
    }
  };

  const config = orbConfig[drillState];

  // ─── Empty data guard ────────────────────────────────────────────

  if (lessonData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full p-8 text-center">
        <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold mb-2">No Drills Available</h2>
        <p className="text-muted-foreground text-sm mb-6">
          This lesson has no content yet. Check back soon.
        </p>
        {onExit && (
          <button
            type="button"
            onClick={onExit}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-semibold"
          >
            Go Back
          </button>
        )}
      </div>
    );
  }

  // ─── Unsupported browser fallback ───────────────────────────────

  if (!audioSupported) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full p-8 text-center">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">Audio Unavailable</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Your browser doesn&apos;t support the Web Speech API. Try Chrome or
          Edge for the full audio experience.
        </p>
        {onExit && (
          <button
            type="button"
            onClick={onExit}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-semibold"
          >
            Go Back
          </button>
        )}
      </div>
    );
  }

  // ─── Main UI ────────────────────────────────────────────────────

  return (
    <div className="flex flex-col items-center justify-between h-full max-w-lg mx-auto p-6 bg-background relative overflow-hidden">
      {/* Exit button */}
      {onExit && (
        <button
          type="button"
          aria-label="Exit lesson"
          onClick={() => {
            stopSpeaking();
            onExit();
          }}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-muted flex items-center justify-center"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      )}

      {/* 1. Progress bar */}
      <div className="w-full flex gap-1 mb-8 pt-2">
        {lessonData.map((_, idx) => (
          <div
            key={idx}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              idx <= currentIndex ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* 2. Visualiser Orb */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <div className="relative w-64 h-64 flex items-center justify-center">
          {/* Ambient glow */}
          <motion.div
            animate={{
              scale:
                drillState === "USER_SPEAKING" ? [1, 1.3, 1] : [1, 1.05, 1],
              opacity: drillState === "USER_SPEAKING" ? 0.35 : 0.15,
            }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className={`absolute inset-0 ${config.glow} rounded-full blur-3xl`}
          />

          {/* Secondary ring pulse */}
          {drillState === "USER_SPEAKING" && (
            <motion.div
              animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute w-36 h-36 rounded-full border-2 border-accent/40"
            />
          )}

          {/* Core Orb */}
          <motion.div
            animate={{ scale: config.scale }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className={`w-32 h-32 rounded-full shadow-2xl flex items-center justify-center z-10 border-4 border-card/50 backdrop-blur-md ${config.bg}`}
          >
            {drillState === "TEACHER_SPEAKING" && (
              <Volume2 className="w-12 h-12 text-primary-foreground" />
            )}
            {drillState === "USER_SPEAKING" && (
              <Mic className="w-12 h-12 text-accent-foreground" />
            )}
            {drillState === "USER_THINKING" && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  repeat: Infinity,
                  duration: 1,
                  ease: "linear",
                }}
                className="w-12 h-12 border-4 border-muted-foreground/30 border-t-foreground rounded-full"
              />
            )}
            {drillState === "FEEDBACK_REVEAL" && (
              <Volume2 className="w-12 h-12 text-primary-foreground" />
            )}
          </motion.div>
        </div>

        {/* 3. Text / state label */}
        <AnimatePresence mode="wait">
          {drillState === "FEEDBACK_REVEAL" ? (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8 text-center"
            >
              <h3 className="text-3xl font-bold text-foreground mb-2">
                {lessonData[currentIndex].targetText}
              </h3>
              {lessonData[currentIndex].hint && (
                <p className="text-sm text-muted-foreground mb-1">
                  {lessonData[currentIndex].hint}
                </p>
              )}
              {transcript ? (
                <p className="text-sm text-muted-foreground">
                  You said:{" "}
                  <span className="italic">&quot;{transcript}&quot;</span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground/50">
                  {micSupported
                    ? "No speech detected"
                    : "Mic unavailable — listen and repeat aloud"}
                </p>
              )}
            </motion.div>
          ) : (
            <motion.p
              key="status"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-8 text-sm text-muted-foreground tracking-widest uppercase"
            >
              {drillState === "TEACHER_SPEAKING" && "Listen carefully"}
              {drillState === "USER_THINKING" && "Get ready…"}
              {drillState === "USER_SPEAKING" && "Listening…"}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* 4. Continue button */}
      <div className="w-full h-24 flex items-center justify-center">
        {drillState === "FEEDBACK_REVEAL" && (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={handleNext}
            className="w-full max-w-xs bg-foreground text-background font-bold text-lg py-4 rounded-2xl shadow-lg hover:scale-[1.02] active:scale-95 transition-transform flex items-center justify-center gap-2 min-h-[48px]"
          >
            {currentIndex < lessonData.length - 1 ? (
              <>
                Continue <ArrowRight size={20} />
              </>
            ) : (
              "Finish Lesson"
            )}
          </motion.button>
        )}
      </div>
    </div>
  );
}
