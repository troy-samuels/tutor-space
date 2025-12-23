/**
 * Speaker Diarization Unit Tests
 *
 * Tests for the speaker diarization parsing and speaker identification logic.
 */

import test, { describe } from "node:test";
import assert from "node:assert/strict";

import {
  parseDiarization,
  identifyTutorSpeaker,
  separateSpeakers,
  getDiarizedTranscript,
  extractTextFromSegments,
  calculateTurnTaking,
  findResponseLatencies,
  type SpeakerSegment,
} from "@/lib/analysis/speaker-diarization";

import {
  MockDeepgramResponses,
  createMockDeepgramResult,
  createMockDeepgramUtterance,
  createMockDeepgramWord,
} from "../../mocks/deepgram-mocks.ts";

import {
  assertValidSpeakerSegment,
  assertSegmentsOrdered,
  assertMultipleSpeakers,
} from "../../utils/assertions.ts";

// ============================================
// parseDiarization Tests
// ============================================

describe("parseDiarization", () => {
  test("extracts segments from Deepgram utterances format", () => {
    const transcript = MockDeepgramResponses.twoSpeakerLesson({
      tutorSegments: 3,
      studentSegments: 3,
    });

    const segments = parseDiarization(transcript);

    assert.ok(segments.length > 0, "Should extract segments");
    assert.equal(segments.length, 6, "Should have 6 segments (3 tutor + 3 student)");

    // Validate each segment
    for (const segment of segments) {
      assertValidSpeakerSegment(segment);
    }
  });

  test("extracts segments from words format when utterances not available", () => {
    const words = [
      createMockDeepgramWord({ word: "Hello", start: 0, end: 0.3, speaker: 0 }),
      createMockDeepgramWord({ word: "there", start: 0.4, end: 0.7, speaker: 0 }),
      createMockDeepgramWord({ word: "Hi", start: 1.0, end: 1.2, speaker: 1 }),
      createMockDeepgramWord({ word: "tutor", start: 1.3, end: 1.6, speaker: 1 }),
    ];

    const transcript = createMockDeepgramResult({ words });
    const segments = parseDiarization(transcript);

    assert.ok(segments.length > 0, "Should extract segments from words");
    assertMultipleSpeakers(segments, 2);
  });

  test("handles empty transcript", () => {
    const transcript = MockDeepgramResponses.emptyTranscript();
    const segments = parseDiarization(transcript);

    assert.deepEqual(segments, [], "Should return empty array for empty transcript");
  });

  test("handles single speaker transcript", () => {
    const transcript = MockDeepgramResponses.singleSpeaker();
    const segments = parseDiarization(transcript);

    assert.ok(segments.length > 0, "Should extract segments");

    const speakers = new Set(segments.map((s) => s.speaker));
    assert.equal(speakers.size, 1, "Should have only one speaker");
  });

  test("preserves language codes for code-switching", () => {
    const transcript = MockDeepgramResponses.englishSpanishMixed();
    const segments = parseDiarization(transcript);

    assert.ok(segments.length > 0, "Should extract segments");

    // At least one segment should have language information
    const hasLanguages = segments.some(
      (seg) => seg.languages && seg.languages.length > 0
    );
    assert.ok(hasLanguages, "Should preserve language codes from Deepgram");

    // Check for multiple languages in code-switched content
    const allLanguages = new Set<string>();
    for (const seg of segments) {
      if (seg.languages) {
        for (const lang of seg.languages) {
          allLanguages.add(lang);
        }
      }
    }

    assert.ok(
      allLanguages.size >= 2,
      "Should detect multiple languages in code-switched content"
    );
  });

  test("handles null/undefined input gracefully", () => {
    assert.deepEqual(parseDiarization(null), []);
    assert.deepEqual(parseDiarization(undefined), []);
    assert.deepEqual(parseDiarization({}), []);
    assert.deepEqual(parseDiarization("invalid"), []);
  });

  test("maintains chronological order of segments", () => {
    const transcript = MockDeepgramResponses.twoSpeakerLesson({
      tutorSegments: 5,
      studentSegments: 5,
    });

    const segments = parseDiarization(transcript);

    assertSegmentsOrdered(segments);
  });

  test("calculates average confidence for segments", () => {
    const transcript = MockDeepgramResponses.twoSpeakerLesson({
      tutorSegments: 2,
      studentSegments: 2,
    });

    const segments = parseDiarization(transcript);

    for (const segment of segments) {
      assert.ok(
        segment.confidence >= 0 && segment.confidence <= 1,
        `Confidence should be between 0 and 1, got ${segment.confidence}`
      );
    }
  });
});

// ============================================
// identifyTutorSpeaker Tests
// ============================================

