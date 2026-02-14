export const ATTRIBUTION_COOKIE_NAME = "tl_ref";
export const ATTRIBUTION_COOKIE_DAYS = 30;

export type AttributionSource =
  | "invite_link"
  | "practice_assignment"
  | "referral"
  | "directory";

export type AttributionCookie = {
  tutorId: string;
  tutorUsername: string;
  source: string;
  timestamp: number;
};

/**
 * Validates that an unknown value contains the attribution cookie shape.
 *
 * @param value - Unknown parsed payload.
 * @returns `true` when payload shape is valid.
 */
function isAttributionCookie(value: unknown): value is AttributionCookie {
  const candidate = value as Partial<AttributionCookie> | null;
  return Boolean(
    candidate &&
      typeof candidate.tutorId === "string" &&
      candidate.tutorId.length > 0 &&
      typeof candidate.tutorUsername === "string" &&
      candidate.tutorUsername.length > 0 &&
      typeof candidate.source === "string" &&
      candidate.source.length > 0 &&
      typeof candidate.timestamp === "number"
  );
}

/**
 * Builds the serialized cookie value for attribution data.
 *
 * @param value - Attribution payload.
 * @returns Encoded cookie-safe payload.
 */
export function serializeAttributionCookieValue(value: AttributionCookie): string {
  return encodeURIComponent(JSON.stringify(value));
}

/**
 * Parses a serialized attribution cookie value.
 *
 * @param value - Raw cookie string value.
 * @returns Parsed attribution payload or `null`.
 */
export function parseAttributionCookieValue(value: string | null | undefined): AttributionCookie | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as unknown;
    if (!isAttributionCookie(parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Sets the attribution cookie from the browser.
 *
 * @param params - Attribution metadata.
 */
export function setAttributionCookie(params: {
  tutorId: string;
  tutorUsername: string;
  source: AttributionSource;
}): void {
  if (typeof document === "undefined") {
    return;
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + ATTRIBUTION_COOKIE_DAYS);

  const cookieValue = serializeAttributionCookieValue({
    tutorId: params.tutorId,
    tutorUsername: params.tutorUsername,
    source: params.source,
    timestamp: Date.now(),
  });

  document.cookie = `${ATTRIBUTION_COOKIE_NAME}=${cookieValue}; Path=/; Expires=${expiresAt.toUTCString()}; SameSite=Lax; Secure`;
}

/**
 * Reads attribution metadata from the browser cookie jar.
 *
 * @returns Parsed attribution payload or `null`.
 */
export function getAttributionCookie(): AttributionCookie | null {
  if (typeof document === "undefined") {
    return null;
  }

  const allCookies = document.cookie.split(";");
  for (const cookie of allCookies) {
    const [name, ...valueParts] = cookie.trim().split("=");
    if (name !== ATTRIBUTION_COOKIE_NAME) {
      continue;
    }

    return parseAttributionCookieValue(valueParts.join("="));
  }

  return null;
}

/**
 * Clears the attribution cookie from the browser.
 */
export function clearAttributionCookie(): void {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${ATTRIBUTION_COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure`;
}

/**
 * Sets the attribution cookie from a Server Component/Action context.
 *
 * @param params - Attribution metadata.
 */
export async function setServerAttributionCookie(params: {
  tutorId: string;
  tutorUsername: string;
  source: AttributionSource;
}): Promise<void> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + ATTRIBUTION_COOKIE_DAYS);

  cookieStore.set(ATTRIBUTION_COOKIE_NAME, serializeAttributionCookieValue({
    tutorId: params.tutorId,
    tutorUsername: params.tutorUsername,
    source: params.source,
    timestamp: Date.now(),
  }), {
    path: "/",
    expires: expiresAt,
    httpOnly: false,
    secure: true,
    sameSite: "lax",
  });
}

/**
 * Reads the attribution cookie from a Server Component/Action context.
 *
 * @returns Parsed attribution payload or `null`.
 */
export async function getServerAttributionCookie(): Promise<AttributionCookie | null> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(ATTRIBUTION_COOKIE_NAME)?.value;
  return parseAttributionCookieValue(rawValue);
}

/**
 * Clears the attribution cookie from a Server Component/Action context.
 */
export async function clearServerAttributionCookie(): Promise<void> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  cookieStore.set(ATTRIBUTION_COOKIE_NAME, "", {
    path: "/",
    expires: new Date(0),
    httpOnly: false,
    secure: true,
    sameSite: "lax",
  });
}
