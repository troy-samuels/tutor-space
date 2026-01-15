"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRoomContext } from "@livekit/components-react";
import { ConnectionQuality, RoomEvent, Track } from "livekit-client";

// ============================================
// TYPES
// ============================================

export interface QualityMetrics {
  connectionQuality: ConnectionQuality;
  videoBitrate: number;
  audioBitrate: number;
  packetLoss: number;
  roundTripTime: number;
  currentLayer: "high" | "medium" | "low" | "unknown";
  timestamp: number;
}

export interface QualityMonitorOptions {
  onQualityChange?: (metrics: QualityMetrics) => void;
  onDegraded?: (metrics: QualityMetrics) => void;
  onRecovered?: (metrics: QualityMetrics) => void;
  samplingIntervalMs?: number;
  enableLogging?: boolean;
  degradationThreshold?: ConnectionQuality;
}

// ============================================
// HOOK
// ============================================

export function useLiveKitQualityMonitor(options: QualityMonitorOptions = {}) {
  const {
    onQualityChange,
    onDegraded,
    onRecovered,
    samplingIntervalMs = 2000,
    enableLogging = false,
    degradationThreshold = ConnectionQuality.Poor,
  } = options;

  const room = useRoomContext();
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isDegraded, setIsDegraded] = useState(false);

  const previousQualityRef = useRef<ConnectionQuality | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const log = useCallback(
    (message: string, data?: unknown) => {
      if (enableLogging) {
        console.log(`[LiveKit Quality] ${message}`, data ?? "");
      }
    },
    [enableLogging]
  );

  /**
   * Determine current video layer based on published track dimensions
   */
  const getCurrentLayer = useCallback((): QualityMetrics["currentLayer"] => {
    if (!room?.localParticipant) return "unknown";

    const cameraPublication = room.localParticipant.getTrackPublication(
      Track.Source.Camera
    );
    const videoTrack = cameraPublication?.track;

    if (!videoTrack) return "unknown";

    const dimensions = videoTrack.dimensions;
    if (!dimensions) return "unknown";

    if (dimensions.height >= 1080) return "high";
    if (dimensions.height >= 720) return "medium";
    return "low";
  }, [room]);

  /**
   * Collect current quality metrics
   */
  const collectMetrics = useCallback(async (): Promise<QualityMetrics | null> => {
    if (!room?.localParticipant) return null;

    try {
      const connectionQuality = room.localParticipant.connectionQuality;
      const currentLayer = getCurrentLayer();

      const newMetrics: QualityMetrics = {
        connectionQuality,
        videoBitrate: 0, // Would come from getStats() - simplified for now
        audioBitrate: 0,
        packetLoss: 0,
        roundTripTime: 0,
        currentLayer,
        timestamp: Date.now(),
      };

      return newMetrics;
    } catch (error) {
      log("Error collecting metrics:", error);
      return null;
    }
  }, [room, getCurrentLayer, log]);

  /**
   * Handle connection quality changes
   */
  const handleQualityChange = useCallback(
    (quality: ConnectionQuality) => {
      const previousQuality = previousQualityRef.current;
      previousQualityRef.current = quality;

      // Check for degradation (quality dropped below threshold)
      if (
        quality <= degradationThreshold &&
        previousQuality !== null &&
        previousQuality > degradationThreshold
      ) {
        setIsDegraded(true);
        collectMetrics().then((m) => {
          if (m) {
            log("Quality degraded", m);
            onDegraded?.(m);
          }
        });
      }

      // Check for recovery (quality improved above threshold)
      if (
        quality > degradationThreshold &&
        previousQuality !== null &&
        previousQuality <= degradationThreshold
      ) {
        setIsDegraded(false);
        collectMetrics().then((m) => {
          if (m) {
            log("Quality recovered", m);
            onRecovered?.(m);
          }
        });
      }
    },
    [collectMetrics, degradationThreshold, log, onDegraded, onRecovered]
  );

  /**
   * Start monitoring quality metrics
   */
  const startMonitoring = useCallback(() => {
    if (isMonitoring || !room) return;

    setIsMonitoring(true);
    log("Started monitoring");

    // Set up interval for metrics collection
    intervalRef.current = setInterval(async () => {
      const newMetrics = await collectMetrics();
      if (newMetrics) {
        setMetrics(newMetrics);
        onQualityChange?.(newMetrics);
      }
    }, samplingIntervalMs);
  }, [isMonitoring, room, collectMetrics, samplingIntervalMs, log, onQualityChange]);

  /**
   * Stop monitoring quality metrics
   */
  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsMonitoring(false);
    log("Stopped monitoring");
  }, [log]);

  // Subscribe to room connection quality events
  useEffect(() => {
    if (!room) return;

    const onConnectionQualityChanged = (
      quality: ConnectionQuality
    ) => {
      handleQualityChange(quality);
    };

    room.on(RoomEvent.ConnectionQualityChanged, onConnectionQualityChanged);

    return () => {
      room.off(RoomEvent.ConnectionQualityChanged, onConnectionQualityChanged);
    };
  }, [room, handleQualityChange]);

  // Auto-start monitoring when room connects
  useEffect(() => {
    if (room?.state === "connected") {
      startMonitoring();
    }

    return () => {
      stopMonitoring();
    };
  }, [room?.state, startMonitoring, stopMonitoring]);

  return {
    metrics,
    isMonitoring,
    isDegraded,
    startMonitoring,
    stopMonitoring,
  };
}