describe("identifyTutorSpeaker", () => {
  test("returns speaker with most words/duration", () => {
    const segments: SpeakerSegment[] = [
      {
        speaker: 0,
        text: "Hello, today we will learn about verbs. This is a very important topic in grammar.",
        start: 0,
        end: 8,
        words: [],
        confidence: 0.95,
      },
      {
        speaker: 1,
        text: "OK",
        start: 8.5,
        end: 9,
        words: [],
        confidence: 0.95,
      },
      {
        speaker: 0,
        text: "Verbs are action words. They describe what we do, what we think, or how we feel.",
        start: 10,
        end: 18,
        words: [],
        confidence: 0.95,
      },
      {
        speaker: 1,
        text: "I see",
        start: 19,
        end: 20,
        words: [],
        confidence: 0.95,
      },
    ];

    const tutorId = identifyTutorSpeaker(segments);

    // Speaker 0 has much more speaking time and words
    assert.equal(tutorId, 0, "Should identify speaker with more content as tutor");
  });

  test("detects teaching indicators in speech", () => {
    const segments: SpeakerSegment[] = [
      {
        speaker: 0,
        text: "Let me explain how this works.",
        start: 0,
        end: 3,
        words: [],
        confidence: 0.95,
      },
      {
        speaker: 1,
        text: "I went to the store yesterday and bought some things.",
        start: 4,
        end: 8,
        words: [],
        confidence: 0.95,
      },
      {
        speaker: 0,
        text: "Excellent! Good job. Now repeat after me.",
        start: 9,
        end: 12,
        words: [],
        confidence: 0.95,
      },
    ];

    const tutorId = identifyTutorSpeaker(segments);

    // Speaker 0 uses teaching indicators
    assert.equal(tutorId, 0, "Should identify speaker with teaching indicators as tutor");
  });

  test("uses name matching for tutor identification", () => {
    const segments: SpeakerSegment[] = [
      {
        speaker: 0,
        text: "Hello, I'm Sarah, your English tutor for today.",
        start: 0,
        end: 4,
        words: [],
        confidence: 0.95,
      },
      {
        speaker: 1,
        text: "Hi Sarah, nice to meet you. I'm ready to learn.",
        start: 5,
        end: 9,
        words: [],
        confidence: 0.95,
      },
    ];

    const tutorId = identifyTutorSpeaker(segments, "Sarah");

    assert.equal(tutorId, 0, "Should identify speaker who introduces themselves as tutor");
  });

  test("handles empty segments array", () => {
    const tutorId = identifyTutorSpeaker([]);
    assert.equal(tutorId, 0, "Should return 0 for empty segments");
  });

  test("handles equal speaking time (tie-breaker)", () => {
    const segments: SpeakerSegment[] = [
      {
        speaker: 0,
        text: "Hello there",
        start: 0,
        end: 2,
        words: [],
        confidence: 0.95,
      },
      {
        speaker: 1,
        text: "Hi there too",
        start: 2.5,
        end: 4.5,
        words: [],
        confidence: 0.95,
      },
    ];

    const tutorId = identifyTutorSpeaker(segments);

    // First speaker should win in tie
    assert.equal(tutorId, 0, "Should return first speaker in case of tie");
  });

  test("prioritizes questions as tutor indicator", () => {
    const segments: SpeakerSegment[] = [
      {
        speaker: 0,
        text: "What did you do yesterday? How was your weekend?",
        start: 0,
        end: 4,
        words: [],
        confidence: 0.95,
      },
      {
        speaker: 1,
        text: "I went to the park. It was nice. I had fun.",
        start: 5,
        end: 9,
        words: [],
        confidence: 0.95,
      },
    ];

    const tutorId = identifyTutorSpeaker(segments);

    // Speaker asking questions is likely the tutor
    assert.equal(tutorId, 0, "Should identify question-asker as tutor");
  });
});

// ============================================
// separateSpeakers Tests
// ============================================

