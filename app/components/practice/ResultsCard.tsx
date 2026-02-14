"use client";

import { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2,
  Swords,
  RotateCcw,
  Loader2,
  Check,
  Mail,
  CalendarPlus,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { SCORE_RESULTS, LANGUAGES } from "@/lib/practice/catalogue-bridge";
import type { PracticeChallengeSeed } from "@/lib/hooks/use-practice";
import { generateShareableResultLink, generateChallengeLink } from "@/lib/practice/deep-links";
import { StreakShare } from "@/components/practice/StreakShare";
import { ChallengeComparison } from "@/components/practice/ChallengeComparison";
import { TutorRecommendation } from "@/components/practice/TutorRecommendation";

// ─── Types ───────────────────────────────────────────────────────

type ResultsCardProps = {
  languageCode: string;
  score: number | null;
  levelLabel: string;
  streak: number;
  sessionId: string | null;
  sessionToken: string | null;
  challengeSeed: PracticeChallengeSeed | null;
  isPersistingSession: boolean;
  onKeepPractising: () => void;
  /** Optional tutor name for authenticated students. */
  tutorName?: string;
};

// ─── Constants ───────────────────────────────────────────────────

const SPRING_TRANSITION = {
  type: "spring" as const,
  stiffness: 280,
  damping: 26,
};

const STAGGER_CONTAINER = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const STAGGER_ITEM = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: SPRING_TRANSITION },
};

// ─── Helpers ─────────────────────────────────────────────────────

function getLanguageFlag(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.flag ?? "🌍";
}

function getLanguageName(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.name ?? code;
}

function getScoreColour(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  return "text-primary";
}

function getScoreRingColour(score: number): string {
  if (score >= 80) return "stroke-emerald-400";
  if (score >= 60) return "stroke-amber-400";
  return "stroke-primary";
}

function getScoreGlow(score: number): string {
  if (score >= 80) return "shadow-[0_0_60px_-12px_rgba(52,211,153,0.4)]";
  if (score >= 60) return "shadow-[0_0_60px_-12px_rgba(232,168,77,0.4)]";
  return "shadow-[0_0_60px_-12px_rgba(232,120,77,0.4)]";
}

function getScoreMessage(score: number): string {
  if (score >= 90) return "Outstanding";
  if (score >= 80) return "Impressive";
  if (score >= 70) return "Well done";
  if (score >= 60) return "Good effort";
  if (score >= 50) return "Getting there";
  return "Keep practising";
}

// ─── Score Ring ──────────────────────────────────────────────────

function ScoreRing({ score, size = 140 }: { score: number; size?: number }) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-white/[0.08]"
        />
        {/* Progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={getScoreRingColour(score)}
          initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ ...SPRING_TRANSITION, delay: 0.3 }}
        />
      </svg>
      {/* Score text in centre */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className={`text-4xl font-bold tabular-nums ${getScoreColour(score)}`}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ ...SPRING_TRANSITION, delay: 0.2 }}
        >
          {score}
        </motion.span>
        <span className="text-[10px] font-medium text-muted-foreground">out of 100</span>
      </div>
    </div>
  );
}

// ─── Language Card (Shareable Visual) ────────────────────────────

