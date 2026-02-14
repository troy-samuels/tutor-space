import { NextRequest, NextResponse } from "next/server";
import { routedChatCompletion } from "@/lib/ai/model-router";

// ---------------------------------------------------------------------------
// In-memory rate limiter (max 5 analyses per IP per hour)
// ---------------------------------------------------------------------------
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  rateLimitMap.set(ip, recent);
  if (recent.length >= RATE_LIMIT_MAX) return true;
  recent.push(now);
  rateLimitMap.set(ip, recent);
  return false;
}

// ---------------------------------------------------------------------------
// URL validation
// ---------------------------------------------------------------------------
const PREPLY_RE = /^https?:\/\/(www\.)?preply\.com\/.+\/tutor\/(\d+)/;
const ITALKI_RE =
  /^https?:\/\/(www\.)?italki\.com\/en\/teacher\/(\d+)/;

type Platform = "preply" | "italki";

function detectPlatform(url: string): { platform: Platform; id: string } | null {
  let m = url.match(PREPLY_RE);
  if (m) return { platform: "preply", id: m[2] };
  m = url.match(ITALKI_RE);
  if (m) return { platform: "italki", id: m[2] };
  return null;
}

// ---------------------------------------------------------------------------
// Profile fetching
// ---------------------------------------------------------------------------
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

