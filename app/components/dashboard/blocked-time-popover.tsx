"use client";

import { useState, useRef, useEffect } from "react";
import { X, Clock, Trash2, Edit3, RepeatIcon } from "lucide-react";
import type { CalendarEvent } from "@/lib/types/calendar";
import { CALENDAR_COLORS } from "@/lib/types/calendar";
import { format } from "date-fns";
import { deleteBlockedTime, updateBlockedTime } from "@/lib/actions/blocked-times";

type BlockedTimePopoverProps = {
  event: CalendarEvent;
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  onRefresh?: () => void;
  onConvertToRecurring?: (event: CalendarEvent) => void;
};

export function BlockedTimePopover({
  event,
  isOpen,
  onClose,
  position,
  onRefresh,
  onConvertToRecurring,
}: BlockedTimePopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editLabel, setEditLabel] = useState(event.title || "");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const colors = CALENDAR_COLORS.blocked;
  const startTime = new Date(event.start);
  const endTime = new Date(event.end);
  const durationMinutes = Math.round(
    (endTime.getTime() - startTime.getTime()) / 60000
  );

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isEditing) {
          setIsEditing(false);
          setEditLabel(event.title || "");
        } else {
          onClose();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose, isEditing, event.title]);

  // Adjust position to keep popover in viewport
  useEffect(() => {
    if (!isOpen || !popoverRef.current) return;

    const popover = popoverRef.current;
    const rect = popover.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (rect.right > viewportWidth - 16) {
      popover.style.left = `${viewportWidth - rect.width - 16}px`;
    }

    if (rect.bottom > viewportHeight - 16) {
      popover.style.top = `${position.y - rect.height - 8}px`;
    }
  }, [isOpen, position]);

  // Reset edit state when popover opens with new event
  useEffect(() => {
    setEditLabel(event.title || "");
    setIsEditing(false);
    setShowDeleteConfirm(false);
  }, [event.id, event.title]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setFeedback(null);

    const result = await deleteBlockedTime(event.id);

    if (result.error) {
      setFeedback({ type: "error", message: result.error });
      setIsDeleting(false);
    } else {
      setFeedback({ type: "success", message: "Blocked time deleted" });
      setTimeout(() => {
        onRefresh?.();
        onClose();
      }, 500);
    }
  };

  const handleSaveLabel = async () => {
    if (!editLabel.trim()) {
      setFeedback({ type: "error", message: "Label cannot be empty" });
      return;
    }

    setFeedback(null);

    const result = await updateBlockedTime(event.id, { label: editLabel.trim() });

    if (result.error) {
      setFeedback({ type: "error", message: result.error });
    } else {
      setFeedback({ type: "success", message: "Label updated" });
      setIsEditing(false);
      onRefresh?.();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 w-72 rounded-xl border border-border bg-white shadow-xl animate-in fade-in zoom-in-95 duration-150"
      style={{
        left: position.x,
        top: position.y + 8,
      }}
    >
      {/* Header */}
      <div
        className={`flex items-start justify-between rounded-t-xl p-4 ${colors.bg}`}
      >
        <div className="flex-1">
          <span
            className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${colors.text}`}
          >
            Blocked Time
          </span>
          {isEditing ? (
            <input
              type="text"
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSaveLabel();
                }
              }}
              className="mt-2 w-full rounded-md border border-border bg-white px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Enter label..."
              autoFocus
            />
          ) : (
            <h3 className="mt-1 text-base font-semibold text-foreground">
              {event.title || "Blocked"}
            </h3>
          )}
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-1 text-muted-foreground hover:bg-white/50 hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Time and Date */}
        <div className="flex items-center gap-3 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">
              {formatTime(startTime)} - {formatTime(endTime)}
            </div>
            <div className="text-muted-foreground text-xs">
              {format(startTime, "EEEE, MMMM d, yyyy")}
            </div>
          </div>
        </div>

        {/* Duration */}
        <div className="text-sm text-muted-foreground">
          Duration: {durationMinutes} minutes
        </div>

        {/* Feedback message */}
        {feedback && (
          <div
            className={`rounded-lg px-3 py-2 text-xs font-medium ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {feedback.message}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t p-2">
        {/* Edit label */}
        {isEditing ? (
          <div className="flex gap-2 px-2 py-1">
            <button
              onClick={handleSaveLabel}
              className="flex-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Save
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditLabel(event.title || "");
              }}
              className="flex-1 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Edit3 className="h-4 w-4" />
              Edit Label
            </button>

            {/* Convert to recurring */}
            {onConvertToRecurring && (
              <button
                onClick={() => {
                  onConvertToRecurring(event);
                  onClose();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <RepeatIcon className="h-4 w-4" />
                Make Recurring
              </button>
            )}

            {/* Delete */}
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            ) : (
              <div className="rounded-lg bg-red-50 p-3">
                <p className="text-sm text-red-700 mb-2">
                  Delete this blocked time?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {isDeleting ? "Deleting..." : "Yes, Delete"}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
