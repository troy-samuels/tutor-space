import "server-only";

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const GATE_COOKIE_NAME = "tl_site_gate";
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

export interface GateSession {
  verified: boolean;
  iat: number;
  exp: number;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.SITE_GATE_SECRET;
  if (!secret) {
    throw new Error(
      "SITE_GATE_SECRET environment variable must be set. " +
        "Generate a secure random string (32+ chars) and add it to your environment."
    );
  }
  if (secret.length < 32) {
    throw new Error(
      "SITE_GATE_SECRET must be at least 32 characters for security"
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createGateSession(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const token = await new SignJWT({
    verified: true,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + SESSION_MAX_AGE)
    .sign(getSecretKey());

  return token;
}

export async function parseGateSession(token: string): Promise<GateSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as GateSession;
  } catch {
    return null;
  }
}

export async function getGateSessionFromCookies(): Promise<GateSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(GATE_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return parseGateSession(token);
}

export async function setGateSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(GATE_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function clearGateSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(GATE_COOKIE_NAME);
}

export { GATE_COOKIE_NAME };

// Verify if the gate password matches
export function verifyGatePassword(password: string): boolean {
  const correctPassword = process.env.SITE_GATE_PASSWORD;
  if (!correctPassword) {
    throw new Error("SITE_GATE_PASSWORD environment variable must be set.");
  }
  return password === correctPassword;
}

// Check if gate is enabled
export function isGateEnabled(): boolean {
  return process.env.SITE_GATE_ENABLED === "true";
}
