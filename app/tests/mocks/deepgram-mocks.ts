/**
 * Deepgram Mock Utilities for Enterprise-Grade Testing
 *
 * Provides factories for creating mock Deepgram transcription objects:
 * - Words with timing, speaker, and language data
 * - Utterances with diarization
 * - Full transcription results
 * - Scenario-specific transcripts (bilingual, L1 interference, etc.)
 */

// ============================================
// ID GENERATORS
// ============================================

let idCounter = 0;

export function generateDeepgramId(prefix: string): string {
  return `${prefix}_test_${Date.now()}_${++idCounter}`;
}

export const generateUtteranceId = () => generateDeepgramId("utt");
export const generateRequestId = () => generateDeepgramId("req");

// ============================================
// TYPES (Matching Deepgram SDK response structure)
// ============================================

export interface MockDeepgramWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: number;
  punctuated_word?: string;
  language?: string; // BCP-47 code (e.g., "en", "es", "ja")
}

export interface MockDeepgramUtterance {
  id: string;
  start: number;
  end: number;
  confidence: number;
  channel: number;
  transcript: string;
  words: MockDeepgramWord[];
  speaker: number;
}

export interface MockDeepgramParagraph {
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

export interface MockDeepgramAlternative {
  transcript: string;
  confidence: number;
  words?: MockDeepgramWord[];
  paragraphs?: {
    transcript: string;
    paragraphs: MockDeepgramParagraph[];
  };
}

export interface MockDeepgramChannel {
  alternatives: MockDeepgramAlternative[];
}

export interface MockDeepgramResult {
  channels?: MockDeepgramChannel[];
  utterances?: MockDeepgramUtterance[];
  metadata?: {
    request_id: string;
    created: string;
    duration: number;
    channels: number;
    models: string[];
  };
}

// ============================================
// WORD FACTORY
// ============================================

export interface CreateWordOptions {
  word?: string;
  start?: number;
  end?: number;
  confidence?: number;
  speaker?: number;
  language?: string;
}

export function createMockDeepgramWord(options: CreateWordOptions = {}): MockDeepgramWord {
  const word = options.word || "hello";
  return {
    word: word.toLowerCase().replace(/[.,!?]/g, ""),
    start: options.start ?? 0,
    end: options.end ?? 0.5,
    confidence: options.confidence ?? 0.95,
    speaker: options.speaker,
    punctuated_word: word,
    language: options.language,
  };
}

// ============================================
// UTTERANCE FACTORY
// ============================================

export interface CreateUtteranceOptions {
  id?: string;
  speaker?: number;
  transcript?: string;
  start?: number;
  end?: number;
  confidence?: number;
  words?: MockDeepgramWord[];
  language?: string;
}

export function createMockDeepgramUtterance(
  options: CreateUtteranceOptions = {}
): MockDeepgramUtterance {
  const transcript = options.transcript || "Hello, how are you today?";
  const words = options.words || createWordsFromTranscript(transcript, {
    startTime: options.start ?? 0,
    speaker: options.speaker ?? 0,
    language: options.language,
  });

  const start = options.start ?? words[0]?.start ?? 0;
  const end = options.end ?? words[words.length - 1]?.end ?? start + 2;

  return {
    id: options.id || generateUtteranceId(),
    start,
    end,
    confidence: options.confidence ?? 0.95,
    channel: 0,
    transcript,
    words,
    speaker: options.speaker ?? 0,
  };
}

// ============================================
// RESULT FACTORY
// ============================================

export interface CreateResultOptions {
  utterances?: MockDeepgramUtterance[];
  words?: MockDeepgramWord[];
  transcript?: string;
  duration?: number;
  channels?: MockDeepgramChannel[];
}

export function createMockDeepgramResult(options: CreateResultOptions = {}): MockDeepgramResult {
  const requestId = generateRequestId();
  const duration = options.duration ?? 1800; // 30 minutes default

  // If utterances provided, use them
  if (options.utterances && options.utterances.length > 0) {
    const fullTranscript = options.utterances.map((u) => u.transcript).join(" ");
    const allWords = options.utterances.flatMap((u) => u.words);

    return {
      channels: [
        {
          alternatives: [
            {
              transcript: fullTranscript,
              confidence: 0.95,
              words: allWords,
            },
          ],
        },
      ],
      utterances: options.utterances,
      metadata: {
        request_id: requestId,
        created: new Date().toISOString(),
        duration,
        channels: 1,
        models: ["nova-3"],
      },
    };
  }

  // If channels provided, use them
  if (options.channels) {
    return {
      channels: options.channels,
      metadata: {
        request_id: requestId,
        created: new Date().toISOString(),
        duration,
        channels: 1,
        models: ["nova-3"],
      },
    };
  }

  // If words provided, use them
  if (options.words && options.words.length > 0) {
    const transcript =
      options.transcript ?? options.words.map((w) => w.punctuated_word || w.word).join(" ");

    return {
      channels: [
        {
          alternatives: [
            {
              transcript,
              confidence: 0.95,
              words: options.words,
            },
          ],
        },
      ],
      metadata: {
        request_id: requestId,
        created: new Date().toISOString(),
        duration,
        channels: 1,
        models: ["nova-3"],
      },
    };
  }

  // Default: simple transcript
  const transcript = options.transcript ?? "Hello, how are you today?";
  const words = createWordsFromTranscript(transcript, { startTime: 0 });

  return {
    channels: [
      {
        alternatives: [
          {
            transcript,
            confidence: 0.95,
            words,
          },
        ],
      },
    ],
    metadata: {
      request_id: requestId,
      created: new Date().toISOString(),
      duration,
      channels: 1,
      models: ["nova-3"],
    },
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

interface CreateWordsOptions {
  startTime?: number;
  speaker?: number;
  language?: string;
  avgWordDuration?: number;
}

function createWordsFromTranscript(
  transcript: string,
  options: CreateWordsOptions = {}
): MockDeepgramWord[] {
  const words = transcript.split(/\s+/).filter((w) => w.length > 0);
  const avgDuration = options.avgWordDuration ?? 0.3;
  let currentTime = options.startTime ?? 0;

  return words.map((word) => {
    const start = currentTime;
    const duration = avgDuration + Math.random() * 0.2;
    currentTime += duration;

    return createMockDeepgramWord({
      word,
      start,
      end: currentTime,
      speaker: options.speaker,
      language: options.language,
      confidence: 0.9 + Math.random() * 0.1,
    });
  });
}

// ============================================
// SCENARIO FACTORIES
// ============================================

export const MockDeepgramResponses = {
  /**
   * Empty transcript (no speech detected)
   */
  emptyTranscript: (): MockDeepgramResult => {
    return createMockDeepgramResult({
      utterances: [],
      words: [],
      transcript: "",
      duration: 0,
    });
  },

  /**
   * Single speaker transcript (no diarization)
   */
  singleSpeaker: (options?: { transcript?: string; duration?: number }): MockDeepgramResult => {
    const transcript =
      options?.transcript ||
      "Today we're going to learn about past tense verbs. The past tense is used to describe actions that happened before now. For example, I walked to the store yesterday.";

    return createMockDeepgramResult({
      utterances: [
        createMockDeepgramUtterance({
          speaker: 0,
          transcript,
          start: 0,
        }),
      ],
      duration: options?.duration ?? 30,
    });
  },

  /**
   * Two-speaker lesson (tutor and student)
   */
  twoSpeakerLesson: (options: {
    tutorSegments?: number;
    studentSegments?: number;
    duration?: number;
  }): MockDeepgramResult => {
    const tutorSegments = options.tutorSegments ?? 5;
    const studentSegments = options.studentSegments ?? 5;
    const totalSegments = tutorSegments + studentSegments;

    const tutorPhrases = [
      "Hello! Today we're going to practice conversation.",
      "Let's start with some basic greetings.",
      "Very good! Now, can you tell me about your day?",
      "Excellent progress! Remember to use the past tense.",
      "Great job today! For homework, practice these phrases.",
      "Let me explain how this grammar structure works.",
      "Can you repeat after me? I went to the store.",
      "Perfect pronunciation! Keep practicing.",
      "Do you understand what I mean?",
      "Let's try a more challenging exercise now.",
    ];

    const studentPhrases = [
      "Hello, I am fine, thank you.",
      "Yes, I understand.",
      "Today I went to work and I eat lunch.",
      "I am not sure about this.",
      "Can you please repeat that?",
      "Oh, I see! So it's like this.",
      "I think I made a mistake.",
      "Yesterday I go to the park.",
      "I am learning many new words.",
      "Thank you for the lesson!",
    ];

    const utterances: MockDeepgramUtterance[] = [];
    let currentTime = 0;
    let tutorIndex = 0;
    let studentIndex = 0;

    for (let i = 0; i < totalSegments; i++) {
      const isTutor = i % 2 === 0 && tutorIndex < tutorSegments;
      const speaker = isTutor ? 0 : 1;

      let transcript: string;
      if (isTutor) {
        transcript = tutorPhrases[tutorIndex % tutorPhrases.length];
        tutorIndex++;
      } else {
        transcript = studentPhrases[studentIndex % studentPhrases.length];
        studentIndex++;
      }

      const duration = 2 + Math.random() * 4; // 2-6 seconds per segment

      utterances.push(
        createMockDeepgramUtterance({
          speaker,
          transcript,
          start: currentTime,
          end: currentTime + duration,
        })
      );

      currentTime += duration + 0.3; // Small gap between speakers
    }

    return createMockDeepgramResult({
      utterances,
      duration: options.duration ?? Math.ceil(currentTime),
    });
  },

  /**
   * English-Spanish code-switching lesson
   */
  englishSpanishMixed: (): MockDeepgramResult => {
    const utterances: MockDeepgramUtterance[] = [];
    let currentTime = 0;

    const segments = [
      {
        speaker: 0,
        transcript: "Today we're going to practice ordering food at a restaurant.",
        language: "en",
      },
      {
        speaker: 1,
        transcript: "Okay, I like restaurantes... I mean, restaurants.",
        mixed: [
          { word: "Okay,", lang: "en" },
          { word: "I", lang: "en" },
          { word: "like", lang: "en" },
          { word: "restaurantes...", lang: "es" },
          { word: "I", lang: "en" },
          { word: "mean,", lang: "en" },
          { word: "restaurants.", lang: "en" },
        ],
      },
      {
        speaker: 0,
        transcript: "Good! How would you ask for a table?",
        language: "en",
      },
      {
        speaker: 1,
        transcript: "Quiero una mesa para dos, por favor. Wait, I should say it in English.",
        mixed: [
          { word: "Quiero", lang: "es" },
          { word: "una", lang: "es" },
          { word: "mesa", lang: "es" },
          { word: "para", lang: "es" },
          { word: "dos,", lang: "es" },
          { word: "por", lang: "es" },
          { word: "favor.", lang: "es" },
          { word: "Wait,", lang: "en" },
          { word: "I", lang: "en" },
          { word: "should", lang: "en" },
          { word: "say", lang: "en" },
          { word: "it", lang: "en" },
          { word: "in", lang: "en" },
          { word: "English.", lang: "en" },
        ],
      },
      {
        speaker: 0,
        transcript: "Try again in English. I would like a table for two, please.",
        language: "en",
      },
      {
        speaker: 1,
        transcript: "I would like a table for two, please.",
        language: "en",
      },
    ];

    for (const segment of segments) {
      const duration = 2 + Math.random() * 3;

      let words: MockDeepgramWord[];
      if ("mixed" in segment && segment.mixed) {
        words = segment.mixed.map((item, idx) => {
          const wordStart = currentTime + idx * 0.35;
          return createMockDeepgramWord({
            word: item.word,
            start: wordStart,
            end: wordStart + 0.3,
            speaker: segment.speaker,
            language: item.lang,
          });
        });
      } else {
        words = createWordsFromTranscript(segment.transcript, {
          startTime: currentTime,
          speaker: segment.speaker,
          language: segment.language,
        });
      }

      utterances.push({
        id: generateUtteranceId(),
        start: currentTime,
        end: currentTime + duration,
        confidence: 0.94,
        channel: 0,
        transcript: segment.transcript,
        words,
        speaker: segment.speaker,
      });

      currentTime += duration + 0.4;
    }

    return createMockDeepgramResult({
      utterances,
      duration: Math.ceil(currentTime),
    });
  },

  /**
   * Japanese student learning English (with L1 interference patterns)
   */
  japaneseStudentEnglish: (): MockDeepgramResult => {
    const utterances: MockDeepgramUtterance[] = [];
    let currentTime = 0;

    const segments = [
      {
        speaker: 0,
        transcript: "Let's practice using articles today. They are very important in English.",
        language: "en",
      },
      {
        speaker: 1,
        transcript: "Yesterday I went to park with friend.", // Missing articles
        language: "en",
      },
      {
        speaker: 0,
        transcript:
          "Good try! Remember, we say 'the park' and 'a friend'. Let me explain why.",
        language: "en",
      },
      {
        speaker: 1,
        transcript: "Oh, I went to the park with a friend. Is correct?", // Word order issue
        language: "en",
      },
      {
        speaker: 0,
        transcript: "Almost! We say 'Is that correct?' The verb comes first in questions.",
        language: "en",
      },
      {
        speaker: 1,
        transcript: "I have many book at home.", // Missing plural
        language: "en",
      },
      {
        speaker: 0,
        transcript:
          "Many books - with an 's' for plural. In English, we add 's' to show more than one.",
        language: "en",
      },
      {
        speaker: 1,
        transcript: "Ah, I see! Many books. I reading many books every day.", // Missing auxiliary
        language: "en",
      },
      {
        speaker: 0,
        transcript:
          "We say 'I am reading' or 'I read'. You need the helper verb 'am' for present continuous.",
        language: "en",
      },
      {
        speaker: 1,
        transcript: "I am reading many books every day. Thank you, teacher!",
        language: "en",
      },
    ];

    for (const segment of segments) {
      const duration = 2 + Math.random() * 4;

      const words = createWordsFromTranscript(segment.transcript, {
        startTime: currentTime,
        speaker: segment.speaker,
        language: segment.language,
      });

      utterances.push({
        id: generateUtteranceId(),
        start: currentTime,
        end: currentTime + duration,
        confidence: segment.speaker === 0 ? 0.96 : 0.88, // Lower confidence for non-native
        channel: 0,
        transcript: segment.transcript,
        words,
        speaker: segment.speaker,
      });

      currentTime += duration + 0.5;
    }

    return createMockDeepgramResult({
      utterances,
      duration: Math.ceil(currentTime),
    });
  },

  /**
   * Spanish student learning English (with L1 interference patterns)
   */
  spanishStudentEnglish: (): MockDeepgramResult => {
    const utterances: MockDeepgramUtterance[] = [];
    let currentTime = 0;

    const segments = [
      {
        speaker: 0,
        transcript: "Today we'll practice adjective order in English.",
        language: "en",
      },
      {
        speaker: 1,
        transcript: "I have a house big.", // Adjective placement error
        language: "en",
      },
      {
        speaker: 0,
        transcript: "In English, adjectives come before nouns. We say 'a big house'.",
        language: "en",
      },
      {
        speaker: 1,
        transcript: "Oh! A big house. And I have a car red beautiful.", // Double adjective error
        language: "en",
      },
      {
        speaker: 0,
        transcript: "Good try! We say 'a beautiful red car'. Color comes after other adjectives.",
        language: "en",
      },
      {
        speaker: 1,
        transcript: "I am agree with you.", // False friend "estar de acuerdo"
        language: "en",
      },
      {
        speaker: 0,
        transcript: "We just say 'I agree'. No 'am' needed here.",
        language: "en",
      },
      {
        speaker: 1,
        transcript: "I agree! This is very interesting.",
        language: "en",
      },
    ];

    for (const segment of segments) {
      const duration = 2 + Math.random() * 3;

      const words = createWordsFromTranscript(segment.transcript, {
        startTime: currentTime,
        speaker: segment.speaker,
        language: segment.language,
      });

      utterances.push({
        id: generateUtteranceId(),
        start: currentTime,
        end: currentTime + duration,
        confidence: segment.speaker === 0 ? 0.96 : 0.90,
        channel: 0,
        transcript: segment.transcript,
        words,
        speaker: segment.speaker,
      });

      currentTime += duration + 0.4;
    }

    return createMockDeepgramResult({
      utterances,
      duration: Math.ceil(currentTime),
    });
  },

  /**
   * French beginner lesson
   */
  frenchBeginnerLesson: (): MockDeepgramResult => {
    const utterances: MockDeepgramUtterance[] = [];
    let currentTime = 0;

    const segments = [
      {
        speaker: 0,
        transcript: "Let's practice basic French greetings today.",
        language: "en",
      },
      {
        speaker: 1,
        transcript: "Okay. Um... bonjour?",
        language: "en",
      },
      {
        speaker: 0,
        transcript: "Bonjour! Very good! Now try 'Comment allez-vous?'",
        language: "en",
      },
      {
        speaker: 1,
        transcript: "Comment... allez... vous?",
        language: "en",
      },
      {
        speaker: 0,
        transcript: "Excellent! That means 'How are you?' More formally.",
        language: "en",
      },
      {
        speaker: 1,
        transcript: "Je... I mean... Je vais bien.",
        language: "en",
      },
      {
        speaker: 0,
        transcript: "Perfect pronunciation! 'Je vais bien' means 'I am doing well'.",
        language: "en",
      },
    ];

    for (const segment of segments) {
      const duration = 2 + Math.random() * 3;

      const words = createWordsFromTranscript(segment.transcript, {
        startTime: currentTime,
        speaker: segment.speaker,
        language: segment.language,
      });

      utterances.push({
        id: generateUtteranceId(),
        start: currentTime,
        end: currentTime + duration,
        confidence: 0.93,
        channel: 0,
        transcript: segment.transcript,
        words,
        speaker: segment.speaker,
      });

      currentTime += duration + 0.3;
    }

    return createMockDeepgramResult({
      utterances,
      duration: Math.ceil(currentTime),
    });
  },

  /**
   * Low confidence transcript (noisy audio)
   */
  lowConfidenceTranscript: (): MockDeepgramResult => {
    const words = [
      createMockDeepgramWord({ word: "Hello", confidence: 0.65, start: 0, end: 0.4 }),
      createMockDeepgramWord({ word: "[inaudible]", confidence: 0.30, start: 0.5, end: 1.0 }),
      createMockDeepgramWord({ word: "today", confidence: 0.55, start: 1.1, end: 1.4 }),
      createMockDeepgramWord({ word: "we", confidence: 0.70, start: 1.5, end: 1.6 }),
      createMockDeepgramWord({ word: "[inaudible]", confidence: 0.25, start: 1.7, end: 2.2 }),
    ];

    return createMockDeepgramResult({
      words,
      transcript: "Hello [inaudible] today we [inaudible]",
    });
  },

  /**
   * Long lesson with many segments
   */
  longLesson: (options?: { durationMinutes?: number }): MockDeepgramResult => {
    const durationMinutes = options?.durationMinutes ?? 45;
    const segmentsPerMinute = 4; // About 15 seconds per segment
    const totalSegments = durationMinutes * segmentsPerMinute;

    const tutorPhrases = [
      "Let me explain this concept.",
      "Can you repeat after me?",
      "Very good! Let's continue.",
      "Do you have any questions?",
      "Now let's practice together.",
      "Remember what we learned last time.",
      "Excellent progress today!",
      "Let's try a different approach.",
      "Pay attention to the pronunciation.",
      "Great job on that exercise!",
    ];

    const studentPhrases = [
      "Yes, I understand.",
      "Can you please repeat that?",
      "I think I got it.",
      "Let me try again.",
      "Is this correct?",
      "I'm not sure about this.",
      "Oh, I see!",
      "Thank you for explaining.",
      "I'll practice more.",
      "This is challenging but fun.",
    ];

    const utterances: MockDeepgramUtterance[] = [];
    let currentTime = 0;

    for (let i = 0; i < totalSegments; i++) {
      const isTutor = i % 2 === 0;
      const speaker = isTutor ? 0 : 1;
      const phrases = isTutor ? tutorPhrases : studentPhrases;
      const transcript = phrases[i % phrases.length];

      const duration = 3 + Math.random() * 8; // 3-11 seconds

      utterances.push(
        createMockDeepgramUtterance({
          speaker,
          transcript,
          start: currentTime,
          end: currentTime + duration,
        })
      );

      currentTime += duration + 0.5;
    }

    return createMockDeepgramResult({
      utterances,
      duration: durationMinutes * 60,
    });
  },

  /**
   * Multi-participant lesson (tutor + 2 students)
   */
  multiParticipant: (): MockDeepgramResult => {
    const utterances: MockDeepgramUtterance[] = [];
    let currentTime = 0;

    const segments = [
      { speaker: 0, transcript: "Welcome to our group lesson today. Let's go around and introduce ourselves." },
      { speaker: 1, transcript: "Hi, I'm Maria. I'm learning English for work." },
      { speaker: 2, transcript: "Hello, my name is Kenji. I want to improve my speaking." },
      { speaker: 0, transcript: "Great! Let's start with a warm-up exercise." },
      { speaker: 1, transcript: "Okay, I'm ready." },
      { speaker: 2, transcript: "Me too." },
      { speaker: 0, transcript: "Maria, can you tell us about your weekend?" },
      { speaker: 1, transcript: "Sure! I went to a nice restaurant with my family." },
      { speaker: 0, transcript: "Excellent! Kenji, what did you do?" },
      { speaker: 2, transcript: "I study English and watch movie." },
      { speaker: 0, transcript: "Good! Remember to say 'I studied' and 'watched a movie'. Past tense!" },
    ];

    for (const segment of segments) {
      const duration = 2 + Math.random() * 4;

      utterances.push(
        createMockDeepgramUtterance({
          speaker: segment.speaker,
          transcript: segment.transcript,
          start: currentTime,
          end: currentTime + duration,
        })
      );

      currentTime += duration + 0.4;
    }

    return createMockDeepgramResult({
      utterances,
      duration: Math.ceil(currentTime),
    });
  },

  /**
   * Lesson with hesitations and filler words
   */
  withFillerWords: (): MockDeepgramResult => {
    const utterances: MockDeepgramUtterance[] = [];
    let currentTime = 0;

    const segments = [
      {
        speaker: 0,
        transcript: "Tell me about your hobbies.",
      },
      {
        speaker: 1,
        transcript: "Um, I like, you know, playing games. And, uh, reading books.",
      },
      {
        speaker: 0,
        transcript: "That's great! What kind of games?",
      },
      {
        speaker: 1,
        transcript: "Well, um, I like video games, like, strategy games and, uh, also sports games.",
      },
      {
        speaker: 0,
        transcript: "Interesting! Try to speak without saying 'um' and 'like' so much.",
      },
      {
        speaker: 1,
        transcript: "Okay, I will try. I enjoy playing video games, especially strategy games.",
      },
    ];

    for (const segment of segments) {
      const duration = 2 + Math.random() * 4;

      utterances.push(
        createMockDeepgramUtterance({
          speaker: segment.speaker,
          transcript: segment.transcript,
          start: currentTime,
          end: currentTime + duration,
        })
      );

      currentTime += duration + 0.5;
    }

    return createMockDeepgramResult({
      utterances,
      duration: Math.ceil(currentTime),
    });
  },

  /**
   * Lesson with confusion indicators
   */
  withConfusion: (): MockDeepgramResult => {
    const utterances: MockDeepgramUtterance[] = [];
    let currentTime = 0;

    const segments = [
      {
        speaker: 0,
        transcript: "The present perfect tense is used for actions that started in the past and continue to now.",
      },
      {
        speaker: 1,
        transcript: "I don't understand. What do you mean by present perfect?",
      },
      {
        speaker: 0,
        transcript: "Let me give you an example. 'I have lived here for five years.'",
      },
      {
        speaker: 1,
        transcript: "Sorry, can you repeat that? I'm confused.",
      },
      {
        speaker: 0,
        transcript: "Of course. 'I have lived' means you started living somewhere in the past and still live there now.",
      },
      {
        speaker: 1,
        transcript: "Oh! I see now. So it connects the past to the present?",
      },
      {
        speaker: 0,
        transcript: "Exactly! You got it!",
      },
    ];

    for (const segment of segments) {
      const duration = 2 + Math.random() * 5;

      utterances.push(
        createMockDeepgramUtterance({
          speaker: segment.speaker,
          transcript: segment.transcript,
          start: currentTime,
          end: currentTime + duration,
        })
      );

      // Add longer pause after confusion phrases
      const isConfusion =
        segment.transcript.includes("don't understand") ||
        segment.transcript.includes("confused");
      currentTime += duration + (isConfusion ? 2.0 : 0.4);
    }

    return createMockDeepgramResult({
      utterances,
      duration: Math.ceil(currentTime),
    });
  },
};

// ============================================
// REALISTIC TRANSCRIPT BUILDER
// ============================================

export interface BuildRealisticTranscriptOptions {
  language?: string;
  proficiencyLevel?: "beginner" | "intermediate" | "advanced";
  durationMinutes?: number;
  topic?: string;
  includeErrors?: boolean;
  includeCodeSwitching?: boolean;
  nativeLanguage?: string;
}

export function buildRealisticTranscript(
  options: BuildRealisticTranscriptOptions = {}
): MockDeepgramResult {
  const {
    proficiencyLevel = "intermediate",
    durationMinutes = 30,
    includeErrors = true,
    includeCodeSwitching = false,
    nativeLanguage,
  } = options;

  // Select appropriate scenario based on options
  if (includeCodeSwitching && nativeLanguage === "es") {
    return MockDeepgramResponses.englishSpanishMixed();
  }

  if (includeErrors && nativeLanguage === "ja") {
    return MockDeepgramResponses.japaneseStudentEnglish();
  }

  if (includeErrors && nativeLanguage === "es") {
    return MockDeepgramResponses.spanishStudentEnglish();
  }

  if (proficiencyLevel === "beginner") {
    return MockDeepgramResponses.frenchBeginnerLesson();
  }

  // Default to two-speaker lesson
  const segmentsPerMinute = 4;
  return MockDeepgramResponses.twoSpeakerLesson({
    tutorSegments: Math.floor(durationMinutes * segmentsPerMinute * 0.6),
    studentSegments: Math.floor(durationMinutes * segmentsPerMinute * 0.4),
    duration: durationMinutes * 60,
  });
}
