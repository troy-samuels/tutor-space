/**
 * LiveKit Configuration & Utilities
 *
 * This module exports all LiveKit-related utilities for the TutorLingua platform.
 */

// Core utilities
export * from "../livekit";

// Video configuration & quality presets
export * from "../livekit-video-config";

// End-to-end encryption
export * from "../livekit-e2ee";

// Auto-egress (automatic recording)
export * from "../livekit-auto-egress";

// AI Agents integration
export * from "../livekit-agents";

// Re-export hooks from their locations
export { useLiveKitQualityMonitor } from "../hooks/useLiveKitQualityMonitor";
export type { QualityMetrics, QualityMonitorOptions } from "../hooks/useLiveKitQualityMonitor";

export { useLiveKitConnectionMonitor } from "../hooks/useLiveKitConnectionMonitor";
export type { ConnectionToastState } from "../hooks/useLiveKitConnectionMonitor";

export { useLiveKitTrackPausing, useTrackQuality } from "../hooks/useLiveKitTrackPausing";
export type { TrackPausingOptions, TrackQualityState } from "../hooks/useLiveKitTrackPausing";

export {
  useLiveKitSelectiveSubscription,
  ONE_ON_ONE_PRESET,
  SMALL_GROUP_PRESET,
  LARGE_GROUP_PRESET,
  WEBINAR_PRESET,
  getRecommendedPreset,
} from "../hooks/useLiveKitSelectiveSubscription";
export type {
  SelectiveSubscriptionOptions,
  SubscriptionState,
  SubscriptionStrategy,
} from "../hooks/useLiveKitSelectiveSubscription";

export {
  useLiveKitAIAgent,
  getAgentStatusText,
  getAgentTypeDisplayName,
} from "../hooks/useLiveKitAIAgent";
export type {
  AIAgentState,
  GrammarCorrection,
  VocabularyItem,
  UseLiveKitAIAgentOptions,
} from "../hooks/useLiveKitAIAgent";
