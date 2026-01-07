"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  OnboardingTemplateItem,
  OnboardingTemplate,
  OnboardingProgress,
  OnboardingOverview,
} from "@/lib/actions/types";

type CreateTemplateInput = {
  name: string;
  items: Omit<OnboardingTemplateItem, "id">[];
  isDefault?: boolean;
};

type UpdateTemplateInput = Partial<CreateTemplateInput>;

// ============================================================================
// HELPER: Require authenticated tutor
// ============================================================================

async function requireTutor() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  return { supabase, userId: user.id };
}

// ============================================================================
// TEMPLATE MANAGEMENT
// ============================================================================

/**
 * Get all onboarding templates for the current tutor
 */
export async function getOnboardingTemplates(): Promise<OnboardingTemplate[]> {
  const { supabase, userId } = await requireTutor();

  const { data, error } = await supabase
    .from("student_onboarding_templates")
    .select("*")
    .eq("tutor_id", userId)
    .order("is_default", { ascending: false })
    .order("name");

  if (error) {
    console.error("[getOnboardingTemplates] Error:", error);
    return [];
  }

  return (data ?? []) as OnboardingTemplate[];
}

/**
 * Get a single onboarding template by ID
 */
export async function getOnboardingTemplate(
  templateId: string
): Promise<OnboardingTemplate | null> {
  const { supabase, userId } = await requireTutor();

  const { data, error } = await supabase
    .from("student_onboarding_templates")
    .select("*")
    .eq("id", templateId)
    .eq("tutor_id", userId)
    .single();

  if (error) {
    console.error("[getOnboardingTemplate] Error:", error);
    return null;
  }

  return data as OnboardingTemplate;
}

/**
 * Create a new onboarding template
 */
export async function createOnboardingTemplate(
  input: CreateTemplateInput
): Promise<{ data?: OnboardingTemplate; error?: string }> {
  const { supabase, userId } = await requireTutor();

  // Generate IDs for items
  const items = input.items.map((item, index) => ({
    ...item,
    id: crypto.randomUUID(),
    order: item.order ?? index,
  }));

  const { data, error } = await supabase
    .from("student_onboarding_templates")
    .insert({
      tutor_id: userId,
      name: input.name.trim(),
      items,
      is_default: input.isDefault ?? false,
    })
    .select()
    .single();

  if (error) {
    console.error("[createOnboardingTemplate] Error:", error);
    if (error.code === "23505") {
      return { error: "A template with this name already exists" };
    }
    return { error: "Failed to create template" };
  }

  revalidatePath("/students");
  return { data: data as OnboardingTemplate };
}

/**
 * Update an existing onboarding template
 */
export async function updateOnboardingTemplate(
  templateId: string,
  input: UpdateTemplateInput
): Promise<{ data?: OnboardingTemplate; error?: string }> {
  const { supabase, userId } = await requireTutor();

  const updateData: Record<string, unknown> = {};

  if (input.name !== undefined) {
    updateData.name = input.name.trim();
  }

  if (input.items !== undefined) {
    updateData.items = input.items.map((item, index) => ({
      ...item,
      id: (item as OnboardingTemplateItem).id ?? crypto.randomUUID(),
      order: item.order ?? index,
    }));
  }

  if (input.isDefault !== undefined) {
    updateData.is_default = input.isDefault;
  }

  const { data, error } = await supabase
    .from("student_onboarding_templates")
    .update(updateData)
    .eq("id", templateId)
    .eq("tutor_id", userId)
    .select()
    .single();

  if (error) {
    console.error("[updateOnboardingTemplate] Error:", error);
    if (error.code === "23505") {
      return { error: "A template with this name already exists" };
    }
    return { error: "Failed to update template" };
  }

  revalidatePath("/students");
  return { data: data as OnboardingTemplate };
}

/**
 * Delete an onboarding template
 */