async function fetchProfileHTML(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Failed to fetch profile (HTTP ${res.status})`);
  return res.text();
}

function extractTextFromHTML(html: string): string {
  // Remove script / style blocks
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "");

  // Replace common block-level elements with newlines
  text = text.replace(/<\/(p|div|h[1-6]|li|tr|br\s*\/?)>/gi, "\n");
  text = text.replace(/<br\s*\/?>/gi, "\n");

  // Strip remaining tags
  text = text.replace(/<[^>]+>/g, " ");

  // Decode common HTML entities
  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  // Collapse whitespace
  text = text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();

  // Limit to ~12 000 chars to stay within token limits
  return text.slice(0, 12_000);
}

// ---------------------------------------------------------------------------
// Analysis types
// ---------------------------------------------------------------------------
interface SectionScore {
  score: number;
  maxScore: number;
  feedback: string;
}

interface Recommendation {
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
}

interface AnalysisResult {
  platform: Platform;
  tutorName: string;
  overallScore: number;
  sections: {
    headline: SectionScore;
    bio: SectionScore;
    differentiation: SectionScore;
    pricing: SectionScore;
    keywords: SectionScore;
    reviews: SectionScore;
  };
  topRecommendations: Recommendation[];
  summary: string;
}

// ---------------------------------------------------------------------------
// OpenAI analysis
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are a world-class tutor profile consultant who has reviewed thousands of profiles on Preply and iTalki. Your job is to give honest, specific, actionable feedback that helps tutors attract more students.

Evaluate the profile across these dimensions (each scored 1-10):

1. **Headline** – Is it compelling and specific, or generic? Does it promise a clear outcome?
2. **Bio** – Is it personal, specific, and student-focused? Does it show personality or read like a corporate template?
3. **Differentiation** – What makes this tutor stand out from 10,000 other tutors? Is there a unique angle?
4. **Pricing** – Is the pricing appropriate for their qualifications and experience level? Is the value proposition clear?
5. **Keywords & Discoverability** – Does the profile contain relevant search terms students might use? (exam prep, conversation, business English, etc.)
6. **Reviews** – What's the sentiment? Do reviews mention specific positives? If no reviews are visible, score based on how the profile sets up for positive reviews.

Then provide:
- An overall score out of 100 (weighted average, not just sum of sections)
- 3 specific, actionable recommendations ranked by impact (high/medium/low)
- A 2-3 sentence summary

Respond ONLY with valid JSON matching this exact structure:
{
  "tutorName": "string",
  "overallScore": number,
  "sections": {
    "headline": { "score": number, "maxScore": 10, "feedback": "string" },
    "bio": { "score": number, "maxScore": 10, "feedback": "string" },
    "differentiation": { "score": number, "maxScore": 10, "feedback": "string" },
    "pricing": { "score": number, "maxScore": 10, "feedback": "string" },
    "keywords": { "score": number, "maxScore": 10, "feedback": "string" },
    "reviews": { "score": number, "maxScore": 10, "feedback": "string" }
  },
  "topRecommendations": [
    { "title": "string", "description": "string", "impact": "high" | "medium" | "low" }
  ],
  "summary": "string"
}`;

async function analyseWithAI(
  profileText: string,
  platform: Platform,
): Promise<Omit<AnalysisResult, "platform">> {
  const completion = await routedChatCompletion(
    { task: "profile_analysis" },
    {
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Here is a ${platform} tutor profile to analyse:\n\n${profileText}`,
        },
      ],
    }
  );

  const raw = completion.choices[0]?.message?.content ?? "{}";
  return JSON.parse(raw) as Omit<AnalysisResult, "platform">;
}

async function analyseScreenshotWithAI(
  base64Image: string,
  platform: Platform | null,
): Promise<Omit<AnalysisResult, "platform">> {
  const completion = await routedChatCompletion(
    { task: "profile_analysis" },
    {
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyse this ${platform ?? "tutor"} profile screenshot. Extract all visible information and evaluate the profile.`,
            },
            {
              type: "image_url",
              image_url: {
                url: base64Image.startsWith("data:")
                  ? base64Image
                  : `data:image/png;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
    }
  );

  const raw = completion.choices[0]?.message?.content ?? "{}";
  return JSON.parse(raw) as Omit<AnalysisResult, "platform">;
}

// ---------------------------------------------------------------------------
// Demo / mock response (when no API key)
// ---------------------------------------------------------------------------
function getMockResponse(platform: Platform): AnalysisResult {
  return {
    platform,
    tutorName: "Demo Tutor",
    overallScore: 68,
    sections: {
      headline: {
        score: 6,
        maxScore: 10,
        feedback:
          "Your headline is functional but generic. \"Experienced English tutor\" doesn't tell students what specific outcome they'll get. Try something like \"Business English coach – land your next promotion\" or \"IELTS specialist – average score improvement of 1.5 bands\".",
      },
      bio: {
        score: 7,
        maxScore: 10,
        feedback:
          "Your bio has good detail about your qualifications but reads a bit formal. Students want to feel a personal connection. Try opening with a relatable story or the specific transformation you create for students.",
      },
      differentiation: {
        score: 5,
        maxScore: 10,
        feedback:
          "Right now, your profile could belong to any of 10,000 English tutors. What's your unique angle? Maybe it's your industry background, your teaching method, or the specific results you deliver. Make that the centrepiece.",
      },
      pricing: {
        score: 8,
        maxScore: 10,
        feedback:
          "Your pricing is competitive for your experience level. Consider offering a slightly higher-priced \"premium\" package with extras like homework review or progress reports to capture higher-value students.",
      },
      keywords: {
        score: 6,
        maxScore: 10,
        feedback:
          "You mention some key terms but are missing high-search-volume phrases like \"conversation practice\", \"exam preparation\", and specific exam names (IELTS, TOEFL, Cambridge). Naturally weave these into your bio.",
      },
      reviews: {
        score: 7,
        maxScore: 10,
        feedback:
          "Your reviews are positive and mention your patience and structure. To strengthen them further, encourage students to mention specific outcomes or milestones they achieved working with you.",
      },
    },
    topRecommendations: [
      {
        title: "Rewrite your headline with a specific outcome",
        description:
          "Replace your generic headline with one that promises a clear result. Students searching for tutors scan headlines first – make yours impossible to skip. Example: \"Conversational fluency in 3 months – structured method with real results\".",
        impact: "high",
      },
      {
        title: "Add a personal story to your bio opening",
        description:
          "Start with why you teach, a moment with a student, or your own language learning journey. This builds instant rapport and makes your profile memorable among hundreds of similar ones.",
        impact: "high",
      },
      {
        title: "Include more searchable keywords naturally",
        description:
          "Weave in terms like \"business English\", \"IELTS preparation\", \"conversation practice\", and \"beginner-friendly\" throughout your bio. This helps students find you through platform search.",
        impact: "medium",
      },
    ],
    summary:
      "Your profile has a solid foundation with good qualifications and positive reviews. The biggest opportunity is differentiation – right now you blend in with thousands of similar profiles. A compelling headline, a personal bio opening, and strategic keyword placement could significantly increase your booking rate.",
  };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  // Rate limiting
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      {
        error:
          "Rate limit exceeded. You can analyse up to 5 profiles per hour. Please try again later.",
      },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();
    const { url, screenshot } = body as {
      url?: string;
      screenshot?: string;
    };

    // ---- Screenshot mode ----
    if (screenshot) {
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json(getMockResponse("preply"));
      }

      const detectedPlatform: Platform | null = url
        ? detectPlatform(url)?.platform ?? null
        : null;

      const analysis = await analyseScreenshotWithAI(
        screenshot,
        detectedPlatform,
      );

      return NextResponse.json({
        platform: detectedPlatform ?? "unknown",
        ...analysis,
      });
    }

    // ---- URL mode ----
    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Please provide a valid Preply or iTalki profile URL." },
        { status: 400 },
      );
    }

    const parsed = detectPlatform(url.trim());
    if (!parsed) {
      return NextResponse.json(
        {
          error:
            "Invalid URL. Please paste a Preply (preply.com/en/tutor/...) or iTalki (italki.com/en/teacher/...) profile link.",
        },
        { status: 400 },
      );
    }

    // No API key → return demo data
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(getMockResponse(parsed.platform));
    }

    // Fetch profile
    let profileText: string;
    try {
      const html = await fetchProfileHTML(url.trim());
      profileText = extractTextFromHTML(html);
    } catch (err) {
      console.error("[profile-analyser] Fetch error:", err);
      return NextResponse.json(
        {
          error:
            "Could not fetch that profile. The page may be private or temporarily unavailable. Try uploading a screenshot instead.",
        },
        { status: 422 },
      );
    }

    if (profileText.length < 100) {
      return NextResponse.json(
        {
          error:
            "Could not extract enough content from that profile. This can happen with iTalki profiles (they load dynamically). Try uploading a screenshot instead.",
        },
        { status: 422 },
      );
    }

    // Analyse
    const analysis = await analyseWithAI(profileText, parsed.platform);

    return NextResponse.json({
      platform: parsed.platform,
      ...analysis,
    } satisfies AnalysisResult);
  } catch (err) {
    console.error("[profile-analyser] Unexpected error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
