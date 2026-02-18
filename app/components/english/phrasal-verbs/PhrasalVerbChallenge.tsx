"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { getDailyChallenge, REGISTER_LABEL, type PhrasalVerbQuestion } from "./PhrasalVerbData";
import { EmailGate } from "@/components/english/EmailGate";
import { cn } from "@/lib/utils";

type Phase = "intro" | "quiz" | "email-gate" | "results";

const RESULT_EMOJI: Record<"correct" | "wrong", string> = {
  correct: "🟢",
  wrong: "🔴",
};

function StreakBar({ results }: { results: (boolean | null)[] }) {
  return (
    <div className="flex gap-1.5 items-center justify-center">
      {results.map((r, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: i * 0.06, type: "spring", stiffness: 300 }}
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold border",
            r === true
              ? "bg-emerald-50 border-emerald-300 text-emerald-600"
              : r === false
              ? "bg-red-50 border-red-300 text-red-600"
              : "bg-gray-50 border-gray-200 text-gray-300"
          )}
        >
          {r === true ? "✓" : r === false ? "✗" : "·"}
        </motion.div>
      ))}
    </div>
  );
}

function QuizCard({
  question,
  qIndex,
  total,
  onAnswer,
}: {
  question: PhrasalVerbQuestion;
  qIndex: number;
  total: number;
  onAnswer: (correct: boolean) => void;
}) {
  const [selected, setSelected] = React.useState<number | null>(null);
  const [revealed, setRevealed] = React.useState(false);

  function handleSelect(idx: number) {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    // Small delay before continuing
    setTimeout(() => {
      onAnswer(idx === question.correct);
    }, 1400);
  }

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.22 }}
      className="flex flex-col gap-4"
    >
      {/* Register badge */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground/40 bg-black/5 px-2.5 py-1 rounded-full">
          {REGISTER_LABEL[question.register]}
        </span>
        <span className="text-xs text-foreground/40">
          {qIndex + 1} / {total}
        </span>
      </div>

      {/* Sentence gap */}
      <div className="bg-white rounded-2xl border border-black/8 p-5 shadow-soft">
        <p className="text-sm text-foreground/50 mb-2 font-medium">
          Choose the correct phrasal verb:
        </p>
        <p className="text-lg font-semibold text-foreground leading-snug">
          {question.sentence.replace("___", "________")}
        </p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-2.5">
        {question.options.map((opt, idx) => {
          const isCorrect = idx === question.correct;
          const isSelected = idx === selected;
          let style = "bg-white border-black/10 hover:bg-gray-50 text-foreground";
          if (revealed) {
            if (isCorrect) {
              style = "bg-emerald-50 border-emerald-400 text-emerald-800";
            } else if (isSelected && !isCorrect) {
              style = "bg-red-50 border-red-400 text-red-800";
            } else {
              style = "bg-white/40 border-black/6 text-foreground/30";
            }
          }
          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={revealed}
              className={cn(
                "px-3 py-3 rounded-xl border font-semibold text-sm transition-all duration-200 text-left",
                style,
                !revealed && "active:scale-[0.97] cursor-pointer"
              )}
            >
              {opt}
              {revealed && isCorrect && " ✓"}
              {revealed && isSelected && !isCorrect && " ✗"}
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="overflow-hidden"
          >
            <div className="bg-blue-50 border border-blue-200/60 rounded-xl p-4 flex flex-col gap-2">
              <p className="text-sm font-semibold text-blue-900">
                📖 {question.verb}
              </p>
              <p className="text-sm text-blue-800">{question.meaning}</p>
              {question.tip && (
                <p className="text-xs text-blue-600/80 border-t border-blue-200/60 pt-2">
                  💡 {question.tip}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ResultsView({
  results,
  questions,
  onShare,
  onRestart,
}: {
  results: boolean[];
  questions: PhrasalVerbQuestion[];
  onShare: () => void;
  onRestart: () => void;
}) {
  const correct = results.filter(Boolean).length;
  const total = results.length;
  const pct = Math.round((correct / total) * 100);

  const medal =
    pct === 100 ? "🏆" : pct >= 80 ? "🥇" : pct >= 60 ? "🥈" : pct >= 40 ? "🥉" : "📚";

  const message =
    pct === 100
      ? "Perfect! You're a phrasal verb master!"
      : pct >= 80
      ? "Excellent! You really know your phrasal verbs."
      : pct >= 60
      ? "Good work! A bit more practice and you'll nail it."
      : pct >= 40
      ? "Keep going — phrasal verbs take time. You'll get there!"
      : "Phrasal verbs are tough — don't give up! (See what we did there? 😉)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-5"
    >
      {/* Score */}
      <div className="bg-white rounded-2xl border border-black/8 p-6 text-center shadow-soft">
        <div className="text-5xl mb-3">{medal}</div>
        <div className="text-3xl font-bold text-foreground mb-1">
          {correct} / {total}
        </div>
        <p className="text-sm text-foreground/60">{message}</p>
      </div>

      {/* Emoji grid */}
      <div className="bg-white rounded-2xl border border-black/8 p-4 shadow-soft">
        <p className="text-xs text-foreground/40 text-center mb-3 font-medium uppercase tracking-wider">
          Today&apos;s Result
        </p>
        <div className="flex justify-center gap-2 text-xl">
          {results.map((r, i) => (
            <span key={i}>{r ? RESULT_EMOJI.correct : RESULT_EMOJI.wrong}</span>
          ))}
        </div>
      </div>

      {/* Quick review */}
      <div className="flex flex-col gap-2">
        {questions.map((q, i) => (
          <div
            key={q.id}
            className={cn(
              "rounded-xl border p-3 flex items-start gap-3 text-sm",
              results[i]
                ? "bg-emerald-50/60 border-emerald-200/60"
                : "bg-red-50/60 border-red-200/60"
            )}
          >
            <span className="mt-0.5">{results[i] ? "✅" : "❌"}</span>
            <div className="min-w-0">
              <span className="font-semibold text-foreground">{q.verb}</span>
              <span className="text-foreground/60 ml-2">— {q.meaning}</span>
            </div>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-2.5">
        <Button onClick={onShare} size="lg" className="w-full rounded-xl min-h-[48px]">
          📋 Share Result
        </Button>
        <Button
          onClick={onRestart}
          variant="outline"
          size="lg"
          className="w-full rounded-xl min-h-[48px]"
        >
          🔄 Practice Again
        </Button>
      </div>
    </motion.div>
  );
}

export default function PhrasalVerbChallenge() {
  const [phase, setPhase] = React.useState<Phase>("intro");
  const [questions] = React.useState<PhrasalVerbQuestion[]>(() => getDailyChallenge());
  const [currentQ, setCurrentQ] = React.useState(0);
  const [results, setResults] = React.useState<boolean[]>([]);

  // Check if already played today
  React.useEffect(() => {
    const key = `tl_pv_played_${new Date().toDateString()}`;
    if (localStorage.getItem(key)) {
      // Could restore results — for simplicity, just let them replay
    }
  }, []);

  function handleAnswer(correct: boolean) {
    const next = [...results, correct];
    setResults(next);
    if (currentQ + 1 >= questions.length) {
      // Save played date
      localStorage.setItem(`tl_pv_played_${new Date().toDateString()}`, "1");
      const hasEmail = localStorage.getItem("tl_english_email");
      setPhase(hasEmail ? "results" : "email-gate");
    } else {
      setTimeout(() => setCurrentQ((q) => q + 1), 200);
    }
  }

  function handleEmailSubmit(email: string) {
    localStorage.setItem("tl_english_email", email);
    setPhase("results");
  }

  function handleShare() {
    const correct = results.filter(Boolean).length;
    const emoji = results.map((r) => (r ? "🟢" : "🔴")).join("");
    const text = `🧩 Phrasal Verb Challenge\n${emoji}\n${correct}/${questions.length} correct\n\nPlay today's challenge → tutorlingua.co/english/phrasal-verbs`;
    if (navigator.share) {
      navigator.share({ title: "Phrasal Verb Challenge", text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => alert("Copied!"));
    }
  }

  function handleRestart() {
    setPhase("intro");
    setCurrentQ(0);
    setResults([]);
  }

  if (phase === "intro") {
    const today = new Date().toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-6"
      >
        <div className="text-center">
          <div className="text-5xl mb-3">🧩</div>
          <h1 className="text-3xl font-bold text-foreground mb-1">
            Phrasal Verb Challenge
          </h1>
          <p className="text-foreground/50 text-sm">{today}</p>
        </div>

        <div className="bg-white rounded-2xl border border-black/8 p-5 shadow-soft">
          <ul className="space-y-3">
            {[
              ["🎯", "5 phrasal verbs, new every day"],
              ["📝", "Fill the gap — choose the right verb"],
              ["💡", "Instant explanations after each answer"],
              ["📤", "Share your score like Wordle"],
            ].map(([icon, text]) => (
              <li key={text} className="flex items-center gap-3 text-sm text-foreground/70">
                <span className="text-base">{icon}</span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-4">
          <p className="text-sm text-amber-800">
            <strong>Why phrasal verbs?</strong> They&apos;re the #1 challenge for English
            learners — even at B2/C1 level. Native speakers use them constantly.
          </p>
        </div>

        <Button
          size="lg"
          className="w-full rounded-xl min-h-[52px] text-base"
          onClick={() => setPhase("quiz")}
        >
          Start Today&apos;s Challenge →
        </Button>
      </motion.div>
    );
  }

  if (phase === "quiz") {
    return (
      <div className="flex flex-col gap-5">
        {/* Mini streak */}
        <div className="flex flex-col gap-2">
          <StreakBar results={[...results.map(Boolean), ...Array(questions.length - results.length).fill(null)]} />
        </div>

        <AnimatePresence mode="wait">
          <QuizCard
            key={currentQ}
            question={questions[currentQ]}
            qIndex={currentQ}
            total={questions.length}
            onAnswer={handleAnswer}
          />
        </AnimatePresence>
      </div>
    );
  }

  if (phase === "email-gate") {
    const correct = results.filter(Boolean).length;
    return (
      <EmailGate
        previewContent={
          <div className="text-center py-2">
            <div className="text-2xl mb-1">🧩</div>
            <p className="font-semibold text-foreground">
              {correct}/{questions.length} correct today!
            </p>
            <p className="text-xs text-foreground/50 mt-1">
              {results.map((r) => (r ? "🟢" : "🔴")).join(" ")}
            </p>
          </div>
        }
        benefit="Get 5 new phrasal verbs in your inbox every day — free"
        onSubmit={handleEmailSubmit}
      />
    );
  }

  return (
    <ResultsView
      results={results}
      questions={questions}
      onShare={handleShare}
      onRestart={handleRestart}
    />
  );
}
