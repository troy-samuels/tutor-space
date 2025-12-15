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

export function getProviderConfig(provider: CalendarProvider): ProviderConfig | null {
  if (provider === "google") {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URL;

    if (!clientId || !clientSecret || !redirectUri) {
      return null;
    }

    return {
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      userInfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
      // Request the narrowest scope needed: read/write events only (no calendar settings access)
      scopes: ["https://www.googleapis.com/auth/calendar.events"],
      clientId,
      clientSecret,
      redirectUri,
    };
  }

  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const redirectUri = process.env.MICROSOFT_OAUTH_REDIRECT_URL;

  if (!clientId || !clientSecret || !redirectUri) {
    return null;
  }

  return {
    authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    userInfoUrl: "https://graph.microsoft.com/v1.0/me",
    scopes: ["Calendars.ReadWrite", "offline_access"],
    clientId,
    clientSecret,
    redirectUri,
  };
}