export async function deleteOnboardingTemplate(
  templateId: string
): Promise<{ success: boolean; error?: string }> {
  const { supabase, userId } = await requireTutor();

  const { error } = await supabase
    .from("student_onboarding_templates")
    .delete()
    .eq("id", templateId)
    .eq("tutor_id", userId);

  if (error) {
    console.error("[deleteOnboardingTemplate] Error:", error);
    return { success: false, error: "Failed to delete template" };
  }

  revalidatePath("/students");
  return { success: true };
}

/**
 * Set a template as the default
 */
export async function setDefaultTemplate(
  templateId: string
): Promise<{ success: boolean; error?: string }> {
  const { supabase, userId } = await requireTutor();

  const { error } = await supabase
    .from("student_onboarding_templates")
    .update({ is_default: true })
    .eq("id", templateId)
    .eq("tutor_id", userId);

  if (error) {
    console.error("[setDefaultTemplate] Error:", error);
    return { success: false, error: "Failed to set default template" };
  }

  revalidatePath("/students");
  return { success: true };
}

/**
 * Get or create a default onboarding template for the tutor
 */
export async function getOrCreateDefaultTemplate(): Promise<OnboardingTemplate | null> {
  const { supabase, userId } = await requireTutor();

  // First, try to get existing default template
  const { data: existing } = await supabase
    .from("student_onboarding_templates")
    .select("*")
    .eq("tutor_id", userId)
    .eq("is_default", true)
    .single();

  if (existing) {
    return existing as OnboardingTemplate;
  }

  // Create a default template with common onboarding tasks
  const defaultItems: OnboardingTemplateItem[] = [
    {
      id: crypto.randomUUID(),
      label: "Welcome message sent",
      description: "Send a personalized welcome message to the student",
      order: 0,
    },
    {
      id: crypto.randomUUID(),
      label: "Learning goals discussed",
      description: "Understand what the student wants to achieve",
      order: 1,
    },
    {
      id: crypto.randomUUID(),
      label: "Proficiency level assessed",
      description: "Evaluate current language skills",
      order: 2,
    },
    {
      id: crypto.randomUUID(),
      label: "Schedule first lesson",
      description: "Book the initial lesson",
      order: 3,
    },
    {
      id: crypto.randomUUID(),
      label: "First lesson completed",
      description: "Complete the introductory lesson",
      order: 4,
    },
  ];

  const { data, error } = await supabase
    .from("student_onboarding_templates")
    .insert({
      tutor_id: userId,
      name: "Default Onboarding",
      items: defaultItems,
      is_default: true,
    })
    .select()
    .single();

  if (error) {
    console.error("[getOrCreateDefaultTemplate] Error:", error);
    return null;
  }

  return data as OnboardingTemplate;
}

// ============================================================================
// PROGRESS MANAGEMENT
// ============================================================================

/**
 * Get onboarding progress for a specific student
 */
export async function getStudentOnboardingProgress(
  studentId: string
): Promise<OnboardingProgress | null> {
  const { supabase, userId } = await requireTutor();

  const { data, error } = await supabase
    .from("student_onboarding_progress")
    .select(
      `
      *,
      template:student_onboarding_templates(*)
    `
    )
    .eq("student_id", studentId)
    .eq("tutor_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No progress record exists yet
      return null;
    }
    console.error("[getStudentOnboardingProgress] Error:", error);
    return null;
  }

  return data as OnboardingProgress;
}

/**
 * Initialize onboarding for a student
 */
