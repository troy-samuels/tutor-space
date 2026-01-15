"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export interface SupportTicket {
  id: string;
  user_id: string;
  submitted_by_role: "tutor" | "student" | "unknown";
  subject: string;
  message: string;
  category: string;
  status: "open" | "in_progress" | "closed";
  tutor_id: string | null;
  student_id: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  // Joined fields for admin view
  user_email?: string;
  user_name?: string;
}

/**
 * Get support tickets for the current user
 */
export async function getUserSupportTickets(): Promise<{
  tickets: SupportTicket[];
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { tickets: [], error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Support] Failed to fetch tickets", error);
    return { tickets: [], error: "Failed to fetch tickets" };
  }

  return { tickets: data as SupportTicket[] };
}

/**
 * Get all support tickets (admin only)
 */
export async function getAllSupportTickets(options?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{
  tickets: SupportTicket[];
  total: number;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { tickets: [], total: 0, error: "Not authenticated" };
  }

  // Check if user is admin
  const admin = createServiceRoleClient();
  if (!admin) {
    return { tickets: [], total: 0, error: "Service unavailable" };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return { tickets: [], total: 0, error: "Unauthorized" };
  }

  // Build query
  let query = admin
    .from("support_tickets")
    .select(
      `
      *,
      profiles:user_id (
        email,
        full_name
      )
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("[Support] Failed to fetch all tickets", error);
    return { tickets: [], total: 0, error: "Failed to fetch tickets" };
  }

  // Transform data to flatten joined fields
  const tickets = (data || []).map((ticket: Record<string, unknown>) => {
    const profiles = ticket.profiles as { email?: string; full_name?: string } | null;
    return {
      id: ticket.id,
      user_id: ticket.user_id,
      submitted_by_role: ticket.submitted_by_role,
      subject: ticket.subject,
      message: ticket.message,
      category: ticket.category,
      status: ticket.status,
      tutor_id: ticket.tutor_id,
      student_id: ticket.student_id,
      created_at: ticket.created_at,
      updated_at: ticket.updated_at,
      resolved_at: ticket.resolved_at,
      user_email: profiles?.email,
      user_name: profiles?.full_name,
    } as SupportTicket;
  });

  return { tickets, total: count || 0 };
}

/**
 * Update ticket status (admin only)
 */
export async function updateTicketStatus(
  ticketId: string,
  status: "open" | "in_progress" | "closed"
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const admin = createServiceRoleClient();
  if (!admin) {
    return { error: "Service unavailable" };
  }

  // Check admin role
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const updateData: Record<string, unknown> = { status };
  if (status === "closed") {
    updateData.resolved_at = new Date().toISOString();
  } else {
    updateData.resolved_at = null;
  }

  const { error } = await admin
    .from("support_tickets")
    .update(updateData)
    .eq("id", ticketId);

  if (error) {
    console.error("[Support] Failed to update ticket status", error);
    return { error: "Failed to update ticket" };
  }

  revalidatePath("/admin/support");
  return {};
}

/**
 * Get support ticket stats (admin only)
 */
export async function getSupportStats(): Promise<{
  open: number;
  in_progress: number;
  closed_today: number;
  total: number;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { open: 0, in_progress: 0, closed_today: 0, total: 0, error: "Not authenticated" };
  }

  const admin = createServiceRoleClient();
  if (!admin) {
    return { open: 0, in_progress: 0, closed_today: 0, total: 0, error: "Service unavailable" };
  }

  // Check admin role
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return { open: 0, in_progress: 0, closed_today: 0, total: 0, error: "Unauthorized" };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [openResult, inProgressResult, closedTodayResult, totalResult] = await Promise.all([
    admin.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "open"),
    admin.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "in_progress"),
    admin
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .eq("status", "closed")
      .gte("resolved_at", today.toISOString()),
    admin.from("support_tickets").select("id", { count: "exact", head: true }),
  ]);

  return {
    open: openResult.count || 0,
    in_progress: inProgressResult.count || 0,
    closed_today: closedTodayResult.count || 0,
    total: totalResult.count || 0,
  };
}
