import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { generateBookingSlots } from "@/lib/utils/scheduling";
import type { AvailabilitySlotInput } from "@/lib/validators/availability";

export default async function BookPage({ searchParams }: { searchParams?: Record<string, string> }) {
  const supabase = await createClient();

  const { data: services } = await supabase
    .from("services")
    .select("id, name, tutor_id, duration_minutes, is_active")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (!services || services.length === 0) {
    return notFound();
  }

  const selectedServiceId = searchParams?.service ?? services[0].id;
  const service = services.find((item) => item.id === selectedServiceId) ?? services[0];

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, timezone, instagram_handle, website_url")
    .eq("id", service.tutor_id)
    .single();

  const { data: availability } = await supabase
    .from("availability")
    .select("day_of_week, start_time, end_time, is_available")
    .eq("tutor_id", service.tutor_id);

  const timezone = profile?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const slots = generateBookingSlots({
    availability: (availability as AvailabilitySlotInput[] | null) ?? [],
    timezone,
    days: 14,
  }).slice(0, 12);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6">
      <header className="space-y-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-brown/70">
          Book with {profile?.full_name ?? "your tutor"}
        </p>
        <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">Book a lesson</h1>
        <p className="text-sm text-muted-foreground">
          Choose a time that works for you. We&apos;ll confirm by email within a few hours.
        </p>
      </header>

      <section className="grid gap-6 rounded-3xl border border-brand-brown/20 bg-white/90 p-6 shadow-sm backdrop-blur sm:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">Available slots</h2>
          {slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No availability published yet. Please contact the tutor directly to arrange a lesson.
            </p>
          ) : (
            <ul className="grid gap-3">
              {slots.map((slot) => (
                <li
                  key={slot.start}
                  className="flex items-center justify-between rounded-2xl border border-brand-brown/20 bg-brand-brown/5 px-4 py-3 text-sm text-foreground"
                >
                  <div>
                    <p className="font-semibold text-foreground">{slot.day_label}</p>
                    <p className="text-xs text-muted-foreground">{slot.time_label}</p>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-brand-brown">Request</span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted-foreground">
            Times are shown in {timezone}. If you don&apos;t see a slot that works, message the tutor for a custom time.
          </p>
        </div>
        <aside className="space-y-4 text-sm text-muted-foreground">
          <div className="rounded-2xl border border-brand-brown/20 bg-brand-brown/5 px-4 py-4">
            <p className="text-sm font-semibold text-foreground">Lesson details</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {service.name} · {service.duration_minutes} minutes
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Payment is handled after confirmation. You&apos;ll receive secure checkout links in your inbox.
            </p>
          </div>
          <div className="rounded-2xl border border-dashed border-brand-brown/20 px-4 py-4 text-xs">
            <p className="font-semibold text-foreground">Need help?</p>
            <p className="mt-1 text-muted-foreground">
              Email us at <span className="font-semibold">{profile?.website_url ?? "tutor@example.com"}</span> or DM on Instagram {profile?.instagram_handle ? `@${profile.instagram_handle.replace(/^@/, "")}` : ""}.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex h-10 w-full items-center justify-center rounded-full border border-brand-brown/40 bg-white px-4 text-sm font-semibold text-brand-brown transition hover:bg-brand-brown/10"
          >
            Back to TutorLingua
          </Link>
        </aside>
      </section>
    </div>
  );
}
