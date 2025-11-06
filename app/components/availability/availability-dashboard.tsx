"use client";

import { useMemo, useState, useTransition } from "react";
import { availabilitySlotSchema, type AvailabilitySlotInput } from "@/lib/validators/availability";
import { saveAvailability } from "@/lib/actions/availability";

type AvailabilityDashboardProps = {
  initialSlots: Array<AvailabilitySlotInput & { id: string }>;
};

const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function AvailabilityDashboard({ initialSlots }: AvailabilityDashboardProps) {
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

  function handleAddSlot() {
    const parsed = availabilitySlotSchema.safeParse(draft);
    if (!parsed.success) {
      setStatus({ type: "error", message: parsed.error.issues[0]?.message ?? "Invalid slot." });
      return;
    }

    setSlots((prev) => {
      const updated = [...prev, { ...parsed.data }];
      return updated.sort(sortSlots);
    });
    setStatus(null);
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
      })();
    });
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Availability</h1>
          <p className="text-sm text-muted-foreground">
            Set the weekly schedule students can book. You can add special exceptions later.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex h-10 items-center justify-center rounded-full bg-brand-brown px-4 text-sm font-semibold text-brand-white shadow-sm transition hover:bg-brand-brown/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Save changes"}
        </button>
      </header>

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

      <section className="rounded-3xl border border-brand-brown/20 bg-white/90 p-6 shadow-sm backdrop-blur">
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
              className="rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-brand-brown focus:outline-none focus:ring-1 focus:ring-brand-brown"
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
              className="rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-brand-brown focus:outline-none focus:ring-1 focus:ring-brand-brown"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-foreground">End time</span>
            <input
              type="time"
              value={draft.end_time}
              onChange={(event) => setDraft((prev) => ({ ...prev, end_time: event.target.value }))}
              className="rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-brand-brown focus:outline-none focus:ring-1 focus:ring-brand-brown"
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
              className="h-4 w-4 rounded border-brand-brown text-brand-brown focus:ring-brand-brown"
            />
            Mark as bookable
          </label>
          <button
            type="button"
            onClick={handleAddSlot}
            className="ml-auto inline-flex h-9 items-center justify-center rounded-full border border-brand-brown/40 px-4 text-xs font-semibold text-brand-brown transition hover:bg-brand-brown/10"
          >
            Add slot
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-brand-brown/20 bg-white/90 shadow-sm backdrop-blur">
        {/* Horizontal scroll container for mobile */}
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
                              : "bg-brand-brown/10 text-brand-brown"
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
                            className="text-xs font-semibold text-brand-brown hover:underline"
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
    </div>
  );
}

function computeSlotHours(start: string, end: string) {
  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);
  return (endH + endM / 60) - (startH + startM / 60);
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
    <div className="rounded-2xl border border-brand-brown/20 bg-white/90 px-4 py-4 shadow-sm backdrop-blur">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
