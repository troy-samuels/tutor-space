/**
 * Lesson Insights Analysis
 *
 * Analyzes lesson transcripts for grammar errors, vocabulary gaps, and fluency patterns.
 * Uses Deepgram for transcription and OpenAI for analysis.
 *
 * @google-compliance
 * This module sends data to OpenAI. Per GOOGLE_DATA_POLICY:
 * - Only Deepgram transcript text is analyzed (lesson audio transcriptions)
 * - External calendar data (calendar_events) is NEVER included
 * - See: lib/ai/google-compliance.ts
 */

import { assertGoogleDataIsolation } from "@/lib/ai/google-compliance";
import { routedChatCompletion } from "@/lib/ai/model-router";
import { identifyTutorSpeaker, parseDiarization, separateSpeakers } from "./speaker-diarization";

type TranscriptSegment = {
  text: string;
  start?: number | null;
  end?: number | null;
};

type TranscriptExtractionOptions = {
  role?: "all" | "student" | "tutor";
  tutorName?: string | null;
};

type KeyPoint = {
  kind: "strength" | "struggle";
  text: string;
  timestamp_seconds?: number | null;
};

type FluencyFlag = {
  type: "filler" | "pause" | "stutter";
  text: string;
  timestamp_seconds?: number | null;
};

type Drill = {
  content: DrillContent;
  focus_area?: string | null;
  source_timestamp_seconds?: number | null;
  drill_type?: "pronunciation" | "grammar" | "vocabulary" | "fluency";
};

type ScrambleContent = {
  type: "scramble";
  prompt?: string;
  data: { words: string[]; solution?: string[] };
};

type MatchContent = {
  type: "match";
  prompt?: string;
  data: { pairs: Array<{ id: string; left: string; right: string }> };
};

type GapFillContent = {
  type: "gap-fill";
  prompt?: string;
  data: { sentence: string; answer: string; options: string[] };
};

type DrillContent = ScrambleContent | MatchContent | GapFillContent;

// New types for OpenAI analysis
export type GrammarError = {
  type: "subject_verb" | "tense" | "article" | "preposition" | "word_order" | "conjugation" | "other";
  original: string;
  correction: string;
  explanation: string;
  timestamp_seconds?: number | null;
};

export type VocabGap = {
  type: "missing_word" | "wrong_word" | "level_mismatch";
  context: string;
  target_word: string;
  suggestion: string;
  timestamp_seconds?: number | null;
};

export type OpenAIAnalysisResult = {
  grammarErrors: GrammarError[];
  vocabGaps: VocabGap[];
  summary: string;
};

const FILLER_WORDS = ["um", "uh", "erm", "uhm", "like", "you know", "kind of", "sort of"];

function sanitizeText(text: string | null | undefined): string {
  if (!text || typeof text !== "string") return "";
  return text.replace(/\s+/g, " ").trim();
}

