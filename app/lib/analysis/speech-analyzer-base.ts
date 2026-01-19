import type { SpeakerSegment } from "./speaker-diarization";

export type PromptFormatOptions = {
  maxPromptChars?: number;
  maxSegments?: number;
  headSegments?: number;
  tailSegments?: number;
  minSegments?: number;
  minSegmentChars?: number;
  segmentMaxChars?: number;
};

const DEFAULT_PROMPT_OPTIONS = {
  maxPromptChars: 12000,
  maxSegments: 160,
  headSegments: 20,
  tailSegments: 20,
  minSegments: 40,
  minSegmentChars: 120,
  segmentMaxChars: 240,
};

export abstract class SpeechAnalyzerBase {
  protected static readonly FILLER_WORDS: Record<string, string[]> = {
    en: ["um", "uh", "like", "you know", "kind of", "sort of", "basically", "actually", "right", "well"],
    es: ["eh", "este", "o sea", "pues", "bueno", "entonces", "como", "digamos"],
    fr: ["euh", "ben", "genre", "en fait", "quoi", "donc", "voilà"],
    de: ["äh", "ähm", "also", "halt", "sozusagen", "irgendwie", "na ja"],
    pt: ["é", "tipo", "né", "assim", "então", "bom", "tipo assim"],
    it: ["ehm", "cioè", "allora", "praticamente", "insomma", "tipo"],
    ja: ["えーと", "あの", "その", "なんか", "まあ"],
    ko: ["음", "어", "그", "저", "이제"],
    zh: ["那个", "嗯", "就是", "然后"],
  };

  protected getBaseLanguage(language: string | undefined): string {
    if (!language) return "en";
    const base = language.split(/[-_]/)[0]?.toLowerCase();
    return base && base.length > 0 ? base : "en";
  }

  protected getFillerWords(language?: string): string[] {
    const baseLanguage = this.getBaseLanguage(language);
    return SpeechAnalyzerBase.FILLER_WORDS[baseLanguage] || SpeechAnalyzerBase.FILLER_WORDS.en;
  }

  protected truncateText(value: string, maxChars: number): string {
    if (value.length <= maxChars) return value;
    return value.slice(0, maxChars).trimEnd();
  }

  protected selectRepresentativeSegments(
    segments: SpeakerSegment[],
    maxSegments: number,
    headCount: number,
    tailCount: number
  ): SpeakerSegment[] {
    if (segments.length <= maxSegments) return segments;
    const normalizedHead = Math.min(headCount, maxSegments);
    const normalizedTail = Math.min(tailCount, Math.max(0, maxSegments - normalizedHead));
    const middleCount = Math.max(0, maxSegments - normalizedHead - normalizedTail);

    const selected: SpeakerSegment[] = [];
    selected.push(...segments.slice(0, normalizedHead));

    if (middleCount > 0) {
      const startIdx = normalizedHead;
      const endIdx = Math.max(startIdx, segments.length - normalizedTail);
      const middle = segments.slice(startIdx, endIdx);

      if (middle.length > 0) {
        for (let i = 0; i < middleCount; i++) {
          const ratio = middleCount === 1 ? 0 : i / (middleCount - 1);
          const index = Math.min(middle.length - 1, Math.floor(ratio * (middle.length - 1)));
          selected.push(middle[index]!);
        }
      }
    }

    if (normalizedTail > 0) {
      selected.push(...segments.slice(-normalizedTail));
    }

    const byStart = new Map<number, SpeakerSegment>();
    for (const segment of selected) {
      byStart.set(segment.start, segment);
    }

    return Array.from(byStart.values()).sort((a, b) => a.start - b.start);
  }

  protected formatSegmentsForPrompt(
    segments: SpeakerSegment[],
    options: PromptFormatOptions = {}
  ): string {
    const {
      maxPromptChars,
      maxSegments,
      headSegments,
      tailSegments,
      minSegments,
      minSegmentChars,
      segmentMaxChars,
    } = { ...DEFAULT_PROMPT_OPTIONS, ...options };

    const cleaned = segments
      .filter((segment) => typeof segment.text === "string" && segment.text.trim().length > 0)
      .slice()
      .sort((a, b) => a.start - b.start);

    if (cleaned.length === 0) return "";

    let segmentCount = Math.min(maxSegments, cleaned.length);
    let maxCharsPerSegment = segmentMaxChars;

    while (true) {
      const selected = this.selectRepresentativeSegments(
        cleaned,
        segmentCount,
        headSegments,
        tailSegments
      );
      const formatted = selected
        .map((segment) => `[${segment.start.toFixed(1)}s] ${this.truncateText(segment.text.trim(), maxCharsPerSegment)}`)
        .join("\n");

      if (formatted.length <= maxPromptChars) return formatted;

      if (segmentCount > minSegments) {
        segmentCount = Math.max(minSegments, Math.floor(segmentCount * 0.8));
        continue;
      }

      if (maxCharsPerSegment > minSegmentChars) {
        maxCharsPerSegment = Math.max(minSegmentChars, Math.floor(maxCharsPerSegment * 0.8));
        continue;
      }

      return formatted.slice(0, maxPromptChars);
    }
  }
}
