"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ContextClozeExercise as ContextClozeExerciseType, RecapUIStrings } from "@/lib/recap/types";
import { DEFAULT_UI_STRINGS } from "@/lib/recap/types";

type ContextClozeExerciseProps = {
  exercise: ContextClozeExerciseType;
  onAnswer: (correct: boolean, userAnswers?: Record<string, string>) => void;
  uiStrings?: RecapUIStrings;
};

function normalize(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function ContextClozeExerciseComponent({
  exercise,
  onAnswer,
  uiStrings,
}: ContextClozeExerciseProps) {
  const ui = { ...DEFAULT_UI_STRINGS, ...uiStrings };
  const blankKeys = Object.keys(exercise.answers).sort(
    (a, b) => Number(a) - Number(b)
  );

  const [inputs, setInputs] = useState<Record<string, string>>(
    Object.fromEntries(blankKeys.map((k) => [k, ""]))
  );
  const [showResult, setShowResult] = useState(false);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [showHints, setShowHints] = useState<Set<string>>(new Set());

  const allFilled = blankKeys.every((k) => inputs[k]?.trim());

  const handleInputChange = useCallback((key: string, value: string) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleCheck = useCallback(() => {
    if (showResult || !allFilled) return;

    const checkResults: Record<string, boolean> = {};
    let allCorrect = true;

    for (const key of blankKeys) {
      const correct =
        normalize(inputs[key]) === normalize(exercise.answers[key]);
      checkResults[key] = correct;
      if (!correct) allCorrect = false;
    }

    setResults(checkResults);
    setShowResult(true);
    onAnswer(allCorrect, inputs);
  }, [inputs, exercise.answers, blankKeys, showResult, allFilled, onAnswer]);

  const toggleHint = useCallback((key: string) => {
    setShowHints((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, []);

  // Render passage with inline blanks
  const renderPassage = () => {
    // Split passage by blank markers {1}, {2}, etc.
    const parts = exercise.passage.split(/\{(\d+)\}/);
    return parts.map((part, i) => {
      // Odd indices are blank numbers
      if (i % 2 === 1) {
        const key = part;
        if (!blankKeys.includes(key)) return <span key={i}>{`{${part}}`}</span>;

        return (
          <span key={i} className="inline-block align-middle mx-1">
            <input
              type="text"
              value={inputs[key] ?? ""}
              onChange={(e) => handleInputChange(key, e.target.value)}
              disabled={showResult}
              placeholder={`(${key})`}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              className={cn(
                "inline-block w-28 rounded-lg border px-2 py-1 text-center text-sm font-medium text-foreground",
                "placeholder:text-muted-foreground/40",
                "focus:outline-none focus:ring-2 focus:ring-primary/50",
                showResult && results[key] === true &&
                  "border-green-500 bg-green-500/10",
                showResult && results[key] === false &&
                  "border-red-500 bg-red-500/10",
                !showResult && "border-primary/30 bg-card"
              )}
            />
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div>
      <p className="mb-4 text-lg font-medium leading-relaxed text-foreground">
        {exercise.question || ui.fillInTheBlanks}
      </p>

      {/* Passage with inline blanks */}
      <div
        className="mb-4 rounded-xl border bg-card p-5 text-base leading-loose text-foreground"
        style={{ borderColor: "rgba(245, 242, 239, 0.08)" }}
      >
        {renderPassage()}
      </div>

      {/* Hints */}
      {!showResult && exercise.hints && (
        <div className="mb-4 flex flex-wrap gap-2">
          {blankKeys.map((key) => {
            const hint = exercise.hints?.[key];
            if (!hint) return null;
            return (
              <button
                key={key}
                onClick={() => toggleHint(key)}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {showHints.has(key) ? (
                  <span>
                    💡 ({key}) {hint}
                  </span>
                ) : (
                  <span>
                    💡 Hint for blank {key}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Check button */}
      {!showResult && (
        <button
          onClick={handleCheck}
          disabled={!allFilled}
          className={cn(
            "mt-2 w-full rounded-xl bg-primary py-3 font-semibold text-white",
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
            Object.values(results).every(Boolean)
              ? "bg-green-500/10 text-green-300"
              : "bg-red-500/10 text-red-300"
          )}
        >
          <p className="mb-1 font-semibold">
            {Object.values(results).every(Boolean)
              ? ui.correct
              : ui.notQuite}
          </p>
          {/* Show incorrect answers */}
          {Object.entries(results)
            .filter(([, correct]) => !correct)
            .map(([key]) => (
              <p key={key} className="mb-1 text-foreground/70">
                Blank {key}: {ui.correctAnswerIs}{" "}
                <span className="font-semibold text-green-400">
                  {exercise.answers[key]}
                </span>
              </p>
            ))}
          <p className="mt-2 text-foreground/70">{exercise.explanation}</p>
        </motion.div>
      )}
    </div>
  );
}
