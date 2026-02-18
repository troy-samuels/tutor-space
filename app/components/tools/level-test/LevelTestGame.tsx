"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ToolLanguageBar } from "@/components/tools/LanguageSelector";
import { EmailGate } from "@/components/tools/EmailGate";
import { useToolLanguage } from "@/lib/tools/useToolLanguage";
import {
  getQuestions,
  scoreToLevel,
  LEVEL_META,
  LEVEL_TEST_META,
  type CEFRLevel,
  type LevelQuestion,
} from "./LevelTestData";
import { cn } from "@/lib/utils";

type Phase = "intro" | "quiz" | "email-gate" | "results";

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="w-full h-1.5 bg-black/8 rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ background: "var(--primary)" }}
        initial={{ width: 0 }}
        animate={{ width: `${(current / total) * 100}%` }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
    </div>
  );
}

function CEFRLadder({ level }: { level: string }) {
  const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];
  return (
    <div className="flex gap-1 items-center justify-center flex-wrap">
      {levels.map((l) => (
        <span
          key={l}
          className={cn(
            "text-xs font-bold px-2 py-0.5 rounded-full border transition-all",
            l === level
              ? "bg-primary text-white border-primary scale-110"
              : "bg-white/60 text-foreground/40 border-black/10",
          )}
        >
          {l}
        </span>
      ))}
    </div>
  );
}

