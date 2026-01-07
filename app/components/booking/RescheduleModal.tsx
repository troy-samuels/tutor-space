"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  History,
} from "lucide-react";
import {
  rescheduleBooking,
  getAvailableRescheduleTimes,
  getRescheduleHistory,
} from "@/lib/actions/reschedule";
import type { RescheduleHistoryItem } from "@/lib/actions/types";
import { format, parseISO } from "date-fns";

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string;
    scheduled_at: string;
    duration_minutes: number;
    timezone: string;
    students?: {
      full_name: string;
    } | null;
    services?: {
      name: string;
    } | null;
    reschedule_count?: number;
  };
  userRole: "tutor" | "student";
  onSuccess?: () => void;
}

export function RescheduleModal({
  isOpen,
  onClose,
  booking,
  userRole,
  onSuccess,
}: RescheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [reason, setReason] = useState("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isLoadingTimes, setIsLoadingTimes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [history, setHistory] = useState<RescheduleHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Get minimum date (today)
  const today = new Date().toISOString().split("T")[0];

  // Get maximum date (3 months from now)
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  // Load available times when date changes
  const loadAvailableTimes = useCallback(async (date: string) => {
    setIsLoadingTimes(true);
    setSelectedTime("");
    setError(null);

    const result = await getAvailableRescheduleTimes(booking.id, date);

    if (result.error) {
      setError(result.error);
    } else {
      setAvailableTimes(result.times);
      if (result.times.length === 0) {
        setError("No available times for this date");
      }
    }

    setIsLoadingTimes(false);
  }, [booking.id]);

  const loadHistory = useCallback(async () => {
    const historyData = await getRescheduleHistory(booking.id);
    setHistory(historyData);
  }, [booking.id]);

  useEffect(() => {
    if (selectedDate) {
      loadAvailableTimes(selectedDate);
    }
  }, [selectedDate, loadAvailableTimes]);

  // Load reschedule history on open
  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, loadHistory]);

  const handleSubmit = async () => {
    if (!selectedTime) {
      setError("Please select a new time");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await rescheduleBooking({
      bookingId: booking.id,
      newScheduledAt: selectedTime,
      reason: reason || undefined,
      requestedBy: userRole,
    });

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 1500);
    } else {
      setError(result.error || "Failed to reschedule");
    }

    setIsSubmitting(false);
  };

  const formatTime = (isoString: string) => {
    const date = parseISO(isoString);
    return format(date, "h:mm a");
  };

  const formatDateTime = (isoString: string) => {
    const date = parseISO(isoString);
    return format(date, "MMM d, yyyy 'at' h:mm a");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Reschedule Lesson
          </DialogTitle>
          <DialogDescription>
            {booking.services?.name && (
              <span className="font-medium">{booking.services.name}</span>
            )}
            {booking.students?.full_name && (
              <span> with {booking.students.full_name}</span>
            )}
            <br />
            <span className="text-muted-foreground">
              Currently scheduled for {formatDateTime(booking.scheduled_at)}
            </span>
            {booking.reschedule_count && booking.reschedule_count > 0 && (
              <span className="ml-2 text-xs text-amber-600">
                (Rescheduled {booking.reschedule_count} time{booking.reschedule_count > 1 ? "s" : ""})
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <p className="text-lg font-medium">Lesson Rescheduled!</p>
            <p className="text-sm text-muted-foreground">
              New time: {formatDateTime(selectedTime)}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              {/* Date Selection */}
              <div className="space-y-2">
                <Label htmlFor="date">New Date</Label>
                <Input
                  id="date"
                  type="date"
                  min={today}
                  max={maxDateStr}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              {/* Time Selection */}
              <div className="space-y-2">
                <Label htmlFor="time">New Time</Label>
                {isLoadingTimes ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading available times...
                  </div>
                ) : selectedDate ? (
                  availableTimes.length > 0 ? (
                    <Select value={selectedTime} onValueChange={setSelectedTime}>
                      <SelectTrigger id="time">
                        <Clock className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Select a time" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTimes.map((time) => (
                          <SelectItem key={time} value={time}>
                            {formatTime(time)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">
                      No available times for this date
                    </p>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground py-2">
                    Please select a date first
                  </p>
                )}
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label htmlFor="reason">Reason (optional)</Label>
                <Textarea
                  id="reason"
                  placeholder="Why are you rescheduling?"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Error Display */}
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              {/* History Toggle */}
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <History className="h-4 w-4" />
                  {showHistory ? "Hide" : "Show"} reschedule history ({history.length})
                </button>
              )}

              {/* History List */}
              {showHistory && history.length > 0 && (
                <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                  {history.map((item) => (
                    <div key={item.id} className="text-xs border-b last:border-0 pb-2 last:pb-0">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {format(parseISO(item.created_at), "MMM d, yyyy")}
                        </span>
                        <span className="capitalize text-muted-foreground">
                          by {item.requested_by}
                        </span>
                      </div>
                      <div>
                        <span className="line-through text-red-500/70">
                          {formatDateTime(item.previous_scheduled_at)}
                        </span>
                        <span className="mx-1">→</span>
                        <span className="text-green-600">
                          {formatDateTime(item.new_scheduled_at)}
                        </span>
                      </div>
                      {item.reason && (
                        <p className="text-muted-foreground mt-1 italic">
                          "{item.reason}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedTime}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rescheduling...
                  </>
                ) : (
                  "Confirm Reschedule"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
