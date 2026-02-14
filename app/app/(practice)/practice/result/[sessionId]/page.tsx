import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/admin";

type PageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

type PublicResult = {
  sessionId: string;
  language: string;
  level: string;
  score: number;
};

/**
 * Loads a public-facing result from anonymous sessions first, then student sessions.
 *
 * @param sessionId - Session identifier from URL.
 * @returns Public result payload or `null`.
 */
async function loadPublicResult(sessionId: string): Promise<PublicResult | null> {
  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    return null;
  }

  const { data: anonymousResult } = await adminClient
    .from("anonymous_practice_sessions")
    .select("id, language, level, score")
    .eq("id", sessionId)
    .limit(1)
    .maybeSingle();

  if (anonymousResult?.id) {
    return {
      sessionId: anonymousResult.id,
      language: anonymousResult.language || "Spanish",
      level: anonymousResult.level || "Intermediate",
      score: anonymousResult.score ?? 0,
    };
  }

  const { data: studentResult } = await adminClient
    .from("student_practice_sessions")
    .select("id, language, level, ai_feedback")
    .eq("id", sessionId)
    .limit(1)
    .maybeSingle();

  if (!studentResult?.id) {
    return null;
  }

  const derivedScore = Math.max(
    0,
    Math.min(100, Math.round(((studentResult.ai_feedback?.overall_rating ?? 3) / 5) * 100))
  );

  return {
    sessionId: studentResult.id,
    language: studentResult.language || "Spanish",
    level: studentResult.level || "Intermediate",
    score: derivedScore,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sessionId } = await params;
  const result = await loadPublicResult(sessionId);

  if (!result) {
    return {
      title: "Practice Result | TutorLingua",
      description: "Practice language skills and share your results.",
    };
  }

  const ogImage = `/api/og/practice-result/${result.sessionId}`;
  return {
    title: `${result.score}/100 in ${result.language} | TutorLingua`,
    description: `Scored ${result.score}/100 in ${result.language} at ${result.level} level.`,
    openGraph: {
      title: `${result.score}/100 in ${result.language}`,
      description: `Can you beat this ${result.level} score?`,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${result.score}/100 in ${result.language}`,
      description: `Can you beat this ${result.level} score?`,
      images: [ogImage],
    },
  };
}

// ─── Helpers ─────────────────────────────────────────────────────

function getScoreColour(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  return "text-primary";
}

function getScoreRingClasses(score: number): string {
  if (score >= 80) return "border-emerald-400/40";
  if (score >= 60) return "border-amber-400/40";
  return "border-primary/40";
}

function getScoreGlow(score: number): string {
  if (score >= 80) return "shadow-[0_0_80px_-20px_rgba(52,211,153,0.4)]";
  if (score >= 60) return "shadow-[0_0_80px_-20px_rgba(232,168,77,0.4)]";
  return "shadow-[0_0_80px_-20px_rgba(232,120,77,0.4)]";
}

function getScoreMessage(score: number): string {
  if (score >= 90) return "Outstanding";
  if (score >= 80) return "Impressive";
  if (score >= 70) return "Well done";
  if (score >= 60) return "Good effort";
  if (score >= 50) return "Getting there";
  return "Keep practising";
}

// ─── Page ────────────────────────────────────────────────────────

export default async function PracticeResultPage({ params }: PageProps) {
  const { sessionId } = await params;
  const result = await loadPublicResult(sessionId);

  if (!result) {
    notFound();
  }

  const radarItems = [
    { label: "Grammar", value: Math.max(10, Math.min(100, result.score - 5)) },
    { label: "Vocabulary", value: Math.max(10, Math.min(100, result.score + 2)) },
    { label: "Fluency", value: Math.max(10, Math.min(100, result.score - 1)) },
    { label: "Confidence", value: Math.max(10, Math.min(100, result.score + 4)) },
  ];

  return (
    <div className="flex min-h-[100dvh] flex-col justify-center px-4 py-10">
      <div className={`mx-auto w-full max-w-xl space-y-5 rounded-3xl border border-white/[0.1] bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-6 text-foreground backdrop-blur-xl ${getScoreGlow(result.score)}`}>
        {/* Badge */}
        <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/45 bg-primary/16 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-amber-400">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Shared result
        </p>

        {/* Score Hero */}
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">{result.language}</p>

          {/* Score Circle */}
          <div className="mx-auto mt-4 flex h-32 w-32 items-center justify-center rounded-full border-4 border-dashed" style={{ borderColor: "inherit" }}>
            <div className={`flex h-28 w-28 flex-col items-center justify-center rounded-full border-2 ${getScoreRingClasses(result.score)} bg-white/[0.03]`}>
              <p className={`text-5xl font-bold tabular-nums ${getScoreColour(result.score)}`}>{result.score}</p>
              <p className="text-[10px] font-medium text-muted-foreground">out of 100</p>
            </div>
          </div>

          <p className={`mt-3 text-sm font-semibold ${getScoreColour(result.score)}`}>
            {getScoreMessage(result.score)}
          </p>

          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="rounded-full border border-white/[0.1] bg-white/[0.06] px-3 py-1 text-xs font-semibold text-foreground">
              {result.level}
            </span>
          </div>
        </div>

        {/* Metrics */}
        <div className="space-y-2.5">
          {radarItems.map((item) => (
            <div key={item.label} className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
              <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium">{item.label}</span>
                <span className="tabular-nums">{item.value}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-amber-500 transition-all duration-700"
                  style={{ width: `${item.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="/practice"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-semibold text-white shadow-[0_4px_24px_-4px_rgba(232,120,77,0.6)] transition-transform active:scale-[0.98]"
        >
          Think you can beat this? Try now →
        </Link>

        {/* Branding */}
        <div className="flex items-center justify-center gap-1.5 pt-1">
          <svg className="h-3 w-3 text-primary/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
          </svg>
          <span className="text-[10px] font-medium tracking-[0.12em] text-muted-foreground/50">
            TUTORLINGUA
          </span>
        </div>
      </div>
    </div>
  );
}
