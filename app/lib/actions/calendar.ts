"use server";

import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  SUPPORTED_CALENDAR_PROVIDERS,
  getProviderConfigStatus,
  type CalendarProvider,
} from "@/lib/calendar/config";
import { formatCalendarConfigIssues } from "@/lib/calendar/errors";
import type { CalendarConnectionStatus } from "@/lib/actions/types";

type CalendarConnectionRow = {
  provider: CalendarProvider;
  account_email: string | null;
  account_name: string | null;
  last_synced_at: string | null;
  sync_status: string;
  error_message: string | null;
};

async function requireTutor() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null as null };
  }

  return { supabase, user };
}

export async function listCalendarConnections(): Promise<CalendarConnectionStatus[]> {
  const { supabase, user } = await requireTutor();

  const baseStatuses: CalendarConnectionStatus[] = SUPPORTED_CALENDAR_PROVIDERS.map(
    (provider) => ({
      provider,
      connected: false,
    })
  );

  if (!user) {
    return baseStatuses;
  }

  const { data } = await supabase
    .from("calendar_connections")
    .select("provider, account_email, account_name, last_synced_at, sync_status, error_message")
    .eq("tutor_id", user.id);

  if (!data) {
    return baseStatuses;
  }

  const map = new Map<CalendarProvider, CalendarConnectionRow>();
  for (const row of data as CalendarConnectionRow[]) {
    map.set(row.provider, row);
  }

  return baseStatuses.map((status) => {
    const row = map.get(status.provider);
    if (!row) {
      return status;
    }
    return {
      provider: status.provider,
      connected: true,
      accountEmail: row.account_email,
      accountName: row.account_name,
      lastSyncedAt: row.last_synced_at,
      syncStatus: row.sync_status,
      error: row.error_message,
    };
  });
}

export async function requestCalendarConnection(provider: CalendarProvider, options?: { popup?: boolean }) {
  if (!SUPPORTED_CALENDAR_PROVIDERS.includes(provider)) {
    return { error: "Unsupported calendar provider." };
  }

  const { config, issues } = getProviderConfigStatus(provider, {
    requireEncryptionKey: true,
  });
  if (!config) {
    console.warn("[Calendar OAuth] Provider misconfigured", {
      provider,
      issues: issues.map((issue) => issue.code),
    });
    return { error: formatCalendarConfigIssues(issues.map((issue) => issue.code), provider) };
  }

  const { user } = await requireTutor();
  if (!user) {
    return { error: "Sign in to connect your calendar." };
  }

  // Get the user's email to use as login_hint for OAuth
  const userEmail = user.email;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const isSecureCookie =
    process.env.NODE_ENV === "production" || appUrl.startsWith("https://");

  const stateId = randomUUID();
  // Encode popup mode in state as JSON
  const stateData = {
    id: stateId,
    popup: options?.popup ?? false,
  };
  const state = Buffer.from(JSON.stringify(stateData)).toString("base64");

  const cookieName = `calendar_oauth_state_${provider}`;
  const cookieStore = await cookies();
  cookieStore.set(cookieName, stateId, {
    httpOnly: true,
    secure: isSecureCookie,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  const url = new URL(config.authUrl);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  url.searchParams.set("scope", config.scopes.join(" "));

  // Pre-fill the user's email in the OAuth window
  if (userEmail) {
    url.searchParams.set("login_hint", userEmail);
  }

  if (provider === "google") {
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
    url.searchParams.set("include_granted_scopes", "true");
  } else {
    url.searchParams.set("response_mode", "query");
  }

  return { url: url.toString() };
}

export async function disconnectCalendar(provider: CalendarProvider) {
  const { supabase, user } = await requireTutor();
  if (!user) {
    return { error: "Sign in to manage calendar connections." };
  }

  await supabase
    .from("calendar_connections")
    .delete()
    .eq("tutor_id", user.id)
    .eq("provider", provider);

  return { success: true };
}