export default function LevelTestGame() {
  const [lang, setLang] = useToolLanguage();
  const [phase, setPhase] = React.useState<Phase>("intro");
  const questions = React.useMemo(() => getQuestions(lang), [lang]);
  const TOTAL = questions.length;
  const meta = LEVEL_TEST_META[lang];

  const [currentQ, setCurrentQ] = React.useState(0);
  const [answers, setAnswers] = React.useState<(boolean | null)[]>(Array(TOTAL).fill(null));
  const [selected, setSelected] = React.useState<number | null>(null);
  const [showFeedback, setShowFeedback] = React.useState(false);
  const [level, setLevel] = React.useState<CEFRLevel>("A1");

  const question: LevelQuestion = questions[currentQ];
  const correct = answers.filter(Boolean).length;

  // Reset quiz state when language changes
  React.useEffect(() => {
    if (phase !== "intro") {
      setPhase("intro");
      setCurrentQ(0);
      setAnswers(Array(TOTAL).fill(null));
      setSelected(null);
      setShowFeedback(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  function handleSelect(idx: number) {
    if (showFeedback) return;
    setSelected(idx);
    setShowFeedback(true);
    const next = [...answers];
    next[currentQ] = idx === question.correct;
    setAnswers(next);
  }

  function handleNext() {
    setSelected(null);
    setShowFeedback(false);
    if (currentQ + 1 >= TOTAL) {
      const finalCorrect = answers.filter(Boolean).length;
      const lvl = scoreToLevel(finalCorrect, TOTAL);
      setLevel(lvl);
      const hasEmail = localStorage.getItem("tl_tools_email");
      setPhase(hasEmail ? "results" : "email-gate");
    } else {
      setCurrentQ((q) => q + 1);
    }
  }

  function handleEmailSubmit(email: string) {
    localStorage.setItem("tl_tools_email", email);
    setPhase("results");
  }

  function handleShare() {
    const lvlMeta = LEVEL_META[level];
    const emoji = answers.map((a) => (a ? "🟢" : "🔴")).join("");
    const langNames: Record<string, string> = { en: "English", es: "Spanish", fr: "French", de: "German" };
    const text = `🎓 My ${langNames[lang]} Level: ${lvlMeta.label}\nScore: ${correct}/${TOTAL}\n${emoji}\n\nTake the free test → tutorlingua.co/tools/level-test?lang=${lang}`;
    if (navigator.share) {
      navigator.share({ title: `My ${langNames[lang]} Level`, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => alert("Copied to clipboard!"));
    }
  }

  function handleRestart() {
    setPhase("intro");
    setCurrentQ(0);
    setAnswers(Array(TOTAL).fill(null));
    setSelected(null);
    setShowFeedback(false);
  }

  // ── INTRO ──
  if (phase === "intro") {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5">
        <ToolLanguageBar lang={lang} onChangeLang={setLang} />

        <div className="text-center">
          <div className="text-5xl mb-3">🎯</div>
          <h1 className="text-2xl font-bold text-foreground mb-1">{meta.title}</h1>
          <p className="text-foreground/50 text-sm">{meta.intro}</p>
        </div>

        <div className="bg-white rounded-2xl border border-black/8 p-5 shadow-soft">
          <ul className="space-y-3">
            {[["📝","Grammar, vocabulary & natural usage"],["📊","Mapped to the CEFR standard used worldwide"],["🔒","Free — no login required"],["📤","Share your result like Wordle"]].map(([icon,text]) => (
              <li key={String(text)} className="flex items-center gap-3 text-sm text-foreground/70">
                <span>{icon}</span>{text}
              </li>
            ))}
          </ul>
        </div>

        <Button size="lg" className="w-full rounded-xl min-h-[52px] text-base" onClick={() => setPhase("quiz")}>
          Start the Test →
        </Button>
        <p className="text-xs text-center text-foreground/40">
          Results based on the Common European Framework of Reference (CEFR)
        </p>
      </motion.div>
    );
  }

  // ── QUIZ ──
  if (phase === "quiz") {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-foreground/50">
            <span>Question {currentQ + 1} of {TOTAL}</span>
            <span className="font-medium" style={{ color: "var(--primary)" }}>{question.level}</span>
          </div>
          <ProgressBar current={currentQ + 1} total={TOTAL} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={`${lang}-${currentQ}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-black/8 p-5 shadow-soft min-h-[80px] flex items-center">
              <p className="text-lg font-semibold text-foreground leading-snug">{question.prompt}</p>
            </div>

            <div className="flex flex-col gap-2.5">
              {question.options.map((opt, idx) => {
                const isCorrect = idx === question.correct;
                const isSelected = idx === selected;
                let bg = "bg-white hover:bg-gray-50 border-black/10";
                let textColor = "text-foreground";
                if (showFeedback) {
                  if (isCorrect) { bg = "bg-emerald-50 border-emerald-400"; textColor = "text-emerald-800"; }
                  else if (isSelected) { bg = "bg-red-50 border-red-400"; textColor = "text-red-800"; }
                  else { bg = "bg-white/50 border-black/6"; textColor = "text-foreground/40"; }
                }
                return (
                  <button key={idx} onClick={() => handleSelect(idx)} disabled={showFeedback}
                    className={cn("w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-200 font-medium text-sm leading-snug", bg, textColor, !showFeedback && "active:scale-[0.98] cursor-pointer")}>
                    <span className="font-bold mr-2 opacity-50">{["A","B","C","D"][idx]}.</span>
                    {opt}
                    {showFeedback && isCorrect && <span className="ml-2">✓</span>}
                    {showFeedback && isSelected && !isCorrect && <span className="ml-2">✗</span>}
                  </button>
                );
              })}
            </div>

            {showFeedback && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-blue-50 border border-blue-200/60 rounded-xl p-4">
                <p className="text-sm text-blue-800 leading-relaxed">💡 {question.explanation}</p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {showFeedback && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Button onClick={handleNext} size="lg" className="w-full rounded-xl min-h-[48px]">
              {currentQ + 1 >= TOTAL ? "See My Result →" : "Next Question →"}
            </Button>
          </motion.div>
        )}
      </div>
    );
  }

  // ── EMAIL GATE ──
  if (phase === "email-gate") {
    const lvl = scoreToLevel(correct, TOTAL);
    const lvlMeta = LEVEL_META[lvl];
    return (
      <EmailGate
        lang={lang}
        tool="level-test"
        previewContent={
          <div className="text-center py-2">
            <div className="text-3xl mb-2">🎓</div>
            <p className="text-base font-semibold text-foreground mb-1">Your result is ready!</p>
            <p className="text-sm text-foreground/60">
              Score: <strong>{correct}/{TOTAL}</strong> — approx. <span style={{ color: lvlMeta.colour }} className="font-bold">{lvl}</span>
            </p>
          </div>
        }
        onSubmit={handleEmailSubmit}
      />
    );
  }

  // ── RESULTS ──
  const lvlMeta = LEVEL_META[level];
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5">
      <div className="rounded-2xl p-6 text-center border border-black/8 shadow-soft" style={{ background: lvlMeta.bg }}>
        <div className="text-4xl mb-3">🎓</div>
        <h2 className="text-2xl font-bold mb-1" style={{ color: lvlMeta.colour }}>{lvlMeta.label}</h2>
        <p className="text-sm text-foreground/70 leading-relaxed">{lvlMeta.description}</p>
      </div>

      <div className="bg-white rounded-2xl border border-black/8 p-5 shadow-soft">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-foreground/60">Score</span>
          <span className="text-lg font-bold text-foreground">{correct} / {TOTAL}</span>
        </div>
        <p className="text-xs font-mono tracking-wide text-foreground/50 break-all">
          {answers.map((a) => (a ? "🟢" : "🔴")).join("")}
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-4">
        <div className="flex gap-3">
          <span className="text-lg">💡</span>
          <div>
            <p className="text-sm font-semibold text-amber-900 mb-1">Next steps</p>
            <p className="text-sm text-amber-800/80">{lvlMeta.next}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-black/8 p-4 shadow-soft">
        <p className="text-xs text-foreground/50 text-center mb-3 font-medium uppercase tracking-wider">CEFR Level</p>
        <CEFRLadder level={level} />
      </div>

      <div className="flex flex-col gap-2.5">
        <Button onClick={handleShare} size="lg" className="w-full rounded-xl min-h-[48px]">📋 Share My Result</Button>
        <Button onClick={handleRestart} variant="outline" size="lg" className="w-full rounded-xl min-h-[48px]">🔄 Try Again</Button>
      </div>
    </motion.div>
  );
}
