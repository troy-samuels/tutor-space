import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import PracticeApp from "../../PracticeApp";

type PageProps = {
  params: Promise<{
    challengerId: string;
  }>;
  searchParams: Promise<{
    lang?: string;
    level?: string;
    score?: string;
  }>;
};

type ChallengeRow = {
  id: string;
  challenger_name: string | null;
  language: string;
  level: string;
  challenger_score: number;
};

/**
 * Loads a challenge row by ID.
 *
 * @param challengeId - Challenge identifier.
 * @returns Challenge row or `null`.
 */
async function loadChallenge(challengeId: string): Promise<ChallengeRow | null> {
  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    return null;
  }

  const { data } = await adminClient
    .from("practice_challenges")
    .select("id, challenger_name, language, level, challenger_score")
    .eq("id", challengeId)
    .limit(1)
    .maybeSingle();

  if (!data?.id) {
    return null;
  }

  return data as ChallengeRow;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { challengerId } = await params;
  const query = await searchParams;
  const challenge = await loadChallenge(challengerId);

  const challengerName = challenge?.challenger_name || "A friend";
  const language = challenge?.language || query.lang || "Spanish";
  const score = challenge?.challenger_score ?? Number(query.score || 0);

  return {
    title: `Challenge: Beat ${score}/100 in ${language} | TutorLingua`,
    description: `${challengerName} scored ${score}/100 in ${language}. Can you beat them?`,
    openGraph: {
      title: `${challengerName} scored ${score}/100 in ${language}`,
      description: `Think you can do better? Take the challenge now — no signup required.`,
    },
  };
}

function getScoreColour(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  return "text-primary";
}

export default async function PracticeChallengePage({ params, searchParams }: PageProps) {
  const { challengerId } = await params;
  const query = await searchParams;

  const challenge = await loadChallenge(challengerId);
  if (!challenge && !query.lang) {
    notFound();
  }

  const challengerName = challenge?.challenger_name || "A friend";
  const language = challenge?.language || query.lang || "Spanish";
  const level = challenge?.level || query.level || "Intermediate";
  const challengerScore = challenge?.challenger_score ?? Number(query.score || 0);

  return (
    <div className="min-h-[100dvh]">
      {/* Challenger Card */}
      <div className="border-b border-white/[0.08] bg-gradient-to-r from-white/[0.04] to-white/[0.02] px-5 py-5 backdrop-blur-xl">
        <div className="mx-auto max-w-md">
          {/* Challenge badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            Challenge Mode
          </div>

          {/* Challenger info */}
          <div className="mt-3 flex items-center gap-4">
            {/* Avatar */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-lg font-bold text-white">
              {challengerName.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                {challengerName} scored{" "}
                <span className={`text-lg font-bold tabular-nums ${getScoreColour(challengerScore)}`}>
                  {challengerScore}
                </span>
                <span className="text-muted-foreground">/100</span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {level} {language} • Can you beat this?
              </p>
            </div>
          </div>
        </div>
      </div>

      <PracticeApp
        initialLanguageCode={language}
        initialExerciseContext={{
          language,
          level,
          topic: `${language} challenge`,
          vocabularyFocus: [],
          grammarFocus: [],
        }}
        initialScreen="level-assessment"
        challengeSeed={{
          challengeId: challenge?.id || challengerId,
          challengerName,
          challengerScore,
          language,
          level,
        }}
      />
    </div>
  );
}
