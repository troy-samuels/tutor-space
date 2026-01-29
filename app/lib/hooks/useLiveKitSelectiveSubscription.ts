"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRoomContext } from "@livekit/components-react";
import {
  Track,
  RemoteParticipant,
  RemoteTrackPublication,
  VideoQuality,
  RoomEvent,
  Participant,
} from "livekit-client";

// ============================================
// TYPES
// ============================================

export type SubscriptionStrategy =
  | "all" // Subscribe to all participants (default for 1:1)
  | "active_speaker" // Only subscribe to active speaker's video
  | "pinned" // Subscribe to pinned participants + active speaker
  | "manual"; // Full manual control

export interface SelectiveSubscriptionOptions {
  /**
   * Subscription strategy
   */
  strategy?: SubscriptionStrategy;

  /**
   * Maximum number of video subscriptions
   * Set to null for unlimited (not recommended for large rooms)
   */
  maxVideoSubscriptions?: number | null;

  /**
   * Always subscribe to audio (recommended)
   */
  alwaysSubscribeAudio?: boolean;

  /**
   * Keep video subscription for N seconds after speaker becomes inactive
   * Helps prevent constant switching
   */
  speakerCooldownMs?: number;

  /**
   * Quality for non-active speakers (when subscribed)
   */
  backgroundQuality?: VideoQuality;

  /**
   * Quality for active speaker
   */
  activeSpeakerQuality?: VideoQuality;

  /**
   * Enable logging
   */
  enableLogging?: boolean;
}

export interface SubscriptionState {
  participantIdentity: string;
  participantName?: string;
  isVideoSubscribed: boolean;
  isAudioSubscribed: boolean;
  isPinned: boolean;
  isActiveSpeaker: boolean;
  videoQuality: VideoQuality;
  lastActiveTime?: number;
}

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_OPTIONS: Required<SelectiveSubscriptionOptions> = {
  strategy: "all",
  maxVideoSubscriptions: null,
  alwaysSubscribeAudio: true,
  speakerCooldownMs: 3000,
  backgroundQuality: VideoQuality.LOW,
  activeSpeakerQuality: VideoQuality.HIGH,
  enableLogging: false,
};

function areSubscriptionStatesEqual(
  prev: Map<string, SubscriptionState>,
  next: Map<string, SubscriptionState>
): boolean {
  if (prev.size !== next.size) return false;

  for (const [identity, nextState] of next) {
    const prevState = prev.get(identity);
    if (!prevState) return false;

    if (
      prevState.participantName !== nextState.participantName ||
      prevState.isVideoSubscribed !== nextState.isVideoSubscribed ||
      prevState.isAudioSubscribed !== nextState.isAudioSubscribed ||
      prevState.isPinned !== nextState.isPinned ||
      prevState.isActiveSpeaker !== nextState.isActiveSpeaker ||
      prevState.videoQuality !== nextState.videoQuality ||
      prevState.lastActiveTime !== nextState.lastActiveTime
    ) {
      return false;
    }
  }

  return true;
}

// ============================================
// MAIN HOOK
// ============================================

