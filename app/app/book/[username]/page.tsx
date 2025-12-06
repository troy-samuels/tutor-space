import { notFound } from "next/navigation";
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

interface BookPageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ service?: string }>;
}

export async function generateMetadata({ params }: BookPageProps): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();
  
  const { data: profile } = await supabase
    .from("public_profiles")
    .select("full_name, username, bio, tagline, avatar_url, languages_taught")
    .eq("username", username)
    .single();

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
      canonical: `/book/${profile.username ?? username}`,
    },
    openGraph: {
      title: `Book ${languagesList} lessons with ${tutorName}`,
      description,
      type: "profile",
      url: `https://tutorlingua.co/book/${profile.username ?? username}`,
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
  const { service: serviceId } = await searchParams;

  const supabase = await createClient();

  // Check if student is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get tutor profile by username (from public_profiles view which only returns tutors)
  const { data: profile, error: profileError } = await supabase
    .from("public_profiles")
    .select("id, full_name, username, email, timezone, bio, tagline, avatar_url, instagram_handle, website_url, languages_taught, average_rating, testimonial_count")
    .eq("username", username)
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
      average_rating: profile.average_rating || undefined,
      testimonial_count: profile.testimonial_count || undefined,
    },
    services.map(s => ({
      id: s.id,
      name: s.name,
      description: s.description || "",
      duration_minutes: s.duration_minutes,
      price: s.price_amount * 100, // Convert to cents
      currency: s.price_currency,
    }))
  );

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: `${profile.full_name || username}`, url: `/profile/${username}` },
    { name: "Book a Lesson", url: `/book/${username}` },
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
