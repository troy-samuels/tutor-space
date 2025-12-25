"use client";

import { useTracks, TrackLoop, ParticipantAudioTile } from "@livekit/components-react";
import { Track } from "livekit-client";
import { ControlBar } from "./ControlBar";
import { cn } from "@/lib/utils";

export interface AudioStageProps {
  roomName: string;
  isTutor: boolean;
  recordingEnabled?: boolean;
}

export function AudioStage({ roomName, isTutor, recordingEnabled }: AudioStageProps) {
  const tracks = useTracks(
    [{ source: Track.Source.Microphone, withPlaceholder: true }],
    { onlySubscribed: false }
  );

  return (
    <div className="h-full relative bg-slate-950 overflow-hidden">
      <div className="flex h-full flex-col items-center justify-center p-6">
        <div className="grid w-full max-w-4xl gap-4 sm:grid-cols-2">
          <TrackLoop tracks={tracks}>
            <ParticipantAudioTile
              className={cn(
                "flex min-h-[220px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-lg backdrop-blur",
                "[&_.lk-audio-bar-visualizer]:mt-6 [&_.lk-audio-bar-visualizer]:h-16",
                "[&_.lk-audio-bar]:bg-white/30 [&_.lk-audio-bar.lk-highlighted]:bg-emerald-400",
                "[&_.lk-participant-metadata]:mt-4 [&_.lk-participant-metadata]:flex [&_.lk-participant-metadata]:items-center [&_.lk-participant-metadata]:justify-between [&_.lk-participant-metadata]:w-full",
                "[&_.lk-participant-name]:text-sm [&_.lk-participant-name]:font-medium",
                "[&_.lk-connection-quality-indicator]:scale-90"
              )}
            />
          </TrackLoop>
        </div>
      </div>

      <ControlBar
        roomName={roomName}
        isTutor={isTutor}
        recordingEnabled={recordingEnabled}
        className="absolute bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-1/2 -translate-x-1/2 z-40 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-full bg-white/80 shadow-lg backdrop-blur-md sm:bottom-8"
      />
    </div>
  );
}
