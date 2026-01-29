import {
  AccessToken,
  RoomServiceClient,
  TrackSource,
} from "livekit-server-sdk";

// ============================================
// TYPES
// ============================================

export interface AIAgentConfig {
  /**
   * Type of AI agent
   */
  agentType: "conversation_practice" | "pronunciation_coach" | "grammar_assistant" | "translator";

  /**
   * Target language for the conversation
   */
  targetLanguage: string;

  /**
   * Student's native language (for L1 interference detection)
   */
  nativeLanguage?: string;

  /**
   * Proficiency level
   */
  proficiencyLevel?: "beginner" | "elementary" | "intermediate" | "upper_intermediate" | "advanced";

  /**
   * Conversation topic or scenario
   */
  topic?: string;

  /**
   * Custom system prompt for the AI
   */
  customSystemPrompt?: string;

  /**
   * Voice configuration
   */
  voice?: {
    provider: "elevenlabs" | "azure" | "openai";
    voiceId?: string;
    speed?: number;
    pitch?: number;
  };

  /**
   * Speech-to-text configuration
   */
  stt?: {
    provider: "deepgram" | "whisper" | "azure";
    language?: string;
    enablePunctuation?: boolean;
    enableDiarization?: boolean;
  };

  /**
   * Enable grammar corrections
   */
  enableGrammarCorrections?: boolean;

  /**
   * Enable pronunciation feedback
   */
  enablePronunciationFeedback?: boolean;

  /**
   * Enable vocabulary tracking
   */
  enableVocabularyTracking?: boolean;

  /**
   * Maximum session duration in minutes
   */
  maxDurationMinutes?: number;
}

export interface AIAgentSession {
  sessionId: string;
  roomName: string;
  agentIdentity: string;
  agentType: AIAgentConfig["agentType"];
  status: "starting" | "active" | "paused" | "ended";
  startedAt: number;
  config: AIAgentConfig;
}

export interface AgentDispatchRequest {
  roomName: string;
  config: AIAgentConfig;
  studentId: string;
  tutorId?: string;
  bookingId?: string;
}

export interface AgentDispatchResponse {
  success: boolean;
  session?: AIAgentSession;
  error?: string;
}

// ============================================
// CONSTANTS
// ============================================

/**
 * Agent identity prefix for easy identification
 */
export const AGENT_IDENTITY_PREFIX = "ai-tutor";

/**
 * Data channel topic for agent communication
 */
export const AGENT_DATA_CHANNEL = "ai-agent";

/**
 * Agent metadata key in room metadata
 */
export const AGENT_METADATA_KEY = "ai_agent";

/**
 * Default voice configurations per language
 */
export const DEFAULT_VOICES: Record<
  string,
  { provider: string; voiceId: string }
> = {
  en: { provider: "elevenlabs", voiceId: "21m00Tcm4TlvDq8ikWAM" }, // Rachel
  es: { provider: "elevenlabs", voiceId: "GBv7mTt0atIp3Br8iCZE" }, // Thomas
  fr: { provider: "elevenlabs", voiceId: "pNInz6obpgDQGcFmaJgB" }, // Adam
  de: { provider: "elevenlabs", voiceId: "yoZ06aMxZJJ28mfd3POQ" }, // Sam
  pt: { provider: "elevenlabs", voiceId: "TxGEqnHWrfWFTfGW9XjX" }, // Josh
  it: { provider: "elevenlabs", voiceId: "VR6AewLTigWG4xSOukaG" }, // Arnold
  zh: { provider: "azure", voiceId: "zh-CN-XiaohanNeural" },
  ja: { provider: "azure", voiceId: "ja-JP-NanamiNeural" },
  ko: { provider: "azure", voiceId: "ko-KR-SunHiNeural" },
};

/**
 * System prompts for different agent types
 */
export const AGENT_SYSTEM_PROMPTS: Record<
  AIAgentConfig["agentType"],
  (config: AIAgentConfig) => string
