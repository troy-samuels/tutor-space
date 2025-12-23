/**
 * OpenAI Mock Utilities for Enterprise-Grade Testing
 *
 * Provides factories for creating mock OpenAI chat completion objects:
 * - Chat completions with custom content
 * - Tutor speech analysis responses
 * - Student speech analysis responses
 * - Practice chat responses with grammar corrections
 * - Marketing clip extraction responses
 */

// ============================================
// ID GENERATORS
// ============================================

let idCounter = 0;

export function generateOpenAIId(prefix: string): string {
  return `${prefix}-test-${Date.now()}-${++idCounter}`;
}

export const generateCompletionId = () => generateOpenAIId("chatcmpl");

// ============================================
// TYPES (Matching OpenAI SDK response structure)
// ============================================

export interface MockOpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
  refusal?: null;
}

export interface MockOpenAIChoice {
  index: number;
  message: MockOpenAIMessage;
  logprobs: null;
  finish_reason: "stop" | "length" | "content_filter" | "tool_calls";
}

export interface MockOpenAIUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface MockOpenAICompletion {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: MockOpenAIChoice[];
  usage: MockOpenAIUsage;
  system_fingerprint?: string;
}

// ============================================
// COMPLETION FACTORY
// ============================================

export interface CreateCompletionOptions {
  id?: string;
  content: string;
  model?: string;
  tokens?: {
    prompt?: number;
    completion?: number;
  };
  finishReason?: "stop" | "length" | "content_filter" | "tool_calls";
}

export function createMockOpenAICompletion(
  options: CreateCompletionOptions
): MockOpenAICompletion {
  const promptTokens = options.tokens?.prompt ?? 500;
  const completionTokens = options.tokens?.completion ?? 200;

  return {
    id: options.id || generateCompletionId(),
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: options.model || "gpt-4o",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: options.content,
          refusal: null,
        },
        logprobs: null,
        finish_reason: options.finishReason || "stop",
      },
    ],
    usage: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens,
    },
    system_fingerprint: "fp_test_mock",
  };
}

// ============================================
// ANALYSIS RESPONSE TYPES
// ============================================

export interface TutorAnalysisResponse {
  explanations: Array<{
    topic: string;
    explanation: string;
    timestamp?: number;
  }>;
  corrections: Array<{
    original: string;
    corrected: string;
    explanation: string;
    timestamp?: number;
  }>;
  focusTopics: string[];
  focusVocabulary: string[];
  focusGrammar: string[];
  inferredObjectives: Array<{
    objective: string;
    confidence: "low" | "medium" | "high";
  }>;
  teachingStyle: {
    questionFrequency: number;
    correctionFrequency: number;
    explanationLength: "brief" | "moderate" | "detailed";
    praiseFrequency: number;
  };
}

export interface StudentAnalysisResponse {
  errors: Array<{
    original: string;
    correction: string;
    category: string;
    explanation: string;
    timestamp?: number;
    isL1Interference?: boolean;
    l1Pattern?: string;
  }>;
  hesitations: Array<{
    text: string;
    timestamp: number;
    duration: number;
    type: "pause" | "filler" | "repetition";
  }>;
  strengths: Array<{
    type: string;
    description: string;
    examples: string[];
  }>;
  vocabularyUsed: string[];
  grammarStructuresUsed: string[];
  fluencyMetrics: {
    wordsPerMinute: number;
    avgPauseDuration: number;
    fillerWordCount: number;
    fillerWords: string[];
    selfCorrectionCount: number;
  };
  l1InterferenceSummary: {
    overallLevel: "low" | "medium" | "high";
    topPatterns: Array<{
      pattern: string;
      count: number;
    }>;
  };
}

export interface PracticeChatCorrection {
  original: string;
  corrected: string;
  category: string;
  explanation: string;
}

export interface PracticeChatResponse {
  message: string;
  corrections: PracticeChatCorrection[];
  vocabularyIntroduced: string[];
  encouragement?: string;
}

export interface MarketingClipResponse {
  title: string;
  topic: string;
  summary: string;
  startTime: number;
  endTime: number;
  transcriptSnippet: string;
  tags: string[];
}

// ============================================
// SCENARIO FACTORIES
// ============================================

