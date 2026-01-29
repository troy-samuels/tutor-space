"use server";

import { requireTutor } from "@/lib/auth/guards";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import type { InviteLink, InviteLinkWithServices, ValidatedInviteLink } from "@/lib/actions/types";

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Generate a cryptographically secure URL-safe token
 */
function generateSecureToken(): string {
  // 16 bytes = 128 bits of entropy, base64url encoded = 22 chars
  return randomBytes(16).toString("base64url");
}

// =============================================================================
// SERVER ACTIONS
// =============================================================================

/**
 * Create a new invite link for the authenticated tutor
 */
export async function createInviteLink(params: {
  name: string;
  serviceIds?: string[];
}): Promise<{ success: boolean; link?: InviteLink; error?: string }> {
  try {
    const { supabase, user } = await requireTutor({ strict: true });

    const token = generateSecureToken();

    const { data, error } = await supabase
      .from("tutor_invite_links")
      .insert({
        tutor_id: user.id,
        token,
        name: params.name.trim(),
        service_ids: params.serviceIds ?? [],
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating invite link:", error);
      return { success: false, error: "Failed to create invite link" };
    }

    revalidatePath("/students");

    return {
      success: true,
      link: {
        id: data.id,
        tutorId: data.tutor_id,
        token: data.token,
        name: data.name,
        expiresAt: data.expires_at,
        isActive: data.is_active,
        serviceIds: data.service_ids ?? [],
        usageCount: data.usage_count,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    };
  } catch (err) {
    console.error("Error in createInviteLink:", err);
    return { success: false, error: "Failed to create invite link" };
  }
}

/**
 * List all invite links for the authenticated tutor
 */
export async function listInviteLinks(): Promise<{
  success: boolean;
  links?: InviteLinkWithServices[];
  error?: string;
}> {
  try {
    const { supabase, user } = await requireTutor({ strict: true });

    // Fetch invite links
    const { data: links, error: linksError } = await supabase
      .from("tutor_invite_links")
      .select("*")
      .eq("tutor_id", user.id)
      .order("created_at", { ascending: false });

    if (linksError) {
      console.error("Error fetching invite links:", linksError);
      return { success: false, error: "Failed to fetch invite links" };
    }

    // Get all unique service IDs to fetch service names
    const allServiceIds = [
      ...new Set(links?.flatMap((link) => link.service_ids ?? []) ?? []),
    ];

    let serviceMap: Record<string, string> = {};
    if (allServiceIds.length > 0) {
      const { data: services } = await supabase
        .from("services")
        .select("id, name")
        .in("id", allServiceIds);

      serviceMap = Object.fromEntries(
        (services ?? []).map((s) => [s.id, s.name])
      );
    }

    const formattedLinks: InviteLinkWithServices[] = (links ?? []).map(
      (link) => ({
        id: link.id,
        tutorId: link.tutor_id,
        token: link.token,
        name: link.name,
        expiresAt: link.expires_at,
        isActive: link.is_active,
        serviceIds: link.service_ids ?? [],
        usageCount: link.usage_count,
        createdAt: link.created_at,
        updatedAt: link.updated_at,
        services: (link.service_ids ?? [])
          .filter((id: string) => serviceMap[id])
          .map((id: string) => ({ id, name: serviceMap[id] })),
      })
    );

    return { success: true, links: formattedLinks };
  } catch (err) {
    console.error("Error in listInviteLinks:", err);
    return { success: false, error: "Failed to fetch invite links" };
  }
}

/**
 * Delete/revoke an invite link
 */
export async function deleteInviteLink(
  linkId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase, user } = await requireTutor({ strict: true });

    const { error } = await supabase
      .from("tutor_invite_links")
      .delete()
      .eq("id", linkId)
      .eq("tutor_id", user.id); // Ensure tutor owns this link

    if (error) {
      console.error("Error deleting invite link:", error);
      return { success: false, error: "Failed to delete invite link" };
    }

    revalidatePath("/students");

    return { success: true };
  } catch (err) {
    console.error("Error in deleteInviteLink:", err);
    return { success: false, error: "Failed to delete invite link" };
  }
}

/**
 * Toggle invite link active status
 */
