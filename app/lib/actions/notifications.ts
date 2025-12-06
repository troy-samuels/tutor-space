"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export type NotificationType =
  | "booking_new"
  | "booking_confirmed"
  | "booking_cancelled"
  | "booking_reminder"
  | "payment_received"
  | "payment_failed"
  | "message_new"
  | "message_reply"
  | "student_new"
  | "student_access_request"
  | "package_purchased"
  | "package_expiring"
  | "review_received"
  | "review_approved"
  | "system_announcement"
  | "account_update";

export interface Notification {
  id: string;
  user_id: string;
  user_role: "tutor" | "student";
  type: NotificationType;
  title: string;
  body: string | null;
  icon: string | null;
  link: string | null;
  metadata: Record<string, unknown>;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

/**
 * Get notifications for the current user
 */
export async function getNotifications(options?: {
  limit?: number;
  unreadOnly?: boolean;
}): Promise<{ notifications: Notification[]; unreadCount: number }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { notifications: [], unreadCount: 0 };
  }

  const limit = options?.limit || 50;

  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options?.unreadOnly) {
    query = query.eq("read", false);
  }

  const { data: notifications, error } = await query;

  if (error) {
    console.error("Error fetching notifications:", error);
    return { notifications: [], unreadCount: 0 };
  }

  // Get unread count
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false);

  return {
    notifications: (notifications || []) as Notification[],
    unreadCount: count || 0,
  };
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return 0;
  }

  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false);

  return count || 0;
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("notifications")
    .update({
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error marking notification as read:", error);
    return { success: false, error: "Failed to mark as read" };
  }

  return { success: true };
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("notifications")
    .update({
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("read", false);

  if (error) {
    console.error("Error marking all notifications as read:", error);
    return { success: false, error: "Failed to mark all as read" };
  }

  return { success: true };
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return { success: false, error: "Database connection failed" };
  }

  const { error } = await serviceClient
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting notification:", error);
    return { success: false, error: "Failed to delete notification" };
  }

  return { success: true };
}

/**
 * Create a notification (server-side utility)
 */
export async function createNotification({
  userId,
  userRole,
  type,
  title,
  body,
  link,
  icon,
  metadata,
}: {
  userId: string;
  userRole: "tutor" | "student";
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  icon?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return { success: false, error: "Database connection failed" };
  }

  const { data, error } = await serviceClient
    .from("notifications")
    .insert({
      user_id: userId,
      user_role: userRole,
      type,
      title,
      body: body || null,
      link: link || null,
      icon: icon || null,
      metadata: metadata || {},
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating notification:", error);
    return { success: false, error: "Failed to create notification" };
  }

  return { success: true, notificationId: data?.id };
}

// Notification type to icon mapping - moved to @/lib/constants/notification-icons.ts if needed
