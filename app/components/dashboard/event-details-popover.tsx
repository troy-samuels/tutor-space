"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  User,
  Calendar,
  Clock,
  DollarSign,
  MessageSquare,
  Video,
  ExternalLink,
  Trash2,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import type { CalendarEvent } from "@/lib/types/calendar";
import { CALENDAR_COLORS } from "@/lib/types/calendar";
import { format, addMinutes } from "date-fns";
import { markBookingAsPaid, cancelBooking, rescheduleBooking } from "@/lib/actions/bookings"
import { updateBookingDuration } from "@/lib/actions/booking-duration";
import { QuickMessageDialog } from "./quick-message-dialog";
import { isClassroomUrl } from "@/lib/utils/classroom-links";

type EventDetailsPopoverProps = {
  event: CalendarEvent;
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  onReschedule?: (event: CalendarEvent) => void;
  onRefresh?: () => void;
  isConflict?: boolean;
};

const DURATION_OPTIONS = [30, 45, 60, 90, 120];

export function EventDetailsPopover({
  event,
  isOpen,
  onClose,
  position,
  onReschedule,
  onRefresh,
  isConflict = false,
}: EventDetailsPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [isChangingDuration, setIsChangingDuration] = useState(false);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [isShifting, setIsShifting] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const colors = isConflict
    ? {
        bg: "bg-rose-50",
        border: "border-rose-300",
        text: "text-rose-900",
        dot: "bg-rose-500",
      }
    : CALENDAR_COLORS[event.type];

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
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Adjust position to keep popover in viewport
  useEffect(() => {
    if (!isOpen || !popoverRef.current) return;

    const popover = popoverRef.current;
    const rect = popover.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Adjust if going off right edge
    if (rect.right > viewportWidth - 16) {
      popover.style.left = `${viewportWidth - rect.width - 16}px`;
    }

    // Adjust if going off bottom edge
    if (rect.bottom > viewportHeight - 16) {
      popover.style.top = `${position.y - rect.height - 8}px`;
    }
  }, [isOpen, position]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleMarkAsPaid = async () => {
    setIsMarkingPaid(true);
    setFeedback(null);

    const result = await markBookingAsPaid(event.id);

    if (result.error) {
      setFeedback({ type: "error", message: result.error });
    } else {
      setFeedback({ type: "success", message: "Marked as paid" });
      onRefresh?.();
    }

    setIsMarkingPaid(false);
  };

  const handleChangeDuration = async (newDuration: number) => {
    setIsChangingDuration(true);
    setFeedback(null);

    const result = await updateBookingDuration({
      bookingId: event.id,
      durationMinutes: newDuration,
    });

    if (result.error) {
      setFeedback({ type: "error", message: result.error });
    } else {
      setFeedback({ type: "success", message: "Duration updated" });
      onRefresh?.();
    }

    setIsChangingDuration(false);
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    setFeedback(null);

    const result = await cancelBooking(event.id);

    if (result.error) {
      setFeedback({ type: "error", message: result.error });
      setIsCancelling(false);
    } else {
      setFeedback({ type: "success", message: "Booking cancelled" });
      setTimeout(() => {
        onRefresh?.();
        onClose();
      }, 1000);
    }
  };

  const handleQuickShift = async (minutes: number) => {
    setIsShifting(minutes);
    setFeedback(null);

    const newStart = addMinutes(startTime, minutes);
    const result = await rescheduleBooking({
      bookingId: event.id,
      newStart: newStart.toISOString(),
      durationMinutes: durationMinutes,
      requestedBy: "tutor",
    });

    if (result.error) {
      setFeedback({ type: "error", message: result.error });
    } else {
      const direction = minutes > 0 ? "forward" : "back";
      const amount = Math.abs(minutes);
      setFeedback({ type: "success", message: `Shifted ${amount}min ${direction}` });
      onRefresh?.();
    }

    setIsShifting(null);
  };

  if (!isOpen) return null;

  // Only show full actions for TutorLingua bookings
  const isTutorLinguaBooking = event.type === "tutorlingua";

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 w-80 rounded-xl border border-border bg-white shadow-xl animate-in fade-in zoom-in-95 duration-150"
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
          <div className="flex items-center gap-2">
            <span
              className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${colors.text}`}
            >
              {event.source}
            </span>
            {isConflict && (
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-700">
                Conflict
              </span>
            )}
          </div>
          <h3 className="mt-1 text-base font-semibold text-foreground">
            {event.title}
          </h3>
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

        {/* Duration selector - only for TutorLingua bookings */}
        {isTutorLinguaBooking && (
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <span className="text-muted-foreground mr-2">Duration:</span>
              <select
                value={durationMinutes}
                onChange={(e) => handleChangeDuration(Number(e.target.value))}
                disabled={isChangingDuration}
                className="rounded-md border border-border bg-white px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              >
                {DURATION_OPTIONS.map((dur) => (
                  <option key={dur} value={dur}>
                    {dur} min
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Quick shift buttons - only for TutorLingua bookings */}
        {isTutorLinguaBooking && (
          <div className="flex items-center gap-3 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <span className="text-muted-foreground mr-2">Quick shift:</span>
              <div className="inline-flex gap-1">
                {[-30, -15, 15, 30].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => handleQuickShift(mins)}
                    disabled={isShifting !== null}
                    className="rounded border border-border px-1.5 py-0.5 text-xs font-medium hover:bg-muted disabled:opacity-50 transition-colors"
                  >
                    {isShifting === mins ? "..." : `${mins > 0 ? "+" : ""}${mins}m`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Student info */}
        {event.studentName && (
          <div className="flex items-center gap-3 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{event.studentName}</span>
          </div>
        )}

        {/* Service */}
        {event.serviceName && (
          <div className="flex items-center gap-3 text-sm">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>{event.serviceName}</span>
          </div>
        )}

        {/* Status badges */}
        {event.bookingStatus && (
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                event.bookingStatus === "confirmed"
                  ? "bg-emerald-100 text-emerald-700"
                  : event.bookingStatus === "pending"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-gray-100 text-gray-700"
              }`}
            >
              {event.bookingStatus}
            </span>
            {event.paymentStatus && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  event.paymentStatus === "paid"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {event.paymentStatus}
              </span>
            )}
          </div>
        )}

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
        {/* Meeting URL - Show for any event with meeting URL */}
        {event.meetingUrl && (
          <a
            href={event.meetingUrl}
            target={isClassroomUrl(event.meetingUrl) ? "_self" : "_blank"}
            rel="noopener noreferrer"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            <Video className="h-4 w-4" />
            Join Meeting
            {!isClassroomUrl(event.meetingUrl) && (
              <ExternalLink className="h-3 w-3 ml-auto" />
            )}
          </a>
        )}

        {/* TutorLingua-specific actions */}
        {isTutorLinguaBooking && (
          <>
            {/* View student profile */}
            {event.studentId && (
              <Link
                href={`/students/${event.studentId}`}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <User className="h-4 w-4" />
                View Student
              </Link>
            )}

            {/* Reschedule */}
            <button
              onClick={() => {
                onReschedule?.(event);
                onClose();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Calendar className="h-4 w-4" />
              Reschedule
            </button>

            {/* Mark as paid - only if unpaid */}
            {event.paymentStatus !== "paid" && (
              <button
                onClick={handleMarkAsPaid}
                disabled={isMarkingPaid}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                {isMarkingPaid ? "Marking..." : "Mark as Paid"}
              </button>
            )}

            {/* Send message */}
            {event.studentId && (
              <button
                onClick={() => setIsMessageDialogOpen(true)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                Send Message
              </button>
            )}

            {/* Cancel */}
            {!showCancelConfirm ? (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Cancel Booking
              </button>
            ) : (
              <div className="rounded-lg bg-red-50 p-3">
                <p className="text-sm text-red-700 mb-2">
                  Are you sure you want to cancel this booking?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    disabled={isCancelling}
                    className="flex-1 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {isCancelling ? "Cancelling..." : "Yes, Cancel"}
                  </button>
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="flex-1 rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
                  >
                    Keep
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick Message Dialog */}
      {event.studentId && event.studentName && (
        <QuickMessageDialog
          isOpen={isMessageDialogOpen}
          onClose={() => setIsMessageDialogOpen(false)}
          studentId={event.studentId}
          studentName={event.studentName}
        />
      )}
    </div>
  );
}
