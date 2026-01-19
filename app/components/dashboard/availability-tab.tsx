"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { availabilitySlotSchema, type AvailabilitySlotInput } from "@/lib/validators/availability";
import { saveAvailability } from "@/lib/actions/availability";

type AvailabilitySlot = {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
};

type AvailabilityTabProps = {
  initialSlots: AvailabilitySlot[];
  onSaveSuccess?: (slots: AvailabilitySlot[]) => void;
};

const HALF_HOUR_SEGMENTS = 48;
const SEGMENT_MINUTES = 30;
const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function AvailabilityTab({ initialSlots, onSaveSuccess }: AvailabilityTabProps) {
  const [slots, setSlots] = useState<AvailabilitySlotInput[]>(
    initialSlots.map((slot) => ({
      id: slot.id,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
      is_available: slot.is_available,
    }))
  );
  const [draft, setDraft] = useState<AvailabilitySlotInput>({
    day_of_week: 1,
    start_time: "09:00",
    end_time: "11:00",
    is_available: true,
  });
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [dragSelection, setDragSelection] = useState<{ day: number; start: number; end: number } | null>(
    null
  );

  const gridColumnsStyle = useMemo(
    () => ({ gridTemplateColumns: `repeat(${HALF_HOUR_SEGMENTS}, minmax(0, 1fr))` }),
    []
  );

  const grouped = useMemo(() => {
    return DAY_LABELS.map((label, index) => ({
      day_of_week: index,
      label,
      slots: slots.filter((slot) => slot.day_of_week === index),
    }));
  }, [slots]);

  const totalHours = useMemo(() => {
    return slots.reduce((total, slot) => total + computeSlotHours(slot.start_time, slot.end_time), 0);
  }, [slots]);

  const addSlotEntry = useCallback((slot: AvailabilitySlotInput, successMessage?: string) => {
    const parsed = availabilitySlotSchema.safeParse(slot);
    if (!parsed.success) {
      setStatus({ type: "error", message: parsed.error.issues[0]?.message ?? "Invalid slot." });
      return false;
    }

    const startMinutes = timeToMinutes(parsed.data.start_time);
    const endMinutes = timeToMinutes(parsed.data.end_time);
    if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes)) {
      setStatus({ type: "error", message: "Enter a valid time between 00:00 and 24:00." });
      return false;
    }
    if (endMinutes <= startMinutes) {
      setStatus({ type: "error", message: "End time must be after start time." });
      return false;
    }

    let added = false;
    let duplicate = false;

    setSlots((prev) => {
      const exists = prev.some(
        (existing) =>
          existing.day_of_week === parsed.data.day_of_week &&
          existing.start_time === parsed.data.start_time &&
          existing.end_time === parsed.data.end_time
      );

      if (exists) {
        duplicate = true;
        return prev;
      }

      added = true;
      return [...prev, { ...parsed.data }].sort(sortSlots);
    });

    if (duplicate) {
      setStatus({ type: "error", message: "That slot is already on your schedule." });
      return false;
    }

    if (added) {
      if (successMessage) {
        setStatus({ type: "success", message: successMessage });
      } else {
        setStatus(null);
      }
      return true;
    }

    return false;
  }, []);

  function handleAddSlot() {
    addSlotEntry(draft);
  }

  function handleRemoveSlot(index: number) {
    setSlots((prev) => prev.filter((_, idx) => idx !== index));
  }

  function handleToggle(dayIndex: number, slotIndex: number) {
    setSlots((prev) => {
      const targetIndex = findSlotGlobalIndexByOrder(prev, dayIndex, slotIndex);
      if (targetIndex === -1) return prev;
      return prev.map((slot, index) =>
        index === targetIndex ? { ...slot, is_available: !slot.is_available } : slot
      );
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
        setStatus({ type: "success", message: "Availability saved successfully." });
        if (onSaveSuccess) {
          onSaveSuccess(slots.map((s) => ({
            id: s.id,
            day_of_week: s.day_of_week,
            start_time: s.start_time,
            end_time: s.end_time,
            is_available: s.is_available,
          })));
        }
      })();
    });
  }

  const commitDragSelection = useCallback(
    (selection: { day: number; start: number; end: number }) => {
      const startIndex = Math.min(selection.start, selection.end);
      const endIndex = Math.max(selection.start, selection.end) + 1;
      const slot: AvailabilitySlotInput = {
        day_of_week: selection.day,
        start_time: minutesToTime(startIndex * SEGMENT_MINUTES),
        end_time: minutesToTime(endIndex * SEGMENT_MINUTES),
        is_available: draft.is_available,
      };

      const added = addSlotEntry(
        slot,
        `Added ${DAY_LABELS[selection.day]} ${formatTime(slot.start_time)} – ${formatTime(slot.end_time)}.`
      );

      if (added) {
        setDraft(slot);
      }
      setDragSelection(null);
    },
    [addSlotEntry, draft.is_available]
  );

  useEffect(() => {
    if (!dragSelection) return undefined;

    const handleMouseUp = () => {
      commitDragSelection(dragSelection);
    };

    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [commitDragSelection, dragSelection]);

  function startDrag(dayIndex: number, segmentIndex: number, event: { preventDefault: () => void }) {
    event.preventDefault();
    setStatus(null);
    setDragSelection({ day: dayIndex, start: segmentIndex, end: segmentIndex });
  }

  function extendDrag(dayIndex: number, segmentIndex: number) {
    setDragSelection((current) =>
      current && current.day === dayIndex ? { ...current, end: segmentIndex } : current
    );
  }

  function applyPreset(presetSlots: AvailabilitySlotInput[]) {
    let added = 0;
    setSlots((prev) => {
      const existing = new Set(prev.map((s) => `${s.day_of_week}-${s.start_time}-${s.end_time}`));
      const next = [...prev];
      presetSlots.forEach((slot) => {
        const key = `${slot.day_of_week}-${slot.start_time}-${slot.end_time}`;
        if (!existing.has(key)) {
          next.push(slot);
          existing.add(key);
          added += 1;
        }
      });
      return next.sort(sortSlots);
    });
    if (added > 0) {
      setStatus({ type: "success", message: `Added ${added} preset slot${added === 1 ? "" : "s"}.` });
    } else {
      setStatus({ type: "error", message: "Preset already applied." });
    }
  }

  function copyToEmptyDays() {
    const templateDay = grouped.find((group) => group.slots.length > 0);
    if (!templateDay) {
      setStatus({ type: "error", message: "Add a slot first, then copy to empty days." });
      return;
    }
    const templateSlots = templateDay.slots;
    let copied = 0;
    setSlots((prev) => {
      const next = [...prev];
      grouped.forEach((group) => {
        if (group.slots.length === 0) {
          templateSlots.forEach((slot) => {
            next.push({
              ...slot,
              day_of_week: group.day_of_week,
            });
            copied += 1;
          });
        }
      });
      return next.sort(sortSlots);
    });
    setStatus(
      copied > 0
        ? { type: "success", message: `Copied ${copied} slot${copied === 1 ? "" : "s"} to empty days.` }
        : { type: "error", message: "No empty days to copy into." }
    );
  }

  return (
    <div className="space-y-6 overflow-y-auto pb-8">
      {/* Stats Row */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active slots" value={slots.length} />
        <StatCard label="Weekly hours" value={totalHours.toFixed(1)} />
        <StatCard
          label="Days with availability"
          value={grouped.filter((group) => group.slots.length > 0).length}
        />
      </section>

      {status ? (
        <p
          className={`rounded-2xl px-4 py-3 text-sm ${
            status.type === "success"
              ? "bg-emerald-50 text-emerald-600"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {status.message}
        </p>
      ) : null}

      {/* Add Slot Form */}
      <section className="rounded-3xl border border-border bg-white/90 p-6 shadow-sm backdrop-blur">
        <h2 className="text-base font-semibold text-foreground">Add a slot</h2>
        <p className="text-xs text-muted-foreground">
          Choose a day and time window when you&apos;re available. Add multiple slots per day if needed.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-[160px_repeat(2,minmax(0,1fr))]">
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-foreground">Day</span>
            <select
              value={draft.day_of_week}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, day_of_week: Number.parseInt(event.target.value, 10) }))
              }
              className="rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {DAY_LABELS.map((day, index) => (
                <option key={day} value={index}>
                  {day}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-foreground">Start time</span>
            <input
              type="time"
              value={draft.start_time}
              onChange={(event) => setDraft((prev) => ({ ...prev, start_time: event.target.value }))}
              className="rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-foreground">End time</span>
            <input
              type="time"
              value={draft.end_time}
              onChange={(event) => setDraft((prev) => ({ ...prev, end_time: event.target.value }))}
              className="rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </label>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-foreground">
            <input
              type="checkbox"
              checked={draft.is_available}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, is_available: event.target.checked }))
              }
              className="h-4 w-4 rounded text-primary focus:ring-primary"
            />
            Mark as bookable
          </label>
          <button
            type="button"
            onClick={handleAddSlot}
            className="ml-auto inline-flex h-9 items-center justify-center rounded-full border border-border px-4 text-xs font-semibold text-primary transition hover:bg-primary/10"
          >
            Add slot
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="text-muted-foreground">Presets:</span>
          <button
            type="button"
            className="rounded-full border border-border bg-background px-3 py-1 font-semibold text-foreground transition hover:bg-muted"
            onClick={() =>
              applyPreset(
                Array.from({ length: 5 }).map((_, idx) => ({
                  day_of_week: idx + 1,
                  start_time: "09:00",
                  end_time: "12:00",
                  is_available: true,
                }))
              )
            }
          >
            Weekday mornings
          </button>
          <button
            type="button"
            className="rounded-full border border-border bg-background px-3 py-1 font-semibold text-foreground transition hover:bg-muted"
            onClick={copyToEmptyDays}
          >
            Copy to empty days
          </button>
        </div>

        {/* Drag-to-select Grid */}
        <div className="mt-6 rounded-2xl border border-dashed border-border/70 bg-muted/40 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Drag to add</h3>
              <p className="text-xs text-muted-foreground">
                Drag across a day row to add a slot quickly. Each block equals 30 minutes.
              </p>
            </div>
            <div className="hidden items-center gap-3 text-[10px] text-muted-foreground sm:flex">
              <span className="inline-flex items-center gap-1">
                <span className="h-3 w-3 rounded bg-primary/25" />
                Bookable
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-3 w-3 rounded bg-emerald-500/40" />
                New range
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-3 w-3 rounded bg-destructive/15" />
                Blocked
              </span>
            </div>
          </div>

          <div className="mt-3 space-y-2 rounded-xl bg-white/70 p-3 shadow-inner">
            {DAY_LABELS.map((day, dayIndex) => {
              const daySlots = grouped[dayIndex].slots;
              return (
                <div key={day} className="flex items-center gap-3 text-xs text-foreground">
                  <span className="w-14 shrink-0 text-right font-medium text-muted-foreground">
                    {day.slice(0, 3)}
                  </span>
                  <div className="flex-1 select-none">
                    <div className="grid gap-[2px]" style={gridColumnsStyle}>
                      {Array.from({ length: HALF_HOUR_SEGMENTS }).map((_, segmentIndex) => {
                        const activeSlot = findSlotForSegment(daySlots, segmentIndex);
                        const isDragging =
                          dragSelection &&
                          dragSelection.day === dayIndex &&
                          isWithinRange(segmentIndex, dragSelection.start, dragSelection.end);

                        let cellClass =
                          "h-6 rounded-sm border border-transparent bg-muted/40 transition-colors";

                        if (activeSlot) {
                          cellClass = activeSlot.is_available
                            ? "h-6 rounded-sm border border-primary/30 bg-primary/25 transition-colors"
                            : "h-6 rounded-sm border border-destructive/30 bg-destructive/15 transition-colors";
                        }

                        if (isDragging) {
                          cellClass =
                            "h-6 rounded-sm border border-emerald-500/70 bg-emerald-500/30 transition-colors";
                        }

                        return (
                          <button
                            key={`${day}-${segmentIndex}`}
                            type="button"
                            aria-label={`${day} ${formatTime(minutesToTime(segmentIndex * SEGMENT_MINUTES))}`}
                            className={cellClass}
                            onMouseDown={(event) => startDrag(dayIndex, segmentIndex, event)}
                            onMouseEnter={() => extendDrag(dayIndex, segmentIndex)}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Slots Table */}
      <section className="rounded-3xl border border-border bg-white/90 shadow-sm backdrop-blur">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full table-fixed border-separate border-spacing-y-2 text-sm min-w-[600px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-6 py-2">Day</th>
                <th className="px-6 py-2">Time</th>
                <th className="px-6 py-2">Status</th>
                <th className="px-6 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {grouped.every((group) => group.slots.length === 0) ? (
                <tr>
                  <td colSpan={4} className="px-6 py-6 text-center text-sm text-muted-foreground">
                    No availability yet. Add your first time slot above.
                  </td>
                </tr>
              ) : (
                grouped.map((group) =>
                  group.slots.map((slot, slotIndex) => (
                    <tr key={`${group.day_of_week}-${slot.start_time}-${slot.end_time}`}>
                      <td className="px-6 py-2 align-middle text-foreground">{group.label}</td>
                      <td className="px-6 py-2 align-middle text-muted-foreground">
                        {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                      </td>
                      <td className="px-6 py-2 align-middle">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                            slot.is_available
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {slot.is_available ? "Available" : "Blocked"}
                        </span>
                      </td>
                      <td className="px-6 py-2 align-middle text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggle(group.day_of_week, slotIndex)}
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            {slot.is_available ? "Block" : "Unblock"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveSlot(findSlotGlobalIndex(slots, slot))}
                            className="text-xs font-semibold text-destructive hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}

function minutesToTime(totalMinutes: number) {
  const clamped = Math.max(0, Math.min(totalMinutes, 24 * 60));
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return Number.NaN;
  if (hours < 0 || hours > 24) return Number.NaN;
  if (minutes < 0 || minutes > 59) return Number.NaN;
  if (hours === 24 && minutes !== 0) return Number.NaN;
  return hours * 60 + minutes;
}

function isWithinRange(value: number, start: number, end: number) {
  return value >= Math.min(start, end) && value <= Math.max(start, end);
}

function findSlotForSegment(slots: AvailabilitySlotInput[], segmentIndex: number) {
  const segmentStart = segmentIndex * SEGMENT_MINUTES;
  return slots.find((slot) => {
    const slotStart = timeToMinutes(slot.start_time);
    const slotEnd = timeToMinutes(slot.end_time);
    if (!Number.isFinite(slotStart) || !Number.isFinite(slotEnd)) return false;
    return segmentStart >= slotStart && segmentStart < slotEnd;
  });
}

function computeSlotHours(start: string, end: string) {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes)) return 0;
  return Math.max(0, (endMinutes - startMinutes) / 60);
}

function formatTime(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function sortSlots(a: AvailabilitySlotInput, b: AvailabilitySlotInput) {
  if (a.day_of_week !== b.day_of_week) {
    return a.day_of_week - b.day_of_week;
  }
  return a.start_time.localeCompare(b.start_time);
}

function findSlotGlobalIndex(slots: AvailabilitySlotInput[], target: AvailabilitySlotInput) {
  return slots.findIndex(
    (slot) =>
      slot.day_of_week === target.day_of_week &&
      slot.start_time === target.start_time &&
      slot.end_time === target.end_time
  );
}

function findSlotGlobalIndexByOrder(
  slots: AvailabilitySlotInput[],
  dayIndex: number,
  slotIndex: number
) {
  let count = -1;
  for (let i = 0; i < slots.length; i += 1) {
    const slot = slots[i];
    if (slot.day_of_week === dayIndex) {
      count += 1;
      if (count === slotIndex) {
        return i;
      }
    }
  }
  return -1;
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-border bg-white/90 px-4 py-4 shadow-sm backdrop-blur">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
