"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ToolLanguageBar } from "@/components/tools/LanguageSelector";
import { EmailGate } from "@/components/tools/EmailGate";
import { useToolLanguage } from "@/lib/tools/useToolLanguage";
import { getDailyWord, VOCAB_META, type VocabWord } from "./VocabData";
import { cn } from "@/lib/utils";

const LEVEL_COLOURS: Record<string, { text: string; bg: string }> = {
  B1: { text: "#0D9668", bg: "#ECFDF5" },
  B2: { text: "#4A7EC5", bg: "#EFF6FF" },
  C1: { text: "#7C4FD0", bg: "#F5F3FF" },
  C2: { text: "#D36135", bg: "#FFF7ED" },
};

function WordCard({ word }: { word: VocabWord }) {
  const level = LEVEL_COLOURS[word.level] ?? LEVEL_COLOURS.C1;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
      {/* Main word */}
      <div className="bg-white rounded-2xl border border-black/8 p-5 shadow-soft">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-1">{word.word}</h2>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-foreground/50 bg-black/5 px-2 py-0.5 rounded-md">{word.phonetic}</span>
              <span className="text-xs text-foreground/40 italic">{word.partOfSpeech}</span>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
            style={{ color: level.text, background: level.bg }}>
            {word.level}
          </span>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-foreground/40 uppercase tracking-wider mb-1">Definition</p>
            <p className="text-base text-foreground leading-relaxed">{word.definition}</p>
            {word.nativeDefinition && (
              <p className="text-sm text-foreground/50 italic mt-1">{word.nativeDefinition}</p>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground/40 uppercase tracking-wider mb-1">Example</p>
            <p className="text-sm text-foreground/70 italic leading-relaxed">&ldquo;{word.example}&rdquo;</p>
          </div>
        </div>
      </div>

      {/* Etymology */}
      <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-4">
        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1.5">🏛️ Word Origin</p>
        <p className="text-sm text-amber-900 leading-relaxed">{word.etymology}</p>
      </div>

      {/* Synonyms & Antonyms */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-black/8 p-4 shadow-soft">
          <p className="text-xs font-semibold text-foreground/40 uppercase tracking-wider mb-2">Synonyms</p>
          <div className="flex flex-wrap gap-1.5">
            {word.synonyms.map((s) => (
              <span key={s} className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-full">{s}</span>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-black/8 p-4 shadow-soft">
          <p className="text-xs font-semibold text-foreground/40 uppercase tracking-wider mb-2">Antonyms</p>
          <div className="flex flex-wrap gap-1.5">
            {word.antonyms.length > 0
              ? word.antonyms.map((a) => (
                  <span key={a} className="text-xs bg-red-50 text-red-700 border border-red-200/60 px-2 py-0.5 rounded-full">{a}</span>
                ))
              : <span className="text-xs text-foreground/30">—</span>
            }
          </div>
        </div>
      </div>

      {/* Collocations */}
      {word.collocations.length > 0 && (
        <div className="bg-white rounded-2xl border border-black/8 p-4 shadow-soft">
          <p className="text-xs font-semibold text-foreground/40 uppercase tracking-wider mb-2.5">Common Collocations</p>
          <div className="flex flex-wrap gap-2">
            {word.collocations.map((c) => (
              <span key={c} className="text-xs bg-blue-50 text-blue-700 border border-blue-200/60 px-3 py-1 rounded-full">{c}</span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function MiniQuiz({ word, onComplete }: { word: VocabWord; onComplete: (correct: boolean) => void }) {
  const [selected, setSelected] = React.useState<number | null>(null);
  const [revealed, setRevealed] = React.useState(false);

  function handleSelect(idx: number) {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    setTimeout(() => onComplete(idx === word.correctOption), 1500);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl border border-black/8 p-5 shadow-soft">
        <p className="text-xs font-semibold text-foreground/40 uppercase tracking-wider mb-3">✏️ Test yourself</p>
        <p className="text-base font-semibold text-foreground">What does &ldquo;{word.word}&rdquo; mean?</p>
      </div>

      <div className="flex flex-col gap-2.5">
        {word.quizOptions.map((opt, idx) => {
          const isCorrect = idx === word.correctOption;
          const isSelected = idx === selected;
          let style = "bg-white border-black/10 hover:bg-gray-50 text-foreground";
          if (revealed) {
            if (isCorrect) style = "bg-emerald-50 border-emerald-400 text-emerald-800";
            else if (isSelected) style = "bg-red-50 border-red-400 text-red-800";
            else style = "bg-white/40 border-black/6 text-foreground/30";
          }
          return (
            <button key={idx} onClick={() => handleSelect(idx)} disabled={revealed}
              className={cn("w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-all", style, !revealed && "cursor-pointer active:scale-[0.98]")}>
              <span className="font-bold mr-2 opacity-50">{["A","B","C","D"][idx]}.</span>
              {opt}
              {revealed && isCorrect && " ✓"}
              {revealed && isSelected && !isCorrect && " ✗"}
            </button>
          );
        })}
      </div>

      {revealed && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className={cn("rounded-xl p-4 text-sm font-medium", selected === word.correctOption
            ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
            : "bg-red-50 border border-red-200 text-red-800")}>
          {selected === word.correctOption
            ? "🎉 Correct! Great work."
            : `❌ The answer is: "${word.quizOptions[word.correctOption]}"`}
        </motion.div>
      )}
    </motion.div>
  );
}

type Phase = "word" | "quiz" | "email-gate" | "done";

export default function VocabBuilder() {
  const [lang, setLang] = useToolLanguage();
  const [word, setWord] = React.useState<VocabWord>(() => getDailyWord(lang));
  const [phase, setPhase] = React.useState<Phase>("word");
  const [quizResult, setQuizResult] = React.useState<boolean | null>(null);
  const meta = VOCAB_META[lang];

  // Reload word when language changes
  React.useEffect(() => {
    setWord(getDailyWord(lang));
    setPhase("word");
    setQuizResult(null);
  }, [lang]);

  const today = new Date().toLocaleDateString(meta.dateLocale, {
    weekday: "long", day: "numeric", month: "long",
  });

  function handleQuizComplete(correct: boolean) {
    setQuizResult(correct);
    const hasEmail = localStorage.getItem("tl_tools_email");
    setPhase(hasEmail ? "done" : "email-gate");
  }

  function handleEmailSubmit(email: string) {
    localStorage.setItem("tl_tools_email", email);
    setPhase("done");
  }

  function handleShare() {
    const text = `📖 ${meta.title}: ${word.word}\n"${word.definition}"\n\n${word.example}\n\nLearn a new word every day → tutorlingua.co/tools/vocab?lang=${lang}`;
    if (navigator.share) {
      navigator.share({ title: `${meta.title}: ${word.word}`, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => alert("Copied!"));
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Language bar + header */}
      <ToolLanguageBar lang={lang} onChangeLang={setLang} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">{meta.title}</h1>
          <p className="text-xs text-foreground/40">{today}</p>
        </div>
        <button onClick={handleShare}
          className="text-xs font-medium text-foreground/50 bg-black/5 hover:bg-black/8 px-3 py-1.5 rounded-full transition-colors">
          📋 Share
        </button>
      </div>

      <AnimatePresence mode="wait">
        {phase === "word" && (
          <motion.div key={`word-${lang}`} className="flex flex-col gap-5">
            <WordCard word={word} />
            <Button size="lg" className="w-full rounded-xl min-h-[48px]" onClick={() => setPhase("quiz")}>
              Test Yourself →
            </Button>
          </motion.div>
        )}

        {phase === "quiz" && (
          <motion.div key={`quiz-${lang}`}>
            <MiniQuiz word={word} onComplete={handleQuizComplete} />
          </motion.div>
        )}

        {phase === "email-gate" && (
          <motion.div key="gate">
            <EmailGate
              lang={lang}
              tool="vocab"
              previewContent={
                <div className="text-center py-2">
                  <div className="text-2xl mb-1">📖</div>
                  <p className="font-semibold text-foreground">{word.word}</p>
                  <p className="text-sm text-foreground/60">
                    {quizResult ? "✅ You got it right!" : "You've studied today's word!"}
                  </p>
                </div>
              }
              onSubmit={handleEmailSubmit}
            />
          </motion.div>
        )}

        {phase === "done" && (
          <motion.div key="done" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5">
            <div className="bg-white rounded-2xl border border-black/8 p-6 text-center shadow-soft">
              <div className="text-4xl mb-3">{quizResult ? "🎉" : "📚"}</div>
              <h3 className="text-xl font-bold text-foreground mb-1">
                {quizResult ? "Word mastered!" : "Keep practising!"}
              </h3>
              <p className="text-sm text-foreground/60">
                {quizResult
                  ? `You correctly defined "${word.word}".`
                  : `"${word.word}" means: ${word.definition}`}
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-4">
              <p className="text-sm text-amber-800">
                📬 <strong>Come back tomorrow</strong> for a new word — we&apos;ll email it too!
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <Button onClick={handleShare} size="lg" className="w-full rounded-xl min-h-[48px]">📋 Share Today&apos;s Word</Button>
              <Button onClick={() => setPhase("word")} variant="outline" size="lg" className="w-full rounded-xl min-h-[48px]">🔄 Review Again</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
