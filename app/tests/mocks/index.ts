/**
 * Mock Barrel Export
 *
 * Exports all mock factories for convenient importing in tests.
 */

// Deepgram Mocks
export {
  // ID generators
  generateDeepgramId,
  generateUtteranceId,
  generateRequestId,

  // Factories
  createMockDeepgramWord,
  createMockDeepgramUtterance,
  createMockDeepgramResult,
  buildRealisticTranscript,

  // Scenario factories
  MockDeepgramResponses,

  // Types
  type MockDeepgramWord,
  type MockDeepgramUtterance,
  type MockDeepgramResult,
  type MockDeepgramChannel,
  type MockDeepgramAlternative,
  type MockDeepgramParagraph,
  type CreateWordOptions,
  type CreateUtteranceOptions,
  type CreateResultOptions,
  type BuildRealisticTranscriptOptions,
} from "./deepgram-mocks";

// OpenAI Mocks
export {
  // ID generators
  generateOpenAIId,
  generateCompletionId,

  // Factories
  createMockOpenAICompletion,
  createMockOpenAIClient,
  createMockStreamChunks,

  // Scenario factories
  MockOpenAIResponses,

  // Types
  type MockOpenAIMessage,
  type MockOpenAIChoice,
  type MockOpenAIUsage,
  type MockOpenAICompletion,
  type TutorAnalysisResponse,
  type StudentAnalysisResponse,
  type PracticeChatCorrection,
  type PracticeChatResponse,
  type MarketingClipResponse,
  type CreateCompletionOptions,
  type MockOpenAIClientOptions,
  type StreamChunk,
} from "./openai-mocks";

// LiveKit Mocks
export {
  // ID generators
  generateLiveKitId,
  generateEgressId,
  generateRoomSid,
  generateParticipantSid,
  generateTrackSid,

  // Factories
  createMockEgressInfo,
  createMockRoom,
  createMockParticipant,
  createMockLiveKitEvent,
  createMockWebhookReceiver,
  createMockAccessToken,
  decodeMockAccessToken,
  createMockLiveKitClient,

  // Scenario factories
  MockLiveKitEvents,

  // Types
  type EgressStatus,
  type MockFileResult,
  type MockEgressInfo,
  type MockRoom,
  type MockParticipant,
  type MockTrackInfo,
  type WebhookEventType,
  type MockLiveKitWebhookEvent,
  type CreateEgressInfoOptions,
  type CreateRoomOptions,
  type CreateParticipantOptions,
  type CreateWebhookEventOptions,
  type MockAccessTokenOptions,
  type MockLiveKitClientOptions,
} from "./livekit-mocks";
