"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useConnectionState, useRoomContext } from "@livekit/components-react";
import { ConnectionState, RoomEvent } from "livekit-client";
import { Textarea } from "@/components/ui/textarea";
import { Check, Loader2, AlertCircle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface NotesEditorProps {
  bookingId: string;
  studentId: string;
  initialNotes?: string | null;
}

const LOCAL_STORAGE_KEY_PREFIX = "classroom:tutor-notes:";

export function NotesEditor({ bookingId, studentId, initialNotes }: NotesEditorProps) {
  const room = useRoomContext();
  const connectionState = useConnectionState();
  const storageKey = useMemo(
    () => `${LOCAL_STORAGE_KEY_PREFIX}${bookingId}:${studentId}`,
    [bookingId, studentId]
  );

  const [notes, setNotes] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const hasPersistedRef = useRef(false);
  const notesRef = useRef("");

  // Initialize from localStorage (preferred), otherwise from initialNotes.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      const next = stored ?? initialNotes ?? "";
      setNotes(next);
      notesRef.current = next;
    } catch {
      const next = initialNotes ?? "";
      setNotes(next);
      notesRef.current = next;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    notesRef.current = notes;
    try {
      localStorage.setItem(storageKey, notes);
    } catch {
      // ignore
    }
  }, [notes, storageKey]);

  const persistNotes = useCallback(
    async (viaBeacon?: boolean) => {
      if (hasPersistedRef.current) return;
      const content = notesRef.current.trim();
      if (!content) {
        hasPersistedRef.current = true;
        try {
          localStorage.removeItem(storageKey);
        } catch {
          // ignore
        }
        return;
      }

      const payload = JSON.stringify({ bookingId, notes: content });

      if (viaBeacon && typeof navigator !== "undefined" && "sendBeacon" in navigator) {
        try {
          const ok = navigator.sendBeacon("/api/classroom/tutor-notes", payload);
          if (ok) {
            hasPersistedRef.current = true;
            try {
              localStorage.removeItem(storageKey);
            } catch {
              // ignore
            }
          }
        } catch {
          // fall through to fetch
        }
      }

      if (hasPersistedRef.current) return;

      setSaveStatus("saving");
      try {
        const res = await fetch("/api/classroom/tutor-notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
        });

        if (!res.ok) {
          setSaveStatus("error");
          return;
        }

        hasPersistedRef.current = true;
        setSaveStatus("saved");
        setLastSaved(new Date());
        try {
          localStorage.removeItem(storageKey);
        } catch {
          // ignore
        }
      } catch (err) {
        console.error("[Tutor Notes] Failed to save:", err);
        setSaveStatus("error");
      }
    },
    [bookingId, storageKey]
  );

  // Persist on disconnect (lesson ended).
  useEffect(() => {
    const handler = () => {
      void persistNotes();
    };
    room.on(RoomEvent.Disconnected, handler);
    return () => {
      room.off(RoomEvent.Disconnected, handler);
    };
  }, [persistNotes, room]);

  // Persist on page close.
  useEffect(() => {
    const onBeforeUnload = () => {
      void persistNotes(true);
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [persistNotes]);

  const renderSaveStatus = () => {
    switch (saveStatus) {
      case "saving":
        return (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="text-xs">Saving to student…</span>
          </div>
        );
      case "saved":
        return (
          <div className="flex items-center gap-1.5 text-emerald-600">
            <Check className="h-3 w-3" />
            <span className="text-xs">
              Saved {lastSaved && `at ${format(lastSaved, "h:mm a")}`}
            </span>
          </div>
        );
      case "error":
        return (
          <div className="flex items-center gap-1.5 text-red-500">
            <AlertCircle className="h-3 w-3" />
            <span className="text-xs">Could not save (will retry next time)</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span className="text-xs">Private to you • saves when lesson ends</span>
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Tutor Notes
        </p>
        {renderSaveStatus()}
      </div>

      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Private notes (only you can see these). Saved to the student when the lesson ends."
        disabled={connectionState !== ConnectionState.Connected && connectionState !== ConnectionState.Reconnecting}
        className={cn(
          "flex-1 min-h-0 resize-none rounded-xl bg-muted/60 border-border",
          "font-mono text-sm leading-relaxed",
          "focus:bg-card focus:ring-2 focus:ring-primary/20",
          "placeholder:text-muted-foreground/70"
        )}
      />
    </div>
  );
}

