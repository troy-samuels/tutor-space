"use client";

import {
  useTracks,
  TrackRefContext,
  VideoTrack,
  AudioTrack,
  useParticipantInfo,
  useConnectionQualityIndicator,
  useIsSpeaking,
  useMaybeTrackRefContext,
} from "@livekit/components-react";
import { Track, ConnectionQuality } from "livekit-client";
import { ControlBar } from "./ControlBar";
import { cn } from "@/lib/utils";
import { User, Mic, MicOff, SignalLow, SignalMedium, SignalHigh } from "lucide-react";
import { useLiveKitQualityMonitor, type QualityMetrics } from "@/lib/hooks/useLiveKitQualityMonitor";
import { ConnectionQualityIndicator } from "./ConnectionQualityIndicator";
import { ReconnectionToast } from "./ReconnectionOverlay";

export interface VideoStageProps {
  roomName: string;
  isTutor: boolean;
  recordingEnabled?: boolean;
  onLeave?: () => void;
}

export function VideoStage({ roomName, isTutor, recordingEnabled, onLeave }: VideoStageProps) {
  // Quality monitoring
  const { metrics, isDegraded } = useLiveKitQualityMonitor({
    enableLogging: process.env.NODE_ENV === "development",
  });

  // Subscribe to camera, microphone, and screen share tracks
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.Microphone, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  // Separate screen share tracks from regular participant tracks
  const screenShareTracks = tracks.filter(
    (track) => track.source === Track.Source.ScreenShare
  );

  // Get unique participants with their camera tracks
  const participantMap = new Map<string, typeof tracks[0]>();
  tracks
    .filter((track) => track.source === Track.Source.Camera)
    .forEach((track) => {
      participantMap.set(track.participant.identity, track);
    });
  const participantTracks = Array.from(participantMap.values());

  const hasScreenShare = screenShareTracks.length > 0;

  return (
    <div className="h-full relative bg-slate-950 overflow-hidden">
      {/* Reconnection toast notification */}
      <ReconnectionToast />

      {/* Connection quality indicator (top-left) */}
      <div className="absolute top-4 left-4 z-20">
        <ConnectionQualityIndicator showTips={true} />
      </div>

      {/* Quality overlay (top-right) */}
      <QualityOverlay metrics={metrics} isDegraded={isDegraded} />

      <div className="flex h-full flex-col p-2 sm:p-4 pb-20 sm:pb-24">
        {/* Screen share takes priority - shown large */}
        {hasScreenShare && (
          <div className="flex-1 min-h-0 mb-4">
            <div className="h-full rounded-2xl overflow-hidden border border-white/10 bg-black">
              <TrackRefContext.Provider value={screenShareTracks[0]}>
                <VideoTrack className="w-full h-full object-contain" />
              </TrackRefContext.Provider>
            </div>
          </div>
        )}

        {/* Participant video grid */}
        <div
          className={cn(
            "grid gap-3 sm:gap-4 w-full",
            hasScreenShare
              ? "h-32 sm:h-40 grid-cols-2 sm:grid-cols-4"
              : "flex-1 min-h-0",
            !hasScreenShare && participantTracks.length === 1 && "grid-cols-1 max-w-2xl mx-auto",
            !hasScreenShare && participantTracks.length >= 2 && "grid-cols-1 sm:grid-cols-2 max-w-5xl mx-auto"
          )}
        >
          {participantTracks.map((trackRef) => (
            <TrackRefContext.Provider key={trackRef.participant.identity} value={trackRef}>
              <ParticipantVideoTile compact={hasScreenShare} />
            </TrackRefContext.Provider>
          ))}
        </div>
      </div>

      <ControlBar
        roomName={roomName}
        isTutor={isTutor}
        recordingEnabled={recordingEnabled}
        onLeave={onLeave}
        className="absolute bottom-[calc(env(safe-area-inset-bottom)+0.5rem)] left-1/2 -translate-x-1/2 z-40 max-w-[calc(100vw-1rem)] min-w-fit rounded-full bg-white/90 shadow-lg backdrop-blur-md sm:bottom-6"
      />
    </div>
  );
}

