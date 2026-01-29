"use server";

import { requireTutor } from "@/lib/auth/guards";
import { availabilityFormSchema, type AvailabilitySlotInput } from "@/lib/validators/availability";
import type { AvailabilityRecord } from "@/lib/actions/types";

export async function getAvailability(): Promise<{ slots: AvailabilityRecord[] }> {
  const { supabase, user } = await requireTutor();
  if (!user) {
    return { slots: [] };
  }

  const { data } = await supabase
    .from("availability")
    .select("*")
    .eq("tutor_id", user.id)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  return { slots: (data as AvailabilityRecord[] | null) ?? [] };
}

export async function saveAvailability(slots: AvailabilitySlotInput[]) {
  const parsed = availabilityFormSchema.safeParse(slots);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid availability data.";
    return { error: message };
  }

  const { supabase, user } = await requireTutor();
  if (!user) {
    return { error: "You need to be signed in to update availability." };
  }

  const { data, error } = await supabase.rpc("save_availability", {
    p_user_id: user.id,
    p_availability: parsed.data,
  });

  if (error || !data?.success) {
    return { error: data?.error || "We couldn't update your schedule. Try again." };
  }

  return { success: true };
}

/**
 * Creates a one-time unavailability exception.
 * Semantic wrapper around createBlockedTime() for clarity.
 */
export async function createOneTimeException(input: {
  startTime: string;
  endTime: string;
  label?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const { createBlockedTime } = await import("./blocked-times");
  return createBlockedTime({
    startTime: input.startTime,
    endTime: input.endTime,
    label: input.label,
  });
}
