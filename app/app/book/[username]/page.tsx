import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { generateBookableSlots, filterFutureSlots, groupSlotsByDate } from "@/lib/utils/slots";
import { addDays } from "date-fns";
import BookingInterface from "@/components/booking/BookingInterface";
import { PublicBookingLanding } from "@/components/booking/PublicBookingLanding";
import { AccessRequestStatus } from "@/components/booking/AccessRequestStatus";
import { checkStudentAccess } from "@/lib/actions/student-auth";
import { getStudentLessonHistory } from "@/lib/actions/student-lessons";
import { generateTutorPersonSchema, generateBreadcrumbSchema } from "@/lib/utils/structured-data";
import { normalizeUsernameSlug } from "@/lib/utils/username-slug";

interface BookPageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ service?: string; services?: string }>;
}

export async function generateMetadata({ params }: BookPageProps): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();
  const rawLower = username.trim().toLowerCase();
  const normalized = normalizeUsernameSlug(username) || rawLower;

  let profileResult = await supabase
    .from("public_profiles")
    .select("full_name, username, bio, tagline, avatar_url, languages_taught")
    .eq("username", normalized)
    .maybeSingle();

  if (!profileResult.data && rawLower && rawLower !== normalized) {
    profileResult = await supabase
      .from("public_profiles")
      .select("full_name, username, bio, tagline, avatar_url, languages_taught")
      .eq("username", rawLower)
      .maybeSingle();
  }

  const profile = profileResult.data;

  if (!profile) {
    return {
      title: "Tutor Not Found | TutorLingua",
    };
  }

  const tutorName = profile.full_name ?? profile.username ?? username;
  
  // Extract languages for rich metadata
  const languages = Array.isArray(profile.languages_taught)
    ? profile.languages_taught
    : profile.languages_taught
      ?.split(",")
      .map((lang: string) => lang.trim())
      .filter(Boolean) ?? [];
  
  const languagesList = languages.length > 0 ? languages.join(", ") : "multiple languages";
  
  const description = profile.tagline ?? 
    `Book ${languagesList} lessons with ${tutorName}. View real-time availability, select a service, and schedule your session instantly. No commission fees. Direct booking on TutorLingua.`;

  return {
    title: `Book ${tutorName} - ${languagesList.split(",")[0] || "Language"} Tutor | TutorLingua`,
    description,
    keywords: [
      `${tutorName}`,
      ...languages.map((lang: string) => `${lang} tutor`),
      ...languages.map((lang: string) => `learn ${lang} online`),
      "book language lessons",
      "online tutoring",
      username,
    ],
    alternates: {
      canonical: `/book/${profile.username ?? normalized}`,
    },
    openGraph: {
      title: `Book ${languagesList} lessons with ${tutorName}`,
      description,
      type: "profile",
      url: `https://tutorlingua.co/book/${profile.username ?? normalized}`,
      images: profile.avatar_url ? [{ 
        url: profile.avatar_url,
        width: 400,
        height: 400,
        alt: `${tutorName} - ${languagesList} Tutor`,
      }] : undefined,
    },
    twitter: {
      card: "summary",
      title: `Book ${tutorName}`,
      description: `${languagesList} lessons available. Book instantly on TutorLingua.`,
      images: profile.avatar_url ? [profile.avatar_url] : undefined,
    },
  };
}

