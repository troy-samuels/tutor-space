"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { AutomationActionState, UnsubscribeActionState } from "@/lib/actions/types";

const automationSchema = z.object({
  auto_welcome_enabled: z.boolean().optional(),
  auto_reengage_enabled: z.boolean().optional(),
  auto_reengage_days: z.coerce.number().min(7).max(365).optional(),
});

export async function updateEmailAutomationSettings(
  _prevState: AutomationActionState,
  formData: FormData
): Promise<AutomationActionState> {
  const parsed = automationSchema.safeParse({
    auto_welcome_enabled: formData.get("auto_welcome_enabled") === "on",
    auto_reengage_enabled: formData.get("auto_reengage_enabled") === "on",
    auto_reengage_days: formData.get("auto_reengage_days"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid automation settings." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be signed in." };
  }

  const payload = {
    auto_welcome_enabled: parsed.data.auto_welcome_enabled ?? false,
    auto_reengage_enabled: parsed.data.auto_reengage_enabled ?? false,
    auto_reengage_days: parsed.data.auto_reengage_days ?? 30,
  };

  const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);

  if (error) {
    console.error("[EmailPreferences] Failed to update automations", error);
    return { error: "We couldn’t update these settings. Try again." };
  }
  revalidatePath("/marketing/email");
  return { success: "Saved" };
}

const unsubscribeSchema = z.object({
  token: z.string().uuid(),
});

export async function unsubscribeStudentAction(
  _prevState: UnsubscribeActionState,
  formData: FormData
): Promise<UnsubscribeActionState> {
  const parsed = unsubscribeSchema.safeParse({
    token: formData.get("token"),
  });

  if (!parsed.success) {
    return { error: "Invalid unsubscribe link." };
  }

  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    return { error: "Server configuration error." };
  }

  const { data: student, error: studentError } = await adminClient
    .from("students")
    .select(
      "id, full_name, tutor_id, email_opt_out, profiles:profiles!students_tutor_id_fkey(full_name)"
    )
    .eq("email_unsubscribe_token", parsed.data.token)
    .maybeSingle();

  if (studentError || !student) {
    return { error: "This unsubscribe link is no longer valid." };
  }
  const tutorProfile = Array.isArray(student.profiles) ? student.profiles[0] : student.profiles;

  if (student.email_opt_out) {
    return {
      success: "You are already unsubscribed.",
      studentName: student.full_name ?? undefined,
      tutorName: tutorProfile?.full_name ?? undefined,
    };
  }

  const { error: updateError } = await adminClient
    .from("students")
    .update({
      email_opt_out: true,
      last_reengage_email_at: new Date().toISOString(),
    })
    .eq("id", student.id);

  if (updateError) {
    console.error("[EmailPreferences] Failed to unsubscribe student", updateError);
    return { error: "We couldn’t complete this request. Try again." };
  }

  return {
    success: "You have been unsubscribed.",
    studentName: student.full_name ?? undefined,
    tutorName: tutorProfile?.full_name ?? undefined,
  };
}
