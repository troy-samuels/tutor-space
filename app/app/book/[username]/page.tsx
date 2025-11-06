import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateBookableSlots, filterFutureSlots, groupSlotsByDate } from "@/lib/utils/slots";
import { addDays } from "date-fns";
import BookingInterface from "@/components/booking/BookingInterface";
import { PublicBookingLanding } from "@/components/booking/PublicBookingLanding";
import { AccessRequestStatus } from "@/components/booking/AccessRequestStatus";
import { checkStudentAccess } from "@/lib/actions/student-auth";
import { getStudentLessonHistory } from "@/lib/actions/student-lessons";

interface BookPageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ service?: string }>;
}

export default async function BookPage({ params, searchParams }: BookPageProps) {
  const { username } = await params;
  const { service: serviceId } = await searchParams;

  const supabase = await createClient();

  // Check if student is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get tutor profile by username
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, username, email, timezone, bio, avatar_url, instagram_handle, website_url")
    .eq("username", username)
    .eq("role", "tutor")
    .single();

  if (profileError || !profile) {
    return notFound();
  }

  // Get tutor's active services
  const { data: services } = await supabase
    .from("services")
    .select("id, name, description, duration_minutes, price_amount, price_currency, is_active")
    .eq("tutor_id", profile.id)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (!services || services.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">No Services Available</h1>
          <p className="text-gray-600">
            {profile.full_name} hasn&apos;t published any services yet. Please check back later or contact them directly.
          </p>
          {profile.instagram_handle && (
            <a
              href={`https://instagram.com/${profile.instagram_handle.replace(/^@/, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Contact on Instagram
            </a>
          )}
        </div>
      </div>
    );
  }

  // CHECK ACCESS CONTROL: Gate calendar based on student authentication and approval status
  if (!user) {
    // No user logged in - show public landing with login/signup options
    return (
      <PublicBookingLanding
        tutor={{
          id: profile.id,
          fullName: profile.full_name || "",
          username: profile.username || "",
          email: profile.email || "",
          bio: profile.bio || "",
          avatarUrl: profile.avatar_url || "",
          instagramHandle: profile.instagram_handle || "",
          websiteUrl: profile.website_url || "",
        }}
        services={services}
      />
    );
  }

  // User is logged in - check their access status
  const accessInfo = await checkStudentAccess(profile.id);

  if (accessInfo.status === "no_record") {
    // Student logged in but no record for this tutor - should request access
    return (
      <PublicBookingLanding
        tutor={{
          id: profile.id,
          fullName: profile.full_name || "",
          username: profile.username || "",
          email: profile.email || "",
          bio: profile.bio || "",
          avatarUrl: profile.avatar_url || "",
          instagramHandle: profile.instagram_handle || "",
          websiteUrl: profile.website_url || "",
        }}
        services={services}
        isLoggedIn={true}
      />
    );
  }

  if (accessInfo.status !== "approved") {
    // Student has requested access but not approved yet, or denied, or suspended
    return (
      <AccessRequestStatus
        tutor={{
          id: profile.id,
          fullName: profile.full_name || "",
          username: profile.username || "",
          email: profile.email || "",
          bio: profile.bio || "",
          avatarUrl: profile.avatar_url || "",
          instagramHandle: profile.instagram_handle || "",
          websiteUrl: profile.website_url || "",
        }}
        accessStatus={accessInfo.status}
        studentId={accessInfo.student_id}
      />
    );
  }

  // APPROVED: Student can see calendar and book!

  // Get student record to fetch lesson history
  const { data: studentRecord } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", user.id)
    .eq("tutor_id", profile.id)
    .single();

  // Fetch student's lesson history
  const lessonHistoryResult = studentRecord
    ? await getStudentLessonHistory(studentRecord.id, profile.id)
    : { data: null, error: null };

  // Get selected service or default to first
  const selectedService = services.find((s) => s.id === serviceId) || services[0];

  // Get tutor's availability
  const { data: availability } = await supabase
    .from("availability")
    .select("day_of_week, start_time, end_time, is_available")
    .eq("tutor_id", profile.id)
    .eq("is_available", true);

  // Get existing bookings to filter out conflicts
  const { data: existingBookings } = await supabase
    .from("bookings")
    .select("scheduled_at, duration_minutes, status")
    .eq("tutor_id", profile.id)
    .in("status", ["pending", "confirmed"])
    .gte("scheduled_at", new Date().toISOString());

  const timezone = profile.timezone || "UTC";

  // Generate available slots for the next 14 days
  const startDate = new Date();
  const endDate = addDays(startDate, 14);

  const allSlots = generateBookableSlots({
    availability: availability || [],
    startDate,
    endDate,
    slotDuration: selectedService.duration_minutes,
    timezone,
    existingBookings: existingBookings || [],
  });

  // Filter to only future slots
  const futureSlots = filterFutureSlots(allSlots);

  // Group by date
  const groupedSlots = groupSlotsByDate(futureSlots, timezone);

  return (
    <div className="min-h-screen bg-gray-50">
      <BookingInterface
        tutor={{
          id: profile.id,
          fullName: profile.full_name || "",
          username: profile.username || "",
          email: profile.email || "",
          bio: profile.bio || "",
          avatarUrl: profile.avatar_url || "",
          instagramHandle: profile.instagram_handle || "",
          websiteUrl: profile.website_url || "",
          timezone,
        }}
        services={services}
        selectedService={selectedService}
        groupedSlots={groupedSlots}
        lessonHistory={lessonHistoryResult.data}
      />
    </div>
  );
}
