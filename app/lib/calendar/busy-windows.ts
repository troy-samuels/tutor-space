import "server-only";

import { fromZonedTime } from "date-fns-tz";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { decrypt, encrypt } from "@/lib/utils/crypto";
import { getProviderConfig, type CalendarProvider } from "@/lib/calendar/config";
import type { TimeWindow } from "@/lib/utils/scheduling";

type CalendarConnectionRecord = {
  id: string;
  tutor_id: string;
  provider: CalendarProvider;
  access_token_encrypted: string;
  refresh_token_encrypted: string | null;
  access_token_expires_at: string | null;
  sync_status: string | null;
};

type BusyWindowParams = {
  tutorId: string;
  start?: Date;
  days?: number;
};

const SYNCABLE_STATUSES = new Set(["idle", "healthy", "syncing"]);

export async function getCalendarBusyWindows({
  tutorId,
  start = new Date(),
  days = 14,
}: BusyWindowParams): Promise<TimeWindow[]> {
  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    console.warn("[CalendarBusy] Service role client unavailable; skipping busy-window sync.");
    return [];
  }

  const windowStart = start;
  const windowEnd = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
  const timeMin = windowStart.toISOString();
  const timeMax = windowEnd.toISOString();

  const { data, error } = await adminClient
    .from("calendar_connections")
    .select(
      "id, provider, access_token_encrypted, refresh_token_encrypted, access_token_expires_at, sync_status"
    )
    .eq("tutor_id", tutorId);

  if (error) {
    console.error("[CalendarBusy] Failed to load connections", error);
    return [];
  }

  const windows: TimeWindow[] = [];

  for (const record of (data ?? []) as CalendarConnectionRecord[]) {
    if (record.sync_status && !SYNCABLE_STATUSES.has(record.sync_status)) {
      continue;
    }

    const busy = await fetchBusyWindowsForConnection({
      connection: record,
      adminClient,
      timeMin,
      timeMax,
    });

    if (busy?.length) {
      windows.push(...busy);
    }
  }

  return windows.sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
}

async function fetchBusyWindowsForConnection({
  connection,
  adminClient,
  timeMin,
  timeMax,
}: {
  connection: CalendarConnectionRecord;
  adminClient: SupabaseClient;
  timeMin: string;
  timeMax: string;
}): Promise<TimeWindow[] | null> {
  const accessToken = await ensureFreshAccessToken(connection, adminClient);

  if (!accessToken) {
    return null;
  }

  try {
    let busy: TimeWindow[] | null = null;

    if (connection.provider === "google") {
      busy = await fetchGoogleBusyWindows(accessToken, timeMin, timeMax);
    } else if (connection.provider === "outlook") {
      busy = await fetchOutlookBusyWindows(accessToken, timeMin, timeMax);
    }

    if (busy?.length) {
      await adminClient
        .from("calendar_connections")
        .update({
          last_synced_at: new Date().toISOString(),
          sync_status: "healthy",
          error_message: null,
        })
        .eq("id", connection.id);
    }

    return busy;
  } catch (error) {
    console.error("[CalendarBusy] Failed to fetch busy windows", error);
    await adminClient
      .from("calendar_connections")
      .update({
        sync_status: "error",
        error_message: error instanceof Error ? error.message : "Unable to sync calendar.",
      })
      .eq("id", connection.id);
    return null;
  }
}

async function ensureFreshAccessToken(
  connection: CalendarConnectionRecord,
  adminClient: SupabaseClient
): Promise<string | null> {
  try {
    if (!needsRefresh(connection.access_token_expires_at)) {
      return decrypt(connection.access_token_encrypted);
    }
  } catch (error) {
    console.error("[CalendarBusy] Failed to decrypt access token", error);
    return null;
  }

  if (!connection.refresh_token_encrypted) {
    console.warn("[CalendarBusy] No refresh token available for connection", connection.id);
    return null;
  }

  const config = getProviderConfig(connection.provider);
  if (!config) {
    console.warn("[CalendarBusy] Missing provider config", connection.provider);
    return null;
  }

  let refreshToken: string;
  try {
    refreshToken = decrypt(connection.refresh_token_encrypted);
  } catch (error) {
    console.error("[CalendarBusy] Failed to decrypt refresh token", error);
    return null;
  }

  const payload = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: payload.toString(),
  });

  if (!response.ok) {
    console.error("[CalendarBusy] Refresh token request failed", response.status, connection.id);
    await adminClient
      .from("calendar_connections")
      .update({
        sync_status: "error",
        error_message: `Token refresh failed (${response.status}).`,
      })
      .eq("id", connection.id);
    return null;
  }

  const data = await response.json();
  if (!data?.access_token) {
    console.error("[CalendarBusy] Refresh response missing access token", connection.id);
    return null;
  }

  const updatePayload: Record<string, unknown> = {
    access_token_encrypted: encrypt(data.access_token),
    access_token_expires_at: data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000).toISOString()
      : null,
    sync_status: "healthy",
    error_message: null,
  };

  if (data.refresh_token) {
    updatePayload.refresh_token_encrypted = encrypt(data.refresh_token);
  }

  await adminClient
    .from("calendar_connections")
    .update(updatePayload)
    .eq("id", connection.id);

  return data.access_token as string;
}

function needsRefresh(expiresAt: string | null): boolean {
  if (!expiresAt) {
    return false;
  }
  const threshold = Date.now() + 60_000; // refresh if expiring in the next minute
  return new Date(expiresAt).getTime() <= threshold;
}

async function fetchGoogleBusyWindows(
  accessToken: string,
  timeMin: string,
  timeMax: string
): Promise<TimeWindow[]> {
  const response = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin,
      timeMax,
      items: [{ id: "primary" }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Google freeBusy failed with status ${response.status}`);
  }

  const data = await response.json();
  const busySlots = data?.calendars?.primary?.busy ?? [];

  return busySlots
    .map((slot: { start?: string; end?: string }) => ({
      start: slot.start,
      end: slot.end,
    }))
    .filter((slot): slot is TimeWindow => Boolean(slot.start && slot.end));
}

async function fetchOutlookBusyWindows(
  accessToken: string,
  timeMin: string,
  timeMax: string
): Promise<TimeWindow[]> {
  const url = new URL("https://graph.microsoft.com/v1.0/me/calendarview");
  url.searchParams.set("startDateTime", timeMin);
  url.searchParams.set("endDateTime", timeMax);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Prefer: 'outlook.timezone="UTC"',
    },
  });

  if (!response.ok) {
    throw new Error(`Microsoft calendarView failed with status ${response.status}`);
  }

  const data = await response.json();
  const events = Array.isArray(data?.value) ? data.value : [];

  return events
    .filter((event) => !event?.isCancelled)
    .map((event) => {
      const startIso = graphDateTimeToIso(event?.start);
      const endIso = graphDateTimeToIso(event?.end);
      return startIso && endIso ? { start: startIso, end: endIso } : null;
    })
    .filter((slot): slot is TimeWindow => Boolean(slot));
}

function graphDateTimeToIso(value?: { dateTime?: string; timeZone?: string } | null): string | null {
  if (!value?.dateTime) {
    return null;
  }

  try {
    const zone = value.timeZone && value.timeZone.length > 0 ? value.timeZone : "UTC";
    return fromZonedTime(value.dateTime, zone).toISOString();
  } catch {
    const parsed = Date.parse(value.dateTime);
    return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
  }
}
