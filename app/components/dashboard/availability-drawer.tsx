"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { Clock, Plus, Trash2, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Sheet, SheetContent, SheetOverlay } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { saveAvailability } from "@/lib/actions/availability";
import type { AvailabilitySlotInput } from "@/lib/validators/availability";

const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

type AvailabilitySlot = {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
};

type AvailabilityDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  initialSlots: AvailabilitySlot[];
  onSaveSuccess?: (slots: AvailabilitySlotInput[]) => void;
};

export function AvailabilityDrawer({
  isOpen,
  onClose,
  initialSlots,
  onSaveSuccess,
}: AvailabilityDrawerProps) {
  const prefersReducedMotion = useReducedMotion();
  const [slots, setSlots] = useState<AvailabilitySlotInput[]>(
    initialSlots.map((slot) => ({
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
      is_available: slot.is_available,
    }))
  );
  const [draft, setDraft] = useState<AvailabilitySlotInput>({
    day_of_week: 1,
    start_time: "09:00",
    end_time: "17:00",
    is_available: true,
  });
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isOpen) return;
    setSlots(
      initialSlots.map((slot) => ({
        day_of_week: slot.day_of_week,
        start_time: slot.start_time,
        end_time: slot.end_time,
        is_available: slot.is_available,
      }))
    );
    setStatus(null);
  }, [initialSlots, isOpen]);

  const grouped = useMemo(() => {
    return DAY_LABELS.map((label, index) => ({
      day_of_week: index,
      label,
      shortLabel: label.slice(0, 3),
      slots: slots.filter((slot) => slot.day_of_week === index),
    }));
  }, [slots]);

  const totalHours = useMemo(() => {
    return slots.reduce((total, slot) => {
      const [startH, startM] = slot.start_time.split(":").map(Number);
      const [endH, endM] = slot.end_time.split(":").map(Number);
      return total + (endH + endM / 60) - (startH + startM / 60);
    }, 0);
  }, [slots]);

  function handleAddSlot() {
    if (draft.start_time >= draft.end_time) {
      setStatus({ type: "error", message: "End time must be after start time." });
      return;
    }

    const exists = slots.some(
      (existing) =>
        existing.day_of_week === draft.day_of_week &&
        existing.start_time === draft.start_time &&
        existing.end_time === draft.end_time
    );

    if (exists) {
      setStatus({ type: "error", message: "This slot already exists." });
      return;
    }

    setSlots((prev) =>
      [...prev, { ...draft }].sort((a, b) => {
        if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
        return a.start_time.localeCompare(b.start_time);
      })
    );
    setStatus(null);
  }

  function handleRemoveSlot(dayIndex: number, slotIndex: number) {
    setSlots((prev) => {
      let count = -1;
      return prev.filter((slot) => {
        if (slot.day_of_week === dayIndex) {
          count += 1;
          return count !== slotIndex;
        }
        return true;
      });
    });
  }

  function handleSave() {
    startTransition(() => {
      (async () => {
        const result = await saveAvailability(slots);
        if (result.error) {
          setStatus({ type: "error", message: result.error });
          return;
        }
        setStatus({ type: "success", message: "Availability saved!" });
        onSaveSuccess?.(slots);
      })();
    });
  }

  function formatTime(value: string) {
    const [hour, minute] = value.split(":").map(Number);
    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()} side="right">
      <SheetOverlay onClick={onClose} />
      <SheetContent className="w-96 max-w-[90vw] overflow-y-auto">
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.div
              key="availability-drawer"
              initial={prefersReducedMotion ? false : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 24 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: "easeOut" }}
              className="flex flex-col h-full"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-4 py-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Weekly Hours</h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-1.5 hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Stats */}
              <div className="flex gap-3 px-4 py-3 border-b border-border bg-muted/30">
                <div className="flex-1 text-center">
                  <p className="text-2xl font-semibold text-foreground">{slots.length}</p>
                  <p className="text-xs text-muted-foreground">Slots</p>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-2xl font-semibold text-foreground">{totalHours.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">Hours/week</p>
                </div>
              </div>

              {/* Status message */}
              {status && (
                <div
                  className={`mx-4 mt-3 rounded-lg px-3 py-2 text-sm ${
                    status.type === "success"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {status.message}
                </div>
              )}

              {/* Add slot form */}
              <div className="px-4 py-4 border-b border-border">
                <h3 className="text-sm font-medium text-foreground mb-3">Add availability</h3>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={draft.day_of_week}
                    onChange={(e) => setDraft((prev) => ({ ...prev, day_of_week: Number(e.target.value) }))}
                    className="col-span-3 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    {DAY_LABELS.map((day, index) => (
                      <option key={day} value={index}>
                        {day}
                      </option>
                    ))}
                  </select>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">From</label>
                    <input
                      type="time"
                      value={draft.start_time}
                      onChange={(e) => setDraft((prev) => ({ ...prev, start_time: e.target.value }))}
                      className="rounded-lg border border-input bg-background px-2 py-2 text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">To</label>
                    <input
                      type="time"
                      value={draft.end_time}
                      onChange={(e) => setDraft((prev) => ({ ...prev, end_time: e.target.value }))}
                      className="rounded-lg border border-input bg-background px-2 py-2 text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={handleAddSlot}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Slot list */}
              <div className="flex-1 overflow-y-auto px-4 py-3">
                {grouped.every((group) => group.slots.length === 0) ? (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    No availability set yet.
                    <br />
                    Add your first time slot above.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {grouped
                      .filter((group) => group.slots.length > 0)
                      .map((group) => (
                        <div key={group.day_of_week}>
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                            {group.label}
                          </h4>
                          <div className="space-y-1.5">
                            {group.slots.map((slot, slotIndex) => (
                              <div
                                key={`${group.day_of_week}-${slot.start_time}-${slot.end_time}`}
                                className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2"
                              >
                                <span className="text-sm text-foreground">
                                  {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSlot(group.day_of_week, slotIndex)}
                                  className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-border px-4 py-4 bg-background">
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={isPending}
                  className="w-full"
                >
                  {isPending ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  );
}