describe("separateSpeakers", () => {
  test("correctly separates tutor and student segments", () => {
    const segments: SpeakerSegment[] = [
      { speaker: 0, text: "Hello", start: 0, end: 1, words: [], confidence: 0.95 },
      { speaker: 1, text: "Hi", start: 1.5, end: 2, words: [], confidence: 0.95 },
      { speaker: 0, text: "How are you?", start: 2.5, end: 4, words: [], confidence: 0.95 },
      { speaker: 1, text: "I'm fine", start: 4.5, end: 5.5, words: [], confidence: 0.95 },
    ];

    const result = separateSpeakers(segments, 0);

    assert.equal(result.tutorSegments.length, 2, "Should have 2 tutor segments");
    assert.equal(result.studentSegments.length, 2, "Should have 2 student segments");
    assert.equal(result.tutorSpeakerId, 0);
    assert.equal(result.studentSpeakerId, 1);
  });

  test("calculates speaking ratio accurately", () => {
    const segments: SpeakerSegment[] = [
      { speaker: 0, text: "Tutor speaking for 10 seconds", start: 0, end: 10, words: [], confidence: 0.95 },
      { speaker: 1, text: "Student speaking for 5 seconds", start: 11, end: 16, words: [], confidence: 0.95 },
    ];

    const result = separateSpeakers(segments, 0);

    // Student spoke 5 out of 15 seconds = 0.333...
    assert.ok(
      Math.abs(result.speakingRatio - 5 / 15) < 0.01,
      `Speaking ratio should be ~0.33, got ${result.speakingRatio}`
    );
  });

  test("calculates speaking times correctly", () => {
    const segments: SpeakerSegment[] = [
      { speaker: 0, text: "A", start: 0, end: 5, words: [], confidence: 0.95 },
      { speaker: 1, text: "B", start: 6, end: 10, words: [], confidence: 0.95 },
      { speaker: 0, text: "C", start: 11, end: 15, words: [], confidence: 0.95 },
    ];

    const result = separateSpeakers(segments, 0);

    assert.equal(result.tutorSpeakingTime, 9, "Tutor speaking time should be 9 seconds");
    assert.equal(result.studentSpeakingTime, 4, "Student speaking time should be 4 seconds");
  });

  test("handles single speaker correctly", () => {
    const segments: SpeakerSegment[] = [
      { speaker: 0, text: "Only tutor", start: 0, end: 10, words: [], confidence: 0.95 },
    ];

    const result = separateSpeakers(segments, 0);

    assert.equal(result.tutorSegments.length, 1);
    assert.equal(result.studentSegments.length, 0);
    assert.equal(result.speakingRatio, 0, "Speaking ratio should be 0 when no student");
  });
});

// ============================================
// getDiarizedTranscript Tests
// ============================================

describe("getDiarizedTranscript", () => {
  test("returns speaker statistics", () => {
    const transcript = MockDeepgramResponses.twoSpeakerLesson({
      tutorSegments: 3,
      studentSegments: 3,
    });

    const segments = parseDiarization(transcript);
    const result = getDiarizedTranscript(segments);

    assert.equal(result.speakerCount, 2, "Should have 2 speakers");
    assert.ok(result.totalDuration > 0, "Should have positive duration");
    assert.equal(result.segments.length, segments.length);

    // Check speaker turn statistics
    assert.ok(result.speakers.has(0), "Should have speaker 0");
    assert.ok(result.speakers.has(1), "Should have speaker 1");

    const speaker0 = result.speakers.get(0)!;
    assert.equal(speaker0.segments.length, 3, "Speaker 0 should have 3 segments");
  });
});

// ============================================
// extractTextFromSegments Tests
// ============================================

describe("extractTextFromSegments", () => {
  test("concatenates all segment text", () => {
    const segments: SpeakerSegment[] = [
      { speaker: 0, text: "Hello", start: 0, end: 1, words: [], confidence: 0.95 },
      { speaker: 1, text: "Hi", start: 1.5, end: 2, words: [], confidence: 0.95 },
      { speaker: 0, text: "How are you?", start: 2.5, end: 4, words: [], confidence: 0.95 },
    ];

    const text = extractTextFromSegments(segments);

    assert.equal(text, "Hello Hi How are you?");
  });

  test("handles empty segments", () => {
    const text = extractTextFromSegments([]);
    assert.equal(text, "");
  });
});

// ============================================
// calculateTurnTaking Tests
// ============================================

describe("calculateTurnTaking", () => {
  test("calculates turn count correctly", () => {
    const segments: SpeakerSegment[] = [
      { speaker: 0, text: "A", start: 0, end: 2, words: [], confidence: 0.95 },
      { speaker: 1, text: "B", start: 3, end: 4, words: [], confidence: 0.95 },
      { speaker: 0, text: "C", start: 5, end: 7, words: [], confidence: 0.95 },
      { speaker: 1, text: "D", start: 8, end: 9, words: [], confidence: 0.95 },
    ];

    const stats = calculateTurnTaking(segments);

    assert.equal(stats.turnCount, 4, "Should have 4 turns");
    assert.equal(stats.turnsBySpeaker.get(0), 2, "Speaker 0 should have 2 turns");
    assert.equal(stats.turnsBySpeaker.get(1), 2, "Speaker 1 should have 2 turns");
  });

  test("calculates average turn duration", () => {
    const segments: SpeakerSegment[] = [
      { speaker: 0, text: "A", start: 0, end: 4, words: [], confidence: 0.95 }, // 4 seconds
      { speaker: 1, text: "B", start: 5, end: 7, words: [], confidence: 0.95 }, // 2 seconds
    ];

    const stats = calculateTurnTaking(segments);

    assert.equal(stats.avgTurnDuration, 3, "Average turn duration should be 3 seconds");
  });

  test("calculates gap between turns", () => {
    const segments: SpeakerSegment[] = [
      { speaker: 0, text: "A", start: 0, end: 2, words: [], confidence: 0.95 },
      { speaker: 1, text: "B", start: 4, end: 5, words: [], confidence: 0.95 }, // 2 second gap
      { speaker: 0, text: "C", start: 6, end: 7, words: [], confidence: 0.95 }, // 1 second gap
    ];

    const stats = calculateTurnTaking(segments);

    assert.equal(stats.avgGapBetweenTurns, 1.5, "Average gap should be 1.5 seconds");
  });
});

