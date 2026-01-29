import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const revalidate = 3600; // Revalidate every hour

/**
 * AI Discovery Endpoint
 * Returns aggregated tutor discovery data optimized for AI consumption
 *
 * Query params:
 * - language: Filter by language taught
 * - limit: Number of tutors to return (default: 20, max: 50)
 * - sort: "rating" | "students" | "price_low" | "price_high"
 */
export async function GET(request: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";
  const { searchParams } = new URL(request.url);

  const language = searchParams.get("language");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const sort = searchParams.get("sort") || "rating";

  const supabaseAdmin = createServiceRoleClient();
  const supabase = supabaseAdmin ?? (await createClient());

  // Build query for tutors
  let query = supabase
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
      years_teaching
    `)
    .eq("role", "tutor")
    .eq("onboarding_completed", true)
    .eq("account_status", "active");

  // Filter by language if specified
  if (language) {
    query = query.contains("languages_taught", [language]);
  }

  // Apply sorting
  switch (sort) {
    case "students":
      query = query.order("total_students", { ascending: false, nullsFirst: false });
      break;
    case "price_low":
    case "price_high":
      // We'll sort by price after fetching services
      query = query.order("average_rating", { ascending: false, nullsFirst: false });
      break;
    case "rating":
    default:
      query = query.order("average_rating", { ascending: false, nullsFirst: false });
      break;
  }

  query = query.limit(limit);

  const { data: tutors, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Failed to fetch tutors" }, { status: 500 });
  }

  // Fetch services for price information
  const tutorIds = tutors?.map(t => t.id) || [];
  const { data: services } = await supabase
    .from("services")
    .select("tutor_id, price_amount, price_currency, duration_minutes")
    .in("tutor_id", tutorIds)
    .eq("is_active", true)
    .not("price_amount", "is", null);

  // Create a map of tutor prices
  const tutorPrices: Record<string, { min: number; max: number; currency: string }> = {};
  services?.forEach(service => {
    if (!tutorPrices[service.tutor_id]) {
      tutorPrices[service.tutor_id] = {
        min: service.price_amount || 0,
        max: service.price_amount || 0,
        currency: service.price_currency || "USD",
      };
    } else {
      tutorPrices[service.tutor_id].min = Math.min(tutorPrices[service.tutor_id].min, service.price_amount || 0);
      tutorPrices[service.tutor_id].max = Math.max(tutorPrices[service.tutor_id].max, service.price_amount || 0);
    }
  });

  // Get unique languages across all tutors
  const allLanguages = new Set<string>();
  tutors?.forEach(t => {
    const langs = Array.isArray(t.languages_taught) ? t.languages_taught : [];
    langs.forEach((l: string) => allLanguages.add(l));
  });

  // Format response
  const formattedTutors = tutors?.map(tutor => {
    const prices = tutorPrices[tutor.id];
    return {
      username: tutor.username,
      name: tutor.full_name,
      tagline: tutor.tagline,
      languages: tutor.languages_taught,
      rating: tutor.average_rating,
      students: tutor.total_students,
      experience_years: tutor.years_teaching,
      price_range: prices ? {
        min_cents: prices.min,
        max_cents: prices.max,
        currency: prices.currency,
        formatted_min: `$${(prices.min / 100).toFixed(0)}`,
        formatted_max: `$${(prices.max / 100).toFixed(0)}`,
      } : null,
      urls: {
        profile: `${baseUrl}/profile/${tutor.username}`,
        booking: `${baseUrl}/book/${tutor.username}`,
        reviews: `${baseUrl}/${tutor.username}/reviews`,
      },
    };
  }) || [];

  // Sort by price if requested
  if (sort === "price_low") {
    formattedTutors.sort((a, b) => {
      const aPrice = a.price_range?.min_cents || Number.MAX_VALUE;
      const bPrice = b.price_range?.min_cents || Number.MAX_VALUE;
      return aPrice - bPrice;
    });
  } else if (sort === "price_high") {
    formattedTutors.sort((a, b) => {
      const aPrice = a.price_range?.max_cents || 0;
      const bPrice = b.price_range?.max_cents || 0;
      return bPrice - aPrice;
    });
  }

  const response = {
    meta: {
      description: "TutorLingua AI Discovery API - Aggregated tutor data for AI assistants",
      version: "1.0",
      generated_at: new Date().toISOString(),
      cache_ttl_seconds: 3600,
    },
    filters: {
      language: language || "all",
      sort,
      limit,
    },
    summary: {
      total_tutors: formattedTutors.length,
      languages_available: Array.from(allLanguages).sort(),
      platform_commission: "0%",
    },
    tutors: formattedTutors,
    links: {
      browse_all: `${baseUrl}/tutors`,
      by_language: language ? `${baseUrl}/tutors/${language.toLowerCase()}` : null,
      sitemap: `${baseUrl}/sitemap.xml`,
      llms_txt: `${baseUrl}/llms.txt`,
    },
  };

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "X-Robots-Tag": "noindex",
    },
  });
}