interface ParticipantVideoTileProps {
  compact?: boolean;
}

function ParticipantVideoTile({ compact = false }: ParticipantVideoTileProps) {
  const trackRef = useMaybeTrackRefContext();
  const { identity, name } = useParticipantInfo();
  const { quality } = useConnectionQualityIndicator({
    participant: trackRef?.participant,
  });
  const isSpeaking = useIsSpeaking();

  if (!trackRef) return null;

  const hasVideo = trackRef.publication?.track && !trackRef.publication.isMuted;
  const displayName = name || identity || "Participant";

  return (
    <div
      className={cn(
        "relative rounded-xl sm:rounded-2xl overflow-hidden border bg-white/5 backdrop-blur transition-all",
        isSpeaking ? "border-emerald-400 ring-2 ring-emerald-400/30" : "border-white/10",
        compact ? "aspect-video" : "aspect-video min-h-[240px] sm:min-h-0"
      )}
    >
      {hasVideo ? (
        <VideoTrack className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-white/70">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/10 flex items-center justify-center mb-3">
            <User className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          {!compact && (
            <span className="text-sm font-medium">{displayName}</span>
          )}
        </div>
      )}

      {/* Audio track (hidden, for audio playback) */}
      <AudioTrack className="hidden" />

      {/* Participant info overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 bg-gradient-to-t from-black/70 to-transparent">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {isSpeaking && (
              <span className="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
            <span className="text-white text-xs sm:text-sm font-medium truncate">
              {displayName}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <MicIndicator />
            <ConnectionQualityIcon quality={quality} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MicIndicator() {
  const trackRef = useMaybeTrackRefContext();

  // Find the microphone track for this participant
  const tracks = useTracks([{ source: Track.Source.Microphone, withPlaceholder: true }]);
  const micTrack = tracks.find(
    (t) => t.participant.identity === trackRef?.participant?.identity
  );

  const isMuted = !micTrack?.publication?.track || micTrack.publication.isMuted;

  return (
    <div
      className={cn(
        "p-1 rounded-full",
        isMuted ? "bg-red-500/80" : "bg-white/20"
      )}
    >
      {isMuted ? (
        <MicOff className="w-3 h-3 text-white" />
      ) : (
        <Mic className="w-3 h-3 text-white" />
      )}
    </div>
  );
}

function ConnectionQualityIcon({ quality }: { quality: ConnectionQuality }) {
  // ConnectionQuality: Unknown=0, Poor=1, Good=2, Excellent=3, Lost=4
  const Icon =
    quality === ConnectionQuality.Poor || quality === ConnectionQuality.Lost
      ? SignalLow
      : quality === ConnectionQuality.Good
        ? SignalMedium
        : SignalHigh;
  const color =
    quality === ConnectionQuality.Poor || quality === ConnectionQuality.Lost
      ? "text-red-400"
      : quality === ConnectionQuality.Good
        ? "text-yellow-400"
        : "text-emerald-400";

  return <Icon className={cn("w-4 h-4", color)} />;
}

function QualityOverlay({
  metrics,
  isDegraded,
}: {
  metrics: QualityMetrics | null;
  isDegraded: boolean;
}) {
  if (!metrics && !isDegraded) return null;

  const layerLabel =
    metrics?.currentLayer && metrics.currentLayer !== "unknown"
      ? metrics.currentLayer.toUpperCase()
      : null;

  return (
    <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
      {isDegraded && (
        <div className="bg-amber-500/90 text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-md">
          Low bandwidth
        </div>
      )}
      {layerLabel && (
        <div className="bg-black/50 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">
          {layerLabel}
        </div>
      )}
    </div>
  );
}
