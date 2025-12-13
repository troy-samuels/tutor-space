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
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Settings,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PreJoinScreenProps {
  onJoin: (settings: {
    videoEnabled: boolean;
    audioEnabled: boolean;
    videoDeviceId?: string;
    audioDeviceId?: string;
  }) => void;
  participantName?: string;
  serviceName?: string;
}

export function PreJoinScreen({
  onJoin,
  participantName,
  serviceName,
}: PreJoinScreenProps) {
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");
  const [showSettings, setShowSettings] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Get available devices and start preview
  useEffect(() => {
    async function initDevices() {
      try {
        // Request permissions first
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        // Get device list after permissions granted
        const devices = await navigator.mediaDevices.enumerateDevices();
        setVideoDevices(devices.filter((d) => d.kind === "videoinput"));
        setAudioDevices(devices.filter((d) => d.kind === "audioinput"));

        // Set default devices
        const defaultVideo = devices.find((d) => d.kind === "videoinput");
        const defaultAudio = devices.find((d) => d.kind === "audioinput");
        if (defaultVideo) setSelectedVideoDevice(defaultVideo.deviceId);
        if (defaultAudio) setSelectedAudioDevice(defaultAudio.deviceId);

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
      // Cleanup stream on unmount
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    };
  }, []);

  // Update video preview when stream changes
  useEffect(() => {
    if (videoRef.current && mediaStream && videoEnabled) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream, videoEnabled]);

  // Update stream when device selection changes
  useEffect(() => {
    async function updateStream() {
      if (!selectedVideoDevice && !selectedAudioDevice) return;

      // Stop existing tracks
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());

      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: selectedVideoDevice
            ? { deviceId: { exact: selectedVideoDevice } }
            : true,
          audio: selectedAudioDevice
            ? { deviceId: { exact: selectedAudioDevice } }
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
  }, [isLoading, selectedVideoDevice, selectedAudioDevice]);

  const handleJoin = () => {
    // Stop preview stream before joining
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    onJoin({
      videoEnabled,
      audioEnabled,
      videoDeviceId: selectedVideoDevice || undefined,
      audioDeviceId: selectedAudioDevice || undefined,
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

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-card p-4 shadow-lg">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">
            Setting up your devices...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:p-6">
      <div className="max-w-xl w-full space-y-6">
        {/* Header */}
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

        {/* Camera Preview Card */}
        <div className="rounded-3xl overflow-hidden aspect-video bg-zinc-900 shadow-xl relative">
          {videoEnabled && mediaStream ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover -scale-x-100"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-800">
              <div className="h-20 w-20 rounded-full bg-zinc-700 flex items-center justify-center">
                <VideoOff className="h-8 w-8 text-zinc-400" />
              </div>
            </div>
          )}

          {/* Settings button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={cn(
              "absolute top-4 right-4 p-2 rounded-full transition-colors",
              showSettings
                ? "bg-white text-zinc-900"
                : "bg-black/50 text-white hover:bg-black/70"
            )}
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>

        {/* Device Selection (collapsed) */}
        {showSettings && (
          <div className="p-4 bg-card rounded-2xl border space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
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
            </div>
          </div>
        )}

        {/* Controls Row */}
        <div className="flex items-center justify-center gap-4">
          {/* Mic Toggle */}
          <button
            onClick={toggleAudio}
            className={cn(
              "h-14 w-14 rounded-full flex items-center justify-center transition-all shadow-md",
              audioEnabled
                ? "bg-card text-foreground hover:bg-muted"
                : "bg-red-500 text-white hover:bg-red-600"
            )}
          >
            {audioEnabled ? (
              <Mic className="h-5 w-5" />
            ) : (
              <MicOff className="h-5 w-5" />
            )}
          </button>

          {/* Camera Toggle */}
          <button
            onClick={toggleVideo}
            className={cn(
              "h-14 w-14 rounded-full flex items-center justify-center transition-all shadow-md",
              videoEnabled
                ? "bg-card text-foreground hover:bg-muted"
                : "bg-red-500 text-white hover:bg-red-600"
            )}
          >
            {videoEnabled ? (
              <Video className="h-5 w-5" />
            ) : (
              <VideoOff className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mic Volume Indicator */}
        {audioEnabled && (
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs text-muted-foreground">Mic level:</span>
            <PreJoinMicIndicator stream={mediaStream} className="h-5" />
          </div>
        )}

        {/* Join Button */}
        <Button
          onClick={handleJoin}
          size="lg"
          className="w-full rounded-full h-14 text-lg"
        >
          Join Lesson
        </Button>
      </div>
    </div>
  );
}
