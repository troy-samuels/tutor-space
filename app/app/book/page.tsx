import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { generateBookableSlots, filterFutureSlots, groupSlotsByDate } from "@/lib/utils/slots";
import type { AvailabilitySlotInput } from "@/lib/validators/availability";
import { getCalendarBusyWindows } from "@/lib/calendar/busy-windows";
import { addDays } from "date-fns";
import BookingInterface from "@/components/booking/BookingInterface";

export default async function BookPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const adminClient = createServiceRoleClient();

  const { data: services } = await supabase
    .from("services")
    .select("id, name, description, tutor_id, duration_minutes, price_amount, price_currency, is_active")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (!services || services.length === 0) {
    return notFound();
  }

  const selectedServiceId = params?.service ?? services[0].id;
  const service = services.find((item) => item.id === selectedServiceId) ?? services[0];

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, username, bio, avatar_url, timezone, instagram_handle, website_url")
    .eq("id", service.tutor_id)
    .single();

  const { data: availability } = await supabase
    .from("availability")
    .select("day_of_week, start_time, end_time, is_available")
    .eq("tutor_id", service.tutor_id);

  const timezone = profile?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const startRange = addDays(new Date(), -1);
  const endRange = addDays(new Date(), 15);

  const [bookingsResult, blockedTimesResult, tutorProfileResult, externalBusyWindows] = await Promise.all([
    adminClient
      ? adminClient
          .from("bookings")
          .select("scheduled_at, duration_minutes, status")
          .eq("tutor_id", service.tutor_id)
          .in("status", ["pending", "confirmed"])
          .gte("scheduled_at", startRange.toISOString())
          .lte("scheduled_at", endRange.toISOString())
      : Promise.resolve({ data: [] as Array<{ scheduled_at: string; duration_minutes: number; status: string }> }),
    adminClient
      ? adminClient
          .from("blocked_times")
          .select("start_time, end_time")
          .eq("tutor_id", service.tutor_id)
          .lt("start_time", endRange.toISOString())
          .gt("end_time", startRange.toISOString())
      : Promise.resolve({ data: [] as Array<{ start_time: string; end_time: string }> }),
    adminClient
      ? adminClient
          .from("profiles")
          .select("buffer_time_minutes")
          .eq("id", service.tutor_id)
          .single()
      : Promise.resolve({ data: null as { buffer_time_minutes: number | null } | null }),
    getCalendarBusyWindows({
      tutorId: service.tutor_id,
      start: startRange,
      days: 16,
    }),
  ]);

  const bufferMinutes = tutorProfileResult.data?.buffer_time_minutes ?? 0;
  const blockedWindows =
    blockedTimesResult.data?.map((block) =>
      block.start_time && block.end_time ? { start: block.start_time, end: block.end_time } : null
    ).filter(Boolean) ?? [];
  const busyWindows = [
    ...(externalBusyWindows ?? []),
    ...(blockedWindows as { start: string; end: string }[]),
  ];
  const bookingSlots = generateBookableSlots({
    availability: (availability as AvailabilitySlotInput[] | null) ?? [],
    startDate: new Date(),
    endDate: addDays(new Date(), 14),
    slotDuration: service.duration_minutes ?? 60,
    timezone,
    existingBookings: bookingsResult.data ?? [],
    busyWindows,
    bufferMinutes,
  });

  const groupedSlots = groupSlotsByDate(filterFutureSlots(bookingSlots).slice(0, 12), timezone);

  const servicePrice = typeof service.price_amount === "number" ? service.price_amount : 0;
  const serviceCurrency = service.price_currency || "USD";

  const normalizedService = {
    id: service.id,
    name: service.name,
    description: service.description ?? null,
    duration_minutes: service.duration_minutes ?? 60,
    price_amount: servicePrice,
    price_currency: serviceCurrency,
    is_active: service.is_active ?? true,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <BookingInterface
        tutor={{
          id: service.tutor_id,
          fullName: profile?.full_name ?? "your tutor",
          username: profile?.username ?? "",
          email: "",
          bio: profile?.bio ?? "",
          avatarUrl: profile?.avatar_url ?? "",
          instagramHandle: profile?.instagram_handle ?? "",
          websiteUrl: profile?.website_url ?? "",
          timezone,
        }}
        services={[normalizedService]}
        selectedService={normalizedService}
        groupedSlots={groupedSlots}
        analyticsContext={{ source: "public" }}
      />
    </div>
  );
}