export const MockOpenAIResponses = {
  /**
   * Tutor speech analysis response
   */
  tutorAnalysis: (options?: {
    objectives?: number;
    corrections?: number;
    vocabulary?: string[];
  }): MockOpenAICompletion => {
    const numObjectives = options?.objectives ?? 3;
    const numCorrections = options?.corrections ?? 2;
    const vocabulary = options?.vocabulary ?? ["vocabulary", "grammar", "pronunciation"];

    const response: TutorAnalysisResponse = {
      explanations: [
        {
          topic: "Past Tense Verbs",
          explanation:
            "The tutor explained how to form past tense verbs by adding -ed to regular verbs.",
          timestamp: 120,
        },
        {
          topic: "Articles",
          explanation:
            "The tutor covered the use of definite and indefinite articles (the, a, an).",
          timestamp: 450,
        },
      ],
      corrections: Array.from({ length: numCorrections }, (_, i) => ({
        original: `Error ${i + 1}`,
        corrected: `Correction ${i + 1}`,
        explanation: `Explanation for correction ${i + 1}`,
        timestamp: 100 + i * 200,
      })),
      focusTopics: ["Past Tense", "Articles", "Pronunciation"],
      focusVocabulary: vocabulary,
      focusGrammar: ["simple past", "present perfect", "articles"],
      inferredObjectives: Array.from({ length: numObjectives }, (_, i) => ({
        objective: `Learning objective ${i + 1}`,
        confidence: (["low", "medium", "high"] as const)[i % 3],
      })),
      teachingStyle: {
        questionFrequency: 2.5,
        correctionFrequency: 1.2,
        explanationLength: "moderate",
        praiseFrequency: 3.0,
      },
    };

    return createMockOpenAICompletion({
      content: JSON.stringify(response),
      tokens: { prompt: 2000, completion: 800 },
    });
  },

  /**
   * Student speech analysis response
   */
  studentAnalysis: (options?: {
    errorCount?: number;
    proficiencyLevel?: string;
    l1Patterns?: string[];
    nativeLanguage?: string;
  }): MockOpenAICompletion => {
    const errorCount = options?.errorCount ?? 5;
    const l1Patterns = options?.l1Patterns ?? ["article_omission", "plural_marking"];

    const errorCategories = [
      "article_omission",
      "plural_marking",
      "verb_tense",
      "word_order",
      "preposition",
    ];

    const response: StudentAnalysisResponse = {
      errors: Array.from({ length: errorCount }, (_, i) => {
        const category = errorCategories[i % errorCategories.length];
        const isL1 = l1Patterns.includes(category);

        return {
          original: `Incorrect phrase ${i + 1}`,
          correction: `Corrected phrase ${i + 1}`,
          category,
          explanation: `Explanation for error ${i + 1}`,
          timestamp: 50 + i * 100,
          isL1Interference: isL1,
          l1Pattern: isL1 ? category : undefined,
        };
      }),
      hesitations: [
        { text: "um", timestamp: 45, duration: 0.5, type: "filler" },
        { text: "...", timestamp: 120, duration: 2.0, type: "pause" },
        { text: "I mean", timestamp: 200, duration: 0.8, type: "repetition" },
      ],
      strengths: [
        {
          type: "vocabulary",
          description: "Good range of vocabulary used",
          examples: ["excellent", "fascinating", "accomplish"],
        },
        {
          type: "fluency",
          description: "Maintained conversation flow",
          examples: ["Connected ideas smoothly"],
        },
      ],
      vocabularyUsed: ["restaurant", "order", "menu", "delicious", "recommend"],
      grammarStructuresUsed: ["simple past", "present continuous", "conditionals"],
      fluencyMetrics: {
        wordsPerMinute: 85,
        avgPauseDuration: 1.2,
        fillerWordCount: 8,
        fillerWords: ["um", "uh", "like", "you know"],
        selfCorrectionCount: 3,
      },
      l1InterferenceSummary: {
        overallLevel: errorCount > 5 ? "high" : errorCount > 2 ? "medium" : "low",
        topPatterns: l1Patterns.map((pattern, i) => ({
          pattern,
          count: Math.max(1, errorCount - i),
        })),
      },
    };

    return createMockOpenAICompletion({
      content: JSON.stringify(response),
      tokens: { prompt: 2500, completion: 1000 },
    });
  },

  /**
   * Practice chat responses
   */
  practiceChat: {
    /**
     * Response with grammar corrections
     */
    withCorrections: (corrections: PracticeChatCorrection[]): MockOpenAICompletion => {
      const response: PracticeChatResponse = {
        message:
          "That's a good attempt! I noticed a few things we can work on. " +
          corrections.map((c) => `You said '${c.original}' - try '${c.corrected}'.`).join(" ") +
          " Keep practicing!",
        corrections,
        vocabularyIntroduced: [],
        encouragement: "You're making great progress!",
      };

      return createMockOpenAICompletion({
        content: JSON.stringify(response),
        tokens: { prompt: 500, completion: 200 },
      });
    },

    /**
     * Response without corrections (correct input)
     */
    noCorrections: (): MockOpenAICompletion => {
      const response: PracticeChatResponse = {
        message:
          "Perfect! That was exactly right. Your grammar and vocabulary usage were excellent. " +
          "Let's try something a bit more challenging.",
        corrections: [],
        vocabularyIntroduced: ["challenging", "excellent"],
        encouragement: "Excellent work!",
      };

      return createMockOpenAICompletion({
        content: JSON.stringify(response),
        tokens: { prompt: 400, completion: 150 },
      });
    },

    /**
     * Response with pronunciation feedback (for audio input)
     */
    withPhoneticErrors: (): MockOpenAICompletion => {
      const response: PracticeChatResponse = {
        message:
          "Good try! I noticed some pronunciation areas to work on. " +
          "The 'th' sound in 'the' should be voiced - try putting your tongue between your teeth. " +
          "Also, the word 'comfortable' has the stress on the first syllable: COM-for-ta-ble.",
        corrections: [
          {
            original: "de",
            corrected: "the",
            category: "pronunciation",
            explanation: "Voiced 'th' sound - tongue between teeth",
          },
          {
            original: "com-FOR-table",
            corrected: "COM-for-ta-ble",
            category: "pronunciation",
            explanation: "Stress on first syllable",
          },
        ],
        vocabularyIntroduced: ["pronunciation", "syllable", "stress"],
        encouragement: "Practice makes perfect!",
      };

      return createMockOpenAICompletion({
        content: JSON.stringify(response),
        tokens: { prompt: 600, completion: 250 },
      });
    },

    /**
     * Conversational response (no corrections, natural dialogue)
     */
    conversational: (topic: string): MockOpenAICompletion => {
      const responses: Record<string, string> = {
        restaurant:
          "That sounds delicious! I love trying new restaurants too. What type of cuisine do you prefer - Italian, Japanese, Mexican, or something else?",
        travel:
          "How exciting! Traveling is a wonderful way to experience different cultures. Have you been planning any trips recently?",
        hobbies:
          "That's a great hobby! How long have you been doing it? Do you practice it regularly?",
        work: "That sounds like an interesting job! What do you enjoy most about your work?",
        default:
          "That's very interesting! Tell me more about that. What aspects do you find most enjoyable?",
      };

      const message = responses[topic] || responses.default;

      const response: PracticeChatResponse = {
        message,
        corrections: [],
        vocabularyIntroduced: [],
      };

      return createMockOpenAICompletion({
        content: JSON.stringify(response),
        tokens: { prompt: 300, completion: 100 },
      });
    },

    /**
     * Grammar-specific correction responses
     */
    grammarCorrection: (
      category:
        | "verb_tense"
        | "article"
        | "subject_verb_agreement"
        | "preposition"
        | "word_order"
        | "gender_agreement"
        | "conjugation"
        | "pronoun"
        | "plural_singular"
    ): MockOpenAICompletion => {
      const corrections: Record<string, PracticeChatCorrection> = {
        verb_tense: {
          original: "Yesterday I go to the store",
          corrected: "Yesterday I went to the store",
          category: "verb_tense",
          explanation: "Use past tense 'went' for actions completed in the past",
        },
        article: {
          original: "I saw dog in park",
          corrected: "I saw a dog in the park",
          category: "article",
          explanation: "Use 'a' for first mention, 'the' for specific places",
        },
        subject_verb_agreement: {
          original: "She have many books",
          corrected: "She has many books",
          category: "subject_verb_agreement",
          explanation: "Third person singular uses 'has' not 'have'",
        },
        preposition: {
          original: "I am good in English",
          corrected: "I am good at English",
          category: "preposition",
          explanation: "We say 'good at' a skill or subject",
        },
        word_order: {
          original: "I like very much pizza",
          corrected: "I like pizza very much",
          category: "word_order",
          explanation: "Adverbs of degree usually come after the object",
        },
        gender_agreement: {
          original: "La problema es grande",
          corrected: "El problema es grande",
          category: "gender_agreement",
          explanation: "'Problema' is masculine despite ending in 'a'",
        },
        conjugation: {
          original: "Yo sabo la respuesta",
          corrected: "Yo sé la respuesta",
          category: "conjugation",
          explanation: "'Saber' has irregular first person: 'sé'",
        },
        pronoun: {
          original: "Me and him went",
          corrected: "He and I went",
          category: "pronoun",
          explanation: "Subject pronouns 'He and I' when acting as subject",
        },
        plural_singular: {
          original: "I have three book",
          corrected: "I have three books",
          category: "plural_singular",
          explanation: "Add 's' for plural nouns with numbers",
        },
      };

      const correction = corrections[category];

      const response: PracticeChatResponse = {
        message: `I noticed a small grammar point. ${correction.explanation}. Try saying: "${correction.corrected}"`,
        corrections: [correction],
        vocabularyIntroduced: [],
        encouragement: "Keep going, you're doing great!",
      };

      return createMockOpenAICompletion({
        content: JSON.stringify(response),
        tokens: { prompt: 450, completion: 180 },
      });
    },
  },

  /**
   * Marketing clip extraction response
   */
  marketingClip: (options: {
    title?: string;
    topic?: string;
    startTime?: number;
    endTime?: number;
  }): MockOpenAICompletion => {
    const response: MarketingClipResponse = {
      title: options.title || "Mastering Past Tense Verbs",
      topic: options.topic || "Grammar",
      summary:
        "The tutor explains the formation and usage of past tense verbs with clear examples and student interaction.",
      startTime: options.startTime ?? 120,
      endTime: options.endTime ?? 180,
      transcriptSnippet:
        "Today we're going to learn about past tense verbs. The past tense is very important...",
      tags: ["grammar", "past-tense", "beginner-friendly"],
    };

    return createMockOpenAICompletion({
      content: JSON.stringify(response),
      tokens: { prompt: 3000, completion: 300 },
    });
  },

  /**
   * Session feedback/summary response
   */
  sessionFeedback: (options?: {
    sessionDuration?: number;
    messageCount?: number;
    errorsDetected?: number;
  }): MockOpenAICompletion => {
    const duration = options?.sessionDuration ?? 15;
    const messages = options?.messageCount ?? 12;
    const errors = options?.errorsDetected ?? 3;

    const feedback = {
      summary: `Great practice session! You practiced for ${duration} minutes and exchanged ${messages} messages.`,
      strengths: [
        "Good vocabulary range",
        "Clear communication of ideas",
        "Willingness to self-correct",
      ],
      areasToImprove: ["Article usage", "Verb tense consistency", "Preposition choices"],
      recommendedTopics: ["Articles (a, an, the)", "Past vs Present Perfect", "Common prepositions"],
      overallProgress: "improving",
      encouragement:
        "You're making excellent progress! Keep practicing regularly and focus on the areas mentioned above.",
      stats: {
        messagesExchanged: messages,
        errorsDetected: errors,
        errorsCorrected: errors,
        vocabularyPracticed: 25,
        newWordsIntroduced: 8,
      },
    };

    return createMockOpenAICompletion({
      content: JSON.stringify(feedback),
      tokens: { prompt: 800, completion: 350 },
    });
  },

  /**
   * Drill generation response
   */
  drillGeneration: (options?: {
    drillType?: "match" | "gap_fill" | "scramble";
    topic?: string;
    difficulty?: "easy" | "medium" | "hard";
  }): MockOpenAICompletion => {
    const drillType = options?.drillType ?? "match";
    const topic = options?.topic ?? "vocabulary";

    let drillContent;

    switch (drillType) {
      case "match":
        drillContent = {
          type: "match",
          instructions: "Match the words with their definitions",
          pairs: [
            { term: "ambitious", definition: "having a strong desire for success" },
            { term: "hesitate", definition: "pause before saying or doing something" },
            { term: "accomplish", definition: "achieve or complete successfully" },
            { term: "encourage", definition: "give support, confidence, or hope" },
          ],
        };
        break;
      case "gap_fill":
        drillContent = {
          type: "gap_fill",
          instructions: "Fill in the blanks with the correct word",
          sentences: [
            {
              text: "I ___ to the store yesterday.",
              answer: "went",
              options: ["go", "went", "going", "gone"],
            },
            {
              text: "She ___ been studying for three hours.",
              answer: "has",
              options: ["has", "have", "had", "having"],
            },
            {
              text: "They are ___ in learning new languages.",
              answer: "interested",
              options: ["interest", "interested", "interesting", "interests"],
            },
          ],
        };
        break;
      case "scramble":
        drillContent = {
          type: "scramble",
          instructions: "Arrange the words to form a correct sentence",
          sentences: [
            {
              scrambled: ["yesterday", "I", "to", "went", "the", "park"],
              answer: "I went to the park yesterday",
            },
            {
              scrambled: ["been", "she", "has", "studying", "English"],
              answer: "She has been studying English",
            },
            {
              scrambled: ["very", "is", "interesting", "book", "this"],
              answer: "This book is very interesting",
            },
          ],
        };
        break;
    }

    const drill = {
      topic,
      difficulty: options?.difficulty ?? "medium",
      ...drillContent,
    };

    return createMockOpenAICompletion({
      content: JSON.stringify(drill),
      tokens: { prompt: 600, completion: 400 },
    });
  },

  /**
   * Error responses for testing error handling
   */
  errors: {
    /**
     * Simulates rate limit error
     */
    rateLimit: (): Error => {
      const error = new Error("Rate limit exceeded. Please retry after 60 seconds.");
      (error as any).status = 429;
      (error as any).code = "rate_limit_exceeded";
      return error;
    },

    /**
     * Simulates invalid API key error
     */
    invalidApiKey: (): Error => {
      const error = new Error("Invalid API key provided.");
      (error as any).status = 401;
      (error as any).code = "invalid_api_key";
      return error;
    },

    /**
     * Simulates content filter error
     */
    contentFilter: (): MockOpenAICompletion => {
      return {
        id: generateCompletionId(),
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: "gpt-4o",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "",
              refusal: null,
            },
            logprobs: null,
            finish_reason: "content_filter",
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 0,
          total_tokens: 100,
        },
      };
    },

    /**
     * Simulates invalid JSON response
     */
    invalidJson: (): MockOpenAICompletion => {
      return createMockOpenAICompletion({
        content: "This is not valid JSON { broken: syntax",
      });
    },

    /**
     * Simulates timeout/network error
     */
    timeout: (): Error => {
      const error = new Error("Request timed out");
      (error as any).code = "ETIMEDOUT";
      return error;
    },
  },
};

