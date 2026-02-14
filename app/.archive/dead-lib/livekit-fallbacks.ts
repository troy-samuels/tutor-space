import type { Room, VideoCodec } from "livekit-client";
import { CODEC_FALLBACK_CHAIN, type VideoQualityLevel } from "./livekit-video-config.ts";

// ============================================
// TYPES
// ============================================

export interface BandwidthAction {
  action: "video_disabled" | "quality_reduced" | "none";
  reason?: string;
}

export interface QualitySettings {
  quality: VideoQualityLevel;
  codec: VideoCodec;
  simulcastEnabled: boolean;
}

export interface FallbackPublishOptions {
  videoSimulcastLayers: undefined;
  videoCodec: VideoCodec;
}

// ============================================
// CONSTANTS
// ============================================

const LOW_BANDWIDTH_THRESHOLD = 200_000; // 200 kbps - disable video
const MEDIUM_BANDWIDTH_THRESHOLD = 500_000; // 500 kbps - reduce quality
const QUALITY_STORAGE_KEY = "livekit_quality_settings";

// ============================================
// BANDWIDTH HANDLING
// ============================================

/**
 * Determine what action to take based on current bitrate
 */
export function determineBandwidthAction(currentBitrate: number): BandwidthAction {
  if (currentBitrate < LOW_BANDWIDTH_THRESHOLD) {
    return {
      action: "video_disabled",
      reason: `Bitrate ${Math.round(currentBitrate / 1000)}kbps below minimum threshold`,
    };
  }
  if (currentBitrate < MEDIUM_BANDWIDTH_THRESHOLD) {
    return {
      action: "quality_reduced",
      reason: `Bitrate ${Math.round(currentBitrate / 1000)}kbps - reducing quality`,
    };
  }
  return { action: "none" };
}

/**
 * Handle low bandwidth by disabling video or reducing quality
 */
export async function handleLowBandwidth(
  room: Room | null,
  currentBitrate: number,
  callbacks?: {
    onVideoDisabled?: () => void;
    onQualityReduced?: () => void;
  }
): Promise<BandwidthAction> {
  const action = determineBandwidthAction(currentBitrate);

  if (!room?.localParticipant) {
    return action;
  }

  switch (action.action) {
    case "video_disabled":
      try {
        await room.localParticipant.setCameraEnabled(false);
        callbacks?.onVideoDisabled?.();
        console.log("[LiveKit] Video disabled due to low bandwidth:", action.reason);
      } catch (error) {
        console.error("[LiveKit] Failed to disable camera:", error);
      }
      break;
    case "quality_reduced":
      // Quality reduction is handled by LiveKit's adaptive streaming
      // We just notify the UI
      callbacks?.onQualityReduced?.();
      console.log("[LiveKit] Quality reduced due to bandwidth:", action.reason);
      break;
  }

  return action;
}

// ============================================
// CODEC FALLBACK
// ============================================

/**
 * Check if a video codec is supported by the browser
 */
export async function isCodecSupported(codec: VideoCodec): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    const mimeType =
      codec === "h264"
        ? 'video/mp4; codecs="avc1.42E01E"'
        : codec === "vp9"
          ? 'video/webm; codecs="vp9"'
          : 'video/webm; codecs="vp8"';

    return MediaRecorder.isTypeSupported(mimeType);
  } catch {
    // VP8 is universally supported as fallback
    return codec === "vp8";
  }
}

/**
 * Find the first supported codec from the fallback chain
 */
export async function findSupportedCodec(): Promise<VideoCodec> {
  for (const codec of CODEC_FALLBACK_CHAIN) {
    if (await isCodecSupported(codec)) {
      console.log(`[LiveKit] Using codec: ${codec}`);
      return codec;
    }
  }
  console.log("[LiveKit] Falling back to VP8");
  return "vp8";
}

// ============================================
// SIMULCAST FAILURE HANDLING
// ============================================

/**
 * Handle simulcast initialization failure by falling back to single layer
 */
export function handleSimulcastFailure(error: Error): FallbackPublishOptions {
  console.warn(
    "[LiveKit] Simulcast failed, falling back to single layer:",
    error.message
  );
  return {
    videoSimulcastLayers: undefined,
    videoCodec: "vp8", // Most compatible codec
  };
}

// ============================================
// DEVICE CHANGE HANDLING
// ============================================

/**
 * Handle camera or microphone device change mid-session
 * Preserves quality settings during the switch
 */
export async function handleDeviceChange(
  room: Room | null,
  newDeviceId: string,
  type: "video" | "audio"
): Promise<void> {
  if (!room?.localParticipant) {
    console.warn("[LiveKit] Cannot change device: no local participant");
    return;
  }

  try {
    if (type === "video") {
      // Temporarily disable, switch device, re-enable
      await room.localParticipant.setCameraEnabled(false);
      await room.switchActiveDevice("videoinput", newDeviceId);
      await room.localParticipant.setCameraEnabled(true);
    } else {
      await room.localParticipant.setMicrophoneEnabled(false);
      await room.switchActiveDevice("audioinput", newDeviceId);
      await room.localParticipant.setMicrophoneEnabled(true);
    }
    console.log(`[LiveKit] Switched ${type} device to: ${newDeviceId}`);
  } catch (error) {
    console.error(`[LiveKit] Failed to switch ${type} device:`, error);
    throw error;
  }
}

// ============================================
// QUALITY SETTINGS PERSISTENCE
// ============================================

/**
 * Save quality settings to localStorage for reconnection recovery
 */
export function saveQualitySettings(settings: QualitySettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(QUALITY_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage not available or quota exceeded
  }
}

/**
 * Load previously saved quality settings
 */
export function loadQualitySettings(): QualitySettings | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(QUALITY_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Clear saved quality settings
 */
export function clearQualitySettings(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(QUALITY_STORAGE_KEY);
  } catch {
    // localStorage not available
  }
}

// ============================================
// EXPORT THRESHOLDS FOR TESTING
// ============================================

export const BANDWIDTH_THRESHOLDS = {
  LOW: LOW_BANDWIDTH_THRESHOLD,
  MEDIUM: MEDIUM_BANDWIDTH_THRESHOLD,
} as const;
