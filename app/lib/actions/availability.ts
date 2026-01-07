"use server";

import { createClient } from "@/lib/supabase/server";
import { availabilityFormSchema, type AvailabilitySlotInput } from "@/lib/validators/availability";
import type { AvailabilityRecord } from "@/lib/actions/types";

async function requireTutor() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null as null };
  }

  return { supabase, user };
}

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

  const { error: deleteError } = await supabase
    .from("availability")
    .delete()
    .eq("tutor_id", user.id);

  if (deleteError) {
    return { error: "We couldn't update your schedule. Try again." };
  }

  if (parsed.data.length === 0) {
    return { success: true };
  }

  const { error: insertError } = await supabase.from("availability").insert(
    parsed.data.map((slot) => ({
      tutor_id: user.id,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
      is_available: slot.is_available,
    }))
  );

  if (insertError) {
    return { error: "We couldn't save some slots. Please try again." };
  }

  return { success: true };
}
