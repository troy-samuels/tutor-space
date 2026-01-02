"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { PreJoinMicIndicator } from "./MicVolumeIndicator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mic, MicOff, Video, VideoOff, Settings, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PreJoinScreenProps {
  onJoin: (settings: {
    audioEnabled: boolean;
    audioDeviceId?: string;
    videoEnabled: boolean;
    videoDeviceId?: string;
  }) => void;
  participantName?: string;
  serviceName?: string;
}

export function PreJoinScreen({
  onJoin,
  participantName,
  serviceName,
}: PreJoinScreenProps) {
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    async function initDevices() {
      try {
        // Request both audio and video permissions
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });

        const devices = await navigator.mediaDevices.enumerateDevices();
        setAudioDevices(devices.filter((d) => d.kind === "audioinput"));
        setVideoDevices(devices.filter((d) => d.kind === "videoinput"));

        const defaultAudio = devices.find((d) => d.kind === "audioinput");
        if (defaultAudio) setSelectedAudioDevice(defaultAudio.deviceId);

        const defaultVideo = devices.find((d) => d.kind === "videoinput");
        if (defaultVideo) setSelectedVideoDevice(defaultVideo.deviceId);

        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = stream;
        setMediaStream(stream);
        setIsLoading(false);
      } catch (err) {
        console.error("[PreJoin] Failed to get devices:", err);
        setIsLoading(false);
      }
    }

    initDevices();

    return () => {
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    };
  }, []);

  useEffect(() => {
    async function updateStream() {
      if (!selectedAudioDevice && !selectedVideoDevice) return;

      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());

      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          audio: selectedAudioDevice
            ? { deviceId: { exact: selectedAudioDevice } }
            : true,
          video: selectedVideoDevice
            ? { deviceId: { exact: selectedVideoDevice } }
            : true,
        });
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = newStream;
        setMediaStream(newStream);
      } catch (err) {
        console.error("[PreJoin] Failed to update stream:", err);
      }
    }

    if (!isLoading) {
      updateStream();
    }
  }, [isLoading, selectedAudioDevice, selectedVideoDevice]);

  // Attach video stream to video element
  useEffect(() => {
    if (videoRef.current && mediaStream && videoEnabled) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream, videoEnabled]);

  const handleJoin = () => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    onJoin({
      audioEnabled,
      audioDeviceId: selectedAudioDevice || undefined,
      videoEnabled,
      videoDeviceId: selectedVideoDevice || undefined,
    });
  };

  const toggleAudio = () => {
    setAudioEnabled((prev) => {
      const next = !prev;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = next;
        });
      }
      return next;
    });
  };

  const toggleVideo = () => {
    setVideoEnabled((prev) => {
      const next = !prev;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getVideoTracks().forEach((track) => {
          track.enabled = next;
        });
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-card p-4 shadow-lg">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">
            Setting up your camera and mic...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="classroom-prejoin" className="min-h-[100dvh] bg-background flex items-center justify-center p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:p-6">
      <div className="max-w-xl w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            Ready to join?
          </h1>
          {participantName && (
            <p className="text-muted-foreground">
              Meeting with <span className="font-medium">{participantName}</span>
              {serviceName && (
                <span className="text-sm"> - {serviceName}</span>
              )}
            </p>
          )}
        </div>

        <div className="rounded-3xl bg-zinc-900 p-6 shadow-xl relative text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold">Camera & microphone check</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Check your video and say a few words to test your setup.
              </p>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                "p-2 rounded-full transition-colors",
                showSettings
                  ? "bg-white text-zinc-900"
                  : "bg-white/10 text-white hover:bg-white/20"
              )}
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>

          {/* Video Preview */}
          <div className="mt-6 flex items-center justify-center">
            <div className="relative w-full max-w-sm aspect-video rounded-2xl overflow-hidden bg-zinc-800">
              {videoEnabled && mediaStream ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover mirror"
                  style={{ transform: "scaleX(-1)" }}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500">
                  <VideoOff className="h-12 w-12 mb-2" />
                  <span className="text-sm">Camera is off</span>
                </div>
              )}
              {/* Mic indicator overlay */}
              {audioEnabled && mediaStream && (
                <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/50 rounded-full px-3 py-1.5">
                  <Mic className="h-3.5 w-3.5 text-emerald-400" />
                  <PreJoinMicIndicator stream={mediaStream} className="h-4" />
                </div>
              )}
              {!audioEnabled && (
                <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-red-500/80 rounded-full px-3 py-1.5">
                  <MicOff className="h-3.5 w-3.5 text-white" />
                  <span className="text-xs text-white">Muted</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {showSettings && (
          <div className="p-4 bg-card rounded-2xl border space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Microphone
              </label>
              <Select
                value={selectedAudioDevice}
                onValueChange={setSelectedAudioDevice}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select microphone" />
                </SelectTrigger>
                <SelectContent>
                  {audioDevices.map((device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label || `Mic ${device.deviceId.slice(0, 8)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Camera
              </label>
              <Select
                value={selectedVideoDevice}
                onValueChange={setSelectedVideoDevice}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select camera" />
                </SelectTrigger>
                <SelectContent>
                  {videoDevices.map((device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={toggleAudio}
            className={cn(
              "h-14 w-14 rounded-full flex items-center justify-center transition-all shadow-md",
              audioEnabled
                ? "bg-card text-foreground hover:bg-muted"
                : "bg-red-500 text-white hover:bg-red-600"
            )}
            aria-label={audioEnabled ? "Mute microphone" : "Unmute microphone"}
          >
            {audioEnabled ? (
              <Mic className="h-5 w-5" />
            ) : (
              <MicOff className="h-5 w-5" />
            )}
          </button>
          <button
            onClick={toggleVideo}
            className={cn(
              "h-14 w-14 rounded-full flex items-center justify-center transition-all shadow-md",
              videoEnabled
                ? "bg-card text-foreground hover:bg-muted"
                : "bg-red-500 text-white hover:bg-red-600"
            )}
            aria-label={videoEnabled ? "Turn off camera" : "Turn on camera"}
          >
            {videoEnabled ? (
              <Video className="h-5 w-5" />
            ) : (
              <VideoOff className="h-5 w-5" />
            )}
          </button>
        </div>

        <Button
          onClick={handleJoin}
          size="lg"
          data-testid="classroom-join-button"
          className="w-full rounded-full h-14 text-lg"
        >
          Join Lesson
        </Button>
      </div>
    </div>
  );
}