export function useLiveKitSelectiveSubscription(
  options: SelectiveSubscriptionOptions = {}
) {
  const opts = useMemo(
    () => ({ ...DEFAULT_OPTIONS, ...options }),
    [
      options.strategy,
      options.maxVideoSubscriptions,
      options.alwaysSubscribeAudio,
      options.speakerCooldownMs,
      options.backgroundQuality,
      options.activeSpeakerQuality,
      options.enableLogging,
    ]
  );
  const room = useRoomContext();

  const [subscriptionStates, setSubscriptionStates] = useState<
    Map<string, SubscriptionState>
  >(new Map());
  const [pinnedParticipants, setPinnedParticipants] = useState<Set<string>>(
    new Set()
  );
  const [activeSpeakers, setActiveSpeakers] = useState<string[]>([]);

  const log = useCallback(
    (message: string, data?: unknown) => {
      if (opts.enableLogging) {
        console.log(`[SelectiveSubscription] ${message}`, data ?? "");
      }
    },
    [opts.enableLogging]
  );

  /**
   * Update video subscription for a participant
   */
  const updateVideoSubscription = useCallback(
    (
      participant: RemoteParticipant,
      shouldSubscribe: boolean,
      quality: VideoQuality = VideoQuality.HIGH
    ) => {
      participant.trackPublications.forEach((publication) => {
        if (
          publication.kind === Track.Kind.Video &&
          publication instanceof RemoteTrackPublication
        ) {
          if (shouldSubscribe) {
            publication.setEnabled(true);
            publication.setVideoQuality(quality);
            log(`Subscribed to video`, {
              identity: participant.identity,
              quality: VideoQuality[quality],
            });
          } else {
            publication.setEnabled(false);
            log(`Unsubscribed from video`, { identity: participant.identity });
          }
        }
      });
    },
    [log]
  );

  /**
   * Update audio subscription for a participant
   */
  const updateAudioSubscription = useCallback(
    (participant: RemoteParticipant, shouldSubscribe: boolean) => {
      participant.trackPublications.forEach((publication) => {
        if (
          publication.kind === Track.Kind.Audio &&
          publication instanceof RemoteTrackPublication
        ) {
          publication.setEnabled(shouldSubscribe);
        }
      });
    },
    []
  );

  /**
   * Pin/unpin a participant
   */
  const pinParticipant = useCallback((identity: string) => {
    setPinnedParticipants((prev) => {
      const newSet = new Set(prev);
      newSet.add(identity);
      return newSet;
    });
  }, []);

  const unpinParticipant = useCallback((identity: string) => {
    setPinnedParticipants((prev) => {
      const newSet = new Set(prev);
      newSet.delete(identity);
      return newSet;
    });
  }, []);

  const togglePinParticipant = useCallback((identity: string) => {
    setPinnedParticipants((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(identity)) {
        newSet.delete(identity);
      } else {
        newSet.add(identity);
      }
      return newSet;
    });
  }, []);

  /**
   * Apply subscription strategy to all participants
   */
  const applyStrategy = useCallback(() => {
    if (!room) return;

    const participants = Array.from(room.remoteParticipants.values());
    const newStates = new Map<string, SubscriptionState>();
    let subscribedVideoCount = 0;

    participants.forEach((participant) => {
      const identity = participant.identity;
      const isPinned = pinnedParticipants.has(identity);
      const isActiveSpeaker = activeSpeakers.includes(identity);
      const existingState = subscriptionStates.get(identity);

      let shouldSubscribeVideo = false;
      let videoQuality = opts.backgroundQuality;

      switch (opts.strategy) {
        case "all":
          shouldSubscribeVideo = true;
          videoQuality = opts.activeSpeakerQuality;
          break;

        case "active_speaker":
          if (isActiveSpeaker) {
            shouldSubscribeVideo = true;
            videoQuality = opts.activeSpeakerQuality;
          } else if (existingState?.lastActiveTime) {
            // Check cooldown
            const timeSinceActive = Date.now() - existingState.lastActiveTime;
            if (timeSinceActive < opts.speakerCooldownMs) {
              shouldSubscribeVideo = true;
              videoQuality = opts.backgroundQuality;
            }
          }
          break;

        case "pinned":
          if (isPinned || isActiveSpeaker) {
            shouldSubscribeVideo = true;
            videoQuality = isPinned ? opts.activeSpeakerQuality : opts.backgroundQuality;
          }
          break;

        case "manual":
          // Don't auto-subscribe, let manual control handle it
          shouldSubscribeVideo = existingState?.isVideoSubscribed ?? false;
          videoQuality = existingState?.videoQuality ?? opts.backgroundQuality;
          break;
      }

      // Apply max video subscriptions limit
      if (
        opts.maxVideoSubscriptions !== null &&
        shouldSubscribeVideo &&
        !isPinned &&
        !isActiveSpeaker &&
        subscribedVideoCount >= opts.maxVideoSubscriptions
      ) {
        shouldSubscribeVideo = false;
      }

      if (shouldSubscribeVideo) {
        subscribedVideoCount += 1;
      }

      // Update subscriptions
      updateVideoSubscription(participant, shouldSubscribeVideo, videoQuality);

      // Always subscribe to audio if enabled
      if (opts.alwaysSubscribeAudio) {
        updateAudioSubscription(participant, true);
      }

      let lastActiveTime = existingState?.lastActiveTime;
      if (!isActiveSpeaker && existingState?.isActiveSpeaker) {
        lastActiveTime = Date.now();
      }

      // Update state
      newStates.set(identity, {
        participantIdentity: identity,
        participantName: participant.name,
        isVideoSubscribed: shouldSubscribeVideo,
        isAudioSubscribed: opts.alwaysSubscribeAudio,
        isPinned,
        isActiveSpeaker,
        videoQuality,
        lastActiveTime,
      });
    });

    if (!areSubscriptionStatesEqual(subscriptionStates, newStates)) {
      setSubscriptionStates(newStates);
    }
  }, [
    room,
    opts,
    pinnedParticipants,
    activeSpeakers,
    subscriptionStates,
    updateVideoSubscription,
    updateAudioSubscription,
  ]);

  /**
   * Manually set video subscription for a participant
   */
  const setVideoSubscription = useCallback(
    (identity: string, enabled: boolean, quality?: VideoQuality) => {
      if (!room) return;

      const participant = room.remoteParticipants.get(identity);
      if (!participant) return;

      updateVideoSubscription(
        participant,
        enabled,
        quality ?? opts.activeSpeakerQuality
      );

      setSubscriptionStates((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(identity);
        if (existing) {
          newMap.set(identity, {
            ...existing,
            isVideoSubscribed: enabled,
            videoQuality: quality ?? existing.videoQuality,
          });
        }
        return newMap;
      });
    },
    [room, opts.activeSpeakerQuality, updateVideoSubscription]
  );

  /**
   * Set video quality for a participant
   */
  const setParticipantVideoQuality = useCallback(
    (identity: string, quality: VideoQuality) => {
      if (!room) return;

      const participant = room.remoteParticipants.get(identity);
      if (!participant) return;

      participant.trackPublications.forEach((publication) => {
        if (
          publication.kind === Track.Kind.Video &&
          publication instanceof RemoteTrackPublication
        ) {
          publication.setVideoQuality(quality);
        }
      });

      setSubscriptionStates((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(identity);
        if (existing) {
          newMap.set(identity, { ...existing, videoQuality: quality });
        }
        return newMap;
      });
    },
    [room]
  );

  // Track active speakers
  useEffect(() => {
    if (!room) return;

    const handleActiveSpeakersChanged = (speakers: Participant[]) => {
      setActiveSpeakers(speakers.map((s) => s.identity));
    };

    room.on(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakersChanged);

    return () => {
      room.off(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakersChanged);
    };
  }, [room]);

  // Track participant joins/leaves
  useEffect(() => {
    if (!room) return;

    const handleParticipantConnected = (participant: RemoteParticipant) => {
      log("Participant connected", { identity: participant.identity });
      applyStrategy();
    };

    const handleParticipantDisconnected = (participant: RemoteParticipant) => {
      log("Participant disconnected", { identity: participant.identity });
      setSubscriptionStates((prev) => {
        const newMap = new Map(prev);
        newMap.delete(participant.identity);
        return newMap;
      });
      setPinnedParticipants((prev) => {
        const newSet = new Set(prev);
        newSet.delete(participant.identity);
        return newSet;
      });
    };

    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);

    return () => {
      room.off(RoomEvent.ParticipantConnected, handleParticipantConnected);
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
    };
  }, [room, applyStrategy, log]);

  // Reapply strategy when dependencies change
  useEffect(() => {
    applyStrategy();
  }, [applyStrategy, pinnedParticipants, activeSpeakers, opts.strategy]);

  return {
    // State
    subscriptionStates: Array.from(subscriptionStates.values()),
    pinnedParticipants: Array.from(pinnedParticipants),
    activeSpeakers,

    // Actions
    pinParticipant,
    unpinParticipant,
    togglePinParticipant,
    setVideoSubscription,
    setParticipantVideoQuality,
    applyStrategy,

    // Utilities
    isParticipantPinned: (identity: string) => pinnedParticipants.has(identity),
    isParticipantActiveSpeaker: (identity: string) =>
      activeSpeakers.includes(identity),
    getParticipantState: (identity: string) => subscriptionStates.get(identity),
  };
}

