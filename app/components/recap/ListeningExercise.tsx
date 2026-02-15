"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ListeningExercise as ListeningExerciseType, RecapUIStrings } from "@/lib/recap/types";
import { DEFAULT_UI_STRINGS } from "@/lib/recap/types";

type ListeningExerciseProps = {
  exercise: ListeningExerciseType;
  onAnswer: (correct: boolean, userAnswer?: string) => void;
  uiStrings?: RecapUIStrings;
};

function normalize(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,!?;:'"¿¡]/g, "");
}

export default function ListeningExerciseComponent({
  exercise,
  onAnswer,
  uiStrings,
}: ListeningExerciseProps) {
  const ui = { ...DEFAULT_UI_STRINGS, ...uiStrings };
  const [input, setInput] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const speak = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(exercise.spokenText);
    utterance.lang = exercise.speechLang;
    utterance.rate = playCount === 0 ? 0.85 : 0.7; // Slower on replay
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
    setPlayCount((c) => c + 1);
  }, [exercise.spokenText, exercise.speechLang, playCount]);

  // Auto-play on mount
  useEffect(() => {
    const timer = setTimeout(speak, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleCheck = useCallback(() => {
    if (showResult || !input.trim()) return;
    const correct = normalize(input) === normalize(exercise.answer);
    setIsCorrect(correct);
    setShowResult(true);
    onAnswer(correct, input);
  }, [input, exercise.answer, showResult, onAnswer]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleCheck();
      }
    },
    [handleCheck]
  );

  return (
    <div>
      <p className="mb-6 text-lg font-medium leading-relaxed text-foreground">
        {exercise.question || ui.listenAndType}
      </p>

      {/* Play button */}
      <div className="mb-6 flex items-center justify-center gap-3">
        <motion.button
          onClick={speak}
          disabled={isPlaying}
          className={cn(
            "flex items-center gap-2 rounded-xl border bg-card px-6 py-3",
            "text-foreground transition-all",
            isPlaying
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50"
          )}
          whileTap={!isPlaying ? { scale: 0.97 } : undefined}
        >
          <motion.span
            className="text-2xl"
            animate={isPlaying ? { scale: [1, 1.2, 1] } : {}}
            transition={isPlaying ? { repeat: Infinity, duration: 0.8 } : {}}
          >
            🔊
          </motion.span>
          <span className="text-sm font-medium">
            {playCount > 0 ? ui.playAgain : ui.listen}
          </span>
        </motion.button>
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={showResult}
        placeholder={ui.typeYourAnswer}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className={cn(
          "w-full rounded-xl border bg-card p-4 text-center text-lg text-foreground",
          "placeholder:text-muted-foreground/40",
          "focus:outline-none focus:ring-2 focus:ring-primary/50",
          showResult && isCorrect && "border-green-500 bg-green-500/5",
          showResult && !isCorrect && "border-red-500 bg-red-500/5",
          !showResult && "border-border"
        )}
      />

      {/* Hint */}
      {!showResult && exercise.hint && (
        <button
          onClick={() => setShowHint(true)}
          className="mt-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {showHint ? (
            <span>💡 {exercise.hint}</span>
          ) : (
            <span>{ui.showHint}</span>
          )}
        </button>
      )}

      {/* Check button */}
      {!showResult && (
        <button
          onClick={handleCheck}
          disabled={!input.trim()}
          className={cn(
            "mt-6 w-full rounded-xl bg-primary py-3 font-semibold text-white",
            "transition-all hover:brightness-110 active:scale-[0.98]",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          {ui.check}
        </button>
      )}

      {/* Result */}
      {showResult && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "mt-4 rounded-xl p-4 text-sm leading-relaxed",
            isCorrect
              ? "bg-green-500/10 text-green-300"
              : "bg-red-500/10 text-red-300"
          )}
        >
          <p className="mb-1 font-semibold">
            {isCorrect ? ui.correct : ui.notQuite}
          </p>
          {!isCorrect && (
            <p className="mb-2 text-foreground/70">
              {ui.correctAnswerIs}{" "}
              <span className="font-semibold text-green-400">
                {exercise.answer}
              </span>
            </p>
          )}
          <p className="text-foreground/70">{exercise.explanation}</p>
        </motion.div>
      )}
    </div>
  );
}
