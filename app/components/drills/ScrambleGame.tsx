"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type ScrambleWord = { id: string; text: string };

export function ScrambleGame({
  data,
  onChange,
}: {
  data: { words: string[]; solution?: string[] };
  onChange?: (answer: string[]) => void;
}) {
  const wordObjects = useMemo<ScrambleWord[]>(() => {
    return data.words.map((text, idx) => ({
      id: `${text}-${idx}`,
      text,
    }));
  }, [data.words]);

  const [answerWords, setAnswerWords] = useState<ScrambleWord[]>([]);
  const [bankWords, setBankWords] = useState<ScrambleWord[]>([]);

  useEffect(() => {
    const shuffled = [...wordObjects].sort(() => Math.random() - 0.5);
    setAnswerWords([]);
    setBankWords(shuffled);
    onChange?.([]);
  }, [wordObjects, onChange]);

  const handleAdd = (word: ScrambleWord) => {
    const nextAnswer = [...answerWords, word];
    const nextBank = bankWords.filter((w) => w.id !== word.id);
    setAnswerWords(nextAnswer);
    setBankWords(nextBank);
    onChange?.(nextAnswer.map((w) => w.text));
  };

  const handleRemove = (word: ScrambleWord) => {
    const nextAnswer = answerWords.filter((w) => w.id !== word.id);
    const nextBank = [...bankWords, word];
    setAnswerWords(nextAnswer);
    setBankWords(nextBank);
    onChange?.(nextAnswer.map((w) => w.text));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-muted/60 min-h-[110px] p-3">
        <p className="text-sm text-muted-foreground mb-2">Answer Zone</p>
        <div className="flex flex-wrap gap-2">
          <AnimatePresence initial={false}>
            {answerWords.map((word) => (
              <motion.button
                key={word.id}
                layoutId={word.id}
                onClick={() => handleRemove(word)}
                className={cn(
                  "rounded-full bg-emerald-50 text-emerald-800 px-5 py-3 text-lg font-semibold",
                  "shadow-sm hover:shadow touch-action-manipulation"
                )}
                whileTap={{ scale: 0.97 }}
              >
                {word.text}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-background/80 p-3">
        <p className="text-sm text-muted-foreground mb-2">Word Bank</p>
        <div className="flex flex-wrap gap-2">
          <AnimatePresence initial={false}>
            {bankWords.map((word) => (
              <motion.button
                key={word.id}
                layoutId={word.id}
                onClick={() => handleAdd(word)}
                className={cn(
                  "rounded-full bg-slate-900 text-white px-5 py-3 text-lg font-semibold",
                  "shadow-md hover:shadow-lg touch-action-manipulation"
                )}
                whileTap={{ scale: 0.97 }}
              >
                {word.text}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
