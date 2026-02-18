"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ToolLanguageBar } from "@/components/tools/LanguageSelector";
import { EmailGate } from "@/components/tools/EmailGate";
import { useToolLanguage } from "@/lib/tools/useToolLanguage";
import { getDailyChallenge, CHALLENGE_META, type ChallengeQuestion } from "./ChallengeData";
import { cn } from "@/lib/utils";

type Phase = "intro" | "quiz" | "email-gate" | "results";

function ScoreRow({ results }: { results: (boolean | null)[] }) {
  return (
    <div className="flex gap-2 items-center justify-center">
      {results.map((r, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: i * 0.06, type: "spring", stiffness: 280 }}
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center text-base font-bold border",
            r === true ? "bg-emerald-50 border-emerald-300 text-emerald-600"
            : r === false ? "bg-red-50 border-red-300 text-red-600"
            : "bg-gray-50 border-gray-200 text-gray-300",
          )}
        >
          {r === true ? "✓" : r === false ? "✗" : "·"}
        </motion.div>
      ))}
    </div>
  );
}

function QuestionCard({
  question,
  qIndex,
  total,
  tipLabel,
  onAnswer,
}: {
  question: ChallengeQuestion;
  qIndex: number;
  total: number;
  tipLabel: string;
  onAnswer: (correct: boolean) => void;
}) {
  const [selected, setSelected] = React.useState<number | null>(null);
  const [revealed, setRevealed] = React.useState(false);

  function handleSelect(idx: number) {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    setTimeout(() => onAnswer(idx === question.correct), 1500);
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
      <div className="flex items-center justify-between text-xs text-foreground/40">
        <span className="font-medium bg-black/5 px-2.5 py-1 rounded-full">
          {question.word}
        </span>
        <span>{qIndex + 1} / {total}</span>
      </div>

      <div className="bg-white rounded-2xl border border-black/8 p-5 shadow-soft">
        <p className="text-lg font-semibold text-foreground leading-snug">
          {question.prompt}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {question.options.map((opt, idx) => {
          const isCorrect = idx === question.correct;
          const isSelected = idx === selected;
          let style = "bg-white border-black/10 hover:bg-gray-50 text-foreground";
          if (revealed) {
            if (isCorrect) style = "bg-emerald-50 border-emerald-400 text-emerald-800";
            else if (isSelected) style = "bg-red-50 border-red-400 text-red-800";
            else style = "bg-white/40 border-black/6 text-foreground/30";
          }
          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={revealed}
              className={cn(
                "px-3 py-3 rounded-xl border font-semibold text-sm transition-all duration-200 text-left leading-snug",
                style,
                !revealed && "active:scale-[0.97] cursor-pointer",
              )}
            >
              {opt}
              {revealed && isCorrect && " ✓"}
              {revealed && isSelected && !isCorrect && " ✗"}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="overflow-hidden"
          >
            <div className="bg-blue-50 border border-blue-200/60 rounded-xl p-4 flex flex-col gap-2">
              <p className="text-sm font-semibold text-blue-900">📖 {question.word}</p>
              <p className="text-sm text-blue-800">{question.explanation}</p>
              {question.tip && (
                <p className="text-xs text-blue-600/80 border-t border-blue-200/60 pt-2">
                  {tipLabel} {question.tip}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function DailyChallenge() {
  const [lang, setLang] = useToolLanguage();
  const meta = CHALLENGE_META[lang];
  const [phase, setPhase] = React.useState<Phase>("intro");
  const [questions, setQuestions] = React.useState<ChallengeQuestion[]>(() => getDailyChallenge(lang));
  const [currentQ, setCurrentQ] = React.useState(0);
  const [results, setResults] = React.useState<boolean[]>([]);

  // Reload questions when language changes
  React.useEffect(() => {
    setQuestions(getDailyChallenge(lang));
    if (phase !== "intro") {
      setPhase("intro");
      setCurrentQ(0);
      setResults([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  function handleAnswer(correct: boolean) {
    const next = [...results, correct];
    setResults(next);
    if (currentQ + 1 >= questions.length) {
      localStorage.setItem(`tl_challenge_${lang}_${new Date().toDateString()}`, "1");
      const hasEmail = localStorage.getItem("tl_tools_email");
      setPhase(hasEmail ? "results" : "email-gate");
    } else {
      setTimeout(() => setCurrentQ((q) => q + 1), 220);
    }
  }

  function handleEmailSubmit(email: string) {
    localStorage.setItem("tl_tools_email", email);
    setPhase("results");
  }

  function handleShare() {
    const correct = results.filter(Boolean).length;
    const emoji = results.map((r) => (r ? "🟢" : "🔴")).join("");
    const text = `${meta.title}\n${emoji}\n${correct}/${questions.length} correct · ${new Date().toLocaleDateString()}\n\nPlay today's challenge → tutorlingua.co/tools/daily-challenge?lang=${lang}`;
    if (navigator.share) {
      navigator.share({ title: meta.title, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => alert("Result copied to clipboard."));
    }
  }

  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  // ── INTRO ──
  if (phase === "intro") {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5">
        <ToolLanguageBar lang={lang} onChangeLang={setLang} />

        <div className="text-center">
          <div className="text-5xl mb-3">🧩</div>
          <h1 className="text-2xl font-bold text-foreground mb-1">{meta.title}</h1>
          <p className="text-sm font-medium text-primary/80 mb-1">{meta.subtitle}</p>
          <p className="text-foreground/40 text-sm">{today}</p>
        </div>

        <div className="bg-white rounded-2xl border border-black/8 p-5 shadow-soft">
          <p className="text-sm text-foreground/70 leading-relaxed mb-4">{meta.intro}</p>
          <ul className="space-y-2.5">
            {[
              ["🎯", "5 targeted traps learners miss in real conversations"],
              ["💡", "Instant corrections with context after every answer"],
              ["📤", "Share your score card and challenge a friend"],
            ].map(([icon, text]) => (
              <li key={String(text)} className="flex items-center gap-3 text-sm text-foreground/70">
                <span>{icon}</span>{text}
              </li>
            ))}
          </ul>
        </div>

        <Button size="lg" className="w-full rounded-xl min-h-[52px] text-base" onClick={() => setPhase("quiz")}>
          Start Today&apos;s Challenge →
        </Button>
      </motion.div>
    );
  }

  // ── QUIZ ──
  if (phase === "quiz") {
    return (
      <div className="flex flex-col gap-5">
        <ScoreRow results={[...results.map(Boolean), ...Array(questions.length - results.length).fill(null)]} />
        <AnimatePresence mode="wait">
          <QuestionCard
            key={`${lang}-${currentQ}`}
            question={questions[currentQ]}
            qIndex={currentQ}
            total={questions.length}
            tipLabel={meta.tipLabel}
            onAnswer={handleAnswer}
          />
        </AnimatePresence>
      </div>
    );
  }

  // ── EMAIL GATE ──
  if (phase === "email-gate") {
    const correct = results.filter(Boolean).length;
    return (
      <EmailGate
        lang={lang}
        tool="daily-challenge"
        previewContent={
          <div className="text-center py-2">
            <div className="text-2xl mb-1">🧩</div>
            <p className="font-semibold text-foreground">{correct}/{questions.length} correct!</p>
            <p className="text-xs text-foreground/50 mt-1">{results.map((r) => (r ? "🟢" : "🔴")).join(" ")}</p>
          </div>
        }
        onSubmit={handleEmailSubmit}
      />
    );
  }

  // ── RESULTS ──
  const correct = results.filter(Boolean).length;
  const pct = Math.round((correct / questions.length) * 100);
  const medal = pct === 100 ? "🏆" : pct >= 80 ? "🥇" : pct >= 60 ? "🥈" : pct >= 40 ? "🥉" : "📚";
  const message =
    pct === 100
      ? "Perfect score. You're reading nuance like a native."
      : pct >= 80
        ? "Strong accuracy. Keep this streak going."
        : pct >= 60
          ? "Solid base. One more round and you'll level up fast."
          : "Great practice set. Review the notes and run it again.";

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5">
      <div className="bg-white rounded-2xl border border-black/8 p-6 text-center shadow-soft">
        <div className="text-4xl mb-3">{medal}</div>
        <div className="text-3xl font-bold text-foreground mb-1">{correct} / {questions.length}</div>
        <p className="text-sm text-foreground/60">{message}</p>
      </div>

      <div className="bg-white rounded-2xl border border-black/8 p-4 shadow-soft">
        <p className="text-xs text-foreground/40 text-center mb-3 font-medium uppercase tracking-wider">Today&apos;s Result</p>
        <div className="flex justify-center gap-2 text-xl">
          {results.map((r, i) => <span key={i}>{r ? "🟢" : "🔴"}</span>)}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {questions.map((q, i) => (
          <div key={q.id} className={cn("rounded-xl border p-3 flex items-start gap-3 text-sm",
            results[i] ? "bg-emerald-50/60 border-emerald-200/60" : "bg-red-50/60 border-red-200/60")}>
            <span className="mt-0.5">{results[i] ? "✅" : "❌"}</span>
            <div className="min-w-0">
              <span className="font-semibold text-foreground">{q.word}</span>
              <span className="text-foreground/60 ml-2 text-xs">— {q.explanation.split("—")[1]?.trim() ?? q.explanation.slice(0, 60)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        <Button onClick={handleShare} size="lg" className="w-full rounded-xl min-h-[48px]">📋 Share Result</Button>
        <Button onClick={() => { setPhase("intro"); setCurrentQ(0); setResults([]); }} variant="outline" size="lg" className="w-full rounded-xl min-h-[48px]">🔄 Practice Again</Button>
      </div>
    </motion.div>
  );
}
