/**
 * Speaker Diarization Parser
 *
 * Parses Deepgram transcription with speaker diarization to separate
 * tutor and student speech for accurate lesson analysis.
 */

// =============================================================================
// TYPES
// =============================================================================

export interface Word {
  word: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: number;
  punctuated_word?: string;
}

export interface SpeakerSegment {
  speaker: number;
  text: string;
  start: number;
  end: number;
  words: Word[];
  confidence: number;
}

export interface SpeakerTurn {
  speaker: number;
  segments: SpeakerSegment[];
  totalDuration: number;
  wordCount: number;
}

export interface DiarizedTranscript {
  segments: SpeakerSegment[];
  speakers: Map<number, SpeakerTurn>;
  totalDuration: number;
  speakerCount: number;
}

export interface SeparatedSpeech {
  tutorSegments: SpeakerSegment[];
  studentSegments: SpeakerSegment[];
  tutorSpeakerId: number;
  studentSpeakerId: number;
  tutorSpeakingTime: number;
  studentSpeakingTime: number;
  speakingRatio: number; // student / total
}

// =============================================================================
// DEEPGRAM RESPONSE TYPES
// =============================================================================

interface DeepgramWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: number;
  punctuated_word?: string;
}

interface DeepgramParagraph {
  sentences: Array<{
    text: string;
    start: number;
    end: number;
  }>;
  speaker?: number;
  num_words?: number;
  start?: number;
  end?: number;
}

interface DeepgramAlternative {
  transcript: string;
  confidence: number;
  words?: DeepgramWord[];
  paragraphs?: {
    transcript: string;
    paragraphs: DeepgramParagraph[];
  };
}

interface DeepgramChannel {
  alternatives: DeepgramAlternative[];
}

interface DeepgramResults {
  channels?: DeepgramChannel[];
  utterances?: Array<{
    speaker: number;
    transcript: string;
    start: number;
    end: number;
    confidence: number;
    words: DeepgramWord[];
  }>;
}

// =============================================================================
// PARSING FUNCTIONS
// =============================================================================

/**
 * Parse Deepgram response with diarization into speaker segments
 */
export function parseDiarization(transcriptJson: unknown): SpeakerSegment[] {
  if (!transcriptJson || typeof transcriptJson !== "object") {
    return [];
  }

  const json = transcriptJson as DeepgramResults;

  // Method 1: Use utterances if available (best for diarization)
  if (json.utterances && Array.isArray(json.utterances) && json.utterances.length > 0) {
    return parseUtterances(json.utterances);
  }

  // Method 2: Use paragraphs with speaker info
  const paragraphs = json.channels?.[0]?.alternatives?.[0]?.paragraphs?.paragraphs;
  if (Array.isArray(paragraphs) && paragraphs.length > 0) {
    return parseParagraphs(paragraphs, json.channels?.[0]?.alternatives?.[0]?.words || []);
  }

  // Method 3: Use words with speaker info
  const words = json.channels?.[0]?.alternatives?.[0]?.words;
  if (Array.isArray(words) && words.length > 0 && words.some((w) => w.speaker !== undefined)) {
    return parseWordsToSegments(words);
  }

  // Fallback: Return single segment with all text
  const transcript = json.channels?.[0]?.alternatives?.[0]?.transcript;
  if (transcript) {
    return [
      {
        speaker: 0,
        text: transcript,
        start: 0,
        end: 0,
        words: [],
        confidence: json.channels?.[0]?.alternatives?.[0]?.confidence || 0,
      },
    ];
  }

  return [];
}

/**
 * Parse Deepgram utterances (preferred method for diarization)
 */
function parseUtterances(
  utterances: Array<{
    speaker: number;
    transcript: string;
    start: number;
    end: number;
    confidence: number;
    words: DeepgramWord[];
  }>
): SpeakerSegment[] {
  return utterances.map((utterance) => ({
    speaker: utterance.speaker,
    text: utterance.transcript.trim(),
    start: utterance.start,
    end: utterance.end,
    confidence: utterance.confidence,
    words: utterance.words.map((w) => ({
      word: w.word,
      start: w.start,
      end: w.end,
      confidence: w.confidence,
      speaker: w.speaker,
      punctuated_word: w.punctuated_word,
    })),
  }));
}

/**
 * Parse Deepgram paragraphs with speaker info
 */
function parseParagraphs(
  paragraphs: DeepgramParagraph[],
  allWords: DeepgramWord[]
): SpeakerSegment[] {
  const segments: SpeakerSegment[] = [];

  for (const para of paragraphs) {
    const speaker = para.speaker ?? 0;
    const start = para.start ?? para.sentences?.[0]?.start ?? 0;
    const end = para.end ?? para.sentences?.[para.sentences.length - 1]?.end ?? 0;

    // Get words for this paragraph based on time range
    const paraWords = allWords.filter((w) => w.start >= start && w.end <= end);

    // Combine sentences into paragraph text
    const text = para.sentences?.map((s) => s.text).join(" ").trim() || "";

    if (text) {
      segments.push({
        speaker,
        text,
        start,
        end,
        confidence: paraWords.length > 0
          ? paraWords.reduce((sum, w) => sum + w.confidence, 0) / paraWords.length
          : 0,
        words: paraWords.map((w) => ({
          word: w.word,
          start: w.start,
          end: w.end,
          confidence: w.confidence,
          speaker: w.speaker,
          punctuated_word: w.punctuated_word,
        })),
      });
    }
  }

  return segments;
}