function LanguageCard({
  flag,
  languageName,
  score,
  levelLabel,
  percentile,
}: {
  flag: string;
  languageName: string;
  score: number;
  levelLabel: string;
  percentile: number;
}) {
  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <motion.div
      variants={STAGGER_ITEM}
      className={`relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-6 backdrop-blur-xl ${getScoreGlow(score)}`}
    >
      {/* Ambient gradient blobs */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-primary/8 blur-3xl" />

      {/* Header: Language + Date */}
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{flag}</span>
          <span className="text-sm font-semibold text-foreground">{languageName}</span>
        </div>
        <span className="text-[10px] font-medium text-muted-foreground">{today}</span>
      </div>

      {/* Score Ring */}
      <div className="relative mt-5 flex flex-col items-center">
        <ScoreRing score={score} />
        <motion.p
          className="mt-3 text-sm font-semibold text-foreground"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING_TRANSITION, delay: 0.5 }}
        >
          {getScoreMessage(score)}
        </motion.p>
      </div>

      {/* Badges */}
      <div className="relative mt-4 flex items-center justify-center gap-2">
        <span className="rounded-full border border-white/[0.12] bg-white/[0.06] px-3 py-1 text-xs font-semibold text-foreground">
          {levelLabel}
        </span>
        <span className="rounded-full border border-white/[0.12] bg-white/[0.06] px-3 py-1 text-xs text-muted-foreground">
          Better than {percentile}% of learners
        </span>
      </div>

      {/* Branding */}
      <div className="relative mt-5 flex items-center justify-center gap-1.5">
        <Sparkles className="h-3 w-3 text-primary/60" />
        <span className="text-[10px] font-medium tracking-wider text-muted-foreground/60">
          TUTORLINGUA
        </span>
      </div>
    </motion.div>
  );
}

// ─── Metric Bar ──────────────────────────────────────────────────

function MetricBar({ label, value, max = 10 }: { label: string; value: number; max?: number }) {
  const pct = Math.min((value / max) * 100, 100);

  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-amber-500"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ ...SPRING_TRANSITION, delay: 0.4 }}
        />
      </div>
      <span className="w-6 text-right text-xs font-semibold text-foreground">{value}</span>
    </div>
  );
}

// ─── Ghost Email Capture ─────────────────────────────────────────

