"use client";

import "@livekit/components-styles";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  LiveKitRoom,
  RoomAudioRenderer,
} from "@livekit/components-react";
import { Loader2, ShieldAlert, ArrowLeft, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetOverlay } from "@/components/ui/sheet";
import { VideoStage } from "@/components/classroom/VideoStage";
import { StudioSidebar, type BookingInfo } from "@/components/classroom/StudioSidebar";
import { PreJoinScreen } from "@/components/classroom/PreJoinScreen";
import { ConnectionToast } from "@/components/classroom/ConnectionToast";
import { TestModeClassroom } from "@/components/classroom/TestModeClassroom";
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

export default function ClassroomClient() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.bookingId as string;

  const [token, setToken] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [isTutor, setIsTutor] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  const [bookingInfo, setBookingInfo] = useState<BookingInfo | null>(null);
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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    async function fetchToken() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `/api/livekit/token?booking_id=${bookingId}`
        );

        if (!response.ok) {
          const data = await response.json();

          // Check if this is a tier-related access denial
          if (response.status === 403) {
            setError({
              message:
                data.error || "You don't have access to the Native Classroom.",
              isAccessDenied: true,
            });
          } else if (response.status === 401) {
            setError({
              message: "Please sign in to join this lesson.",
              isAccessDenied: false,
            });
          } else if (response.status === 404) {
            setError({
              message: "Booking not found. Please check your link.",
              isAccessDenied: false,
            });
          } else if (response.status === 503) {
            setError({
              message:
                data.error ||
                "Classroom isn't configured yet. Please contact support.",
              isAccessDenied: false,
            });
          } else {
            setError({
              message: data.error || "Failed to join the classroom.",
              isAccessDenied: false,
            });
          }
          return;
        }

        const data = await response.json();
        setToken(data.token);
        setIsTutor(data.isTutor ?? false);
        setIsTestMode(data.isTestMode ?? false);
        setRoomName(data.roomName ?? bookingId);
        if (data.bookingInfo) {
          setBookingInfo(data.bookingInfo);
        }
      } catch (err) {
        console.error("[Classroom] Error fetching token:", err);
        setError({
          message: "Something went wrong. Please try again.",
          isAccessDenied: false,
        });
      } finally {
        setIsLoading(false);
      }
    }

    if (bookingId) {
      fetchToken();
    }
  }, [bookingId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-card p-4 shadow-lg">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">Joining classroom...</p>
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
              {error.isAccessDenied ? "Access Denied" : "Unable to Join"}
            </h1>
            <p className="text-muted-foreground">{error.message}</p>
            {error.isAccessDenied && (
              <p className="text-sm text-muted-foreground/70 mt-2">
                The Native Classroom is available for tutors on the Studio tier.
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

  // E2E Test Mode: Render mock classroom UI
  if (isTestMode) {
    return (
      <TestModeClassroom
        bookingId={bookingId}
        bookingInfo={bookingInfo ?? undefined}
        isTutor={isTutor}
      />
    );
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
        participantName={
          isTutor ? bookingInfo?.studentName : bookingInfo?.tutorName
        }
        serviceName={bookingInfo?.serviceName || undefined}
      />
    );
  }

  const resolvedRoomName = roomName ?? bookingId;
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
          onClick={() => router.push("/dashboard")}
          className="text-muted-foreground hover:text-foreground hover:bg-card rounded-full px-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <Button
          variant="outline"
          onClick={() => setMobileSidebarOpen(true)}
          className="lg:hidden rounded-full px-4"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Chat & Notes
        </Button>
      </div>

      {/* Main Content - Audio + Sidebar */}
      <div className="flex-1 min-h-0">
        <LiveKitRoom
          token={token}
          serverUrl={serverUrl}
          connect={true}
          audio={audio}
          video={video}
          className="flex h-full flex-col gap-3 min-h-0 relative lg:flex-row lg:gap-6"
        >
          <LiveKitConnectionWatcher
            serverUrl={serverUrl}
            token={token}
            onGiveUp={() => router.push("/dashboard")}
          />

          {/* Video Stage - 75% */}
          <div className="flex-1 relative min-h-0 lg:flex-[3]">
            <div className="h-full rounded-xl shadow-lg overflow-hidden sm:rounded-2xl">
              <VideoStage
                roomName={resolvedRoomName}
                isTutor={isTutor}
                onLeave={() => router.push("/dashboard")}
              />
            </div>
          </div>

          {/* Sidebar Card - 25% */}
          <div className="hidden flex-1 min-w-[280px] max-w-[360px] lg:block">
            <div className="h-full rounded-[2rem] shadow-md bg-card overflow-hidden border border-border">
              <StudioSidebar
                bookingId={bookingId}
                bookingInfo={bookingInfo ?? undefined}
                isTutor={isTutor}
              />
            </div>
          </div>

          <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen} side="bottom">
            <SheetOverlay onClick={() => setMobileSidebarOpen(false)} />
            <SheetContent
              side="bottom"
              className="top-auto inset-x-0 h-[70dvh] max-h-[600px] w-full overflow-hidden rounded-t-2xl border-t border-border bg-background p-0 pb-[env(safe-area-inset-bottom)] shadow-xl lg:hidden"
            >
              <div className="h-full">
                <StudioSidebar
                  bookingId={bookingId}
                  bookingInfo={bookingInfo ?? undefined}
                  isTutor={isTutor}
                />
              </div>
            </SheetContent>
          </Sheet>

          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    </div>
  );
}
