import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const revalidate = 3600; // Revalidate every hour

/**
 * Individual Tutor AI Endpoint
 * Returns comprehensive tutor data optimized for AI consumption
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";
  const { username } = await params;

  const supabaseAdmin = createServiceRoleClient();
  const supabase = supabaseAdmin ?? (await createClient());

  // Fetch tutor profile
  const { data: tutor, error: tutorError } = await supabase
    .from("profiles")
    .select(`
      id,
      username,
      full_name,
      tagline,
      bio,
      avatar_url,
      languages_taught,
      timezone,
      average_rating,
      total_students,
      total_lessons,
      years_teaching,
      website_url,
      instagram_handle
    `)
    .eq("username", username)
    .eq("role", "tutor")
    .eq("onboarding_completed", true)
    .single();

  if (tutorError || !tutor) {
    return NextResponse.json(
      {
        error: "Tutor not found",
        suggestion: `Visit ${baseUrl}/tutors to browse available tutors`,
      },
      { status: 404 }
    );
  }

  // Fetch services
  const { data: services } = await supabase
    .from("services")
    .select(`
      id,
      name,
      description,
      duration_minutes,
      price_amount,
      price_currency,
      offer_type
    `)
    .eq("tutor_id", tutor.id)
    .eq("is_active", true)
    .order("price_amount", { ascending: true });

  // Fetch recent reviews
  const { data: reviews } = await supabase
    .from("student_site_reviews")
    .select(`
      id,
      rating,
      comment,
      student_name,
      language_studied,
      created_at
    `)
    .eq("tutor_id", tutor.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(5);

  // Fetch packages
  const { data: packages } = await supabase
    .from("session_package_templates")
    .select(`
      id,
      name,
      session_count,
      total_price,
      currency,
      validity_days
    `)
    .eq("tutor_id", tutor.id)
    .eq("is_active", true);

  // Format services
  const formattedServices = services?.map(service => ({
    name: service.name,
    description: service.description,
    duration_minutes: service.duration_minutes,
    price: {
      amount_cents: service.price_amount,
      currency: service.price_currency || "USD",
      formatted: service.price_amount
        ? `$${(service.price_amount / 100).toFixed(2)}`
        : "Contact for pricing",
    },
    type: service.offer_type,
    booking_url: `${baseUrl}/book/${username}?service=${service.id}`,
  })) || [];

  // Format reviews
  const formattedReviews = reviews?.map(review => ({
    rating: review.rating,
    comment: review.comment,
    author: review.student_name,
    language_studied: review.language_studied,
    date: review.created_at,
  })) || [];

  // Format packages
  const formattedPackages = packages?.map(pkg => ({
    name: pkg.name,
    sessions: pkg.session_count,
    total_price: {
      amount_cents: pkg.total_price,
      currency: pkg.currency || "USD",
      formatted: `$${(pkg.total_price / 100).toFixed(2)}`,
    },
    per_session_price: {
      formatted: `$${((pkg.total_price / pkg.session_count) / 100).toFixed(2)}/session`,
    },
    validity_days: pkg.validity_days,
  })) || [];

  // Calculate price range
  const prices = services?.map(s => s.price_amount).filter((p): p is number => p !== null && p > 0) || [];
  const priceRange = prices.length > 0
    ? {
        min_cents: Math.min(...prices),
        max_cents: Math.max(...prices),
        formatted: `$${(Math.min(...prices) / 100).toFixed(0)} - $${(Math.max(...prices) / 100).toFixed(0)}`,
      }
    : null;

  const response = {
    meta: {
      description: "TutorLingua Tutor Profile API - Individual tutor data for AI assistants",
      version: "1.0",
      generated_at: new Date().toISOString(),
      cache_ttl_seconds: 3600,
    },
    tutor: {
      username: tutor.username,
      name: tutor.full_name,
      tagline: tutor.tagline,
      bio: tutor.bio,
      avatar_url: tutor.avatar_url,
      languages: tutor.languages_taught,
      timezone: tutor.timezone,
      stats: {
        rating: tutor.average_rating,
        total_students: tutor.total_students,
        total_lessons: tutor.total_lessons,
        years_teaching: tutor.years_teaching,
      },
      social: {
        website: tutor.website_url,
        instagram: tutor.instagram_handle
          ? `https://instagram.com/${tutor.instagram_handle.replace(/^@/, "")}`
          : null,
      },
      price_range: priceRange,
    },
    services: formattedServices,
    packages: formattedPackages,
    reviews: {
      count: tutor.total_students || 0,
      average_rating: tutor.average_rating,
      recent: formattedReviews,
    },
    urls: {
      profile: `${baseUrl}/profile/${username}`,
      booking: `${baseUrl}/book/${username}`,
      reviews: `${baseUrl}/${username}/reviews`,
      bio: `${baseUrl}/bio/${username}`,
      products: `${baseUrl}/products/${username}`,
    },
    booking_info: {
      platform_commission: "0%",
      payment_methods: ["Credit Card", "Debit Card"],
      booking_process: [
        "1. Visit the booking page",
        "2. Select a lesson type",
        "3. Choose an available time slot",
        "4. Enter your details and payment",
        "5. Receive confirmation email",
      ],
    },
    schema_org_available: true,
    schema_org_note: `Parse JSON-LD from ${baseUrl}/profile/${username} for rich structured data`,
  };

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "X-Robots-Tag": "noindex",
    },
  });
}