/**
 * Parse words into segments by speaker changes
 */
function parseWordsToSegments(words: DeepgramWord[]): SpeakerSegment[] {
  const segments: SpeakerSegment[] = [];
  let currentSegment: SpeakerSegment | null = null;

  for (const word of words) {
    const speaker = word.speaker ?? 0;

    if (!currentSegment || currentSegment.speaker !== speaker) {
      // Start new segment
      if (currentSegment) {
        segments.push(currentSegment);
      }
      currentSegment = {
        speaker,
        text: "",
        start: word.start,
        end: word.end,
        confidence: 0,
        words: [],
      };
    }

    // Add word to current segment
    const displayWord = word.punctuated_word || word.word;
    currentSegment.text += (currentSegment.text ? " " : "") + displayWord;
    currentSegment.end = word.end;
    currentSegment.words.push({
      word: word.word,
      start: word.start,
      end: word.end,
      confidence: word.confidence,
      speaker: word.speaker,
      punctuated_word: word.punctuated_word,
    });
  }

  if (currentSegment && currentSegment.words.length > 0) {
    // Calculate average confidence
    currentSegment.confidence =
      currentSegment.words.reduce((sum, w) => sum + w.confidence, 0) / currentSegment.words.length;
    segments.push(currentSegment);
  }

  return segments;
}

// =============================================================================
// SPEAKER IDENTIFICATION
// =============================================================================

/**
 * Identify which speaker is the tutor based on heuristics
 *
 * Heuristics used:
 * 1. Tutor typically speaks more (longer total duration)
 * 2. Tutor typically has longer individual segments (explanations)
 * 3. Tutor segments often contain teaching indicators (questions, explanations)
 * 4. If tutor name provided, look for greetings containing the name
 */