export async function toggleInviteLinkActive(
  linkId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase, user } = await requireTutor({ strict: true });

    const { error } = await supabase
      .from("tutor_invite_links")
      .update({ is_active: isActive })
      .eq("id", linkId)
      .eq("tutor_id", user.id);

    if (error) {
      console.error("Error toggling invite link:", error);
      return { success: false, error: "Failed to update invite link" };
    }

    revalidatePath("/students");

    return { success: true };
  } catch (err) {
    console.error("Error in toggleInviteLinkActive:", err);
    return { success: false, error: "Failed to update invite link" };
  }
}

/**
 * Validate an invite token (public - used during signup)
 * Uses service role to bypass RLS for token lookup
 */
export async function validateInviteToken(
  token: string
): Promise<{ valid: boolean; data?: ValidatedInviteLink; error?: string }> {
  try {
    const adminClient = createServiceRoleClient();

    if (!adminClient) {
      return { valid: false, error: "Service unavailable" };
    }

    const { data, error } = await adminClient.rpc("validate_invite_token", {
      p_token: token,
    });

    if (error) {
      console.error("Error validating invite token:", error);
      return { valid: false, error: "Invalid invite link" };
    }

    if (!data || data.length === 0) {
      return { valid: false, error: "Invite link not found" };
    }

    const result = data[0];

    if (!result.is_valid) {
      return { valid: false, error: "This invite link has expired or been deactivated" };
    }

    return {
      valid: true,
      data: {
        id: result.id,
        tutorId: result.tutor_id,
        name: result.name,
        serviceIds: result.service_ids ?? [],
        isValid: result.is_valid,
        tutorUsername: result.tutor_username,
        tutorFullName: result.tutor_full_name,
        tutorAvatarUrl: result.tutor_avatar_url,
      },
    };
  } catch (err) {
    console.error("Error in validateInviteToken:", err);
    return { valid: false, error: "Failed to validate invite link" };
  }
}

/**
 * Record invite link usage after successful signup
 * Uses service role to bypass RLS
 */
export async function recordInviteLinkUsage(
  linkId: string,
  studentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminClient = createServiceRoleClient();

    if (!adminClient) {
      return { success: false, error: "Service unavailable" };
    }

    const { data, error } = await adminClient.rpc("increment_invite_link_usage", {
      p_link_id: linkId,
      p_student_id: studentId,
    });

    if (error) {
      console.error("Error recording invite link usage:", error);
      return { success: false, error: "Failed to record usage" };
    }

    return { success: true };
  } catch (err) {
    console.error("Error in recordInviteLinkUsage:", err);
    return { success: false, error: "Failed to record usage" };
  }
}

/**
 * Get invite link usage details (students who used a link)
 */
export async function getInviteLinkUsages(linkId: string): Promise<{
  success: boolean;
  usages?: Array<{
    studentId: string;
    studentName: string;
    studentEmail: string;
    usedAt: string;
  }>;
  error?: string;
}> {
  try {
    const { supabase, user } = await requireTutor();

    // First verify the tutor owns this link
    const { data: link, error: linkError } = await supabase
      .from("tutor_invite_links")
      .select("id")
      .eq("id", linkId)
      .eq("tutor_id", user.id)
      .single();

    if (linkError || !link) {
      return { success: false, error: "Invite link not found" };
    }

    // Fetch usages with student info
    const { data: usages, error: usagesError } = await supabase
      .from("tutor_invite_link_usages")
      .select(`
        student_id,
        used_at,
        students (
          full_name,
          email
        )
      `)
      .eq("invite_link_id", linkId)
      .order("used_at", { ascending: false });

    if (usagesError) {
      console.error("Error fetching usages:", usagesError);
      return { success: false, error: "Failed to fetch usages" };
    }

    const formattedUsages = (usages ?? []).map((u) => {
      const student = Array.isArray(u.students) ? u.students[0] : u.students;
      return {
        studentId: u.student_id,
        studentName: student?.full_name ?? "Unknown",
        studentEmail: student?.email ?? "",
        usedAt: u.used_at,
      };
    });

    return { success: true, usages: formattedUsages };
  } catch (err) {
    console.error("Error in getInviteLinkUsages:", err);
    return { success: false, error: "Failed to fetch usages" };
  }
}
