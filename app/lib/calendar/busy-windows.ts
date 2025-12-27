import "server-only";

import { fromZonedTime } from "date-fns-tz";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { decrypt, encrypt } from "@/lib/utils/crypto";
import { getProviderConfig, type CalendarProvider } from "@/lib/calendar/config";
import type { TimeWindow } from "@/lib/utils/scheduling";
import type { CalendarEvent } from "@/lib/types/calendar";

type CalendarConnectionRecord = {
  id: string;
  tutor_id: string;
  provider: CalendarProvider;
  provider_account_id?: string | null;
  access_token_encrypted: string;
  refresh_token_encrypted: string | null;
  access_token_expires_at: string | null;
  // Legacy fallback during migration
  token_expires_at?: string | null;
  sync_status: string | null;
  sync_enabled?: boolean | null;
  last_synced_at?: string | null;
};

type BusyWindowParams = {
  tutorId: string;
  start?: Date;
  days?: number;
};

const SYNCABLE_STATUSES = new Set(["idle", "healthy", "syncing"]);
const STALE_THRESHOLD_MINUTES = 10;

function isUndefinedColumnError(error: unknown, column: string): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeError = error as { code?: string; message?: string };
  if (maybeError.code !== "42703") return false;
  if (typeof maybeError.message !== "string") return false;
  return maybeError.message.includes(column);
}

function removeColumnFromSelect(select: string, column: string): string {
  return select
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && part !== column)
    .join(", ");
}

async function fetchCalendarConnections(
  adminClient: SupabaseClient,
  tutorId: string,
  select: string
): Promise<{ data: CalendarConnectionRecord[] | null; error: unknown | null }> {
  const primary = await adminClient.from("calendar_connections").select(select).eq("tutor_id", tutorId);
  if (!primary.error) {
    return { data: (primary.data ?? []) as unknown as CalendarConnectionRecord[], error: null };
  }

  if (isUndefinedColumnError(primary.error, "sync_enabled")) {
    const fallbackSelect = removeColumnFromSelect(select, "sync_enabled");
    const fallback = await adminClient
      .from("calendar_connections")
      .select(fallbackSelect)
      .eq("tutor_id", tutorId);

    if (!fallback.error) {
      return { data: (fallback.data ?? []) as unknown as CalendarConnectionRecord[], error: null };
    }
  }

  return { data: null, error: primary.error };
}

type ProviderEventResult = {
  providerEventId: string;
  calendarId?: string | null;
  start: string;
  end: string;
  summary?: string | null;
  status?: string | null;
  recurrenceMasterId?: string | null;
  recurrenceInstanceStart?: string | null;
  isAllDay?: boolean;
};

type BusyWindowResult = {
  windows: TimeWindow[];
  usedCache: boolean;
  hadLiveError: boolean;
  lastSyncedAt: string | null;
};

export async function getCalendarBusyWindows({
  tutorId,
  start = new Date(),
  days = 14,
}: BusyWindowParams): Promise<TimeWindow[]> {
  const result = await getCalendarBusyWindowsWithStatus({ tutorId, start, days });
  return result.windows;
}

export async function getCalendarBusyWindowsWithStatus({
  tutorId,
  start = new Date(),
  days = 14,
}: BusyWindowParams): Promise<{
  windows: TimeWindow[];
  staleProviders: CalendarProvider[];
  unverifiedProviders: CalendarProvider[];
}> {
  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    console.warn("[CalendarBusy] Service role client unavailable; skipping busy-window sync.");
    return { windows: [], staleProviders: [], unverifiedProviders: [] };
  }

  const windowStart = start;
  const windowEnd = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
  const timeMin = windowStart.toISOString();
  const timeMax = windowEnd.toISOString();

  const { data, error } = await fetchCalendarConnections(
    adminClient,
    tutorId,
    "id, provider, provider_account_id, access_token_encrypted, refresh_token_encrypted, access_token_expires_at, token_expires_at, sync_status, sync_enabled, last_synced_at"
  );

  if (error) {
    console.error("[CalendarBusy] Failed to load connections", error);
    return { windows: [], staleProviders: [], unverifiedProviders: [] };
  }

  const windows: TimeWindow[] = [];
  const staleProviders = new Set<CalendarProvider>();
  const unverifiedProviders = new Set<CalendarProvider>();

  for (const record of (data ?? []) as CalendarConnectionRecord[]) {
    if (record.sync_enabled === false) {
      continue;
    }

    if (record.sync_status && !SYNCABLE_STATUSES.has(record.sync_status)) {
      continue;
    }

    const busy = await fetchBusyWindowsForConnection({
      connection: record,
      adminClient,
      timeMin,
      timeMax,
    });

    if (busy.windows.length) {
      windows.push(...busy.windows);
    }

    if (busy.hadLiveError && busy.windows.length === 0) {
      unverifiedProviders.add(record.provider);
      continue;
    }

    if (busy.usedCache && isStale(busy.lastSyncedAt)) {
      staleProviders.add(record.provider);
    }
  }

  return {
    windows: windows.sort((a, b) => Date.parse(a.start) - Date.parse(b.start)),
    staleProviders: Array.from(staleProviders),
    unverifiedProviders: Array.from(unverifiedProviders),
  };
}