function GhostEmailCapture({ sessionToken }: { sessionToken: string | null }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !sessionToken) return;

    setStatus("sending");
    try {
      const res = await fetch("/api/practice/anonymous/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), sessionToken }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 backdrop-blur-xl"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
          <Check className="h-4 w-4 text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-300">Progress saved!</p>
          <p className="mt-0.5 text-xs text-emerald-300/70">
            We&apos;ll email you a link to continue your learning journey.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-foreground">
          Save your progress & get a personalised learning plan
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          We&apos;ll track your improvement and recommend the right exercises for your level.
        </p>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            required
            className="h-10 w-full rounded-xl border border-white/[0.1] bg-white/[0.05] pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 backdrop-blur-xl outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
          />
        </div>
        <motion.button
          type="submit"
          whileTap={{ scale: 0.96 }}
          disabled={status === "sending"}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {status === "sending" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
        </motion.button>
      </div>
      {status === "error" && (
        <p className="text-xs text-red-400">Something went wrong. Try again.</p>
      )}
    </form>
  );
}

// ─── Signup CTA (Anonymous) ─────────────────────────────────────

function SignupCTA({ languageCode, level }: { languageCode: string; level: string }) {
  return (
    <motion.div variants={STAGGER_ITEM}>
      <Link
        href={`/signup?lang=${languageCode}&level=${encodeURIComponent(level)}`}
        className="group flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-4 backdrop-blur-xl transition-colors hover:bg-primary/15"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20">
          <UserPlus className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Create a free account</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Track your progress, build streaks, and get matched with tutors.
          </p>
        </div>
        <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-0.5" />
      </Link>
    </motion.div>
  );
}

// ─── Authenticated: Tutor Notified Card ─────────────────────────

function TutorNotifiedCard({ tutorName }: { tutorName?: string }) {
  const displayName = tutorName || "Your tutor";

  return (
    <motion.div
      variants={STAGGER_ITEM}
      className="space-y-3"
    >
      {/* Tutor notified */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20">
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <p className="text-sm font-semibold text-emerald-300">
            {displayName} has been notified
          </p>
        </div>
        <p className="mt-1.5 pl-8 text-xs text-muted-foreground">
          They&apos;ll review your results before your next lesson.
        </p>
      </div>

      {/* Book Next Lesson — primary CTA */}
      <Link
        href="/student/schedule"
        className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-semibold text-white shadow-[0_4px_24px_-4px_rgba(232,120,77,0.6)] transition-transform active:scale-[0.98]"
      >
        <CalendarPlus className="h-4 w-4" />
        Book Next Lesson
      </Link>

      {/* Back to Dashboard — secondary link */}
      <Link
        href="/student/search"
        className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to Dashboard
      </Link>
    </motion.div>
  );
}

// ─── ResultsCard ─────────────────────────────────────────────────

export default function ResultsCard({
  languageCode,
  score,
  levelLabel,
  streak,
  sessionId,
  sessionToken,
  challengeSeed,
  isPersistingSession,
  onKeepPractising,
  tutorName,
}: ResultsCardProps) {
  const [shareStatus, setShareStatus] = useState<"idle" | "copied">("idle");
  const [isCreatingChallenge, setIsCreatingChallenge] = useState(false);

  const results = useMemo(
    () => SCORE_RESULTS[languageCode] ?? SCORE_RESULTS.es,
    [languageCode]
  );

  const displayScore = score != null && score > 0 ? score : results.overallScore;
  const flag = getLanguageFlag(languageCode);
  const languageName = getLanguageName(languageCode);
  const isAnonymous = !!sessionToken;

  // ── Share handler ────────────────────────────────────────────

  const shareLink = useMemo(() => {
    if (!sessionId) return null;
    return generateShareableResultLink({
      sessionId,
      language: languageCode,
      score: displayScore,
      level: levelLabel,
    });
  }, [sessionId, languageCode, displayScore, levelLabel]);

  const handleShare = useCallback(async () => {
    if (!shareLink) return;

    const shareText = `I scored ${displayScore}/100 in ${flag} ${languageName}! Can you beat me?`;

    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({ title: "My TutorLingua Score", text: shareText, url: shareLink });
        return;
      }

      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${shareText}\n${shareLink}`);
        setShareStatus("copied");
        setTimeout(() => setShareStatus("idle"), 2200);
      }
    } catch {
      // Silent: share cancellation is fine.
    }
  }, [displayScore, flag, languageName, shareLink]);

  // ── Challenge handler ────────────────────────────────────────

  const handleChallenge = useCallback(async () => {
    if (isCreatingChallenge) return;

    setIsCreatingChallenge(true);

    try {
      const challengeResponse = await fetch("/api/practice/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: languageCode,
          level: levelLabel || "Intermediate",
          challengerScore: displayScore,
          challengerName: "A learner",
        }),
      });

      if (!challengeResponse.ok) {
        return;
      }

      const payload = (await challengeResponse.json()) as {
        success?: boolean;
        challenge?: { id?: string };
      };
      const challengeId = payload.challenge?.id;
      if (!payload.success || !challengeId) {
        return;
      }

      const challengeLink = generateChallengeLink({
        challengerId: challengeId,
        language: languageCode,
        level: levelLabel || "Intermediate",
        score: displayScore,
      });
      const challengeText = `I scored ${displayScore}/100 in ${flag} ${languageName}! Can you beat me? ${challengeLink}`;

      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({ title: "TutorLingua Challenge", text: challengeText, url: challengeLink });
        return;
      }

      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(challengeText);
        setShareStatus("copied");
        setTimeout(() => setShareStatus("idle"), 2200);
      }
    } catch {
      // Silent.
    } finally {
      setIsCreatingChallenge(false);
    }
  }, [displayScore, flag, isCreatingChallenge, languageCode, languageName, levelLabel]);

  // ── Render ───────────────────────────────────────────────────

  return (
    <motion.div
      variants={STAGGER_CONTAINER}
      initial="hidden"
      animate="show"
      className="mx-auto flex min-h-screen max-w-md flex-col items-stretch gap-4 px-4 py-8"
    >
      {/* ── Language Card (Hero — shareable visual) ───────────── */}
      <LanguageCard
        flag={flag}
        languageName={languageName}
        score={displayScore}
        levelLabel={levelLabel || results.levelLabel}
        percentile={results.percentile}
      />

      {isPersistingSession && (
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Saving session…
        </div>
      )}

      {/* ── Share & Challenge Actions ─────────────────────────── */}
      <motion.div variants={STAGGER_ITEM} className="flex gap-2">
        {shareLink && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={handleShare}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.06] text-sm font-semibold text-foreground backdrop-blur-xl transition-colors hover:bg-white/[0.1]"
          >
            <Share2 className="h-4 w-4" />
            {shareStatus === "copied" ? "Copied!" : "Share"}
          </motion.button>
        )}
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={handleChallenge}
          disabled={isCreatingChallenge}
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-primary/40 bg-primary/15 text-sm font-semibold text-primary shadow-[0_0_28px_-6px_rgba(232,120,77,0.4)] backdrop-blur-xl disabled:opacity-60"
        >
          {isCreatingChallenge ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Swords className="h-4 w-4" />
          )}
          {isCreatingChallenge ? "Creating…" : "Challenge"}
        </motion.button>
      </motion.div>

      {/* ── Challenge Comparison (if applicable) ─────────────── */}
      {challengeSeed && (
        <motion.div variants={STAGGER_ITEM}>
          <ChallengeComparison
            challengerName={challengeSeed.challengerName}
            challengerScore={challengeSeed.challengerScore}
            yourScore={displayScore}
            onChallengeAnother={handleChallenge}
            isSharingChallenge={isCreatingChallenge}
          />
        </motion.div>
      )}

      {/* ── Metrics Breakdown ─────────────────────────────────── */}
      <motion.div
        variants={STAGGER_ITEM}
        className="space-y-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-xl"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Breakdown</p>
        {results.metrics.map((m) => (
          <MetricBar key={m.label} label={m.label} value={m.score} />
        ))}
      </motion.div>

      {/* ── Top Errors ────────────────────────────────────────── */}
      {results.topErrors.length > 0 && (
        <motion.div
          variants={STAGGER_ITEM}
          className="space-y-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-xl"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Corrections</p>
          {results.topErrors.map((err, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className="mt-0.5 shrink-0 rounded bg-red-500/20 px-1.5 py-0.5 font-mono text-red-300 line-through">
                {err.wrong}
              </span>
              <span className="mt-0.5 shrink-0 rounded bg-emerald-500/20 px-1.5 py-0.5 font-mono text-emerald-300">
                {err.correct}
              </span>
              <span className="text-muted-foreground">{err.explanation}</span>
            </div>
          ))}
        </motion.div>
      )}

      {/* ── Achievements ──────────────────────────────────────── */}
      {results.achievements.length > 0 && (
        <motion.div
          variants={STAGGER_ITEM}
          className="flex flex-wrap gap-2"
        >
          {results.achievements.map((ach) => (
            <motion.span
              key={ach.label}
              whileHover={{ scale: 1.04 }}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur-xl"
            >
              {ach.icon} {ach.label}
            </motion.span>
          ))}
        </motion.div>
      )}

      {/* ── Streak Share ──────────────────────────────────────── */}
      <AnimatePresence>
        {streak >= 3 && (
          <motion.div variants={STAGGER_ITEM}>
            <StreakShare streak={streak} practiceLink={shareLink ?? "/practice"} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Anonymous Path: Email Capture + Signup + Tutor Recs ─ */}
      {isAnonymous && (
        <>
          <motion.div
            variants={STAGGER_ITEM}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-xl"
          >
            <GhostEmailCapture sessionToken={sessionToken} />
          </motion.div>

          <SignupCTA languageCode={languageCode} level={levelLabel || results.levelLabel} />

          <TutorRecommendation
            language={languageCode}
            level={levelLabel || results.levelLabel}
          />
        </>
      )}

      {/* ── Authenticated Path: Tutor Notified + Actions ──────── */}
      {!isAnonymous && (
        <TutorNotifiedCard tutorName={tutorName} />
      )}

      {/* ── Keep Practising (always last) ─────────────────────── */}
      <motion.div variants={STAGGER_ITEM}>
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={onKeepPractising}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-semibold text-white shadow-[0_4px_24px_-4px_rgba(232,120,77,0.6)]"
        >
          <RotateCcw className="h-4 w-4" />
          Keep Practising
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
