"use client";

import { useEffect, useState, useTransition } from "react";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { rescheduleBooking } from "@/lib/actions/bookings";

type RescheduleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string | null;
  defaultStart?: string;
  timezone?: string | null;
  durationMinutes?: number | null;
  title?: string;
  subtitle?: string;
  onSuccess?: (newStartIso: string) => void;
};

export function RescheduleDialog({
  open,
  onOpenChange,
  bookingId,
  defaultStart,
  timezone,
  durationMinutes,
  title,
  subtitle,
  onSuccess,
}: RescheduleDialogProps) {
  const targetTz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [dateValue, setDateValue] = useState("");
  const [timeValue, setTimeValue] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setStatus(null);

    if (defaultStart) {
      setDateValue(formatInTimeZone(defaultStart, targetTz, "yyyy-MM-dd"));
      setTimeValue(formatInTimeZone(defaultStart, targetTz, "HH:mm"));
    } else {
      setDateValue("");
      setTimeValue("");
    }
  }, [defaultStart, open, targetTz]);

  const handleSubmit = () => {
    if (!bookingId) {
      setStatus({ type: "error", message: "Missing booking details." });
      return;
    }

    if (!dateValue || !timeValue) {
      setStatus({ type: "error", message: "Pick a new date and time." });
      return;
    }

    startTransition(() => {
      (async () => {
        const iso = fromZonedTime(`${dateValue}T${timeValue}:00`, targetTz).toISOString();
        const result = await rescheduleBooking({
          bookingId,
          newStart: iso,
          durationMinutes: durationMinutes ?? undefined,
          timezone: targetTz,
        });

        if (result.error) {
          setStatus({ type: "error", message: result.error });
          return;
        }

        setStatus({ type: "success", message: "Lesson rescheduled." });
        onSuccess?.(iso);
        onOpenChange(false);
      })();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reschedule lesson</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {title || "Move this booking to a new time."}
            {subtitle ? <span className="block text-xs text-muted-foreground mt-1">{subtitle}</span> : null}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm font-medium text-foreground">
              New date
              <Input
                type="date"
                value={dateValue}
                onChange={(e) => setDateValue(e.target.value)}
                className="mt-1"
              />
            </label>
            <label className="text-sm font-medium text-foreground">
              Time
              <Input
                type="time"
                value={timeValue}
                onChange={(e) => setTimeValue(e.target.value)}
                step={900}
                className="mt-1"
              />
            </label>
          </div>

          <p className="text-xs text-muted-foreground">
            Times shown in {targetTz}. You&apos;ll see an error if the new time conflicts with availability or another booking.
          </p>

          {status ? (
            <p
              className={`rounded-lg px-3 py-2 text-sm ${
                status.type === "success"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {status.message}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Saving..." : "Save new time"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
