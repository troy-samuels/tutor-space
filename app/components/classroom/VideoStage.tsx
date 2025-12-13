"use client";

import { useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";
import { GridLayout, ParticipantTile, ParticipantName } from "@livekit/components-react";
import { ControlBar } from "./ControlBar";
import { ConnectionQuality } from "./ConnectionQuality";
import { cn } from "@/lib/utils";

export type LayoutMode = "grid" | "presentation" | "cinema";

interface VideoStageProps {
  roomName: string;
  isTutor: boolean;
  bookingId?: string;
  layoutMode: LayoutMode;
  onLayoutModeChange: (mode: LayoutMode) => void;
  recordingEnabled?: boolean;
}

export function VideoStage({
  roomName,
  isTutor,
  layoutMode,
  onLayoutModeChange,
  recordingEnabled,
}: VideoStageProps) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  const cameraTracks = tracks.filter((t) => t.source === Track.Source.Camera);
  const screenShareTracks = tracks.filter((t) => t.source === Track.Source.ScreenShare);
  const screenShareTrack = screenShareTracks[0];

  const tutorCameraTrack =
    cameraTracks.find((t) => (isTutor ? t.participant.isLocal : !t.participant.isLocal)) ||
    cameraTracks[0];

  const studentCameraTrack = cameraTracks.find(
    (t) => t !== tutorCameraTrack && t.source === Track.Source.Camera
  );

  const renderGrid = () => (
    <GridLayout
      tracks={tracks}
      className={cn(
        "h-full",
        "[&_.lk-participant-tile]:border-0",
        "[&_.lk-participant-tile]:rounded-2xl",
        "[&_.lk-participant-tile]:overflow-hidden",
        "[&_.lk-participant-tile]:bg-black",
        // Style participant name tags via CSS
        "[&_.lk-participant-name]:absolute",
        "[&_.lk-participant-name]:bottom-3",
        "[&_.lk-participant-name]:left-3",
        "[&_.lk-participant-name]:z-10",
        "[&_.lk-participant-name]:px-3",
        "[&_.lk-participant-name]:py-1.5",
        "[&_.lk-participant-name]:rounded-full",
        "[&_.lk-participant-name]:bg-black/50",
        "[&_.lk-participant-name]:backdrop-blur-md",
        "[&_.lk-participant-name]:text-white",
        "[&_.lk-participant-name]:text-xs",
        "[&_.lk-participant-name]:font-medium",
        "[&_.lk-participant-name]:shadow-sm"
      )}
    >
      <ParticipantTile>
        <ParticipantName />
        <ConnectionQuality className="absolute top-3 right-3 z-10" />
      </ParticipantTile>
    </GridLayout>
  );

  const renderScreenShareOnly = (showCameras: boolean) => (
    <div className="relative h-full bg-black">
      {screenShareTrack ? (
        <ParticipantTile
          trackRef={screenShareTrack}
          className="absolute inset-0 [&_.lk-participant-name]:hidden [&_.lk-participant-metadata]:hidden"
        >
          <ParticipantName />
        </ParticipantTile>
      ) : (
        <div className="flex h-full items-center justify-center text-white/70 text-sm">
          Waiting for screen share...
        </div>
      )}

      {showCameras && tutorCameraTrack && (
        <ParticipantTile
          trackRef={tutorCameraTrack}
          className={cn(
            "absolute bottom-4 left-4 w-[150px] h-[150px] rounded-full overflow-hidden border-4 border-white shadow-xl z-20 bg-black/80 backdrop-blur-sm",
            "[&_.lk-participant-name]:hidden",
            "[&_.lk-participant-metadata]:hidden",
            "[&_.lk-participant-placeholder]:opacity-0"
          )}
        />
      )}

      {showCameras && studentCameraTrack && (
        <ParticipantTile
          trackRef={studentCameraTrack}
          className={cn(
            "absolute bottom-4 right-4 w-[110px] h-[110px] rounded-full overflow-hidden border-4 border-white shadow-lg z-20 bg-black/80 backdrop-blur-sm",
            "[&_.lk-participant-name]:hidden",
            "[&_.lk-participant-metadata]:hidden",
            "[&_.lk-participant-placeholder]:opacity-0"
          )}
        />
      )}
    </div>
  );

  const stageContent =
    layoutMode === "grid"
      ? renderGrid()
      : layoutMode === "presentation"
        ? renderScreenShareOnly(true)
        : renderScreenShareOnly(false);

  return (
    <div className="h-full relative bg-slate-900 overflow-hidden">
      {stageContent}

      {/* Floating Control Bar - positioned at bottom center */}
      <ControlBar
        roomName={roomName}
        isTutor={isTutor}
        layoutMode={layoutMode}
        onLayoutModeChange={onLayoutModeChange}
        recordingEnabled={recordingEnabled}
        className="absolute bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-1/2 -translate-x-1/2 z-40 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-full bg-white/80 shadow-lg backdrop-blur-md sm:bottom-8"
      />
    </div>
  );
}