// ============================================
// MOCK CLIENT FACTORY
// ============================================

export interface MockOpenAIClientOptions {
  defaultResponse?: MockOpenAICompletion;
  responseMap?: Map<string, MockOpenAICompletion>;
}

/**
 * Creates a mock OpenAI client for dependency injection in tests
 */
export function createMockOpenAIClient(options: MockOpenAIClientOptions = {}) {
  const { defaultResponse, responseMap } = options;

  return {
    chat: {
      completions: {
        create: async (params: any): Promise<MockOpenAICompletion> => {
          // Check if there's a mapped response for this request
          if (responseMap) {
            const key = JSON.stringify(params.messages);
            const mapped = responseMap.get(key);
            if (mapped) return mapped;
          }

          // Return default response or generate one
          if (defaultResponse) return defaultResponse;

          return MockOpenAIResponses.practiceChat.noCorrections();
        },
      },
    },
  };
}

// ============================================
// STREAMING MOCK (for practice chat)
// ============================================

export interface StreamChunk {
  id: string;
  object: "chat.completion.chunk";
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: { content?: string; role?: "assistant" };
    finish_reason: null | "stop";
  }>;
}

/**
 * Creates mock streaming chunks for testing streaming responses
 */
export function createMockStreamChunks(content: string): StreamChunk[] {
  const id = generateCompletionId();
  const created = Math.floor(Date.now() / 1000);
  const words = content.split(" ");
  const chunks: StreamChunk[] = [];

  // First chunk with role
  chunks.push({
    id,
    object: "chat.completion.chunk",
    created,
    model: "gpt-4o",
    choices: [{ index: 0, delta: { role: "assistant" }, finish_reason: null }],
  });

  // Content chunks
  for (const word of words) {
    chunks.push({
      id,
      object: "chat.completion.chunk",
      created,
      model: "gpt-4o",
      choices: [{ index: 0, delta: { content: word + " " }, finish_reason: null }],
    });
  }

  // Final chunk
  chunks.push({
    id,
    object: "chat.completion.chunk",
    created,
    model: "gpt-4o",
    choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
  });

  return chunks;
}
