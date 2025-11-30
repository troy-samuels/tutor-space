import "server-only";

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const IMPERSONATION_COOKIE = "tl_impersonation";
const IMPERSONATION_MAX_AGE = 60 * 60; // 1 hour in seconds

export interface ImpersonationSession {
  adminId: string;
  adminEmail: string;
  tutorId: string;
  tutorName: string;
  sessionId: string;
  reason: string;
  iat: number;
  exp: number;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new Error("Impersonation secret not configured");
  }
  return new TextEncoder().encode(secret);
}

export async function createImpersonationSession(data: {
  adminId: string;
  adminEmail: string;
  tutorId: string;
  tutorName: string;
  sessionId: string;
  reason: string;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const token = await new SignJWT({
    adminId: data.adminId,
    adminEmail: data.adminEmail,
    tutorId: data.tutorId,
    tutorName: data.tutorName,
    sessionId: data.sessionId,
    reason: data.reason,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + IMPERSONATION_MAX_AGE)
    .sign(getSecretKey());

  return token;
}

export async function parseImpersonationSession(
  token: string
): Promise<ImpersonationSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as ImpersonationSession;
  } catch {
    return null;
  }
}

export async function getImpersonationFromCookies(): Promise<ImpersonationSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(IMPERSONATION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return parseImpersonationSession(token);
}

export async function setImpersonationCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(IMPERSONATION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: IMPERSONATION_MAX_AGE,
    path: "/",
  });
}

export async function clearImpersonationCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(IMPERSONATION_COOKIE);
}

export { IMPERSONATION_COOKIE };
