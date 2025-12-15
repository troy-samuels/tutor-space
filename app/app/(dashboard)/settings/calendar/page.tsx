import { CalendarCheck2, ShieldCheck, Zap } from "lucide-react";
import { CalendarConnectCard } from "@/components/settings/calendar-connect-card";
import { listCalendarConnections } from "@/lib/actions/calendar";
import { createClient } from "@/lib/supabase/server";

const PROVIDERS = [
  {
    provider: "google",
    title: "Google Calendar",
    description:
      "Sync your personal or workspace calendar to auto-block conflicts and add TutorLingua bookings instantly.",
  },
  {
    provider: "outlook",
    title: "Outlook / Microsoft 365",
    description:
      "Link your Microsoft calendar so lessons appear for you and reminders fire for students automatically.",
  },
] as const;

const providerTitle = (slug: string) =>
  PROVIDERS.find((provider) => provider.provider === slug)?.title ?? "your calendar";

const ERROR_MAP: Record<string, string> = {
  unsupported_provider: "We couldn’t recognise that calendar provider.",
  provider_not_configured: "That provider isn’t configured yet. Double-check your OAuth keys.",
  invalid_state: "The calendar connection could not be verified. Please start the flow again.",
  unauthenticated: "Sign in to TutorLingua before connecting your calendar.",
  token_exchange_failed: "We couldn’t finish the OAuth handshake. Try again in a moment.",
  missing_access_token: "Google or Microsoft did not return an access token. Try again.",
  encryption_failed: "We couldn’t encrypt the calendar token securely. Try again.",
  persist_failed: "We couldn't save the connection. Try again or contact support@tutorlingua.co.",
};

export default async function CalendarSettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("calendar_provider")
        .eq("id", user.id)
        .single()
    : { data: null };

  const connections = await listCalendarConnections();
  const params = await searchParams;
  const connectedParam = Array.isArray(params?.connected)
    ? params?.connected[0]
    : params?.connected;
  const errorParam = Array.isArray(params?.calendar_error)
    ? params?.calendar_error[0]
    : params?.calendar_error;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Calendar sync</h1>
        <p className="text-sm text-muted-foreground">
          Sync your calendar to avoid double-bookings.
        </p>
      </header>

      {profile?.calendar_provider && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Default preference:{" "}
          <span className="font-semibold">
            {providerTitle(profile.calendar_provider)}
          </span>
          . You can switch or connect another provider below.
        </div>
      )}

      {connectedParam ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <span className="font-semibold">Success:</span> {providerTitle(connectedParam)} is now
          connected. We’ll keep your availability synced automatically.
        </div>
      ) : null}

      {errorParam ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span className="font-semibold">Couldn’t connect:</span>{" "}
          {ERROR_MAP[errorParam] ?? "Something went wrong during the OAuth flow. Try again shortly."}
        </div>
      ) : null}

      <section className="grid gap-5 sm:grid-cols-2">
        {PROVIDERS.map((provider) => {
          const status = connections.find((connection) => connection.provider === provider.provider) ?? {
            provider: provider.provider,
            connected: false,
          };
          return (
            <CalendarConnectCard
              key={provider.provider}
              provider={provider.provider}
              title={provider.title}
              description={provider.description}
              connection={status}
            />
          );
        })}
      </section>

      <section className="rounded-3xl border border-border/60 bg-white/80 p-6 shadow-sm backdrop-blur">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">How TutorLingua uses your calendar</h2>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-3">
              <CalendarCheck2 className="mt-0.5 h-5 w-5 text-primary" />
              <span>Blocks out busy times so people only see open slots.</span>
            </li>
            <li className="flex items-start gap-3">
              <Zap className="mt-0.5 h-5 w-5 text-primary" />
              <span>Adds bookings to your calendar with reminders.</span>
            </li>
            <li className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
              <span>Your login stays secure. Disconnect anytime.</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
