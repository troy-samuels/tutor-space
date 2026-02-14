/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export const runtime = "edge";

type RouteParams = {
  params: Promise<{
    sessionId: string;
  }>;
};

type ResultPayload = {
  language: string;
  level: string;
  score: number;
};

/**
 * Loads result payload used for the practice share Open Graph image.
 *
 * @param sessionId - Session ID from route params.
 * @returns Result payload or `null`.
 */
async function loadResultPayload(sessionId: string): Promise<ResultPayload | null> {
  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    return null;
  }

  const { data: anonymousResult } = await adminClient
    .from("anonymous_practice_sessions")
    .select("language, level, score")
    .eq("id", sessionId)
    .limit(1)
    .maybeSingle();

  if (anonymousResult) {
    return {
      language: anonymousResult.language || "Spanish",
      level: anonymousResult.level || "Intermediate",
      score: anonymousResult.score ?? 0,
    };
  }

  const { data: studentResult } = await adminClient
    .from("student_practice_sessions")
    .select("language, level, ai_feedback")
    .eq("id", sessionId)
    .limit(1)
    .maybeSingle();

  if (!studentResult) {
    return null;
  }

  const derivedScore = Math.max(
    0,
    Math.min(100, Math.round(((studentResult.ai_feedback?.overall_rating ?? 3) / 5) * 100))
  );

  return {
    language: studentResult.language || "Spanish",
    level: studentResult.level || "Intermediate",
    score: derivedScore,
  };
}

/**
 * Generates a dynamic OG image for practice result sharing.
 */
export async function GET(request: Request, { params }: RouteParams) {
  const { sessionId } = await params;
  const url = new URL(request.url);
  const isStory = url.searchParams.get("story") === "1" || url.searchParams.get("format") === "story";
  const width = isStory ? 1080 : 1200;
  const height = isStory ? 1920 : 630;

  const result = await loadResultPayload(sessionId);
  if (!result) {
    return new Response("Result not found", { status: 404 });
  }

  const scoreColor = result.score >= 80 ? "#E8A84D" : result.score >= 60 ? "#E8784D" : "#C4563F";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "radial-gradient(circle at 20% 20%, rgba(232,120,77,0.25), transparent 40%), #0D0D0C",
          color: "#F5F2EF",
          padding: isStory ? "90px 70px" : "52px 60px",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(125deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02) 30%, rgba(232,120,77,0.08) 80%)",
          }}
        />

        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            borderRadius: "30px",
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(18px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: isStory ? "66px" : "40px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: isStory ? 28 : 20,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#D5C7BC",
              }}
            >
              TutorLingua Practice Result
            </span>
            <span
              style={{
                marginTop: isStory ? 24 : 16,
                fontSize: isStory ? 140 : 110,
                lineHeight: 1,
                fontWeight: 800,
                color: scoreColor,
                textShadow: "0 0 60px rgba(232,120,77,0.55)",
              }}
            >
              {result.score}/100
            </span>
            <span style={{ marginTop: 16, fontSize: isStory ? 48 : 32, color: "#F5F2EF", fontWeight: 600 }}>
              {result.language}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span
              style={{
                fontSize: isStory ? 30 : 22,
                color: "#D5C7BC",
              }}
            >
              Level: {result.level}
            </span>
            <span
              style={{
                border: "1px solid rgba(232,120,77,0.55)",
                borderRadius: 999,
                padding: isStory ? "16px 24px" : "10px 16px",
                fontSize: isStory ? 26 : 18,
                color: "#E8A84D",
              }}
            >
              tutorlingua.com
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width,
      height,
    }
  );
}
