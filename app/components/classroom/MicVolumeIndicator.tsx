"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocalParticipant } from "@livekit/components-react";
import { cn } from "@/lib/utils";

interface MicVolumeIndicatorProps {
  className?: string;
}

function useAudioLevelFromMediaStreamTrack(track?: MediaStreamTrack | null) {
  const [level, setLevel] = useState(0);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Float32Array | null>(null);
  const smoothedRef = useRef(0);

  useEffect(() => {
    if (!track) {
      setLevel(0);
      return;
    }

    let cancelled = false;

    const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextCtor) {
      setLevel(0);
      return;
    }

    const audioContext = new AudioContextCtor({ latencyHint: "interactive" });
    audioContextRef.current = audioContext;
    const analyser = audioContext.createAnalyser();
    analyserRef.current = analyser;
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.8;

    const stream = new MediaStream([track]);
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    const data = new Float32Array(analyser.fftSize);
    dataRef.current = data;

    const tryResume = async () => {
      try {
        if (audioContext.state !== "running") {
          await audioContext.resume();
        }
      } catch {
        // Ignore; browsers may require a user gesture.
      }
    };

    const onUserGesture = () => {
      void tryResume();
    };

    void tryResume();
    window.addEventListener("pointerdown", onUserGesture, { capture: true });
    window.addEventListener("keydown", onUserGesture, { capture: true });

    const tick = () => {
      if (cancelled) return;

      if (audioContext.state !== "running") {
        setLevel(0);
        animationRef.current = requestAnimationFrame(tick);
        return;
      }

      analyser.getFloatTimeDomainData(data);

      let sumSquares = 0;
      for (let i = 0; i < data.length; i++) {
        const v = data[i] ?? 0;
        sumSquares += v * v;
      }
      const rms = Math.sqrt(sumSquares / data.length);

      const normalized = Math.min(rms * 4, 1);
      smoothedRef.current = smoothedRef.current * 0.82 + normalized * 0.18;
      setLevel(smoothedRef.current);

      animationRef.current = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", onUserGesture, true);
      window.removeEventListener("keydown", onUserGesture, true);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      try {
        source.disconnect();
      } catch {
        // ignore
      }
      try {
        analyser.disconnect();
      } catch {
        // ignore
      }
      analyserRef.current = null;
      dataRef.current = null;
      smoothedRef.current = 0;
      void audioContext.close();
      audioContextRef.current = null;
    };
  }, [track]);

  return level;
}

export function MicVolumeIndicator({ className }: MicVolumeIndicatorProps) {
  const { microphoneTrack, isMicrophoneEnabled } = useLocalParticipant();

  const mediaStreamTrack = useMemo(() => {
    if (!isMicrophoneEnabled) return null;
    const track = microphoneTrack?.track as any;
    return (track?.mediaStreamTrack as MediaStreamTrack | undefined) ?? null;
  }, [isMicrophoneEnabled, microphoneTrack]);

  const volume = useAudioLevelFromMediaStreamTrack(mediaStreamTrack);

  // 4 bars with different thresholds
  const bars = [
    { threshold: 0.1, height: "25%" },
    { threshold: 0.25, height: "50%" },
    { threshold: 0.45, height: "75%" },
    { threshold: 0.65, height: "100%" },
  ];

  return (
    <div className={cn("flex items-end gap-0.5 h-4", className)}>
      {bars.map((bar, i) => (
        <div
          key={i}
          className={cn(
            "w-1 rounded-full transition-all duration-75",
            volume > bar.threshold ? "bg-emerald-500" : "bg-muted-foreground/30"
          )}
          style={{ height: bar.height }}
        />
      ))}
    </div>
  );
}

// Simplified version for pre-join screen (uses raw MediaStream)
interface PreJoinMicIndicatorProps {
  stream: MediaStream | null;
  className?: string;
}

export function PreJoinMicIndicator({ stream, className }: PreJoinMicIndicatorProps) {
  const audioTrack = useMemo(() => {
    if (!stream) return null;
    return stream.getAudioTracks()[0] ?? null;
  }, [stream]);

  const volume = useAudioLevelFromMediaStreamTrack(audioTrack);

  const bars = [
    { threshold: 0.1, height: "25%" },
    { threshold: 0.25, height: "50%" },
    { threshold: 0.45, height: "75%" },
    { threshold: 0.65, height: "100%" },
  ];

  return (
    <div className={cn("flex items-end gap-0.5 h-4", className)}>
      {bars.map((bar, i) => (
        <div
          key={i}
          className={cn(
            "w-1 rounded-full transition-all duration-75",
            volume > bar.threshold ? "bg-emerald-500" : "bg-muted-foreground/30"
          )}
          style={{ height: bar.height }}
        />
      ))}
    </div>
  );
}
