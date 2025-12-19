import type { CalendarConfigIssueCode } from "@/lib/calendar/errors";

export const SUPPORTED_CALENDAR_PROVIDERS = ["google", "outlook"] as const;

export type CalendarProvider = (typeof SUPPORTED_CALENDAR_PROVIDERS)[number];

export type ProviderConfig = {
  authUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scopes: string[];
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

export type CalendarConfigIssue = {
  code: CalendarConfigIssueCode;
  detail: string;
};

export type ProviderConfigStatus = {
  config: ProviderConfig | null;
  issues: CalendarConfigIssue[];
};

const GOOGLE_CLIENT_ID_PATTERN = /^[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com$/i;
const MICROSOFT_CLIENT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VALID_REDIRECT_PROTOCOLS = new Set(["http:", "https:"]);

function cleanEnvValue(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.replace(/^['"]|['"]$/g, "");
}

function normalizeUrl(value?: string | null): string | null {
  const cleaned = cleanEnvValue(value);
  if (!cleaned) return null;
  try {
    const parsed = new URL(cleaned);
    if (!VALID_REDIRECT_PROTOCOLS.has(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function stripTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function normalizeAppUrl(): string | null {
  const appUrl = normalizeUrl(process.env.NEXT_PUBLIC_APP_URL);
  if (appUrl) {
    return stripTrailingSlash(appUrl);
  }

  const vercelUrl = cleanEnvValue(process.env.VERCEL_URL);
  if (!vercelUrl) return null;

  const withProtocol = vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`;
  const normalized = normalizeUrl(withProtocol);
  return normalized ? stripTrailingSlash(normalized) : null;
}

function resolveRedirectUri(provider: CalendarProvider): { redirectUri: string | null; issues: CalendarConfigIssue[] } {
  const issues: CalendarConfigIssue[] = [];
  const envRedirect =
    provider === "google"
      ? process.env.GOOGLE_OAUTH_REDIRECT_URL
      : process.env.MICROSOFT_OAUTH_REDIRECT_URL;

  const normalizedEnvRedirect = normalizeUrl(envRedirect);
  if (envRedirect && !normalizedEnvRedirect) {
    issues.push({
      code: "invalid_redirect_uri",
      detail: "OAuth redirect URL is present but not a valid http(s) URL.",
    });
  }

  if (normalizedEnvRedirect) {
    return { redirectUri: normalizedEnvRedirect, issues };
  }

  const baseUrl = normalizeAppUrl();
  if (!baseUrl) return { redirectUri: null, issues };

  const path = provider === "google" ? "/api/calendar/oauth/google" : "/api/calendar/oauth/outlook";
  return { redirectUri: `${baseUrl}${path}`, issues };
}

export function getProviderConfigStatus(
  provider: CalendarProvider,
  options?: { requireEncryptionKey?: boolean }
): ProviderConfigStatus {
  const issues: CalendarConfigIssue[] = [];
  const clientId =
    provider === "google"
      ? cleanEnvValue(process.env.GOOGLE_CLIENT_ID)
      : cleanEnvValue(process.env.MICROSOFT_CLIENT_ID);
  const clientSecret =
    provider === "google"
      ? cleanEnvValue(process.env.GOOGLE_CLIENT_SECRET)
      : cleanEnvValue(process.env.MICROSOFT_CLIENT_SECRET);

  const { redirectUri, issues: redirectIssues } = resolveRedirectUri(provider);
  issues.push(...redirectIssues);

  if (!clientId) {
    issues.push({
      code: "missing_client_id",
      detail: "OAuth client ID is missing.",
    });
  } else if (provider === "google" && !GOOGLE_CLIENT_ID_PATTERN.test(clientId)) {
    issues.push({
      code: "invalid_client_id",
      detail: "Google OAuth client ID does not match expected format.",
    });
  } else if (provider === "outlook" && !MICROSOFT_CLIENT_ID_PATTERN.test(clientId)) {
    issues.push({
      code: "invalid_client_id",
      detail: "Microsoft OAuth client ID does not match expected format.",
    });
  }

  if (!clientSecret) {
    issues.push({
      code: "missing_client_secret",
      detail: "OAuth client secret is missing.",
    });
  }

  if (!redirectUri) {
    issues.push({
      code: "missing_redirect_uri",
      detail: "OAuth redirect URL is missing.",
    });
  }

  if (options?.requireEncryptionKey && !cleanEnvValue(process.env.CALENDAR_TOKEN_ENCRYPTION_KEY)) {
    issues.push({
      code: "missing_encryption_key",
      detail: "CALENDAR_TOKEN_ENCRYPTION_KEY is missing.",
    });
  }

  if (issues.length > 0 || !clientId || !clientSecret || !redirectUri) {
    return { config: null, issues };
  }

  if (provider === "google") {
    return {
      config: {
        authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        userInfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
        // Request the narrowest scope needed: read/write events only (no calendar settings access)
        scopes: ["https://www.googleapis.com/auth/calendar.events"],
        clientId,
        clientSecret,
        redirectUri,
      },
      issues: [],
    };
  }

  return {
    config: {
      authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
      tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      userInfoUrl: "https://graph.microsoft.com/v1.0/me",
      scopes: ["Calendars.ReadWrite", "offline_access"],
      clientId,
      clientSecret,
      redirectUri,
    },
    issues: [],
  };
}

export function getProviderConfig(provider: CalendarProvider): ProviderConfig | null {
  return getProviderConfigStatus(provider).config;
}