// ============================================
// STRATEGY PRESETS
// ============================================

/**
 * Preset for 1:1 lessons - subscribe to everything
 */
export const ONE_ON_ONE_PRESET: SelectiveSubscriptionOptions = {
  strategy: "all",
  maxVideoSubscriptions: null,
  alwaysSubscribeAudio: true,
  activeSpeakerQuality: VideoQuality.HIGH,
  backgroundQuality: VideoQuality.HIGH,
};

/**
 * Preset for small group lessons (3-5 participants)
 */
export const SMALL_GROUP_PRESET: SelectiveSubscriptionOptions = {
  strategy: "pinned",
  maxVideoSubscriptions: 4,
  alwaysSubscribeAudio: true,
  speakerCooldownMs: 3000,
  activeSpeakerQuality: VideoQuality.HIGH,
  backgroundQuality: VideoQuality.MEDIUM,
};

/**
 * Preset for large group lessons (6+ participants)
 */
export const LARGE_GROUP_PRESET: SelectiveSubscriptionOptions = {
  strategy: "active_speaker",
  maxVideoSubscriptions: 3,
  alwaysSubscribeAudio: true,
  speakerCooldownMs: 5000,
  activeSpeakerQuality: VideoQuality.HIGH,
  backgroundQuality: VideoQuality.LOW,
};

/**
 * Preset for webinar-style (one speaker, many viewers)
 */
export const WEBINAR_PRESET: SelectiveSubscriptionOptions = {
  strategy: "pinned",
  maxVideoSubscriptions: 2,
  alwaysSubscribeAudio: true,
  speakerCooldownMs: 1000,
  activeSpeakerQuality: VideoQuality.HIGH,
  backgroundQuality: VideoQuality.LOW,
};

/**
 * Get recommended preset based on participant count
 */
export function getRecommendedPreset(
  participantCount: number
): SelectiveSubscriptionOptions {
  if (participantCount <= 2) {
    return ONE_ON_ONE_PRESET;
  } else if (participantCount <= 5) {
    return SMALL_GROUP_PRESET;
  } else {
    return LARGE_GROUP_PRESET;
  }
}
