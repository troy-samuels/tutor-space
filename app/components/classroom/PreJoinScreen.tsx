"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { PreJoinMicIndicator } from "./MicVolumeIndicator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mic, MicOff, Video, VideoOff, Settings, Loader2, AlertCircle } from "lucide-react";
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
  const [deviceNotice, setDeviceNotice] = useState<{
    tone: "warning" | "error";
    message: string;
  } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const lastRequestedRef = useRef({ audioEnabled: true, videoEnabled: true });
  const audioEnabledRef = useRef(audioEnabled);
  const videoEnabledRef = useRef(videoEnabled);

  useEffect(() => {
    audioEnabledRef.current = audioEnabled;
  }, [audioEnabled]);

  useEffect(() => {
    videoEnabledRef.current = videoEnabled;
  }, [videoEnabled]);

  const stopStream = useCallback((stream: MediaStream | null) => {
    stream?.getTracks().forEach((track) => track.stop());
  }, []);

  const replaceStream = useCallback(
    (nextStream: MediaStream | null) => {
      if (mediaStreamRef.current && mediaStreamRef.current !== nextStream) {
        stopStream(mediaStreamRef.current);
      }
      mediaStreamRef.current = nextStream;
      setMediaStream(nextStream);
    },
    [stopStream]
  );

  const refreshDeviceList = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const nextAudioDevices = devices.filter((d) => d.kind === "audioinput");
      const nextVideoDevices = devices.filter((d) => d.kind === "videoinput");
      setAudioDevices(nextAudioDevices);
      setVideoDevices(nextVideoDevices);
      setSelectedAudioDevice((prev) => {
        if (prev && nextAudioDevices.some((device) => device.deviceId === prev)) return prev;
        return nextAudioDevices[0]?.deviceId ?? "";
      });
      setSelectedVideoDevice((prev) => {
        if (prev && nextVideoDevices.some((device) => device.deviceId === prev)) return prev;
        return nextVideoDevices[0]?.deviceId ?? "";
      });
    } catch (err) {
      console.error("[PreJoin] Failed to enumerate devices:", err);
    }
  }, []);

  const buildConstraints = useCallback(
    (audioOn: boolean, videoOn: boolean) => ({
      audio: audioOn
        ? selectedAudioDevice
          ? { deviceId: { exact: selectedAudioDevice } }
          : true
        : false,
      video: videoOn
        ? selectedVideoDevice
          ? { deviceId: { exact: selectedVideoDevice } }
          : true
        : false,
    }),
    [selectedAudioDevice, selectedVideoDevice]
  );

  const getMediaErrorMessage = (err: unknown) => {
    const name = typeof err === "object" && err !== null && "name" in err ? (err as { name?: string }).name : "";
    switch (name) {
      case "NotAllowedError":
      case "SecurityError":
        return "Camera or microphone access is blocked. Enable permissions in your browser and try again.";
      case "NotFoundError":
        return "No camera or microphone detected. Connect a device or join without media.";
      case "NotReadableError":
        return "Camera or microphone is already in use by another app.";
      case "OverconstrainedError":
        return "Selected device isn't available. Try another device.";
      default:
        return "We couldn't access your camera or microphone. You can join without media or retry.";
    }
  };

  const requestPreviewStream = useCallback(
    async (
      nextAudioEnabled: boolean,
      nextVideoEnabled: boolean,
      options: { allowFallback?: boolean } = {}
    ) => {
      lastRequestedRef.current = { audioEnabled: nextAudioEnabled, videoEnabled: nextVideoEnabled };

      if (!navigator.mediaDevices?.getUserMedia) {
        setDeviceNotice({
          tone: "error",
          message: "Your browser doesn't support camera or microphone access.",
        });
        return { updated: true, audioEnabled: false, videoEnabled: false };
      }

      if (!nextAudioEnabled && !nextVideoEnabled) {
        replaceStream(null);
        setDeviceNotice(null);
        return { updated: true, audioEnabled: false, videoEnabled: false };
      }

      const hadStream = Boolean(mediaStreamRef.current);
      const allowFallback = options.allowFallback ?? false;

      setIsRefreshing(true);
      try {
        const nextStream = await navigator.mediaDevices.getUserMedia(
          buildConstraints(nextAudioEnabled, nextVideoEnabled)
        );
        replaceStream(nextStream);
        setDeviceNotice(null);
        return {
          updated: true,
          audioEnabled: nextAudioEnabled,
          videoEnabled: nextVideoEnabled,
        };
      } catch (err) {
        if (allowFallback && nextAudioEnabled && nextVideoEnabled) {
          try {
            const audioOnlyStream = await navigator.mediaDevices.getUserMedia(
              buildConstraints(true, false)
            );
            replaceStream(audioOnlyStream);
            setDeviceNotice({
              tone: "warning",
              message: "Camera unavailable. You can still join with microphone only.",
            });
            return { updated: true, audioEnabled: true, videoEnabled: false };
          } catch {
            // fall through
          }

          try {
            const videoOnlyStream = await navigator.mediaDevices.getUserMedia(
              buildConstraints(false, true)
            );
            replaceStream(videoOnlyStream);
            setDeviceNotice({
              tone: "warning",
              message: "Microphone unavailable. You can still join with camera only.",
            });
            return { updated: true, audioEnabled: false, videoEnabled: true };
          } catch {
            // fall through
          }
        }

        setDeviceNotice({ tone: "error", message: getMediaErrorMessage(err) });
        return hadStream
          ? { updated: false, audioEnabled: nextAudioEnabled, videoEnabled: nextVideoEnabled }
          : { updated: true, audioEnabled: false, videoEnabled: false };
      } finally {
        setIsRefreshing(false);
      }
    },
    [buildConstraints, replaceStream]
  );

  useEffect(() => {
    async function initDevices() {
      try {
        const outcome = await requestPreviewStream(true, true, { allowFallback: true });
        if (outcome.updated) {
          setAudioEnabled(outcome.audioEnabled);
          setVideoEnabled(outcome.videoEnabled);
        }
        await refreshDeviceList();
        setIsLoading(false);
      } catch (err) {
        console.error("[PreJoin] Failed to get devices:", err);
        setIsLoading(false);
      }
    }

    initDevices();

    return () => {
      replaceStream(null);
    };
  }, [refreshDeviceList, requestPreviewStream, replaceStream]);

  useEffect(() => {
    if (isLoading) return;
    if (!selectedAudioDevice && !selectedVideoDevice) return;

    const updateStream = async () => {
      const outcome = await requestPreviewStream(
        audioEnabledRef.current,
        videoEnabledRef.current,
        { allowFallback: audioEnabledRef.current && videoEnabledRef.current }
      );
      if (outcome.updated) {
        setAudioEnabled(outcome.audioEnabled);
        setVideoEnabled(outcome.videoEnabled);
      }
    };

    void updateStream();
  }, [isLoading, selectedAudioDevice, selectedVideoDevice, requestPreviewStream]);

  // Attach video stream to video element
  useEffect(() => {
    if (!videoRef.current) return;
    if (mediaStream && videoEnabled) {
      videoRef.current.srcObject = mediaStream;
      return;
    }
    videoRef.current.srcObject = null;
  }, [mediaStream, videoEnabled]);

  const handleJoin = () => {
    replaceStream(null);
    onJoin({
      audioEnabled,
      audioDeviceId: selectedAudioDevice || undefined,
      videoEnabled,
      videoDeviceId: selectedVideoDevice || undefined,
    });
  };

  const toggleAudio = async () => {
    if (isRefreshing) return;
    const nextAudioEnabled = !audioEnabled;
    const currentStream = mediaStreamRef.current;

    if (!nextAudioEnabled) {
      currentStream?.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });
      setAudioEnabled(false);
      if (!videoEnabled) {
        replaceStream(null);
      }
      return;
    }

    const hasAudioTrack = (currentStream?.getAudioTracks().length ?? 0) > 0;
    if (hasAudioTrack) {
      currentStream?.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });
      setAudioEnabled(true);
      return;
    }

    const outcome = await requestPreviewStream(nextAudioEnabled, videoEnabled, {
      allowFallback: nextAudioEnabled && videoEnabled,
    });
    if (outcome.updated) {
      setAudioEnabled(outcome.audioEnabled);
      setVideoEnabled(outcome.videoEnabled);
    }
  };

  const toggleVideo = async () => {
    if (isRefreshing) return;
    const nextVideoEnabled = !videoEnabled;
    const currentStream = mediaStreamRef.current;

    if (!nextVideoEnabled) {
      currentStream?.getVideoTracks().forEach((track) => {
        track.enabled = false;
      });
      setVideoEnabled(false);
      if (!audioEnabled) {
        replaceStream(null);
      }
      return;
    }

    const hasVideoTrack = (currentStream?.getVideoTracks().length ?? 0) > 0;
    if (hasVideoTrack) {
      currentStream?.getVideoTracks().forEach((track) => {
        track.enabled = true;
      });
      setVideoEnabled(true);
      return;
    }

    const outcome = await requestPreviewStream(audioEnabled, nextVideoEnabled, {
      allowFallback: audioEnabled && nextVideoEnabled,
    });
    if (outcome.updated) {
      setAudioEnabled(outcome.audioEnabled);
      setVideoEnabled(outcome.videoEnabled);
    }
  };

  const handleRetry = async () => {
    if (isRefreshing) return;
    const lastRequested = lastRequestedRef.current ?? { audioEnabled: true, videoEnabled: true };
    const outcome = await requestPreviewStream(lastRequested.audioEnabled, lastRequested.videoEnabled, {
      allowFallback: lastRequested.audioEnabled && lastRequested.videoEnabled,
    });
    if (outcome.updated) {
      setAudioEnabled(outcome.audioEnabled);
      setVideoEnabled(outcome.videoEnabled);
    }
    await refreshDeviceList();
  };

  useEffect(() => {
    if (!navigator.mediaDevices?.addEventListener) return;
    const handleDeviceChange = () => {
      void refreshDeviceList();
    };
    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
    };
  }, [refreshDeviceList]);

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

        {deviceNotice && (
          <div
            className={cn(
              "flex items-start gap-3 rounded-2xl border p-4 text-sm",
              deviceNotice.tone === "error"
                ? "border-red-200 bg-red-50 text-red-900"
                : "border-amber-200 bg-amber-50 text-amber-900"
            )}
          >
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Camera & microphone issue</p>
              <p
                className={cn(
                  "text-xs mt-1",
                  deviceNotice.tone === "error"
                    ? "text-red-800/80"
                    : "text-amber-900/80"
                )}
              >
                {deviceNotice.message}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              disabled={isRefreshing}
              className="rounded-full h-8 px-3"
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Retry"
              )}
            </Button>
          </div>
        )}

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
              {audioDevices.length === 0 && (
                <p className="text-xs text-muted-foreground">No microphone detected.</p>
              )}
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
              {videoDevices.length === 0 && (
                <p className="text-xs text-muted-foreground">No camera detected.</p>
              )}
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
