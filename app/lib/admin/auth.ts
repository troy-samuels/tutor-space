import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
  getAdminSessionFromCookies,
  parseAdminSession,
  ADMIN_SESSION_COOKIE,
  type AdminSession,
} from "./session";

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: "super_admin" | "admin" | "support";
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Verifies the admin session from cookies and returns the admin user if valid
 */
export async function verifyAdminSession(): Promise<AdminUser | null> {
  const session = await getAdminSessionFromCookies();

  if (!session) {
    return null;
  }

  // Verify admin still exists and is active
  const supabase = createServiceRoleClient();
  if (!supabase) {
    return null;
  }

  const { data: adminUser, error } = await supabase
    .from("admin_users")
    .select("*")
    .eq("id", session.adminId)
    .eq("is_active", true)
    .single();

  if (error || !adminUser) {
    return null;
  }

  return adminUser as AdminUser;
}

/**
 * Gets admin user from database by email
 */
export async function getAdminUserByEmail(email: string): Promise<AdminUser | null> {
  const supabase = createServiceRoleClient();
  if (!supabase) {
    return null;
  }

  const { data: adminUser, error } = await supabase
    .from("admin_users")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .eq("is_active", true)
    .single();

  if (error || !adminUser) {
    return null;
  }

  return adminUser as AdminUser;
}

/**
 * Updates the last_login_at timestamp for an admin user
 */
export async function updateAdminLastLogin(adminId: string): Promise<void> {
  const supabase = createServiceRoleClient();
  if (!supabase) return;

  await supabase
    .from("admin_users")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", adminId);
}

/**
 * Logs an admin action to the audit log
 */
export async function logAdminAction(
  adminUserId: string,
  action: string,
  options?: {
    targetType?: string;
    targetId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<void> {
  const supabase = createServiceRoleClient();
  if (!supabase) return;

  await supabase.from("admin_audit_log").insert({
    admin_user_id: adminUserId,
    action,
    target_type: options?.targetType || null,
    target_id: options?.targetId || null,
    metadata: options?.metadata || {},
    ip_address: options?.ipAddress || null,
    user_agent: options?.userAgent || null,
  });
}

/**
 * Middleware helper to require admin authentication for API routes
 * Throws an error if not authenticated
 */
export async function requireAdmin(request: NextRequest): Promise<AdminSession> {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) {
    throw new Error("Admin authentication required");
  }

  const session = await parseAdminSession(token);
  if (!session) {
    throw new Error("Invalid admin session");
  }

  // Verify admin is still active
  const adminUser = await verifyAdminSession();
  if (!adminUser) {
    throw new Error("Admin account not found or inactive");
  }

  return session;
}

/**
 * Helper to get client IP from request
 */
export function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Check if current admin has a specific role or higher
 */
export function hasRole(
  adminRole: "super_admin" | "admin" | "support",
  requiredRole: "super_admin" | "admin" | "support"
): boolean {
  const roleHierarchy = {
    super_admin: 3,
    admin: 2,
    support: 1,
  };

  return roleHierarchy[adminRole] >= roleHierarchy[requiredRole];
}

export { type AdminSession } from "./session";