export default async function BookPage({ params, searchParams }: BookPageProps) {
  const { username } = await params;
  const { service: serviceId, services: allowedServicesParam } = await searchParams;
  const rawLower = username.trim().toLowerCase();
  const normalized = normalizeUsernameSlug(username) || rawLower;

  // Parse allowed services from invite link (comma-separated IDs)
  const allowedServiceIds = allowedServicesParam
    ? allowedServicesParam.split(",").map((id) => id.trim()).filter(Boolean)
    : null;

  const supabase = await createClient();

  // Fetch auth + tutor profile in parallel to reduce latency
  const [
    {
      data: { user },
    },
    profileResult,
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("public_profiles")
      .select(
        "id, full_name, username, timezone, bio, tagline, avatar_url, instagram_handle, website_url, languages_taught"
      )
      .eq("username", normalized)
      .maybeSingle(),
  ]);
  let profile = profileResult.data;
  const profileError = profileResult.error;

  if (profileError || !profile) {
    const fallbackResult = rawLower && rawLower !== normalized
      ? await supabase
          .from("public_profiles")
          .select(
            "id, full_name, username, timezone, bio, tagline, avatar_url, instagram_handle, website_url, languages_taught"
          )
          .eq("username", rawLower)
          .maybeSingle()
      : null;

    const fallbackProfile = fallbackResult?.data ?? null;
    if (!fallbackProfile) {
      // Debug logging for 404 investigation
      console.error("[BookPage] Profile not found:", {
        username,
        error: profileError?.message,
        code: profileError?.code,
        details: profileError?.details,
        hint: profileError?.hint,
      });
      return notFound();
    }

    profile = fallbackProfile;
  }

  if (profile.username && profile.username !== username) {
    redirect(`/book/${profile.username}`);
  }

  // Get tutor's active services
  let servicesQuery = supabase
    .from("services")
    .select("id, name, description, duration_minutes, price_amount, price_currency, is_active")
    .eq("tutor_id", profile.id)
    .eq("is_active", true);

  // If invite link specified allowed services, filter to only those
  if (allowedServiceIds && allowedServiceIds.length > 0) {
    servicesQuery = servicesQuery.in("id", allowedServiceIds);
  }

  const { data: services } = await servicesQuery.order("name", { ascending: true });

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
          email: "", // Email no longer exposed in public_profiles for privacy
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
          email: "", // Email no longer exposed in public_profiles for privacy
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
          email: "", // Email no longer exposed in public_profiles for privacy
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

  // Get selected service or default to first
  const selectedService = services.find((s) => s.id === serviceId) || services[0];

  // Fetch student record + availability + existing bookings in parallel
  const [studentRecordResult, availabilityResult, existingBookingsResult] = await Promise.all([
    supabase
      .from("students")
      .select("id")
      .eq("user_id", user.id)
      .eq("tutor_id", profile.id)
      .single(),
    supabase
      .from("availability")
      .select("day_of_week, start_time, end_time, is_available")
      .eq("tutor_id", profile.id)
      .eq("is_available", true),
    supabase
      .from("bookings")
      .select("scheduled_at, duration_minutes, status")
      .eq("tutor_id", profile.id)
      .in("status", ["pending", "confirmed"])
      .gte("scheduled_at", new Date().toISOString()),
  ]);

  const studentRecord = studentRecordResult.data;
  const availability = availabilityResult.data;
  const existingBookings = existingBookingsResult.data;

  // Fetch student's lesson history
  const lessonHistoryResult = studentRecord
    ? await getStudentLessonHistory(studentRecord.id, profile.id)
    : { data: null, error: null };

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

  // Prepare languages array
  const languages = Array.isArray(profile.languages_taught)
    ? profile.languages_taught
    : profile.languages_taught
      ?.split(",")
      .map((lang: string) => lang.trim())
      .filter(Boolean) ?? [];

  // Generate structured data for SEO & LLMs
  const tutorSchema = generateTutorPersonSchema(
    {
      id: profile.id,
      username: profile.username || username,
      full_name: profile.full_name || "",
      bio: profile.bio || "",
      tagline: profile.tagline || undefined,
      avatar_url: profile.avatar_url || undefined,
      languages_taught: languages,
      website_url: profile.website_url || undefined,
      instagram_handle: profile.instagram_handle || undefined,
      timezone: profile.timezone || undefined,
      // average_rating and testimonial_count not in public_profiles view yet
      average_rating: undefined,
      testimonial_count: undefined,
    },
    services.map(s => ({
      id: s.id,
      name: s.name,
      description: s.description || "",
      duration_minutes: s.duration_minutes,
      price: s.price_amount ?? 0,
      currency: s.price_currency || "USD",
    }))
  );

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: `${profile.full_name || username}`, url: `/profile/${profile.username || username}` },
    { name: "Book a Lesson", url: `/book/${profile.username || username}` },
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Structured Data for SEO & LLMs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(tutorSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      
      <BookingInterface
        tutor={{
          id: profile.id,
          fullName: profile.full_name || "",
          username: profile.username || "",
          email: "", // Email no longer exposed in public_profiles for privacy
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