export function identifyTutorSpeaker(
  segments: SpeakerSegment[],
  tutorName?: string | null
): number {
  if (segments.length === 0) return 0;

  // Group segments by speaker
  const speakerStats = new Map<
    number,
    {
      totalDuration: number;
      totalWords: number;
      segmentCount: number;
      avgSegmentDuration: number;
      teachingIndicators: number;
      nameMatches: number;
    }
  >();

  // Teaching indicators - words/phrases that suggest tutor speech
  const teachingIndicators = [
    /\b(let me|let's|i'll|we'll)\b/i,
    /\b(explain|show|teach|tell you|learn)\b/i,
    /\b(repeat after me|say it|try again|one more time)\b/i,
    /\b(good|excellent|perfect|great job|well done)\b/i,
    /\b(remember|notice|pay attention|important)\b/i,
    /\b(for example|such as|like this)\b/i,
    /\b(the word|this word|this phrase|pronunciation)\b/i,
    /\b(grammar|vocabulary|sentence|conjugation)\b/i,
    /\?(.*)?$/m, // Questions often indicate teaching
  ];

  for (const segment of segments) {
    const stats = speakerStats.get(segment.speaker) || {
      totalDuration: 0,
      totalWords: 0,
      segmentCount: 0,
      avgSegmentDuration: 0,
      teachingIndicators: 0,
      nameMatches: 0,
    };

    const duration = segment.end - segment.start;
    stats.totalDuration += duration;
    stats.totalWords += segment.words.length;
    stats.segmentCount += 1;

    // Check for teaching indicators
    for (const indicator of teachingIndicators) {
      if (indicator.test(segment.text)) {
        stats.teachingIndicators += 1;
      }
    }

    // Check for tutor name in first few segments (introduction)
    if (tutorName && segment.start < 60) {
      const nameLower = tutorName.toLowerCase();
      const textLower = segment.text.toLowerCase();
      if (
        textLower.includes(`i'm ${nameLower}`) ||
        textLower.includes(`my name is ${nameLower}`) ||
        textLower.includes(`this is ${nameLower}`)
      ) {
        stats.nameMatches += 5; // Strong indicator
      }
    }

    speakerStats.set(segment.speaker, stats);
  }

  // Calculate scores for each speaker
  let bestSpeaker = 0;
  let bestScore = -Infinity;

  for (const [speaker, stats] of speakerStats) {
    stats.avgSegmentDuration = stats.totalDuration / Math.max(1, stats.segmentCount);

    // Score calculation:
    // - More speaking time = more likely tutor
    // - Longer average segments = more likely tutor (explanations)
    // - Teaching indicators = more likely tutor
    // - Name matches = definitive tutor
    const score =
      stats.totalDuration * 1.0 +
      stats.avgSegmentDuration * 2.0 +
      stats.teachingIndicators * 10.0 +
      stats.nameMatches * 100.0;

    if (score > bestScore) {
      bestScore = score;
      bestSpeaker = speaker;
    }
  }

  return bestSpeaker;
}

/**
 * Separate segments by tutor and student
 */
export function separateSpeakers(
  segments: SpeakerSegment[],
  tutorSpeakerId: number
): SeparatedSpeech {
  const tutorSegments: SpeakerSegment[] = [];
  const studentSegments: SpeakerSegment[] = [];

  let tutorSpeakingTime = 0;
  let studentSpeakingTime = 0;
  let studentSpeakerId = -1;

  for (const segment of segments) {
    const duration = segment.end - segment.start;

    if (segment.speaker === tutorSpeakerId) {
      tutorSegments.push(segment);
      tutorSpeakingTime += duration;
    } else {
      studentSegments.push(segment);
      studentSpeakingTime += duration;
      // Track the most common non-tutor speaker as student
      if (studentSpeakerId === -1 || segment.speaker < studentSpeakerId) {
        studentSpeakerId = segment.speaker;
      }
    }
  }

  // Default student speaker ID if not found
  if (studentSpeakerId === -1) {
    studentSpeakerId = tutorSpeakerId === 0 ? 1 : 0;
  }

  const totalSpeakingTime = tutorSpeakingTime + studentSpeakingTime;
  const speakingRatio = totalSpeakingTime > 0 ? studentSpeakingTime / totalSpeakingTime : 0;

  return {
    tutorSegments,
    studentSegments,
    tutorSpeakerId,
    studentSpeakerId,
    tutorSpeakingTime,
    studentSpeakingTime,
    speakingRatio,
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get full diarized transcript with speaker statistics
 */
export function getDiarizedTranscript(segments: SpeakerSegment[]): DiarizedTranscript {
  const speakers = new Map<number, SpeakerTurn>();
  let totalDuration = 0;

  for (const segment of segments) {
    const turn = speakers.get(segment.speaker) || {
      speaker: segment.speaker,
      segments: [],
      totalDuration: 0,
      wordCount: 0,
    };

    turn.segments.push(segment);
    const duration = segment.end - segment.start;
    turn.totalDuration += duration;
    turn.wordCount += segment.words.length;
    totalDuration = Math.max(totalDuration, segment.end);

    speakers.set(segment.speaker, turn);
  }

  return {
    segments,
    speakers,
    totalDuration,
    speakerCount: speakers.size,
  };
}

/**
 * Extract plain text from segments
 */
export function extractTextFromSegments(segments: SpeakerSegment[]): string {
  return segments.map((s) => s.text).join(" ");
}

/**
 * Get segments within a time range
 */
export function getSegmentsInRange(
  segments: SpeakerSegment[],
  startTime: number,
  endTime: number
): SpeakerSegment[] {
  return segments.filter(
    (s) =>
      (s.start >= startTime && s.start < endTime) ||
      (s.end > startTime && s.end <= endTime) ||
      (s.start <= startTime && s.end >= endTime)
  );
}

/**
 * Calculate turn-taking statistics
 */
export function calculateTurnTaking(segments: SpeakerSegment[]): {
  turnCount: number;
  avgTurnDuration: number;
  avgGapBetweenTurns: number;
  turnsBySpeaker: Map<number, number>;
} {
  const turnsByPlayer = new Map<number, number>();
  let turnCount = 0;
  let totalTurnDuration = 0;
  let totalGap = 0;
  let gapCount = 0;
  let lastEnd = 0;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const speaker = segment.speaker;

    // Count turns
    turnCount++;
    turnsByPlayer.set(speaker, (turnsByPlayer.get(speaker) || 0) + 1);

    // Duration
    totalTurnDuration += segment.end - segment.start;

    // Gap to previous segment
    if (i > 0 && segment.start > lastEnd) {
      totalGap += segment.start - lastEnd;
      gapCount++;
    }

    lastEnd = segment.end;
  }

  return {
    turnCount,
    avgTurnDuration: turnCount > 0 ? totalTurnDuration / turnCount : 0,
    avgGapBetweenTurns: gapCount > 0 ? totalGap / gapCount : 0,
    turnsBySpeaker: turnsByPlayer,
  };
}

/**
 * Find response latencies (time between end of one speaker and start of next)
 */
export function findResponseLatencies(
  segments: SpeakerSegment[],
  targetSpeaker: number
): number[] {
  const latencies: number[] = [];

  for (let i = 1; i < segments.length; i++) {
    const current = segments[i];
    const previous = segments[i - 1];

    // If target speaker is responding to a different speaker
    if (current.speaker === targetSpeaker && previous.speaker !== targetSpeaker) {
      const latency = current.start - previous.end;
      if (latency > 0 && latency < 30) {
        // Ignore gaps > 30s as they're likely interruptions
        latencies.push(latency);
      }
    }
  }

  return latencies;
}