function normalizeForMatch(value: string): string {
  return sanitizeText(value)
    .toLowerCase()
    .replace(/[\u2019’]/g, "'")
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesNormalized(haystack: string, needle: string): boolean {
  const normalizedHaystack = normalizeForMatch(haystack);
  const normalizedNeedle = normalizeForMatch(needle);
  if (normalizedNeedle.length < 4) return false;
  return normalizedHaystack.includes(normalizedNeedle);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractSegments(transcriptJson: unknown, options?: TranscriptExtractionOptions): TranscriptSegment[] {
  const role = options?.role ?? "all";
  if (role !== "all") {
    const diarized = parseDiarization(transcriptJson);
    if (diarized.length > 0) {
      const tutorSpeakerId = identifyTutorSpeaker(diarized, options?.tutorName ?? undefined);
      const { tutorSegments, studentSegments } = separateSpeakers(diarized, tutorSpeakerId);
      const selected = role === "tutor" ? tutorSegments : studentSegments;
      const filtered = selected
        .map((segment) => ({
          text: sanitizeText(segment.text),
          start: segment.start ?? null,
          end: segment.end ?? null,
        }))
        .filter((segment) => segment.text.length > 0);
      if (filtered.length > 0) {
        return filtered;
      }
    }
  }

  if (typeof transcriptJson === "string") {
    const text = sanitizeText(transcriptJson);
    if (!text) return [];
    return text
      .split(/[.!?]/)
      .map((t) => sanitizeText(t))
      .filter(Boolean)
      .map((segmentText) => ({ text: segmentText }));
  }

  if (!transcriptJson || typeof transcriptJson !== "object") return [];

  // Deepgram format: channels[0].alternatives[0].paragraphs.paragraphs[].sentences[]
  const json = transcriptJson as any;
  const paragraphs = json?.channels?.[0]?.alternatives?.[0]?.paragraphs?.paragraphs;
  if (Array.isArray(paragraphs)) {
    const sentences = paragraphs.flatMap((p: any) => p.sentences || []);
    return sentences
      .map((s: any) => ({
        text: sanitizeText(s.text),
        start: s.start ?? s.start_time ?? null,
        end: s.end ?? s.end_time ?? null,
      }))
      .filter((s: TranscriptSegment) => s.text.length > 0);
  }

  // Fallback: simple transcript string
  const alt = json?.channels?.[0]?.alternatives?.[0];
  if (typeof alt?.transcript === "string") {
    return alt.transcript
      .split(/[.!?]/)
      .map((t: string) => sanitizeText(t))
      .filter(Boolean)
      .map((text: string) => ({ text }));
  }

  return [];
}

function scoreFillerFlags(segments: TranscriptSegment[]): FluencyFlag[] {
  const flags: FluencyFlag[] = [];
  segments.forEach((segment) => {
    const lower = segment.text.toLowerCase();
    const fillerHit = FILLER_WORDS.find((f) => lower.includes(` ${f} `) || lower.startsWith(`${f} `));
    if (fillerHit) {
      flags.push({
        type: "filler",
        text: segment.text,
        timestamp_seconds: segment.start ?? null,
      });
    }
    // Quick stutter heuristic: repeated first word
    const firstTwo = segment.text.split(" ").slice(0, 2).map((w) => w.toLowerCase());
    if (firstTwo.length === 2 && firstTwo[0] === firstTwo[1]) {
      flags.push({
        type: "stutter",
        text: segment.text,
        timestamp_seconds: segment.start ?? null,
      });
    }
  });
  return flags.slice(0, 8);
}

function scorePauseFlags(segments: TranscriptSegment[]): FluencyFlag[] {
  // If timestamps exist, find big gaps
  const timed = segments.filter((s) => typeof s.start === "number" && typeof s.end === "number");
  if (timed.length < 2) return [];

  const flags: FluencyFlag[] = [];
  for (let i = 1; i < timed.length; i++) {
    const gap = (timed[i].start ?? 0) - (timed[i - 1].end ?? 0);
    if (gap >= 2.5) {
      flags.push({
        type: "pause",
        text: timed[i].text,
        timestamp_seconds: timed[i].start ?? null,
      });
    }
  }
  return flags.slice(0, 5);
}

function buildKeyPoints(segments: TranscriptSegment[], flags: FluencyFlag[]): KeyPoint[] {
  const keyPoints: KeyPoint[] = [];

  // Strengths: clearer, longer sentences without flags
  const cleanSegments = segments.filter(
    (s) => !flags.some((f) => typeof f.timestamp_seconds === "number" && f.timestamp_seconds === s.start)
  );
  cleanSegments.slice(0, 2).forEach((s) =>
    keyPoints.push({
      kind: "strength",
      text: s.text,
      timestamp_seconds: s.start ?? null,
    })
  );

  // Struggles: map flags into points
  flags.slice(0, 3).forEach((f) =>
    keyPoints.push({
      kind: "struggle",
      text: f.text,
      timestamp_seconds: f.timestamp_seconds ?? null,
    })
  );

  return keyPoints.slice(0, 5);
}

function buildSummaryMd(segments: TranscriptSegment[]): string {
  if (!segments.length) return "No transcript available yet.";

  const sentences = segments.slice(0, 6).map((s) => `- ${s.text}`);
  const summary = sentences.join("\n");
  return `### Lesson summary\n${summary}`;
}

function buildDrills(flags: FluencyFlag[]): Drill[] {
  if (!flags.length) return [];

  return flags
    .slice(0, 5)
    .map((flag, index): Drill | null => {
      const words = sanitizeText(flag.text).split(" ").filter(Boolean).slice(0, 14);
      if (words.length < 3) return null;

      const drillType: Drill["drill_type"] =
        flag.type === "stutter" ? "pronunciation" : "fluency";

      const prompt =
        flag.type === "pause"
          ? "Put the words in the correct order, then read it smoothly."
          : flag.type === "filler"
            ? "Put the words in the correct order. Aim for a smooth, filler-free delivery."
            : "Put the words in the correct order, then say it clearly.";

      return {
        drill_type: drillType,
        focus_area: drillType === "fluency" ? "fluency" : "pronunciation",
        source_timestamp_seconds: flag.timestamp_seconds ?? null,
        content: {
          type: "scramble",
          prompt,
          data: { words },
        },
      };
    })
    .filter((d): d is Drill => Boolean(d));
}

export function analyzeTranscript(transcriptJson: unknown, options?: TranscriptExtractionOptions) {
  const segments = extractSegments(transcriptJson, options);
  const fillerFlags = scoreFillerFlags(segments);
  const pauseFlags = scorePauseFlags(segments);
  const flags = [...fillerFlags, ...pauseFlags].slice(0, 8);
  const keyPoints = buildKeyPoints(segments, flags);
  const summaryMd = buildSummaryMd(segments);
  const drills = buildDrills(flags);

  return {
    summaryMd,
    keyPoints,
    fluencyFlags: flags,
    drills,
  };
}

/**
 * Extract plain text from Deepgram transcript JSON for OpenAI analysis
 */
export function extractPlainText(transcriptJson: unknown, options?: TranscriptExtractionOptions): string {
  const segments = extractSegments(transcriptJson, options);
  return segments.map((s) => s.text).join(" ");
}

/**
 * Analyze transcript with OpenAI for grammar and vocabulary errors.
 * Uses gpt-4o-mini for cost-effective analysis.
 *
 * @google-compliance Input is Deepgram transcript text only (no calendar data)
 */
export async function analyzeWithOpenAI(transcript: string): Promise<OpenAIAnalysisResult> {
  // Skip if transcript is too short or OPENAI_API_KEY is not set
  if (!transcript || transcript.length < 50 || !process.env.OPENAI_API_KEY) {
    return { grammarErrors: [], vocabGaps: [], summary: "" };
  }

  try {
    // Google Compliance: Only transcript text (from lesson recordings) is sent to OpenAI
    assertGoogleDataIsolation({
      provider: "openai",
      context: "lesson-insights.analyzeWithOpenAI",
      data: { transcript },
      sources: ["lesson_recordings.transcript_json"],
    });

    const response = await routedChatCompletion(
      { task: "lesson_analysis" },
      {
        messages: [
          {
            role: "system",
            content: `You are a language learning analyst. Analyze this lesson transcript and identify:

1. Grammar errors: Find 0-5 grammar mistakes the student made. For each error, provide:
   - type: one of "subject_verb", "tense", "article", "preposition", "word_order", "conjugation", "other"
   - original: an exact verbatim quote from the transcript containing the error (must appear in the transcript)
   - correction: the corrected phrase
   - explanation: a brief, student-friendly explanation (1 sentence)

2. Vocabulary gaps: Find 0-5 vocabulary issues. For each gap, provide:
   - type: one of "missing_word" (couldn't find the word), "wrong_word" (used incorrect word), "level_mismatch" (word too simple/complex)
   - context: an exact verbatim quote from the transcript showing the issue (must appear in the transcript)
   - target_word: a word/phrase that appears inside the provided context
   - suggestion: what they should use instead

3. Summary: A brief 1-2 sentence summary of the main areas for improvement.

Return valid JSON only with this structure:
{
  "grammarErrors": [...],
  "vocabGaps": [...],
  "summary": "..."
}

Rules:
- Use ONLY information that appears in the transcript text. Do not infer or invent mistakes.
- If you cannot provide an exact verbatim quote for an item, omit that item.
- If the transcript is mostly from the tutor or there are no clear errors, return empty arrays.`,
          },
          {
            role: "user",
            content: transcript.slice(0, 8000), // Limit to ~8000 chars to control costs
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 1500,
        temperature: 0.3,
      }
    );

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { grammarErrors: [], vocabGaps: [], summary: "" };
    }

    const parsed = JSON.parse(content) as Partial<OpenAIAnalysisResult>;

    const grammarErrorsRaw = Array.isArray(parsed.grammarErrors) ? parsed.grammarErrors.slice(0, 5) : [];
    const vocabGapsRaw = Array.isArray(parsed.vocabGaps) ? parsed.vocabGaps.slice(0, 5) : [];

    const allowedGrammarTypes: GrammarError["type"][] = [
      "subject_verb",
      "tense",
      "article",
      "preposition",
      "word_order",
      "conjugation",
      "other",
    ];
    const allowedGrammarTypesSet = new Set<string>(allowedGrammarTypes);

    const allowedVocabTypes: VocabGap["type"][] = ["missing_word", "wrong_word", "level_mismatch"];
    const allowedVocabTypesSet = new Set<string>(allowedVocabTypes);

    function toFiniteNumberOrNull(value: unknown): number | null {
      if (typeof value === "number") return Number.isFinite(value) ? value : null;
      if (typeof value === "string") {
        const parsedNumber = Number.parseFloat(value);
        return Number.isFinite(parsedNumber) ? parsedNumber : null;
      }
      return null;
    }

    function coerceGrammarError(item: any): GrammarError | null {
      const original = typeof item?.original === "string" ? sanitizeText(item.original) : "";
      const correction = typeof item?.correction === "string" ? sanitizeText(item.correction) : "";
      const explanation = typeof item?.explanation === "string" ? sanitizeText(item.explanation) : "";
      if (!original || !correction || !explanation) return null;
      if (!includesNormalized(transcript, original)) return null;
      if (normalizeForMatch(original) === normalizeForMatch(correction)) return null;

      const typeRaw = typeof item?.type === "string" ? item.type : "other";
      const type: GrammarError["type"] = allowedGrammarTypesSet.has(typeRaw) ? (typeRaw as GrammarError["type"]) : "other";

      return {
        type,
        original,
        correction,
        explanation,
        timestamp_seconds: toFiniteNumberOrNull(item?.timestamp_seconds),
      };
    }

    function coerceVocabGap(item: any): VocabGap | null {
      const context = typeof item?.context === "string" ? sanitizeText(item.context) : "";
      const targetWord = typeof item?.target_word === "string" ? sanitizeText(item.target_word) : "";
      const suggestion = typeof item?.suggestion === "string" ? sanitizeText(item.suggestion) : "";
      if (!context || !targetWord || !suggestion) return null;
      if (!includesNormalized(context, targetWord)) return null;
      if (!includesNormalized(transcript, context)) return null;

      const typeRaw = typeof item?.type === "string" ? item.type : "missing_word";
      const type: VocabGap["type"] = allowedVocabTypesSet.has(typeRaw) ? (typeRaw as VocabGap["type"]) : "missing_word";

      return {
        type,
        context,
        target_word: targetWord,
        suggestion,
        timestamp_seconds: toFiniteNumberOrNull(item?.timestamp_seconds),
      };
    }

    const validatedGrammarErrors: GrammarError[] = grammarErrorsRaw
      .map(coerceGrammarError)
      .filter((item): item is GrammarError => Boolean(item))
      .slice(0, 5);

    const validatedVocabGaps: VocabGap[] = vocabGapsRaw
      .map(coerceVocabGap)
      .filter((item): item is VocabGap => Boolean(item))
      .slice(0, 5);

    const summary = typeof parsed.summary === "string" ? sanitizeText(parsed.summary) : "";
    const finalSummary =
      validatedGrammarErrors.length || validatedVocabGaps.length ? summary : "";

    return {
      grammarErrors: validatedGrammarErrors,
      vocabGaps: validatedVocabGaps,
      summary: finalSummary,
    };
  } catch (error) {
    console.error("[OpenAI Analysis] Error:", error);
    return { grammarErrors: [], vocabGaps: [], summary: "" };
  }
}

/**
 * Generate drills from grammar and vocabulary errors
 */
export function generateDrillsFromErrors(
  grammarErrors: GrammarError[],
  vocabGaps: VocabGap[]
): Drill[] {
  const drills: Drill[] = [];

  function dedupeStrings(values: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const value of values) {
      const cleaned = sanitizeText(value);
      const key = normalizeForMatch(cleaned);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      result.push(cleaned);
    }
    return result;
  }

  // Grammar drills: match incorrect -> corrected phrases (grounded in transcript quotes)
  const grammarPairs = grammarErrors
    .slice(0, 3)
    .map((error, idx) => {
      const left = sanitizeText(error.original);
      const right = sanitizeText(error.correction);
      if (!left || !right) return null;
      return { id: `g${idx + 1}`, left, right };
    })
    .filter((p): p is { id: string; left: string; right: string } => Boolean(p));

  if (grammarPairs.length) {
    drills.push({
      drill_type: "grammar",
      focus_area: "grammar",
      source_timestamp_seconds: grammarErrors.find((e) => typeof e.timestamp_seconds === "number")?.timestamp_seconds ?? null,
      content: {
        type: "match",
        prompt: "Match each incorrect phrase to the corrected phrase.",
        data: { pairs: grammarPairs },
      },
    });
  }

  // Vocabulary drills: gap-fill with grounded context and simple distractors
  const vocabCandidates = vocabGaps
    .slice(0, 3)
    .map((gap) => ({
      context: sanitizeText(gap.context),
      targetWord: sanitizeText(gap.target_word),
      suggestion: sanitizeText(gap.suggestion),
      timestamp_seconds: gap.timestamp_seconds ?? null,
    }))
    .filter((gap) => gap.context && gap.targetWord && gap.suggestion);

  const otherSuggestions = dedupeStrings(vocabCandidates.map((g) => g.suggestion));

  for (const gap of vocabCandidates) {
    const escapedTarget = escapeRegExp(gap.targetWord);
    const targetRegex = escapedTarget ? new RegExp(escapedTarget, "i") : null;
    if (!targetRegex || !targetRegex.test(gap.context)) continue;

    const sentence = gap.context.replace(targetRegex, "___");
    if (!sentence.includes("___")) continue;

    const options = dedupeStrings([
      gap.suggestion,
      gap.targetWord,
      ...otherSuggestions.filter((s) => normalizeForMatch(s) !== normalizeForMatch(gap.suggestion)),
    ]).slice(0, 4);

    if (!options.length || !options.some((o) => normalizeForMatch(o) === normalizeForMatch(gap.suggestion))) {
      continue;
    }

    drills.push({
      drill_type: "vocabulary",
      focus_area: "word_usage",
      source_timestamp_seconds: gap.timestamp_seconds,
      content: {
        type: "gap-fill",
        prompt: `Complete the sentence: ${sentence}`,
        data: {
          sentence,
          answer: gap.suggestion,
          options,
        },
      },
    });
  }

  return drills;
}
