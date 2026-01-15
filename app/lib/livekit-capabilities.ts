import type { VideoQualityLevel } from "./livekit-video-config";

// ============================================
// TYPES
// ============================================

export interface BrowserCapabilities {
  supportsH264HW: boolean;
  supportsVP9: boolean;
  supportsSimulcast: boolean;
  maxResolution: { width: number; height: number };
  isMobile: boolean;
  isLowPowerDevice: boolean;
  estimatedBandwidth: "high" | "medium" | "low" | "unknown";
}

// Extended Navigator interface for non-standard APIs
interface ExtendedNavigator extends Navigator {
  deviceMemory?: number;
  connection?: {
    effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
    downlink?: number;
  };
  scheduling?: {
    isInputPending?: () => boolean;
  };
}

// ============================================
// DETECTION FUNCTIONS
// ============================================

/**
 * Detect if the browser supports H.264 hardware acceleration
 * Uses mediaCapabilities API with Safari fallback
 */
export async function detectH264HardwareSupport(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    // Use mediaCapabilities API if available
    if ("mediaCapabilities" in navigator) {
      const result = await navigator.mediaCapabilities.decodingInfo({
        type: "file",
        video: {
          contentType: 'video/mp4; codecs="avc1.42E01E"',
          width: 1920,
          height: 1080,
          bitrate: 3_000_000,
          framerate: 30,
        },
      });
      return result.powerEfficient ?? false;
    }
  } catch {
    // Safari doesn't fully support mediaCapabilities for all codecs
  }

  // Fallback: Safari typically has good H264 HW support via VideoToolbox
  return isSafari();
}

/**
 * Check if the browser is Safari
 */
function isSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

/**
 * Detect if the user is on a mobile device
 */
export function detectMobile(): boolean {
  if (typeof window === "undefined") return false;

  const userAgent = navigator.userAgent.toLowerCase();
  const isMobileUA =
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
      userAgent
    );
  const isSmallScreen = window.innerWidth <= 768;

  return isMobileUA || isSmallScreen;
}

/**
 * Detect if the device is low-power (limited CPU/memory)
 */
export function detectLowPowerDevice(): boolean {
  if (typeof navigator === "undefined") return false;

  const nav = navigator as ExtendedNavigator;

  // Check hardware concurrency (CPU cores)
  const cores = navigator.hardwareConcurrency ?? 4;
  if (cores <= 2) return true;

  // Check device memory if available (Chrome/Edge only)
  if (nav.deviceMemory && nav.deviceMemory <= 2) return true;

  return false;
}

/**
 * Estimate current bandwidth using Network Information API
 */
export function estimateBandwidth(): "high" | "medium" | "low" | "unknown" {
  if (typeof navigator === "undefined") return "unknown";

  const nav = navigator as ExtendedNavigator;
  const connection = nav.connection;

  if (!connection) return "unknown";

  // Use effectiveType if available (most reliable)
  if (connection.effectiveType) {
    switch (connection.effectiveType) {
      case "4g":
        return "high";
      case "3g":
        return "medium";
      case "2g":
      case "slow-2g":
        return "low";
    }
  }

  // Use downlink speed (Mbps) as fallback
  if (connection.downlink) {
    if (connection.downlink >= 5) return "high";
    if (connection.downlink >= 1) return "medium";
    return "low";
  }

  return "unknown";
}

/**
 * Detect all browser capabilities
 */
export async function detectCapabilities(): Promise<BrowserCapabilities> {
  const supportsH264HW = await detectH264HardwareSupport();
  const isMobile = detectMobile();
  const isLowPowerDevice = detectLowPowerDevice();
  const estimatedBandwidth = estimateBandwidth();

  // Determine max resolution based on device capabilities
  let maxResolution = { width: 1920, height: 1080 };
  if (isMobile || isLowPowerDevice) {
    maxResolution = { width: 1280, height: 720 };
  }
  if (estimatedBandwidth === "low") {
    maxResolution = { width: 640, height: 360 };
  }

  return {
    supportsH264HW,
    supportsVP9: !isSafari(), // Safari doesn't support VP9
    supportsSimulcast: true, // All modern browsers support simulcast
    maxResolution,
    isMobile,
    isLowPowerDevice,
    estimatedBandwidth,
  };
}

/**
 * Get optimal video quality based on detected capabilities
 */
export function getOptimalQuality(
  capabilities: BrowserCapabilities
): VideoQualityLevel {
  // Low power or low bandwidth = low quality
  if (
    capabilities.isLowPowerDevice ||
    capabilities.estimatedBandwidth === "low"
  ) {
    return "low";
  }

  // Mobile or medium bandwidth = medium quality
  if (
    capabilities.isMobile ||
    capabilities.estimatedBandwidth === "medium"
  ) {
    return "medium";
  }

  // Desktop with good bandwidth = high quality
  return "high";
}

/**
 * Check if CPU is under pressure (real-time detection)
 */
export function detectCPUThrottling(): boolean {
  if (typeof navigator === "undefined") return false;

  const nav = navigator as ExtendedNavigator;

  // Check if browser reports input pending (indicates busy main thread)
  if (nav.scheduling?.isInputPending) {
    return nav.scheduling.isInputPending();
  }

  return false;
}