function isStale(timestamp: string | null | undefined): boolean {
  if (!timestamp) return true;
  const cutoff = Date.now() - STALE_THRESHOLD_MINUTES * 60_000;
  return new Date(timestamp).getTime() < cutoff;
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
}): Promise<BusyWindowResult> {
  const baseResult: BusyWindowResult = {
    windows: [],
    usedCache: false,
    hadLiveError: false,
    lastSyncedAt: connection.last_synced_at ?? null,
  };

  const accessToken = await ensureFreshAccessToken(connection, adminClient);

  if (!accessToken) {
    const cached = await fetchCachedBusyWindows({ adminClient, connection, timeMin, timeMax });
    return {
      ...baseResult,
      windows: cached,
      usedCache: true,
      hadLiveError: true,
    };
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

    return {
      ...baseResult,
      windows: busy ?? [],
      usedCache: false,
      hadLiveError: false,
      lastSyncedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[CalendarBusy] Failed to fetch busy windows", error);
    await adminClient
      .from("calendar_connections")
      .update({
        sync_status: "error",
        error_message: error instanceof Error ? error.message : "Unable to sync calendar.",
      })
      .eq("id", connection.id);

    const cached = await fetchCachedBusyWindows({ adminClient, connection, timeMin, timeMax });
    return {
      ...baseResult,
      windows: cached,
      usedCache: true,
      hadLiveError: true,
    };
  }
}

async function ensureFreshAccessToken(
  connection: CalendarConnectionRecord,
  adminClient: SupabaseClient
): Promise<string | null> {
  try {
    const expiresAt = connection.access_token_expires_at ?? connection.token_expires_at ?? null;

    if (!needsRefresh(expiresAt)) {
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
  const windows: TimeWindow[] = [];
  let pageToken: string | undefined;

  do {
    // Use events.list so calendar.events scope (events-only) is sufficient
    const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
    url.searchParams.set("timeMin", timeMin);
    url.searchParams.set("timeMax", timeMax);
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("orderBy", "startTime");
    url.searchParams.set("showDeleted", "false");
    url.searchParams.set("maxResults", "2500"); // high cap to minimize pagination
    url.searchParams.set(
      "fields",
      "items(id,start,end,status,transparency),nextPageToken"
    );

    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Google events failed with status ${response.status}`);
    }

    const data = await response.json();
    const items = Array.isArray(data?.items) ? data.items : [];

    for (const item of items as Array<{
      id?: string;
      start?: { dateTime?: string; date?: string };
      end?: { dateTime?: string; date?: string };
      status?: string;
      transparency?: string;
    }>) {
      if (item.status === "cancelled") continue;
      if (item.transparency === "transparent") continue; // treat free blocks as available

      const startIso = googleDateToIso(item.start);
      const endIso = googleDateToIso(item.end);
      if (!startIso || !endIso) continue;

      windows.push({ start: startIso, end: endIso });
    }

    pageToken = typeof data?.nextPageToken === "string" ? data.nextPageToken : undefined;
  } while (pageToken);

  return windows;
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
    .filter((event: { isCancelled?: boolean }) => !event?.isCancelled)
    .map((event: any) => {
      const startIso = graphDateTimeToIso(event?.start);
      const endIso = graphDateTimeToIso(event?.end);
      return startIso && endIso ? { start: startIso, end: endIso } : null;
    })
    .filter((slot: TimeWindow | null): slot is TimeWindow => Boolean(slot));
}

async function fetchCachedBusyWindows({
  adminClient,
  connection,
  timeMin,
  timeMax,
}: {
  adminClient: SupabaseClient;
  connection: CalendarConnectionRecord;
  timeMin: string;
  timeMax: string;
}): Promise<TimeWindow[]> {
  const { data, error } = await adminClient
    .from("calendar_events")
    .select("start_at, end_at")
    .eq("tutor_id", connection.tutor_id)
    .eq("provider", connection.provider)
    .is("deleted_at", null)
    .gte("start_at", timeMin)
    .lte("end_at", timeMax)
    .order("start_at", { ascending: true });

  if (error) {
    console.error("[CalendarBusy] Failed to load cached busy windows", error);
    return [];
  }

  return (data ?? [])
    .map((row: { start_at?: string | null; end_at?: string | null }) =>
      row.start_at && row.end_at
        ? {
            start: row.start_at,
            end: row.end_at,
          }
        : null
    )
    .filter((slot: TimeWindow | null): slot is TimeWindow => Boolean(slot));
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

function googleDateToIso(value?: { dateTime?: string; date?: string } | null): string | null {
  const raw = value?.dateTime || value?.date;
  if (!raw) {
    return null;
  }

  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
}

// Calendar event creation params
export type CreateCalendarEventParams = {
  tutorId: string;
  bookingId?: string;
  title: string;
  start: string; // ISO datetime
  end: string; // ISO datetime
  description?: string;
  studentEmail?: string;
  timezone?: string; // IANA timezone (e.g., "America/New_York")
  forceCreate?: boolean;
};

/**
 * Create a calendar event on the tutor's connected calendar(s)
 * Called after a booking is confirmed/paid to sync the event
 */
export async function createCalendarEventForBooking(
  params: CreateCalendarEventParams
): Promise<{ success: boolean; error?: string }> {
  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    console.warn("[CalendarEvent] Service role client unavailable.");
    return { success: false, error: "Service unavailable" };
  }

  if (params.bookingId && !params.forceCreate) {
    const { data: existing, error: existingError } = await adminClient
      .from("calendar_events")
      .select("id")
      .eq("tutor_id", params.tutorId)
      .eq("booking_id", params.bookingId)
      .is("deleted_at", null)
      .limit(1);

    if (existingError) {
      console.error("[CalendarEvent] Failed to check existing booking events", existingError);
    } else if (existing && existing.length > 0) {
      return { success: true };
    }

    const { data: legacyMatch, error: legacyError } = await adminClient
      .from("calendar_events")
      .select("id")
      .eq("tutor_id", params.tutorId)
      .is("booking_id", null)
      .is("deleted_at", null)
      .eq("start_at", params.start)
      .eq("end_at", params.end)
      .ilike("summary", `${params.title}%`)
      .limit(1);

    if (legacyError) {
      console.error("[CalendarEvent] Failed to check legacy events", legacyError);
    } else if (legacyMatch && legacyMatch.length > 0) {
      const nowIso = new Date().toISOString();
      const { error: linkError } = await adminClient
        .from("calendar_events")
        .update({ booking_id: params.bookingId, updated_at: nowIso })
        .eq("id", legacyMatch[0].id);

      if (linkError) {
        console.error("[CalendarEvent] Failed to link legacy event", linkError);
      }

      return { success: true };
    }
  }

  const { data, error } = await fetchCalendarConnections(
    adminClient,
    params.tutorId,
    "id, provider, provider_account_id, access_token_encrypted, refresh_token_encrypted, access_token_expires_at, token_expires_at, sync_status, sync_enabled"
  );

  if (error || !data || data.length === 0) {
    console.log("[CalendarEvent] No calendar connections for tutor", params.tutorId);
    return { success: true }; // Not an error - just no calendar connected
  }

  let created = false;
  let lastError: string | undefined;
  const eventsToPersist: Array<{
    provider: CalendarProvider;
    providerAccountId: string | null;
    providerEventId: string;
    calendarId: string | null;
    start: string;
    end: string;
    summary: string | null;
    status: string | null;
    recurrenceMasterId: string | null;
    recurrenceInstanceStart: string | null;
    isAllDay: boolean;
  }> = [];

  for (const record of data as CalendarConnectionRecord[]) {
    if (record.sync_enabled === false) {
      continue;
    }

    if (record.sync_status && !SYNCABLE_STATUSES.has(record.sync_status)) {
      continue;
    }

    const accessToken = await ensureFreshAccessToken(record, adminClient);
    if (!accessToken) {
      lastError = "Failed to get access token";
      continue;
    }

    try {
      let createdEvent: ProviderEventResult | null = null;

      if (record.provider === "google") {
        createdEvent = await createGoogleCalendarEvent(accessToken, params);
        console.log(`✅ Created Google calendar event for tutor ${params.tutorId}`);
      } else if (record.provider === "outlook") {
        createdEvent = await createOutlookCalendarEvent(accessToken, params);
        console.log(`✅ Created Outlook calendar event for tutor ${params.tutorId}`);
      }

      if (createdEvent) {
        created = true;
        eventsToPersist.push({
          provider: record.provider,
          providerAccountId: record.provider_account_id ?? null,
          providerEventId: createdEvent.providerEventId,
          calendarId: createdEvent.calendarId ?? "primary",
          start: createdEvent.start,
          end: createdEvent.end,
          summary: createdEvent.summary ?? params.title ?? null,
          status: createdEvent.status ?? "confirmed",
          recurrenceMasterId: createdEvent.recurrenceMasterId ?? null,
          recurrenceInstanceStart:
            createdEvent.recurrenceInstanceStart ?? createdEvent.start ?? null,
          isAllDay: createdEvent.isAllDay ?? false,
        });

        await adminClient
          .from("calendar_connections")
          .update({
            sync_status: "healthy",
            last_synced_at: new Date().toISOString(),
            error_message: null,
          })
          .eq("id", record.id);
      }
    } catch (err) {
      console.error(`[CalendarEvent] Failed to create ${record.provider} event:`, err);
      lastError = err instanceof Error ? err.message : "Failed to create event";

      // Update connection status on error
      await adminClient
        .from("calendar_connections")
        .update({
          sync_status: "error",
          error_message: lastError,
        })
        .eq("id", record.id);
    }
  }

  if (eventsToPersist.length > 0) {
    const nowIso = new Date().toISOString();
      const upsertPayload = eventsToPersist.map((evt) => ({
        tutor_id: params.tutorId,
        booking_id: params.bookingId ?? null,
        provider: evt.provider,
        provider_account_id: evt.providerAccountId,
        provider_event_id: evt.providerEventId,
      calendar_id: evt.calendarId,
      recurrence_master_id: evt.recurrenceMasterId,
      recurrence_instance_start: evt.recurrenceInstanceStart,
      start_at: evt.start,
      end_at: evt.end,
      summary: evt.summary,
      status: evt.status ?? "confirmed",
      is_all_day: evt.isAllDay,
      deleted_at: null,
      last_seen_at: nowIso,
      updated_at: nowIso,
    }));

    const { error: persistError } = await adminClient.from("calendar_events").upsert(upsertPayload);
    if (persistError) {
      console.error("[CalendarEvent] Failed to persist created events", persistError);
    }
  }

  if (created) {
    return { success: true };
  }

  return { success: false, error: lastError || "No calendar to create event in" };
}

type BookingCalendarEventRecord = {
  id: string;
  provider: CalendarProvider;
  provider_account_id?: string | null;
  provider_event_id: string;
  calendar_id?: string | null;
};

type ProviderUpdateResult =
  | { event: ProviderEventResult }
  | { notFound: true };

type ProviderDeleteResult =
  | { deleted: true }
  | { notFound: true };

export async function updateCalendarEventForBooking(
  params: CreateCalendarEventParams & {
    bookingId: string;
    createIfMissing?: boolean;
    previousStart?: string;
    previousEnd?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    console.warn("[CalendarEvent] Service role client unavailable.");
    return { success: false, error: "Service unavailable" };
  }

  const { data: existingEvents, error: existingError } = await adminClient
    .from("calendar_events")
    .select("id, provider, provider_account_id, provider_event_id, calendar_id")
    .eq("tutor_id", params.tutorId)
    .eq("booking_id", params.bookingId)
    .is("deleted_at", null);

  if (existingError) {
    console.error("[CalendarEvent] Failed to load booking events", existingError);
    return { success: false, error: "Failed to load calendar events" };
  }

  const nowIso = new Date().toISOString();
  let resolvedEvents = (existingEvents as BookingCalendarEventRecord[] | null) ?? [];

  if (
    resolvedEvents.length === 0 &&
    params.previousStart &&
    params.previousEnd
  ) {
    const { data: legacyEvents, error: legacyError } = await adminClient
      .from("calendar_events")
      .select("id, provider, provider_account_id, provider_event_id, calendar_id")
      .eq("tutor_id", params.tutorId)
      .is("booking_id", null)
      .is("deleted_at", null)
      .eq("start_at", params.previousStart)
      .eq("end_at", params.previousEnd)
      .ilike("summary", `${params.title}%`);

    if (legacyError) {
      console.error("[CalendarEvent] Failed to load legacy booking events", legacyError);
    } else if (legacyEvents && legacyEvents.length > 0) {
      await adminClient
        .from("calendar_events")
        .update({ booking_id: params.bookingId, updated_at: nowIso })
        .in("id", legacyEvents.map((event) => event.id));
      resolvedEvents = legacyEvents as BookingCalendarEventRecord[];
    }
  }

  if (resolvedEvents.length === 0) {
    if (params.createIfMissing) {
      const { createIfMissing, previousStart, previousEnd, ...createParams } = params;
      return createCalendarEventForBooking({ ...createParams, forceCreate: true });
    }
    return { success: true };
  }

  const { data: connections, error: connectionsError } = await fetchCalendarConnections(
    adminClient,
    params.tutorId,
    "id, provider, provider_account_id, access_token_encrypted, refresh_token_encrypted, access_token_expires_at, token_expires_at, sync_status, sync_enabled"
  );

  if (connectionsError || !connections) {
    console.error("[CalendarEvent] Failed to load calendar connections", connectionsError);
    return { success: false, error: "Failed to load calendar connections" };
  }

  let updatedAny = false;
  let lastError: string | undefined;

  for (const record of resolvedEvents as BookingCalendarEventRecord[]) {
    const connection =
      connections.find(
        (item) =>
          item.provider === record.provider &&
          (item.provider_account_id ?? null) === (record.provider_account_id ?? null)
      ) ?? connections.find((item) => item.provider === record.provider);

    if (!connection || connection.sync_enabled === false || (connection.sync_status && !SYNCABLE_STATUSES.has(connection.sync_status))) {
      await adminClient
        .from("calendar_events")
        .update({
          status: "cancelled",
          deleted_at: nowIso,
          updated_at: nowIso,
        })
        .eq("id", record.id);
      updatedAny = true;
      continue;
    }

    const accessToken = await ensureFreshAccessToken(connection, adminClient);
    if (!accessToken) {
      lastError = "Failed to get access token";
      continue;
    }

    try {
      let updatedEvent: ProviderUpdateResult | null = null;
      if (record.provider === "google") {
        updatedEvent = await updateGoogleCalendarEvent(
          accessToken,
          record,
          params
        );
      } else if (record.provider === "outlook") {
        updatedEvent = await updateOutlookCalendarEvent(
          accessToken,
          record,
          params
        );
      }

      if (!updatedEvent) {
        continue;
      }

      if ("notFound" in updatedEvent) {
        if (params.createIfMissing) {
          const recreated = await recreateProviderEvent(connection, params);
          if (recreated) {
            updatedAny = true;
            await adminClient
              .from("calendar_events")
              .update({
                provider_event_id: recreated.providerEventId,
                calendar_id: recreated.calendarId ?? record.calendar_id ?? null,
                start_at: recreated.start,
                end_at: recreated.end,
                summary: recreated.summary ?? params.title ?? null,
                status: recreated.status ?? "confirmed",
                recurrence_master_id: recreated.recurrenceMasterId ?? null,
                recurrence_instance_start: recreated.recurrenceInstanceStart ?? recreated.start ?? null,
                is_all_day: recreated.isAllDay ?? false,
                deleted_at: null,
                last_seen_at: nowIso,
                updated_at: nowIso,
              })
              .eq("id", record.id);

            await adminClient
              .from("calendar_connections")
              .update({
                sync_status: "healthy",
                last_synced_at: nowIso,
                error_message: null,
              })
              .eq("id", connection.id);
          } else {
            await adminClient
              .from("calendar_events")
              .update({
                status: "cancelled",
                deleted_at: nowIso,
                updated_at: nowIso,
              })
              .eq("id", record.id);
          }
        } else {
          await adminClient
            .from("calendar_events")
            .update({
              status: "cancelled",
              deleted_at: nowIso,
              updated_at: nowIso,
            })
            .eq("id", record.id);
        }
        continue;
      }

      const event = updatedEvent.event;
      updatedAny = true;
      await adminClient
        .from("calendar_events")
        .update({
          start_at: event.start,
          end_at: event.end,
          summary: event.summary ?? params.title ?? null,
          status: event.status ?? "confirmed",
          deleted_at: null,
          last_seen_at: nowIso,
          updated_at: nowIso,
        })
        .eq("id", record.id);

      await adminClient
        .from("calendar_connections")
        .update({
          sync_status: "healthy",
          last_synced_at: nowIso,
          error_message: null,
        })
        .eq("id", connection.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update event";
      lastError = message;
      console.error("[CalendarEvent] Failed to update booking event:", err);
      await adminClient
        .from("calendar_connections")
        .update({
          sync_status: "error",
          error_message: message,
        })
        .eq("id", connection.id);
    }
  }

  if (updatedAny) {
    return { success: true };
  }

  return { success: false, error: lastError || "No calendar events updated" };
}

export async function deleteCalendarEventsForBooking(params: {
  tutorId: string;
  bookingId: string;
  match?: {
    title?: string;
    start?: string;
    end?: string;
  };
}): Promise<{ success: boolean; error?: string }> {
  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    console.warn("[CalendarEvent] Service role client unavailable.");
    return { success: false, error: "Service unavailable" };
  }

  const { data: existingEvents, error: existingError } = await adminClient
    .from("calendar_events")
    .select("id, provider, provider_account_id, provider_event_id, calendar_id")
    .eq("tutor_id", params.tutorId)
    .eq("booking_id", params.bookingId)
    .is("deleted_at", null);

  if (existingError) {
    console.error("[CalendarEvent] Failed to load booking events", existingError);
    return { success: false, error: "Failed to load calendar events" };
  }

  const nowIso = new Date().toISOString();
  let resolvedEvents = (existingEvents as BookingCalendarEventRecord[] | null) ?? [];

  if (
    resolvedEvents.length === 0 &&
    params.match?.start &&
    params.match?.end &&
    params.match?.title
  ) {
    const { data: legacyEvents, error: legacyError } = await adminClient
      .from("calendar_events")
      .select("id, provider, provider_account_id, provider_event_id, calendar_id")
      .eq("tutor_id", params.tutorId)
      .is("booking_id", null)
      .is("deleted_at", null)
      .eq("start_at", params.match.start)
      .eq("end_at", params.match.end)
      .ilike("summary", `${params.match.title}%`);

    if (legacyError) {
      console.error("[CalendarEvent] Failed to load legacy booking events", legacyError);
    } else if (legacyEvents && legacyEvents.length > 0) {
      await adminClient
        .from("calendar_events")
        .update({ booking_id: params.bookingId, updated_at: nowIso })
        .in("id", legacyEvents.map((event) => event.id));
      resolvedEvents = legacyEvents as BookingCalendarEventRecord[];
    }
  }

  if (resolvedEvents.length === 0) {
    return { success: true };
  }

  const { data: connections, error: connectionsError } = await fetchCalendarConnections(
    adminClient,
    params.tutorId,
    "id, provider, provider_account_id, access_token_encrypted, refresh_token_encrypted, access_token_expires_at, token_expires_at, sync_status, sync_enabled"
  );

  if (connectionsError || !connections) {
    console.error("[CalendarEvent] Failed to load calendar connections", connectionsError);
    return { success: false, error: "Failed to load calendar connections" };
  }

  let deletedAny = false;
  let lastError: string | undefined;

  for (const record of resolvedEvents as BookingCalendarEventRecord[]) {
    const connection =
      connections.find(
        (item) =>
          item.provider === record.provider &&
          (item.provider_account_id ?? null) === (record.provider_account_id ?? null)
      ) ?? connections.find((item) => item.provider === record.provider);

    if (!connection || connection.sync_enabled === false || (connection.sync_status && !SYNCABLE_STATUSES.has(connection.sync_status))) {
      await adminClient
        .from("calendar_events")
        .update({
          status: "cancelled",
          deleted_at: nowIso,
          updated_at: nowIso,
        })
        .eq("id", record.id);
      deletedAny = true;
      continue;
    }

    const accessToken = await ensureFreshAccessToken(connection, adminClient);
    if (!accessToken) {
      lastError = "Failed to get access token";
      continue;
    }

    try {
      let deleteResult: ProviderDeleteResult | null = null;
      if (record.provider === "google") {
        deleteResult = await deleteGoogleCalendarEvent(
          accessToken,
          record
        );
      } else if (record.provider === "outlook") {
        deleteResult = await deleteOutlookCalendarEvent(
          accessToken,
          record
        );
      }

      if (!deleteResult) {
        continue;
      }

      deletedAny = true;
      await adminClient
        .from("calendar_events")
        .update({
          status: "cancelled",
          deleted_at: nowIso,
          updated_at: nowIso,
        })
        .eq("id", record.id);

      await adminClient
        .from("calendar_connections")
        .update({
          sync_status: "healthy",
          last_synced_at: nowIso,
          error_message: null,
        })
        .eq("id", connection.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete event";
      lastError = message;
      console.error("[CalendarEvent] Failed to delete booking event:", err);
      await adminClient
        .from("calendar_connections")
        .update({
          sync_status: "error",
          error_message: message,
        })
        .eq("id", connection.id);
    }
  }

  if (deletedAny) {
    return { success: true };
  }

  return { success: false, error: lastError || "No calendar events deleted" };
}

async function recreateProviderEvent(
  connection: CalendarConnectionRecord,
  params: CreateCalendarEventParams & { bookingId: string }
): Promise<ProviderEventResult | null> {
  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    return null;
  }

  const accessToken = await ensureFreshAccessToken(connection, adminClient);
  if (!accessToken) {
    return null;
  }

  if (connection.provider === "google") {
    return createGoogleCalendarEvent(accessToken, params);
  }

  if (connection.provider === "outlook") {
    return createOutlookCalendarEvent(accessToken, params);
  }

  return null;
}

async function updateGoogleCalendarEvent(
  accessToken: string,
  record: BookingCalendarEventRecord,
  params: CreateCalendarEventParams
): Promise<ProviderUpdateResult> {
  const eventTimezone = params.timezone || "UTC";
  const event = {
    summary: params.title,
    description: params.description || "Booked via TutorLingua",
    start: {
      dateTime: params.start,
      timeZone: eventTimezone,
    },
    end: {
      dateTime: params.end,
      timeZone: eventTimezone,
    },
    attendees: params.studentEmail ? [{ email: params.studentEmail }] : undefined,
    reminders: {
      useDefault: true,
    },
  };

  const calendarId = record.calendar_id || "primary";
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(record.provider_event_id)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  if (response.status === 404 || response.status === 410) {
    return { notFound: true };
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Calendar API error ${response.status}: ${errorText}`);
  }

  const eventData = await response.json();
  const startIso = eventData?.start?.dateTime || eventData?.start?.date;
  const endIso = eventData?.end?.dateTime || eventData?.end?.date;

  if (!eventData?.id || !startIso || !endIso) {
    throw new Error("Google Calendar API response missing event data");
  }

  return {
    event: {
      providerEventId: eventData.id as string,
      calendarId: eventData?.organizer?.email ?? calendarId,
      start: new Date(startIso).toISOString(),
      end: new Date(endIso).toISOString(),
      summary: eventData?.summary ?? params.title ?? null,
      status: eventData?.status ?? "confirmed",
      recurrenceMasterId: eventData?.recurringEventId ?? null,
      recurrenceInstanceStart:
        eventData?.originalStartTime?.dateTime ||
        eventData?.originalStartTime?.date ||
        startIso,
      isAllDay: Boolean(eventData?.start?.date && !eventData?.start?.dateTime),
    },
  };
}

async function updateOutlookCalendarEvent(
  accessToken: string,
  record: BookingCalendarEventRecord,
  params: CreateCalendarEventParams
): Promise<ProviderUpdateResult> {
  const eventTimezone = params.timezone || "UTC";
  const event = {
    subject: params.title,
    body: {
      contentType: "text",
      content: params.description || "Booked via TutorLingua",
    },
    start: {
      dateTime: params.start,
      timeZone: eventTimezone,
    },
    end: {
      dateTime: params.end,
      timeZone: eventTimezone,
    },
  };

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/events/${encodeURIComponent(record.provider_event_id)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  if (response.status === 404 || response.status === 410) {
    return { notFound: true };
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Microsoft Graph API error ${response.status}: ${errorText}`);
  }

  const eventData = await response.json();
  const startIso = graphDateTimeToIso(eventData?.start);
  const endIso = graphDateTimeToIso(eventData?.end);

  if (!eventData?.id || !startIso || !endIso) {
    throw new Error("Microsoft Graph API response missing event data");
  }

  return {
    event: {
      providerEventId: eventData.id as string,
      calendarId: null,
      start: startIso,
      end: endIso,
      summary: eventData?.subject ?? params.title ?? null,
      status: eventData?.status ?? "confirmed",
      recurrenceMasterId: eventData?.seriesMasterId ?? null,
      recurrenceInstanceStart: startIso,
      isAllDay: Boolean(eventData?.isAllDay),
    },
  };
}

async function deleteGoogleCalendarEvent(
  accessToken: string,
  record: BookingCalendarEventRecord
): Promise<ProviderDeleteResult> {
  const calendarId = record.calendar_id || "primary";
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(record.provider_event_id)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (response.status === 404 || response.status === 410) {
    return { notFound: true };
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Calendar API error ${response.status}: ${errorText}`);
  }

  return { deleted: true };
}

async function deleteOutlookCalendarEvent(
  accessToken: string,
  record: BookingCalendarEventRecord
): Promise<ProviderDeleteResult> {
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/events/${encodeURIComponent(record.provider_event_id)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (response.status === 404 || response.status === 410) {
    return { notFound: true };
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Microsoft Graph API error ${response.status}: ${errorText}`);
  }

  return { deleted: true };
}

async function createGoogleCalendarEvent(
  accessToken: string,
  params: CreateCalendarEventParams
): Promise<ProviderEventResult> {
  // Use the provided timezone or default to UTC
  const eventTimezone = params.timezone || "UTC";

  const event = {
    summary: params.title,
    description: params.description || "Booked via TutorLingua",
    start: {
      dateTime: params.start,
      timeZone: eventTimezone,
    },
    end: {
      dateTime: params.end,
      timeZone: eventTimezone,
    },
    attendees: params.studentEmail ? [{ email: params.studentEmail }] : undefined,
    reminders: {
      useDefault: true,
    },
  };

  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Calendar API error ${response.status}: ${errorText}`);
  }

  const eventData = await response.json();
  const startIso = eventData?.start?.dateTime || eventData?.start?.date;
  const endIso = eventData?.end?.dateTime || eventData?.end?.date;

  if (!eventData?.id || !startIso || !endIso) {
    throw new Error("Google Calendar API response missing event data");
  }

  return {
    providerEventId: eventData.id as string,
    calendarId: eventData?.organizer?.email ?? "primary",
    start: new Date(startIso).toISOString(),
    end: new Date(endIso).toISOString(),
    summary: eventData?.summary ?? params.title ?? null,
    status: eventData?.status ?? "confirmed",
    recurrenceMasterId: eventData?.recurringEventId ?? null,
    recurrenceInstanceStart:
      eventData?.originalStartTime?.dateTime ||
      eventData?.originalStartTime?.date ||
      startIso,
    isAllDay: Boolean(eventData?.start?.date && !eventData?.start?.dateTime),
  };
}

async function createOutlookCalendarEvent(
  accessToken: string,
  params: CreateCalendarEventParams
): Promise<ProviderEventResult> {
  // Use the provided timezone or default to UTC
  const eventTimezone = params.timezone || "UTC";

  const event = {
    subject: params.title,
    body: {
      contentType: "text",
      content: params.description || "Booked via TutorLingua",
    },
    start: {
      dateTime: params.start,
      timeZone: eventTimezone,
    },
    end: {
      dateTime: params.end,
      timeZone: eventTimezone,
    },
    attendees: params.studentEmail
      ? [
          {
            emailAddress: { address: params.studentEmail },
            type: "required",
          },
        ]
      : undefined,
    isReminderOn: true,
    reminderMinutesBeforeStart: 30,
  };

  const response = await fetch(
    "https://graph.microsoft.com/v1.0/me/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Microsoft Graph API error ${response.status}: ${errorText}`);
  }

  const eventData = await response.json();
  const startIso = graphDateTimeToIso(eventData?.start);
  const endIso = graphDateTimeToIso(eventData?.end);

  if (!eventData?.id || !startIso || !endIso) {
    throw new Error("Microsoft Graph API response missing event data");
  }

  return {
    providerEventId: eventData.id as string,
    calendarId: eventData?.calendarId ?? null,
    start: startIso,
    end: endIso,
    summary: eventData?.subject ?? params.title ?? null,
    status: eventData?.status ?? "confirmed",
    recurrenceMasterId: eventData?.seriesMasterId ?? null,
    recurrenceInstanceStart: startIso,
    isAllDay: eventData?.isAllDay === true,
  };
}

// New function to get calendar events WITH details (title, source, etc.)
export async function getCalendarEventsWithDetails({
  tutorId,
  start = new Date(),
  days = 14,
}: BusyWindowParams): Promise<CalendarEvent[]> {
  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    console.warn("[CalendarEvents] Service role client unavailable.");
    return [];
  }

  const windowStart = start;
  const windowEnd = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
  const timeMin = windowStart.toISOString();
  const timeMax = windowEnd.toISOString();

  const { data, error } = await fetchCalendarConnections(
    adminClient,
    tutorId,
    "id, provider, provider_account_id, access_token_encrypted, refresh_token_encrypted, access_token_expires_at, token_expires_at, sync_status, sync_enabled"
  );

  if (error) {
    console.error("[CalendarEvents] Failed to load connections", error);
    return [];
  }

  const events: CalendarEvent[] = [];

  for (const record of (data ?? []) as CalendarConnectionRecord[]) {
    if (record.sync_enabled === false) {
      continue;
    }

    if (record.sync_status && !SYNCABLE_STATUSES.has(record.sync_status)) {
      continue;
    }

    const connectionEvents = await fetchEventsForConnection({
      connection: record,
      adminClient,
      timeMin,
      timeMax,
    });

    if (connectionEvents?.length) {
      events.push(...connectionEvents);
    }
  }

  return events.sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
}

async function fetchEventsForConnection({
  connection,
  adminClient,
  timeMin,
  timeMax,
}: {
  connection: CalendarConnectionRecord;
  adminClient: SupabaseClient;
  timeMin: string;
  timeMax: string;
}): Promise<CalendarEvent[]> {
  const accessToken = await ensureFreshAccessToken(connection, adminClient);

  if (!accessToken) {
    return fetchCachedEvents({
      adminClient,
      tutorId: connection.tutor_id,
      provider: connection.provider,
      timeMin,
      timeMax,
    });
  }

  try {
    let events: CalendarEvent[] | null = null;

    if (connection.provider === "google") {
      events = await fetchGoogleEvents(accessToken, timeMin, timeMax);
    } else if (connection.provider === "outlook") {
      events = await fetchOutlookEvents(accessToken, timeMin, timeMax);
    }

    if (events?.length) {
      await adminClient
        .from("calendar_connections")
        .update({
          last_synced_at: new Date().toISOString(),
          sync_status: "healthy",
          error_message: null,
        })
        .eq("id", connection.id);

      await persistFetchedEvents({
        adminClient,
        tutorId: connection.tutor_id,
        provider: connection.provider,
        providerAccountId: connection.provider_account_id ?? null,
        events,
      });
    }

    return events ?? [];
  } catch (error) {
    console.error("[CalendarEvents] Failed to fetch events", error);
    await adminClient
      .from("calendar_connections")
      .update({
        sync_status: "error",
        error_message: error instanceof Error ? error.message : "Unable to sync calendar.",
      })
      .eq("id", connection.id);

    return fetchCachedEvents({
      adminClient,
      tutorId: connection.tutor_id,
      provider: connection.provider,
      timeMin,
      timeMax,
    });
  }
}

async function fetchGoogleEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string
): Promise<CalendarEvent[]> {
  const events: CalendarEvent[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
    url.searchParams.set("timeMin", timeMin);
    url.searchParams.set("timeMax", timeMax);
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("orderBy", "startTime");
    url.searchParams.set("showDeleted", "false");
    url.searchParams.set("maxResults", "2500");
    url.searchParams.set(
      "fields",
      "items(id,summary,start,end,status,transparency),nextPageToken"
    );

    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Google events failed with status ${response.status}`);
    }

    const data = await response.json();
    const items = Array.isArray(data?.items) ? data.items : [];

    for (const item of items as Array<{
      id?: string;
      summary?: string;
      start?: { dateTime?: string; date?: string };
      end?: { dateTime?: string; date?: string };
      status?: string;
      transparency?: string;
    }>) {
      if (item.status === "cancelled") continue;
      if (item.transparency === "transparent") continue;

      const startIso = googleDateToIso(item.start);
      const endIso = googleDateToIso(item.end);
      if (!startIso || !endIso) continue;

      events.push({
        id: `google-${item.id}`,
        title: item.summary || "Busy",
        start: startIso,
        end: endIso,
        type: "google" as const,
        source: "Google Calendar",
        packageType: "external" as const,
      });
    }

    pageToken = typeof data?.nextPageToken === "string" ? data.nextPageToken : undefined;
  } while (pageToken);

  return events;
}

async function fetchOutlookEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string
): Promise<CalendarEvent[]> {
  const url = new URL("https://graph.microsoft.com/v1.0/me/calendarview");
  url.searchParams.set("startDateTime", timeMin);
  url.searchParams.set("endDateTime", timeMax);
  url.searchParams.set("$select", "id,subject,start,end,isCancelled");

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
    .filter((event: { isCancelled?: boolean }) => !event?.isCancelled)
    .map((event: {
      id?: string;
      subject?: string;
      start?: { dateTime?: string; timeZone?: string };
      end?: { dateTime?: string; timeZone?: string };
    }) => {
      const startIso = graphDateTimeToIso(event?.start);
      const endIso = graphDateTimeToIso(event?.end);

      if (!startIso || !endIso) return null;

      return {
        id: `outlook-${event.id}`,
        title: event.subject || "Busy",
        start: startIso,
        end: endIso,
        type: "outlook" as const,
        source: "Outlook Calendar",
        packageType: "external" as const,
      };
    })
    .filter((event: CalendarEvent | null): event is CalendarEvent => event !== null);
}

async function fetchCachedEvents({
  adminClient,
  tutorId,
  provider,
  timeMin,
  timeMax,
}: {
  adminClient: SupabaseClient;
  tutorId: string;
  provider: CalendarProvider;
  timeMin: string;
  timeMax: string;
}): Promise<CalendarEvent[]> {
  const { data, error } = await adminClient
    .from("calendar_events")
    .select("provider_event_id, start_at, end_at, summary")
    .eq("tutor_id", tutorId)
    .eq("provider", provider)
    .is("deleted_at", null)
    .gte("start_at", timeMin)
    .lte("end_at", timeMax)
    .order("start_at", { ascending: true });

  if (error) {
    console.error("[CalendarEvents] Failed to load cached events", error);
    return [];
  }

  return (data ?? [])
    .map((row: { provider_event_id?: string; start_at?: string | null; end_at?: string | null; summary?: string | null }) => {
      if (!row.start_at || !row.end_at || !row.provider_event_id) {
        return null;
      }
      const event: CalendarEvent = {
        id: `${provider}-${row.provider_event_id}`,
        title: row.summary || "Busy",
        start: row.start_at,
        end: row.end_at,
        type: provider,
        source: provider === "google" ? "Google Calendar" : "Outlook Calendar",
        packageType: "external",
      };
      return event;
    })
    .filter((event): event is CalendarEvent => event !== null);
}

function toProviderEventId(eventId: string, provider: CalendarProvider) {
  const prefix = `${provider}-`;
  return eventId?.startsWith(prefix) ? eventId.slice(prefix.length) : eventId;
}

async function persistFetchedEvents({
  adminClient,
  tutorId,
  provider,
  providerAccountId,
  events,
}: {
  adminClient: SupabaseClient;
  tutorId: string;
  provider: CalendarProvider;
  providerAccountId: string | null;
  events: CalendarEvent[];
}) {
  if (!events.length) return;

  const nowIso = new Date().toISOString();
  const payload = events.map((event) => ({
    tutor_id: tutorId,
    provider,
    provider_account_id: providerAccountId,
    provider_event_id: toProviderEventId(event.id, provider),
    calendar_id: null,
    recurrence_master_id: null,
    recurrence_instance_start: event.start,
    start_at: event.start,
    end_at: event.end,
    summary: event.title,
    status: "confirmed",
    is_all_day: false,
    deleted_at: null,
    last_seen_at: nowIso,
    updated_at: nowIso,
  }));

  const { error } = await adminClient.from("calendar_events").upsert(payload);
  if (error) {
    console.error("[CalendarEvents] Failed to persist fetched events", error);
  }
}