// ============================================
// findResponseLatencies Tests
// ============================================

describe("findResponseLatencies", () => {
  test("finds response latencies for target speaker", () => {
    const segments: SpeakerSegment[] = [
      { speaker: 0, text: "Question?", start: 0, end: 2, words: [], confidence: 0.95 },
      { speaker: 1, text: "Answer", start: 3, end: 4, words: [], confidence: 0.95 }, // 1 second latency
      { speaker: 0, text: "Another question?", start: 5, end: 7, words: [], confidence: 0.95 },
      { speaker: 1, text: "Another answer", start: 8.5, end: 10, words: [], confidence: 0.95 }, // 1.5 second latency
    ];

    const latencies = findResponseLatencies(segments, 1);

    assert.equal(latencies.length, 2, "Should find 2 response latencies");
    assert.equal(latencies[0], 1, "First latency should be 1 second");
    assert.equal(latencies[1], 1.5, "Second latency should be 1.5 seconds");
  });

  test("ignores very long gaps (>30s)", () => {
    const segments: SpeakerSegment[] = [
      { speaker: 0, text: "Question?", start: 0, end: 2, words: [], confidence: 0.95 },
      { speaker: 1, text: "Answer", start: 35, end: 36, words: [], confidence: 0.95 }, // 33 second gap (ignored)
    ];

    const latencies = findResponseLatencies(segments, 1);

    assert.equal(latencies.length, 0, "Should ignore gaps > 30 seconds");
  });

  test("handles empty segments", () => {
    const latencies = findResponseLatencies([], 1);
    assert.deepEqual(latencies, []);
  });
});

// ============================================
// Integration with Deepgram mock scenarios
// ============================================

describe("Integration with mock scenarios", () => {
  test("handles Japanese student English lesson with L1 patterns", () => {
    const transcript = MockDeepgramResponses.japaneseStudentEnglish();
    const segments = parseDiarization(transcript);

    assert.ok(segments.length > 0, "Should parse segments");
    assertMultipleSpeakers(segments, 2);

    const tutorId = identifyTutorSpeaker(segments);
    const { tutorSegments, studentSegments } = separateSpeakers(segments, tutorId);

    assert.ok(tutorSegments.length > 0, "Should have tutor segments");
    assert.ok(studentSegments.length > 0, "Should have student segments");

    // Check for L1 interference indicators in student speech
    const studentText = extractTextFromSegments(studentSegments);
    assert.ok(
      studentText.includes("went to park") || studentText.includes("many book"),
      "Should contain L1 interference examples"
    );
  });

  test("handles long lesson with many segments", () => {
    const transcript = MockDeepgramResponses.longLesson({ durationMinutes: 30 });
    const segments = parseDiarization(transcript);

    assert.ok(segments.length > 50, "Should have many segments for 30 min lesson");
    assertSegmentsOrdered(segments);

    const stats = calculateTurnTaking(segments);
    assert.ok(stats.turnCount > 50, "Should have many turns");
  });

  test("handles lesson with filler words", () => {
    const transcript = MockDeepgramResponses.withFillerWords();
    const segments = parseDiarization(transcript);

    const allText = extractTextFromSegments(segments);

    // Check that filler words are preserved
    assert.ok(
      allText.toLowerCase().includes("um") || allText.toLowerCase().includes("uh"),
      "Should preserve filler words in transcript"
    );
  });

  test("handles lesson with confusion indicators", () => {
    const transcript = MockDeepgramResponses.withConfusion();
    const segments = parseDiarization(transcript);

    const allText = extractTextFromSegments(segments);

    // Check for confusion phrases
    assert.ok(
      allText.toLowerCase().includes("don't understand") ||
        allText.toLowerCase().includes("confused"),
      "Should contain confusion indicators"
    );
  });
});
