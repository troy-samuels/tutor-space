"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import QRCode from "@/components/recap/QRCode";
import type { RecapData } from "@/lib/recap/types";

type State = "idle" | "generating" | "success" | "error";
type Tone = "encouraging" | "neutral" | "challenging";

const TONE_OPTIONS: { value: Tone; label: string; emoji: string; description: string }[] = [
  { value: "encouraging", label: "Encouraging", emoji: "🌟", description: "Warm and supportive" },
  { value: "neutral", label: "Neutral", emoji: "📝", description: "Clear and balanced" },
  { value: "challenging", label: "Challenging", emoji: "🔥", description: "Push them further" },
];

function getTutorFingerprint(): string {
  if (typeof window === "undefined") return "";
  const key = "tl_tutor_fp";
  let fp = localStorage.getItem(key);
  if (!fp) {
    fp = crypto.randomUUID();
    localStorage.setItem(key, fp);
  }
  return fp;
}

function getStudentFingerprint(): string {
  if (typeof window === "undefined") return "";
  const key = "tl_student_fp";
  let fp = localStorage.getItem(key);
  if (!fp) {
    fp = crypto.randomUUID();
    localStorage.setItem(key, fp);
  }
  return fp;
}

function buildWhatsAppUrl(recap: RecapData, origin: string): string {
  const url = `${origin}/r/${recap.shortId}`;
  const studentName = recap.summary.studentName || "your";
  const lang = recap.summary.language || "language";
  const message = `Hi! 📚 Here's ${studentName === "your" ? "your" : `${studentName}'s`} ${lang} lesson recap with interactive exercises:\n\n${url}\n\nGive it a try when you have a moment! ✨`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export default function RecapGenerator() {
  const [state, setState] = useState<State>("idle");
  const [input, setInput] = useState("");
  const [tone, setTone] = useState<Tone>("encouraging");
  const [recap, setRecap] = useState<RecapData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!input.trim()) return;
    setState("generating");
    setError(null);

    try {
      const res = await fetch("/api/recap/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: input.trim(),
          tone,
          tutorFingerprint: getTutorFingerprint(),
          studentFingerprint: getStudentFingerprint(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Generation failed");
      }

      setRecap(data.recap as RecapData);
      setState("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setState("error");
    }
  }, [input, tone]);

  const handleCopy = useCallback(async () => {
    if (!recap) return;
    const fullUrl = `${window.location.origin}/r/${recap.shortId}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for clipboard API
    }
  }, [recap]);

  const handleReset = useCallback(() => {
    setState("idle");
    setInput("");
    setRecap(null);
    setError(null);
    setShowQR(false);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      {/* Subtle radial glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(232,120,77,0.04) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        <AnimatePresence mode="wait">
          {/* ─── IDLE STATE ─── */}
          {state === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8 flex justify-center">
                <Logo variant="wordmark" className="h-7 opacity-60 invert" />
              </div>

              <h1 className="mb-3 text-center font-heading text-3xl leading-tight text-foreground">
                Turn your lesson into student homework in 10 seconds.
              </h1>

              <p className="mb-8 text-center text-sm text-muted-foreground">
                Describe what you covered. We&apos;ll create an interactive
                study experience for your student.
              </p>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. Sarah, Spanish B1. We covered past tense today – she's mixing up fue and era. Homework: listen to Dakiti by Bad Bunny..."
                className={cn(
                  "w-full resize-none rounded-2xl border bg-card p-4 text-foreground",
                  "placeholder:text-muted-foreground/60",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50",
                  "min-h-[140px] text-sm leading-relaxed"
                )}
                style={{ borderColor: "rgba(245, 242, 239, 0.08)" }}
              />

              {/* Tone Selector */}
              <div className="mt-4">
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Tone
                </label>
                <div className="flex gap-2">
                  {TONE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setTone(opt.value)}
                      className={cn(
                        "flex flex-1 flex-col items-center gap-1 rounded-xl border p-3 text-xs transition-all",
                        tone === opt.value
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border text-muted-foreground hover:border-primary/30"
                      )}
                    >
                      <span className="text-lg">{opt.emoji}</span>
                      <span className="font-medium">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={!input.trim()}
                className={cn(
                  "mt-6 w-full rounded-xl bg-primary py-3.5 text-xl text-white",
                  "transition-all hover:brightness-110 active:scale-[0.98]",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
                style={{ fontFamily: "var(--font-mansalva)" }}
              >
                Generate Recap
              </button>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                Free · No signup required · Takes 10 seconds
              </p>
            </motion.div>
          )}

          {/* ─── GENERATING STATE ─── */}
          {state === "generating" && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center py-20"
            >
              <motion.div
                className="mb-6 text-5xl"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                ✨
              </motion.div>

              <p className="text-lg font-semibold text-foreground">
                Creating magic...
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Generating vocabulary, exercises &amp; encouragement
              </p>

              <div className="mt-8 flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="h-2 w-2 rounded-full bg-primary"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{
                      repeat: Infinity,
                      duration: 1,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* ─── SUCCESS STATE ─── */}
          {state === "success" && recap && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
            >
              <motion.div
                className="mb-4 text-5xl"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                ✅
              </motion.div>

              <h2 className="mb-2 text-center font-heading text-2xl text-foreground">
                Your recap is ready!
              </h2>

              {/* Recap info card */}
              <div
                className="mt-6 w-full rounded-2xl border bg-card p-5"
                style={{ borderColor: "rgba(245, 242, 239, 0.08)" }}
              >
                <p className="font-semibold text-foreground">
                  {recap.summary.studentName
                    ? `${recap.summary.studentName}'s Recap`
                    : "Lesson Recap"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {recap.summary.language}
                  {recap.summary.level ? ` · ${recap.summary.level}` : ""}
                  {" · "}
                  {recap.summary.covered.slice(0, 2).join(", ")}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {recap.exercises.length} exercises · 7 types
                </p>
              </div>

              {/* Link display */}
              <div
                className="mt-4 flex w-full items-center gap-2 rounded-xl border bg-card px-4 py-3"
                style={{ borderColor: "rgba(245, 242, 239, 0.08)" }}
              >
                <span className="flex-1 truncate text-sm text-foreground/70">
                  {typeof window !== "undefined"
                    ? `${window.location.origin}/r/${recap.shortId}`
                    : `/r/${recap.shortId}`}
                </span>
              </div>

              {/* Action buttons */}
              <div className="mt-4 flex w-full gap-3">
                <button
                  onClick={handleCopy}
                  className={cn(
                    "flex-1 rounded-xl bg-primary py-3 font-semibold text-white",
                    "transition-all hover:brightness-110 active:scale-[0.98]"
                  )}
                >
                  {copied ? "✅ Copied!" : "📋 Copy"}
                </button>

                <a
                  href={buildWhatsAppUrl(recap, typeof window !== "undefined" ? window.location.origin : "")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex-1 rounded-xl bg-[#25D366] py-3 text-center font-semibold text-white",
                    "transition-all hover:brightness-110 active:scale-[0.98]"
                  )}
                >
                  💬 WhatsApp
                </a>
              </div>

              {/* QR Code toggle */}
              <button
                onClick={() => setShowQR(!showQR)}
                className={cn(
                  "mt-3 w-full rounded-xl border py-3 font-semibold text-foreground",
                  "transition-all hover:bg-card active:scale-[0.98]"
                )}
                style={{ borderColor: "rgba(245, 242, 239, 0.08)" }}
              >
                {showQR ? "🔳 Hide QR Code" : "🔳 Show QR Code"}
              </button>

              {/* QR Code */}
              <AnimatePresence>
                {showQR && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 flex w-full justify-center overflow-hidden"
                  >
                    <div
                      className="rounded-2xl border bg-white p-4"
                      style={{ borderColor: "rgba(245, 242, 239, 0.08)" }}
                    >
                      <QRCode
                        value={
                          typeof window !== "undefined"
                            ? `${window.location.origin}/r/${recap.shortId}`
                            : `/r/${recap.shortId}`
                        }
                        size={180}
                      />
                      <p className="mt-2 text-center text-xs text-gray-500">
                        Student scans to open recap
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Preview button */}
              <button
                onClick={() =>
                  window.open(`/r/${recap.shortId}`, "_blank")
                }
                className={cn(
                  "mt-3 w-full rounded-xl border py-3 font-semibold text-foreground",
                  "transition-all hover:bg-card active:scale-[0.98]"
                )}
                style={{ borderColor: "rgba(245, 242, 239, 0.08)" }}
              >
                👁 Preview
              </button>

              <button
                onClick={handleReset}
                className="mt-6 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                Generate another recap
              </button>
            </motion.div>
          )}

          {/* ─── ERROR STATE ─── */}
          {state === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center py-20"
            >
              <div className="mb-4 text-5xl">😔</div>

              <h2 className="mb-2 text-center font-heading text-xl text-foreground">
                Something went wrong
              </h2>

              <p className="mb-8 text-center text-sm text-red-400">
                {error}
              </p>

              <button
                onClick={() => {
                  setState("idle");
                  setError(null);
                }}
                className={cn(
                  "w-full max-w-xs rounded-xl bg-primary py-3 font-semibold text-white",
                  "transition-all hover:brightness-110 active:scale-[0.98]"
                )}
              >
                Try again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
