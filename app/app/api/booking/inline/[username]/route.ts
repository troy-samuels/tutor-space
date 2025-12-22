import { NextRequest, NextResponse } from "next/server";
import { addDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { checkStudentAccess } from "@/lib/actions/student-auth";
import { getStudentLessonHistory } from "@/lib/actions/student-lessons";
import { generateBookableSlots, filterFutureSlots, groupSlotsByDate } from "@/lib/utils/slots";
import { normalizeUsernameSlug } from "@/lib/utils/username-slug";

type RouteParams = {
  params: Promise<{ username: string }>;
};

export async function GET(req: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { username } = await params;
  const rawLower = username.trim().toLowerCase();
  const normalizedUsername = normalizeUsernameSlug(username) || rawLower;
  const searchParams = new URL(req.url).searchParams;
  const requestedService = searchParams.get("service");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profileResult = await supabase
    .from("public_profiles")
    .select(
      "id, full_name, username, email, bio, avatar_url, instagram_handle, website_url, timezone, languages_taught"
    )
    .eq("username", normalizedUsername)
    .maybeSingle();

  if (!profileResult.data && rawLower && rawLower !== normalizedUsername) {
    profileResult = await supabase
      .from("public_profiles")
      .select(
        "id, full_name, username, email, bio, avatar_url, instagram_handle, website_url, timezone, languages_taught"
      )
      .eq("username", rawLower)
      .maybeSingle();
  }

  const profile = profileResult.data;

  if (!profile) {
    return NextResponse.json({ status: "not_found" }, { status: 404 });
  }

  const { data: services } = await supabase
    .from("services")
    .select("id, name, description, duration_minutes, price_amount, price_currency, is_active")
    .eq("tutor_id", profile.id)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (!services || services.length === 0) {
    return NextResponse.json({ status: "no_services" }, { status: 404 });
  }

  const tutor = {
    id: profile.id,
    fullName: profile.full_name || profile.username || normalizedUsername,
    username: profile.username || normalizedUsername,
    email: profile.email || "",
    bio: profile.bio || "",
    avatarUrl: profile.avatar_url || "",
    instagramHandle: profile.instagram_handle || "",
    websiteUrl: profile.website_url || "",
    timezone: profile.timezone || "UTC",
    languages: Array.isArray(profile.languages_taught)
      ? profile.languages_taught
      : (profile.languages_taught || "")
          .split(",")
          .map((lang: string) => lang.trim())
          .filter(Boolean),
  };

  // Gating: require auth
  if (!user) {
    return NextResponse.json({
      status: "login_required",
      tutor,
      services,
    });
  }

  const accessInfo = await checkStudentAccess(profile.id);

  if (accessInfo.status !== "approved") {
    return NextResponse.json({
      status: "access_required",
      tutor,
      services,
      accessStatus: accessInfo.status,
      studentId: accessInfo.student_id,
    });
  }

  const { data: studentRecord } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", user.id)
    .eq("tutor_id", profile.id)
    .single();

  const lessonHistoryResult = studentRecord
    ? await getStudentLessonHistory(studentRecord.id, profile.id)
    : { data: null };

  const { data: availability } = await supabase
    .from("availability")
    .select("day_of_week, start_time, end_time, is_available")
    .eq("tutor_id", profile.id)
    .eq("is_available", true);

  const { data: existingBookings } = await supabase
    .from("bookings")
    .select("scheduled_at, duration_minutes, status")
    .eq("tutor_id", profile.id)
    .in("status", ["pending", "confirmed"])
    .gte("scheduled_at", new Date().toISOString());

  const selectedService = services.find((svc) => svc.id === requestedService) || services[0];
  const timezone = tutor.timezone || "UTC";
  const startDate = new Date();
  const endDate = addDays(startDate, 14);

  const allSlots = generateBookableSlots({
    availability: availability || [],
    startDate,
    endDate,
    slotDuration: selectedService?.duration_minutes || 60,
    timezone,
    existingBookings: existingBookings || [],
  });

  const groupedSlots = groupSlotsByDate(filterFutureSlots(allSlots), timezone);

  return NextResponse.json({
    status: "ok",
    tutor,
    services,
    selectedServiceId: selectedService.id,
    groupedSlots,
    lessonHistory: lessonHistoryResult.data || null,
    timezone,
  });
}
