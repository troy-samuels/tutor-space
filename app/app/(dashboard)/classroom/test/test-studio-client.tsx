"use client";

import "@livekit/components-styles";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LiveKitRoom,
  RoomAudioRenderer,
} from "@livekit/components-react";
import { Loader2, ShieldAlert, ArrowLeft, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoStage } from "@/components/classroom/VideoStage";
import { PreJoinScreen } from "@/components/classroom/PreJoinScreen";
import { ConnectionToast } from "@/components/classroom/ConnectionToast";
import { useLiveKitConnectionMonitor } from "@/lib/hooks/useLiveKitConnectionMonitor";

function LiveKitConnectionWatcher({
  serverUrl,
  token,
  onGiveUp,
}: {
  serverUrl: string;
  token: string;
  onGiveUp: () => void;
}) {
  const { toast } = useLiveKitConnectionMonitor({ serverUrl, token, onGiveUp });
  return <ConnectionToast toast={toast} />;
}

export default function TestStudioClient() {
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [error, setError] = useState<{
    message: string;
    isAccessDenied: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);
  const [joinSettings, setJoinSettings] = useState<{
    audioEnabled: boolean;
    audioDeviceId?: string;
    videoEnabled: boolean;
    videoDeviceId?: string;
  } | null>(null);

  useEffect(() => {
    async function fetchToken() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/livekit/token?room_type=test");

        if (!response.ok) {
          const data = await response.json();

          if (response.status === 403) {
            setError({
              message:
                data.error || "You don't have access to the Test Studio.",
              isAccessDenied: true,
            });
          } else if (response.status === 401) {
            setError({
              message: "Please sign in to access the Test Studio.",
              isAccessDenied: false,
            });
          } else if (response.status === 503) {
            setError({
              message:
                data.error ||
                "Classroom service isn't configured yet. Please contact support.",
              isAccessDenied: false,
            });
          } else {
            setError({
              message: data.error || "Failed to access the Test Studio.",
              isAccessDenied: false,
            });
          }
          return;
        }

        const data = await response.json();
        setToken(data.token);
        setRoomName(data.roomName ?? "test-studio");
      } catch (err) {
        console.error("[TestStudio] Error fetching token:", err);
        setError({
          message: "Something went wrong. Please try again.",
          isAccessDenied: false,
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchToken();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-card p-4 shadow-lg">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">Loading Test Studio...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-6 max-w-md text-center">
          <div className="rounded-full bg-red-50 p-5">
            <ShieldAlert className="h-10 w-10 text-red-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">
              {error.isAccessDenied ? "Access Denied" : "Unable to Access"}
            </h1>
            <p className="text-muted-foreground">{error.message}</p>
            {error.isAccessDenied && (
              <p className="text-sm text-muted-foreground/70 mt-2">
                The Test Studio is available for tutors on the Studio tier.
                Upgrade your plan to access this feature.
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="rounded-full px-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            {error.isAccessDenied && (
              <Button
                onClick={() => router.push("/settings/billing")}
                className="rounded-full px-6"
              >
                Upgrade Plan
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // No token (shouldn't happen if no error, but safety check)
  if (!token) {
    return null;
  }

  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (!serverUrl) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Configuration Error
          </h1>
          <p className="text-muted-foreground">
            Classroom service is not configured. Please contact support at support@tutorlingua.co.
          </p>
        </div>
      </div>
    );
  }

  // Pre-join screen
  if (!hasJoined) {
    return (
      <PreJoinScreen
        onJoin={(settings) => {
          setJoinSettings(settings);
          setHasJoined(true);
        }}
        participantName="Test Studio"
        serviceName="Equipment Check"
      />
    );
  }

  const audio =
    joinSettings?.audioEnabled === false
      ? false
      : joinSettings?.audioDeviceId
        ? { deviceId: joinSettings.audioDeviceId }
        : true;
  const video =
    joinSettings?.videoEnabled === false
      ? false
      : joinSettings?.videoDeviceId
        ? { deviceId: joinSettings.videoDeviceId }
        : true;

  return (
    <div className="min-h-[100dvh] bg-background p-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] sm:p-4 flex flex-col">
      {/* Back Button */}
      <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard")}
          className="text-muted-foreground hover:text-foreground hover:bg-card rounded-full px-3 h-8"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
          <span className="hidden sm:inline">Back to Dashboard</span>
          <span className="sm:hidden">Back</span>
        </Button>

        {/* Test Studio Badge */}
        <div className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full">
          <Mic className="h-3.5 w-3.5" />
          <span className="font-medium text-xs sm:text-sm">Test Studio</span>
        </div>
      </div>

      {/* Main Content - Audio Only (no sidebar for test) */}
      <div className="flex-1 min-h-0">
        <LiveKitRoom
          token={token}
          serverUrl={serverUrl}
          connect={true}
          audio={audio}
          video={video}
          className="flex h-full min-h-0 relative"
        >
          <LiveKitConnectionWatcher
            serverUrl={serverUrl}
            token={token}
            onGiveUp={() => router.push("/dashboard")}
          />

          {/* Video Card - Full width for test */}
          <div className="flex-1 relative min-h-0">
            <div className="h-full rounded-xl shadow-lg border border-border overflow-hidden sm:rounded-2xl">
              <VideoStage
                roomName={roomName || "test"}
                isTutor={true}
                recordingEnabled={false}
                onLeave={() => router.push("/dashboard")}
              />
            </div>
          </div>

          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    </div>
  );
}