export async function initializeStudentOnboarding(
  studentId: string,
  templateId?: string
): Promise<{ data?: OnboardingProgress; error?: string }> {
  const { supabase, userId } = await requireTutor();

  // Get template (provided or default)
  let template: OnboardingTemplate | null = null;

  if (templateId) {
    const { data } = await supabase
      .from("student_onboarding_templates")
      .select("*")
      .eq("id", templateId)
      .eq("tutor_id", userId)
      .single();
    template = data as OnboardingTemplate;
  } else {
    template = await getOrCreateDefaultTemplate();
  }

  if (!template) {
    return { error: "No onboarding template found" };
  }

  // Create or update progress record
  const { data, error } = await supabase
    .from("student_onboarding_progress")
    .upsert(
      {
        student_id: studentId,
        tutor_id: userId,
        template_id: template.id,
        completed_items: [],
        status: "in_progress",
        started_at: new Date().toISOString(),
      },
      {
        onConflict: "student_id,tutor_id",
      }
    )
    .select(
      `
      *,
      template:student_onboarding_templates(*)
    `
    )
    .single();

  if (error) {
    console.error("[initializeStudentOnboarding] Error:", error);
    return { error: "Failed to initialize onboarding" };
  }

  // Update student's onboarding status
  await supabase
    .from("students")
    .update({ onboarding_status: "in_progress" })
    .eq("id", studentId)
    .eq("tutor_id", userId);

  // Add timeline event
  await supabase.from("student_timeline_events").insert({
    student_id: studentId,
    tutor_id: userId,
    event_type: "onboarding_started",
    event_title: "Onboarding started",
    event_description: `Started onboarding with "${template.name}" template`,
    visible_to_student: true,
    is_milestone: false,
  });

  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);

  return { data: data as OnboardingProgress };
}

/**
 * Toggle completion of an onboarding item
 */
export async function toggleOnboardingItem(
  studentId: string,
  itemId: string,
  completed: boolean
): Promise<{ data?: OnboardingProgress; error?: string }> {
  const { supabase, userId } = await requireTutor();

  // Get current progress
  const { data: progress, error: fetchError } = await supabase
    .from("student_onboarding_progress")
    .select(
      `
      *,
      template:student_onboarding_templates(*)
    `
    )
    .eq("student_id", studentId)
    .eq("tutor_id", userId)
    .single();

  if (fetchError || !progress) {
    return { error: "Onboarding not initialized for this student" };
  }

  const currentItems = (progress.completed_items as string[]) || [];
  let newItems: string[];

  if (completed) {
    // Add item if not already completed
    newItems = currentItems.includes(itemId)
      ? currentItems
      : [...currentItems, itemId];
  } else {
    // Remove item
    newItems = currentItems.filter((id) => id !== itemId);
  }

  // Check if all items are completed
  const template = progress.template as OnboardingTemplate;
  const totalItems = template?.items?.length ?? 0;
  const isCompleted = totalItems > 0 && newItems.length >= totalItems;

  const { data, error } = await supabase
    .from("student_onboarding_progress")
    .update({
      completed_items: newItems,
      status: isCompleted ? "completed" : "in_progress",
      completed_at: isCompleted ? new Date().toISOString() : null,
    })
    .eq("id", progress.id)
    .select(
      `
      *,
      template:student_onboarding_templates(*)
    `
    )
    .single();

  if (error) {
    console.error("[toggleOnboardingItem] Error:", error);
    return { error: "Failed to update onboarding progress" };
  }

  // Update student's onboarding status
  await supabase
    .from("students")
    .update({
      onboarding_status: isCompleted ? "completed" : "in_progress",
      onboarding_completed_at: isCompleted ? new Date().toISOString() : null,
    })
    .eq("id", studentId)
    .eq("tutor_id", userId);

  // Add timeline event for completion
  if (completed) {
    const itemLabel =
      template?.items?.find((i) => i.id === itemId)?.label ?? "Item";

    await supabase.from("student_timeline_events").insert({
      student_id: studentId,
      tutor_id: userId,
      event_type: "onboarding_item_completed",
      event_title: `Completed: ${itemLabel}`,
      visible_to_student: true,
      is_milestone: false,
    });

    // If all items completed, add milestone event
    if (isCompleted) {
      await supabase.from("student_timeline_events").insert({
        student_id: studentId,
        tutor_id: userId,
        event_type: "onboarding_completed",
        event_title: "Onboarding completed!",
        event_description: "All onboarding tasks have been completed",
        visible_to_student: true,
        is_milestone: true,
      });
    }
  }

  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);

  return { data: data as OnboardingProgress };
}

