"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Reveal } from "./motion";
import { cn } from "@/lib/utils";

const QUESTIONS = [
  {
    language: "Spanish",
    flag: "🇪🇸",
    type: "Fill in the blank",
    prompt: "Complete the sentence:",
    sentence: ["Me gustaría", "___", "café, por favor."],
    options: [
      { text: "un", correct: true },
      { text: "una", correct: false },
      { text: "el", correct: false },
      { text: "lo", correct: false },
    ],
    explanation: "\"Café\" is masculine in Spanish, so it takes the indefinite article \"un\", not \"una\".",
  },
  {
    language: "French",
    flag: "🇫🇷",
    type: "Translate",
    prompt: "How would you say this in French?",
    sentence: ["\"I am learning French.\""],
    options: [
      { text: "Je suis apprendre français", correct: false },
      { text: "J'apprends le français", correct: true },
      { text: "Je apprends français", correct: false },
      { text: "J'ai appris le français", correct: false },
    ],
    explanation: "\"J'apprends\" contracts \"je\" + \"apprends\". The article \"le\" is required before language names in French.",
  },
  {
    language: "Japanese",
    flag: "🇯🇵",
    type: "What does this mean?",
    prompt: "Translate to English:",
    sentence: ["「おはようございます」"],
    options: [
      { text: "Good evening", correct: false },
      { text: "Thank you very much", correct: false },
      { text: "Good morning", correct: true },
      { text: "Goodbye", correct: false },
    ],
    explanation: "おはようございます (ohayou gozaimasu) is the polite form of \"good morning\" — used until around noon.",
  },
];

export function PracticeHook() {
  const [questionIndex] = useState(() => Math.floor(Math.random() * QUESTIONS.length));
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  const q = QUESTIONS[questionIndex];
  const isCorrect = selected !== null && q.options[selected].correct;

  function handleSelect(index: number) {
    if (answered) return;
    setSelected(index);
    setAnswered(true);
  }

  return (
    <section className="relative bg-[#3D2E23] py-16 sm:py-20 lg:py-24 overflow-hidden">
      {/* Subtle glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/[0.06] blur-[150px] rounded-full" aria-hidden="true" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white">
              Don't just learn.{" "}
              <span className="text-primary">Practice.</span>
            </h2>
            <p className="mt-6 text-xl text-white/50 max-w-xl mx-auto">
              Try a real exercise. No signup. No tricks.
            </p>
          </div>
        </Reveal>

        {/* Interactive exercise card */}
        <Reveal delay={0.2}>
          <div className="mx-auto max-w-xl">
            <div className="rounded-2xl bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] p-8 sm:p-10">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{q.flag}</span>
                  <div>
                    <p className="text-sm font-medium text-white/40">{q.type}</p>
                    <p className="text-sm text-white/60">{q.language}</p>
                  </div>
                </div>
              </div>

              {/* Question */}
              <p className="text-lg text-white/70 mb-3">{q.prompt}</p>
              <p className="text-2xl sm:text-3xl font-semibold text-white mb-10 leading-snug">
                {q.sentence.join(" ")}
              </p>

              {/* Options */}
              <div className="grid grid-cols-2 gap-3">
                {q.options.map((option, index) => {
                  const isSelected = selected === index;
                  const optionCorrect = option.correct;

                  return (
                    <motion.button
                      key={index}
                      onClick={() => handleSelect(index)}
                      disabled={answered}
                      whileTap={!answered ? { scale: 0.97 } : undefined}
                      animate={
                        answered && isSelected && !optionCorrect
                          ? { x: [0, -6, 6, -4, 4, 0] }
                          : {}
                      }
                      transition={{ duration: 0.4 }}
                      className={cn(
                        "rounded-xl px-4 py-4 text-center text-base font-medium transition-colors duration-200",
                        !answered && "bg-white/[0.08] text-white/80 hover:bg-white/[0.14] cursor-pointer",
                        answered && isSelected && optionCorrect && "bg-emerald-500/20 text-emerald-300 ring-2 ring-emerald-500/40",
                        answered && isSelected && !optionCorrect && "bg-red-500/20 text-red-300 ring-2 ring-red-500/40",
                        answered && !isSelected && optionCorrect && "bg-emerald-500/10 text-emerald-400/60 ring-1 ring-emerald-500/20",
                        answered && !isSelected && !optionCorrect && "bg-white/[0.03] text-white/20",
                      )}
                    >
                      {option.text}
                    </motion.button>
                  );
                })}
              </div>

              {/* Result */}
              <AnimatePresence>
                {answered && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 16 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-8 space-y-5"
                  >
                    <div className={cn(
                      "rounded-xl px-5 py-4",
                      isCorrect ? "bg-emerald-500/10" : "bg-amber-500/10"
                    )}>
                      <p className={cn(
                        "font-semibold mb-1",
                        isCorrect ? "text-emerald-300" : "text-amber-300"
                      )}>
                        {isCorrect ? "Correct." : "Not quite."}
                      </p>
                      <p className="text-sm text-white/50">{q.explanation}</p>
                    </div>

                    <Link
                      href="/practice"
                      className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary px-6 py-4 text-base font-semibold text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20"
                    >
                      Keep going
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
