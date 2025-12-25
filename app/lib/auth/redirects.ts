export type UserRole = "tutor" | "student";

const DEFAULT_APP_URL = "https://tutorlingua.co";

export function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL).replace(/\/$/, "");
}

export function sanitizeRedirectPath(
  path: FormDataEntryValue | string | null | undefined
): string | null {
  if (typeof path !== "string") return null;
  const trimmed = path.trim();

  // Require a relative path on this domain
  if (!trimmed.startsWith("/")) return null;
  if (trimmed.startsWith("//")) return null;
  if (trimmed.includes("://")) return null;

  return trimmed || null;
}

export function buildAuthCallbackUrl(nextPath: string) {
  const appUrl = getAppUrl();
  const url = new URL("/auth/callback", appUrl);
  url.searchParams.set("next", nextPath);
  return url.toString();
}

export function buildVerifyEmailUrl(params: {
  role: UserRole;
  email?: string | null;
  next?: string | null;
}) {
  const searchParams = new URLSearchParams();
  searchParams.set("role", params.role);

  if (params.email) {
    searchParams.set("email", params.email);
  }

  if (params.next) {
    searchParams.set("next", params.next);
  }

  const query = searchParams.toString();
  return query ? `/verify-email?${query}` : "/verify-email";
}
