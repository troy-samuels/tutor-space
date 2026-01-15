import { VideoPresets, type RoomOptions, type VideoCodec } from "livekit-client";

// ============================================
// TYPES
// ============================================

export type VideoQualityLevel = "high" | "medium" | "low" | "auto";

export interface VideoQualityPreset {
  name: VideoQualityLevel;
  resolution: { width: number; height: number };
  frameRate: number;
  maxBitrate: number;
}

export interface SimulcastLayer {
  rid: string;
  maxBitrate: number;
  scaleDownBy: number;
}

export interface VideoConfigOptions {
  quality?: VideoQualityLevel;
  enableSimulcast?: boolean;
  preferH264?: boolean;
  adaptiveStream?: boolean;
}

// ============================================
// CONSTANTS
// ============================================

export const VIDEO_PRESETS: Record<VideoQualityLevel, VideoQualityPreset> = {
  high: {
    name: "high",
    resolution: { width: 1920, height: 1080 },
    frameRate: 30,
    maxBitrate: 3_000_000,
  },
  medium: {
    name: "medium",
    resolution: { width: 1280, height: 720 },
    frameRate: 30,
    maxBitrate: 1_500_000,
  },
  low: {
    name: "low",
    resolution: { width: 640, height: 360 },
    frameRate: 24,
    maxBitrate: 600_000,
  },
  auto: {
    name: "auto",
    resolution: { width: 1280, height: 720 },
    frameRate: 30,
    maxBitrate: 1_500_000,
  },
};

// Simulcast layers for 1080p (high quality)
// 3 layers: quarter (270p), half (540p), full (1080p)
export const SIMULCAST_LAYERS_1080P: SimulcastLayer[] = [
  { rid: "q", maxBitrate: 150_000, scaleDownBy: 4 },
  { rid: "h", maxBitrate: 500_000, scaleDownBy: 2 },
  { rid: "f", maxBitrate: 2_500_000, scaleDownBy: 1 },
];

// Simulcast layers for 720p (medium quality)
// 2 layers: half (360p), full (720p)
export const SIMULCAST_LAYERS_720P: SimulcastLayer[] = [
  { rid: "q", maxBitrate: 150_000, scaleDownBy: 2 },
  { rid: "f", maxBitrate: 1_500_000, scaleDownBy: 1 },
];

export const SCREEN_SHARE_CONFIG = {
  resolution: { width: 1920, height: 1080 },
  frameRate: 15,
  maxBitrate: 2_500_000,
  contentHint: "detail" as const,
};

export const CODEC_FALLBACK_CHAIN: VideoCodec[] = ["h264", "vp8", "vp9"];

// ============================================
// FUNCTIONS
// ============================================

/**
 * Get video capture options for a given quality level
 */
export function getVideoCaptureOptions(quality: VideoQualityLevel = "auto") {
  const preset = VIDEO_PRESETS[quality] || VIDEO_PRESETS.auto;
  return {
    resolution: preset.resolution,
    frameRate: preset.frameRate,
    facingMode: "user" as const,
  };
}

/**
 * Get simulcast layers for a given quality level
 * Returns empty array for low quality (no simulcast)
 */
export function getSimulcastLayers(
  quality: VideoQualityLevel
): SimulcastLayer[] {
  switch (quality) {
    case "high":
      return SIMULCAST_LAYERS_1080P;
    case "medium":
    case "auto":
      return SIMULCAST_LAYERS_720P;
    case "low":
      return []; // No simulcast for low quality
    default:
      return SIMULCAST_LAYERS_720P;
  }
}

/**
 * Get preferred codec based on hardware support
 */
export function getPreferredCodec(supportsH264HW: boolean): VideoCodec {
  return supportsH264HW ? "h264" : "vp8";
}

/**
 * Build LiveKit RoomOptions with video quality configuration
 */
export function buildRoomOptions(options: VideoConfigOptions = {}): RoomOptions {
  const {
    quality = "auto",
    enableSimulcast = true,
    preferH264 = true,
    adaptiveStream = true,
  } = options;

  const captureOptions = getVideoCaptureOptions(quality);
  const simulcastLayers = enableSimulcast ? getSimulcastLayers(quality) : [];

  // Map our simulcast layers to LiveKit VideoPresets
  const videoSimulcastLayers =
    simulcastLayers.length > 0
      ? simulcastLayers.map((layer) => {
          // Use appropriate VideoPreset based on scale
          if (layer.scaleDownBy === 4) {
            return VideoPresets.h180;
          } else if (layer.scaleDownBy === 2) {
            return VideoPresets.h360;
          } else {
            return quality === "high" ? VideoPresets.h1080 : VideoPresets.h720;
          }
        })
      : undefined;

  return {
    videoCaptureDefaults: {
      resolution: captureOptions.resolution,
      facingMode: captureOptions.facingMode,
    },
    publishDefaults: {
      videoSimulcastLayers,
      videoCodec: preferH264 ? "h264" : "vp8",
      dtx: true, // Discontinuous transmission for audio (saves bandwidth when silent)
      red: true, // Redundant encoding for audio resilience
    },
    adaptiveStream,
    dynacast: true, // Only send video layers that are being consumed
  };
}

/**
 * Get screen share capture options
 */
export function getScreenShareOptions() {
  return {
    resolution: SCREEN_SHARE_CONFIG.resolution,
    contentHint: SCREEN_SHARE_CONFIG.contentHint,
    audio: false,
  };
}

/**
 * Get media constraints for getUserMedia based on quality level
 */
export function getMediaConstraints(
  quality: VideoQualityLevel,
  deviceId?: string
): MediaTrackConstraints {
  const preset = VIDEO_PRESETS[quality] || VIDEO_PRESETS.auto;

  return {
    deviceId: deviceId ? { exact: deviceId } : undefined,
    width: { ideal: preset.resolution.width, max: 1920 },
    height: { ideal: preset.resolution.height, max: 1080 },
    frameRate: { ideal: preset.frameRate, max: 30 },
    facingMode: "user",
  };
}
