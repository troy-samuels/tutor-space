import "server-only";

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const ADMIN_SESSION_COOKIE = "tl_admin_session";
const SESSION_MAX_AGE = 8 * 60 * 60; // 8 hours in seconds

export interface AdminSession {
  adminId: string;
  email: string;
  role: "super_admin" | "admin" | "support";
  fullName: string;
  iat: number;
  exp: number;
}

function getSecretKey(): Uint8Array {
  // SECURITY: ADMIN_SESSION_SECRET must be set explicitly
  // DO NOT fall back to SUPABASE_SERVICE_ROLE_KEY as that key grants full database access
  // and using it for session signing creates a security vulnerability
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "ADMIN_SESSION_SECRET environment variable must be set. " +
        "Generate a secure random string (32+ chars) and add it to your environment."
    );
  }
  // Validate minimum length for security
  if (secret.length < 32) {
    throw new Error(
      "ADMIN_SESSION_SECRET must be at least 32 characters for security"
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createAdminSession(admin: {
  id: string;
  email: string;
  role: "super_admin" | "admin" | "support";
  full_name: string;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const token = await new SignJWT({
    adminId: admin.id,
    email: admin.email,
    role: admin.role,
    fullName: admin.full_name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + SESSION_MAX_AGE)
    .sign(getSecretKey());

  return token;
}

export async function parseAdminSession(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as AdminSession;
  } catch {
    return null;
  }
}

export async function getAdminSessionFromCookies(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return parseAdminSession(token);
}

export async function setAdminSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export { ADMIN_SESSION_COOKIE };