> = {
  conversation_practice: (config) => `
You are a friendly AI language tutor helping a student practice ${config.targetLanguage} conversation.

The student's proficiency level is ${config.proficiencyLevel || "intermediate"}.
${config.topic ? `The conversation topic is: ${config.topic}` : ""}
${config.nativeLanguage ? `The student's native language is ${config.nativeLanguage}.` : ""}

Guidelines:
- Speak naturally and conversationally in ${config.targetLanguage}
- Adjust complexity to match the student's level
- Gently correct errors when they occur, but don't interrupt mid-sentence
- Ask follow-up questions to keep the conversation flowing
- Provide vocabulary suggestions when the student seems stuck
- Be encouraging and patient
- If the student speaks in their native language, gently guide them back to ${config.targetLanguage}

${config.customSystemPrompt || ""}
`.trim(),

  pronunciation_coach: (config) => `
You are a pronunciation coach helping a student improve their ${config.targetLanguage} pronunciation.

The student's proficiency level is ${config.proficiencyLevel || "intermediate"}.
${config.nativeLanguage ? `The student's native language is ${config.nativeLanguage}.` : ""}

Guidelines:
- Listen carefully to the student's pronunciation
- Identify specific sounds they struggle with
- Provide clear, actionable feedback
- Demonstrate correct pronunciation with exaggerated clarity
- Use minimal pairs to help distinguish similar sounds
- Be encouraging about progress
- Focus on sounds that are commonly difficult for speakers of their native language

${config.customSystemPrompt || ""}
`.trim(),

  grammar_assistant: (config) => `
You are a grammar assistant helping a student improve their ${config.targetLanguage} grammar.

The student's proficiency level is ${config.proficiencyLevel || "intermediate"}.
${config.nativeLanguage ? `The student's native language is ${config.nativeLanguage}.` : ""}

Guidelines:
- Identify grammar errors in the student's speech
- Explain grammar rules clearly and concisely
- Provide correct examples
- Focus on patterns the student struggles with
- Be encouraging and constructive
- Prioritize high-frequency grammar issues

${config.customSystemPrompt || ""}
`.trim(),

  translator: (config) => `
You are a translation assistant helping a student understand ${config.targetLanguage}.

The student's proficiency level is ${config.proficiencyLevel || "intermediate"}.
${config.nativeLanguage ? `The student's native language is ${config.nativeLanguage}.` : ""}

Guidelines:
- Translate phrases accurately between languages
- Explain nuances and cultural context
- Provide alternative translations when appropriate
- Help with idiomatic expressions
- Offer pronunciation guidance for translated phrases

${config.customSystemPrompt || ""}
`.trim(),
};

// ============================================
// TOKEN GENERATION
// ============================================

/**
 * Create an access token for an AI agent to join a room
 */
export async function createAgentToken(
  roomName: string,
  agentType: AIAgentConfig["agentType"],
  options?: {
    apiKey?: string;
    apiSecret?: string;
    tokenTtlSeconds?: number;
  }
): Promise<string> {
  const apiKey = options?.apiKey ?? process.env.LIVEKIT_API_KEY?.trim();
  const apiSecret = options?.apiSecret ?? process.env.LIVEKIT_API_SECRET?.trim();

  if (!apiKey || !apiSecret) {
    throw new Error("LiveKit API credentials are not configured");
  }

  const identity = `${AGENT_IDENTITY_PREFIX}-${agentType}-${Date.now()}`;
  const name = getAgentDisplayName(agentType);

  const token = new AccessToken(apiKey, apiSecret, {
    identity,
    name,
    ttl: options?.tokenTtlSeconds ?? "2h",
  });

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishSources: [TrackSource.MICROPHONE],
    canSubscribe: true,
    canPublishData: true,
    // Agent-specific metadata
    agent: true,
  });

  // Add metadata about agent type
  token.metadata = JSON.stringify({
    agentType,
    isAIAgent: true,
    version: "1.0",
  });

  return await token.toJwt();
}

/**
 * Get display name for agent type
 */
function getAgentDisplayName(agentType: AIAgentConfig["agentType"]): string {
  const names: Record<AIAgentConfig["agentType"], string> = {
    conversation_practice: "AI Conversation Partner",
    pronunciation_coach: "AI Pronunciation Coach",
    grammar_assistant: "AI Grammar Assistant",
    translator: "AI Translator",
  };
  return names[agentType];
}

// ============================================
// AGENT DISPATCH
// ============================================

/**
 * Build the agent job data for dispatching to the agent worker
 */
export function buildAgentJobData(
  request: AgentDispatchRequest
): Record<string, unknown> {
  const { roomName, config, studentId, tutorId, bookingId } = request;

  return {
    room_name: roomName,
    agent_type: config.agentType,
    target_language: config.targetLanguage,
    native_language: config.nativeLanguage,
    proficiency_level: config.proficiencyLevel,
    topic: config.topic,
    system_prompt:
      config.customSystemPrompt ||
      AGENT_SYSTEM_PROMPTS[config.agentType](config),
    voice: config.voice || getDefaultVoice(config.targetLanguage),
    stt: config.stt || getDefaultSTT(config.targetLanguage),
    enable_grammar_corrections: config.enableGrammarCorrections ?? true,
    enable_pronunciation_feedback: config.enablePronunciationFeedback ?? true,
    enable_vocabulary_tracking: config.enableVocabularyTracking ?? true,
    max_duration_minutes: config.maxDurationMinutes ?? 30,
    student_id: studentId,
    tutor_id: tutorId,
    booking_id: bookingId,
    timestamp: Date.now(),
  };
}

/**
 * Get default voice configuration for a language
 */
function getDefaultVoice(
  language: string
): NonNullable<AIAgentConfig["voice"]> {
  const langCode = language.toLowerCase().slice(0, 2);
  const defaultVoice = DEFAULT_VOICES[langCode] || DEFAULT_VOICES["en"];

  return {
    provider: defaultVoice.provider as "elevenlabs" | "azure" | "openai",
    voiceId: defaultVoice.voiceId,
    speed: 1.0,
    pitch: 1.0,
  };
}

/**
 * Get default STT configuration for a language
 */
function getDefaultSTT(language: string): NonNullable<AIAgentConfig["stt"]> {
  return {
    provider: "deepgram",
    language,
    enablePunctuation: true,
    enableDiarization: false,
  };
}

// ============================================
// ROOM METADATA HELPERS
// ============================================

/**
 * Add agent session info to room metadata
 */
export function addAgentToRoomMetadata(
  existingMetadata: string | undefined,
  session: AIAgentSession
): string {
  const existing = existingMetadata ? JSON.parse(existingMetadata) : {};

  return JSON.stringify({
    ...existing,
    [AGENT_METADATA_KEY]: {
      sessionId: session.sessionId,
      agentIdentity: session.agentIdentity,
      agentType: session.agentType,
      status: session.status,
      startedAt: session.startedAt,
    },
  });
}

/**
 * Get agent session info from room metadata
 */
export function getAgentFromRoomMetadata(
  metadata: string | undefined
): Partial<AIAgentSession> | null {
  if (!metadata) return null;

  try {
    const parsed = JSON.parse(metadata);
    return parsed[AGENT_METADATA_KEY] || null;
  } catch {
    return null;
  }
}

/**
 * Remove agent from room metadata
 */
export function removeAgentFromRoomMetadata(
  existingMetadata: string | undefined
): string {
  if (!existingMetadata) return "{}";

  try {
    const existing = JSON.parse(existingMetadata);
    delete existing[AGENT_METADATA_KEY];
    return JSON.stringify(existing);
  } catch {
    return "{}";
  }
}

// ============================================
// DATA CHANNEL MESSAGE TYPES
// ============================================

export interface AgentMessage {
  type:
    | "greeting"
    | "response"
    | "correction"
    | "pronunciation_feedback"
    | "vocabulary"
    | "end_session"
    | "error";
  content: string;
  metadata?: {
    grammarCorrections?: Array<{
      original: string;
      corrected: string;
      explanation: string;
      category: string;
    }>;
    pronunciationScore?: number;
    pronunciationFeedback?: string;
    newVocabulary?: Array<{
      word: string;
      translation?: string;
      definition?: string;
      example?: string;
    }>;
  };
  timestamp: number;
}

/**
 * Create an agent message
 */
export function createAgentMessage(
  type: AgentMessage["type"],
  content: string,
  metadata?: AgentMessage["metadata"]
): AgentMessage {
  return {
    type,
    content,
    metadata,
    timestamp: Date.now(),
  };
}

/**
 * Parse a received data channel message
 */
export function parseAgentMessage(data: Uint8Array): AgentMessage | null {
  try {
    const text = new TextDecoder().decode(data);
    const parsed = JSON.parse(text);

    if (parsed.type && parsed.content !== undefined) {
      return parsed as AgentMessage;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Encode an agent message for sending
 */
export function encodeAgentMessage(message: AgentMessage): Uint8Array {
  const text = JSON.stringify(message);
  return new TextEncoder().encode(text);
}

// ============================================
// SESSION HELPERS
// ============================================

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `agent-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Create a new AI agent session object
 */
export function createAgentSession(
  roomName: string,
  config: AIAgentConfig
): AIAgentSession {
  return {
    sessionId: generateSessionId(),
    roomName,
    agentIdentity: `${AGENT_IDENTITY_PREFIX}-${config.agentType}-${Date.now()}`,
    agentType: config.agentType,
    status: "starting",
    startedAt: Date.now(),
    config,
  };
}

// ============================================
// VALIDATION
// ============================================

/**
 * Validate agent configuration
 */
export function validateAgentConfig(
  config: AIAgentConfig
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.agentType) {
    errors.push("Agent type is required");
  }

  if (!config.targetLanguage) {
    errors.push("Target language is required");
  }

  if (
    config.proficiencyLevel &&
    !["beginner", "elementary", "intermediate", "upper_intermediate", "advanced"].includes(
      config.proficiencyLevel
    )
  ) {
    errors.push("Invalid proficiency level");
  }

  if (config.voice?.provider && !["elevenlabs", "azure", "openai"].includes(config.voice.provider)) {
    errors.push("Invalid voice provider");
  }

  if (config.stt?.provider && !["deepgram", "whisper", "azure"].includes(config.stt.provider)) {
    errors.push("Invalid STT provider");
  }

  if (config.maxDurationMinutes && (config.maxDurationMinutes < 1 || config.maxDurationMinutes > 120)) {
    errors.push("Max duration must be between 1 and 120 minutes");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