/**
 * Complete student onboarding manually
 */
export async function completeStudentOnboarding(
  studentId: string
): Promise<{ success: boolean; error?: string }> {
  const { supabase, userId } = await requireTutor();

  const { error: progressError } = await supabase
    .from("student_onboarding_progress")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("student_id", studentId)
    .eq("tutor_id", userId);

  if (progressError) {
    console.error("[completeStudentOnboarding] Progress error:", progressError);
  }

  const { error: studentError } = await supabase
    .from("students")
    .update({
      onboarding_status: "completed",
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", studentId)
    .eq("tutor_id", userId);

  if (studentError) {
    console.error("[completeStudentOnboarding] Student error:", studentError);
    return { success: false, error: "Failed to complete onboarding" };
  }

  // Add milestone event
  await supabase.from("student_timeline_events").insert({
    student_id: studentId,
    tutor_id: userId,
    event_type: "onboarding_completed",
    event_title: "Onboarding completed!",
    event_description: "All onboarding tasks have been completed",
    visible_to_student: true,
    is_milestone: true,
  });

  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);

  return { success: true };
}

// ============================================================================
// DASHBOARD QUERIES
// ============================================================================

/**
 * Get overview of onboarding status across all students
 */
export async function getOnboardingOverview(): Promise<OnboardingOverview> {
  const { supabase, userId } = await requireTutor();

  const { data, error } = await supabase
    .from("students")
    .select("onboarding_status")
    .eq("tutor_id", userId);

  if (error) {
    console.error("[getOnboardingOverview] Error:", error);
    return { not_started: 0, in_progress: 0, completed: 0, total: 0 };
  }

  const counts = {
    not_started: 0,
    in_progress: 0,
    completed: 0,
    total: data?.length ?? 0,
  };

  for (const student of data ?? []) {
    const status = student.onboarding_status as keyof typeof counts;
    if (status in counts) {
      counts[status]++;
    } else {
      counts.not_started++;
    }
  }

  return counts;
}

/**
 * Get students by onboarding status
 */
export async function getStudentsByOnboardingStatus(
  status: "not_started" | "in_progress" | "completed"
): Promise<
  Array<{
    id: string;
    full_name: string;
    email: string;
    onboarding_status: string;
  }>
> {
  const { supabase, userId } = await requireTutor();

  const { data, error } = await supabase
    .from("students")
    .select("id, full_name, email, onboarding_status")
    .eq("tutor_id", userId)
    .eq("onboarding_status", status)
    .order("full_name");

  if (error) {
    console.error("[getStudentsByOnboardingStatus] Error:", error);
    return [];
  }

  return data ?? [];
}

// ============================================================================
// STUDENT PORTAL QUERIES
// ============================================================================

/**
 * Get onboarding progress for the currently logged-in student (for student portal)
 */
export async function getStudentOnboardingProgressForPortal(): Promise<OnboardingProgress | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  // Get the student record for this user (they may be a student of multiple tutors)
  // For now, get the most recent one
  const { data: studentRecord, error: studentError } = await supabase
    .from("students")
    .select("id, tutor_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (studentError || !studentRecord) {
    return null;
  }

  // Get onboarding progress for this student
  const { data, error } = await supabase
    .from("student_onboarding_progress")
    .select(
      `
      *,
      template:student_onboarding_templates(*)
    `
    )
    .eq("student_id", studentRecord.id)
    .eq("tutor_id", studentRecord.tutor_id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No progress record exists yet
      return null;
    }
    console.error("[getStudentOnboardingProgressForPortal] Error:", error);
    return null;
  }

  return data as OnboardingProgress;
}
