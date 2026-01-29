"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRoomContext } from "@livekit/components-react";
import {
  Track,
  RemoteTrackPublication,
  VideoQuality,
} from "livekit-client";

// ============================================
// TYPES
// ============================================

export interface TrackPausingOptions {
  /**
   * Enable automatic pausing based on element visibility
   */
  enableVisibilityPausing?: boolean;

  /**
   * Enable automatic quality adjustment based on element size
   */
  enableSizeBasedQuality?: boolean;

  /**
   * Minimum element width to receive HIGH quality video
   * Default: 640px
   */
  highQualityMinWidth?: number;

  /**
   * Minimum element width to receive MEDIUM quality video
   * Default: 320px
   */
  mediumQualityMinWidth?: number;

  /**
   * Intersection observer threshold for visibility detection
   * Default: 0.1 (10% visible)
   */
  visibilityThreshold?: number;

  /**
   * Debounce time in ms for quality changes
   * Default: 500ms
   */
  debounceMs?: number;

  /**
   * Enable console logging for debugging
   */
  enableLogging?: boolean;
}

export interface TrackQualityState {
  trackSid: string;
  participantIdentity: string;
  currentQuality: VideoQuality;
  isPaused: boolean;
  elementSize?: { width: number; height: number };
}

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_OPTIONS: Required<TrackPausingOptions> = {
  enableVisibilityPausing: true,
  enableSizeBasedQuality: true,
  highQualityMinWidth: 640,
  mediumQualityMinWidth: 320,
  visibilityThreshold: 0.1,
  debounceMs: 500,
  enableLogging: false,
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getQualityForSize(
  width: number,
  highMinWidth: number,
  mediumMinWidth: number
): VideoQuality {
  if (width >= highMinWidth) return VideoQuality.HIGH;
  if (width >= mediumMinWidth) return VideoQuality.MEDIUM;
  return VideoQuality.LOW;
}

// ============================================
// MAIN HOOK
// ============================================

export function useLiveKitTrackPausing(options: TrackPausingOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const room = useRoomContext();

  const [trackStates, setTrackStates] = useState<Map<string, TrackQualityState>>(
    new Map()
  );

  const observersRef = useRef<Map<string, IntersectionObserver>>(new Map());
  const resizeObserversRef = useRef<Map<string, ResizeObserver>>(new Map());
  const debounceTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  const log = useCallback(
    (message: string, data?: unknown) => {
      if (opts.enableLogging) {
        console.log(`[TrackPausing] ${message}`, data ?? "");
      }
    },
    [opts.enableLogging]
  );

  /**
   * Set video quality with debouncing
   */
  const setVideoQualityDebounced = useCallback(
    (publication: RemoteTrackPublication, quality: VideoQuality) => {
      const trackSid = publication.trackSid;
      if (!trackSid) return;

      // Clear existing timer
      const existingTimer = debounceTimersRef.current.get(trackSid);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set new timer
      debounceTimersRef.current.set(
        trackSid,
        setTimeout(() => {
          publication.setVideoQuality(quality);
          log(`Set quality to ${VideoQuality[quality]}`, { trackSid });
        }, opts.debounceMs)
      );
    },
    [opts.debounceMs, log]
  );

  /**
   * Register a video element for automatic pausing/quality adjustment
   */
  const registerVideoElement = useCallback(
    (
      element: HTMLVideoElement | HTMLDivElement,
      publication: RemoteTrackPublication,
      participantIdentity: string
    ) => {
      const trackSid = publication.trackSid;
      if (!trackSid) return;

      log("Registering element for track", { trackSid, participantIdentity });

      // Set up IntersectionObserver for visibility
      if (opts.enableVisibilityPausing) {
        const intersectionObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              const isVisible = entry.isIntersecting;

              if (!isVisible) {
                // Pause track when not visible
                publication.setEnabled(false);
                log("Paused track (not visible)", { trackSid });
              } else {
                // Resume track when visible
                publication.setEnabled(true);
                log("Resumed track (visible)", { trackSid });
              }

              setTrackStates((prev) => {
                const newMap = new Map(prev);
                const existing = newMap.get(trackSid) || {
                  trackSid,
                  participantIdentity,
                  currentQuality: VideoQuality.HIGH,
                  isPaused: false,
                };
                newMap.set(trackSid, {
                  ...existing,
                  isPaused: !isVisible,
                });
                return newMap;
              });
            });
          },
          { threshold: opts.visibilityThreshold }
        );

        intersectionObserver.observe(element);
        observersRef.current.set(trackSid, intersectionObserver);
      }

      // Set up ResizeObserver for size-based quality
      if (opts.enableSizeBasedQuality) {
        const resizeObserver = new ResizeObserver((entries) => {
          entries.forEach((entry) => {
            const { width, height } = entry.contentRect;

            // Calculate optimal quality based on element size
            const quality = getQualityForSize(
              width,
              opts.highQualityMinWidth,
              opts.mediumQualityMinWidth
            );

            setVideoQualityDebounced(publication, quality);

            setTrackStates((prev) => {
              const newMap = new Map(prev);
              const existing = newMap.get(trackSid) || {
                trackSid,
                participantIdentity,
                currentQuality: VideoQuality.HIGH,
                isPaused: false,
              };
              newMap.set(trackSid, {
                ...existing,
                currentQuality: quality,
                elementSize: { width, height },
              });
              return newMap;
            });
          });
        });

        resizeObserver.observe(element);
        resizeObserversRef.current.set(trackSid, resizeObserver);
      }
    },
    [
      opts.enableVisibilityPausing,
      opts.enableSizeBasedQuality,
      opts.visibilityThreshold,
      opts.highQualityMinWidth,
      opts.mediumQualityMinWidth,
      setVideoQualityDebounced,
      log,
    ]
  );

  /**
   * Unregister a video element
   */
  const unregisterVideoElement = useCallback(
    (trackSid: string) => {
      log("Unregistering element for track", { trackSid });

      // Clean up intersection observer
      const intersectionObserver = observersRef.current.get(trackSid);
      if (intersectionObserver) {
        intersectionObserver.disconnect();
        observersRef.current.delete(trackSid);
      }

      // Clean up resize observer
      const resizeObserver = resizeObserversRef.current.get(trackSid);
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserversRef.current.delete(trackSid);
      }

      // Clean up debounce timer
      const timer = debounceTimersRef.current.get(trackSid);
      if (timer) {
        clearTimeout(timer);
        debounceTimersRef.current.delete(trackSid);
      }

      // Remove from state
      setTrackStates((prev) => {
        const newMap = new Map(prev);
        newMap.delete(trackSid);
        return newMap;
      });
    },
    [log]
  );

  /**
   * Pause all remote video tracks (useful when app goes to background)
   */
  const pauseAllTracks = useCallback(() => {
    if (!room) return;

    room.remoteParticipants.forEach((participant) => {
      participant.trackPublications.forEach((publication) => {
        if (
          publication.kind === Track.Kind.Video &&
          publication instanceof RemoteTrackPublication
        ) {
          publication.setEnabled(false);
          log("Paused track", { trackSid: publication.trackSid });
        }
      });
    });
  }, [room, log]);

  /**
   * Resume all remote video tracks
   */
  const resumeAllTracks = useCallback(() => {
    if (!room) return;

    room.remoteParticipants.forEach((participant) => {
      participant.trackPublications.forEach((publication) => {
        if (
          publication.kind === Track.Kind.Video &&
          publication instanceof RemoteTrackPublication
        ) {
          publication.setEnabled(true);
          log("Resumed track", { trackSid: publication.trackSid });
        }
      });
    });
  }, [room, log]);

  /**
   * Set quality for all tracks at once (useful for bandwidth saving mode)
   */
  const setAllTracksQuality = useCallback(
    (quality: VideoQuality) => {
      if (!room) return;

      room.remoteParticipants.forEach((participant) => {
        participant.trackPublications.forEach((publication) => {
          if (
            publication.kind === Track.Kind.Video &&
            publication instanceof RemoteTrackPublication
          ) {
            publication.setVideoQuality(quality);
            log(`Set quality to ${VideoQuality[quality]}`, {
              trackSid: publication.trackSid,
            });
          }
        });
      });
    },
    [room, log]
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      observersRef.current.forEach((observer) => observer.disconnect());
      resizeObserversRef.current.forEach((observer) => observer.disconnect());
      debounceTimersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  // Auto-pause when window loses focus (optional enhancement)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        pauseAllTracks();
      } else {
        resumeAllTracks();
      }
    };

    if (opts.enableVisibilityPausing) {
      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    }
  }, [opts.enableVisibilityPausing, pauseAllTracks, resumeAllTracks]);

  return {
    trackStates: Array.from(trackStates.values()),
    registerVideoElement,
    unregisterVideoElement,
    pauseAllTracks,
    resumeAllTracks,
    setAllTracksQuality,
  };
}

// ============================================
// HOOK FOR INDIVIDUAL TRACK
// ============================================

export function useTrackQuality(
  publication: RemoteTrackPublication | null,
  elementRef: React.RefObject<HTMLElement>
) {
  const [quality, setQuality] = useState<VideoQuality>(VideoQuality.HIGH);
  const [isPaused, setIsPaused] = useState(false);
  const qualityRef = useRef<VideoQuality | null>(null);

  useEffect(() => {
    if (!publication || !elementRef.current) return;

    const element = elementRef.current;
    qualityRef.current = null;

    // Size-based quality
    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const { width } = entry.contentRect;
        const newQuality = getQualityForSize(width, 640, 320);

        if (newQuality !== qualityRef.current) {
          publication.setVideoQuality(newQuality);
          qualityRef.current = newQuality;
          setQuality(newQuality);
        }
      });
    });

    // Visibility-based pausing
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const isVisible = entry.isIntersecting;
          publication.setEnabled(isVisible);
          setIsPaused(!isVisible);
        });
      },
      { threshold: 0.1 }
    );

    resizeObserver.observe(element);
    intersectionObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [publication, elementRef]);

  return { quality, isPaused };
}
