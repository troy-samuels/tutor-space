import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { generateLocalBusinessSchema, generateTutorDirectorySchema } from "@/lib/utils/structured-data";
import { getLocationBySlug, LOCATIONS, generateLocationMetaTitle, generateLocationMetaDescription } from "@/lib/marketing/location-data";

// Supported languages
const SUPPORTED_LANGUAGES: Record<string, { display: string; variants: string[] }> = {
  spanish: { display: "Spanish", variants: ["Spanish", "Español"] },
  french: { display: "French", variants: ["French", "Français"] },
  german: { display: "German", variants: ["German", "Deutsch"] },
  italian: { display: "Italian", variants: ["Italian", "Italiano"] },
  portuguese: { display: "Portuguese", variants: ["Portuguese", "Português"] },
  japanese: { display: "Japanese", variants: ["Japanese", "日本語"] },
  korean: { display: "Korean", variants: ["Korean", "한국어"] },
  mandarin: { display: "Mandarin", variants: ["Mandarin", "Chinese", "Mandarin Chinese", "中文"] },
  arabic: { display: "Arabic", variants: ["Arabic", "العربية"] },
  russian: { display: "Russian", variants: ["Russian", "Русский"] },
  dutch: { display: "Dutch", variants: ["Dutch", "Nederlands"] },
  english: { display: "English", variants: ["English", "ESL"] },
};

type Props = {
  params: Promise<{ language: string; location: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { language, location } = await params;
  const langData = SUPPORTED_LANGUAGES[language.toLowerCase()];
  const locationData = getLocationBySlug(location);

  if (!langData || !locationData) {
    return { title: "Language Tutors | TutorLingua" };
  }

  const displayName = langData.display;
  const title = generateLocationMetaTitle(displayName, locationData);
  const description = generateLocationMetaDescription(displayName, locationData);

  return {
    title,
    description,
    keywords: [
      `${displayName} tutors ${locationData.city}`,
      `${displayName} teachers ${locationData.city}`,
      `learn ${displayName} ${locationData.city}`,
      `${displayName} lessons ${locationData.country}`,
    ],
    openGraph: {
      title,
      description,
      type: "website",
      url: `/tutors/${language}/${location}`,
    },
  };
}

export async function generateStaticParams() {
  const params: { language: string; location: string }[] = [];

  // Generate combinations of languages and their popular locations
  Object.keys(SUPPORTED_LANGUAGES).forEach(language => {
    const langData = SUPPORTED_LANGUAGES[language];
    // Get locations where this language is popular
    const relevantLocations = LOCATIONS.filter(loc =>
      loc.languages.some(l => l.toLowerCase() === langData.display.toLowerCase())
    );

    relevantLocations.forEach(loc => {
      params.push({ language, location: loc.slug });
    });
  });

  return params;
}

export default async function LocationTutorPage({ params }: Props) {
  const { language, location } = await params;
  const langData = SUPPORTED_LANGUAGES[language.toLowerCase()];
  const locationData = getLocationBySlug(location);

  if (!langData || !locationData) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";
  const displayName = langData.display;
  const variants = langData.variants;

  const supabaseAdmin = createServiceRoleClient();
  const supabase = supabaseAdmin ?? (await createClient());

  // Fetch tutors who teach this language
  // Note: In a real implementation, you might filter by timezone proximity
  const { data: allTutors } = await supabase
    .from("profiles")
    .select("id, username, full_name, tagline, bio, avatar_url, languages_taught, average_rating, total_students, timezone")
    .eq("role", "tutor")
    .eq("onboarding_completed", true)
    .eq("account_status", "active")
    .order("average_rating", { ascending: false, nullsFirst: false });

  // Filter tutors by language variants
  const tutors = allTutors?.filter(t => {
    const langs = Array.isArray(t.languages_taught) ? t.languages_taught : [];
    return langs.some((l: string) =>
      variants.some(v => l.toLowerCase().includes(v.toLowerCase()))
    );
  }).slice(0, 20) || [];

  // Generate structured data
  const localBusinessSchema = generateLocalBusinessSchema(
    {
      city: locationData.city,
      country: locationData.country,
      region: locationData.region,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
    },
    {
      language: displayName,
      tutorCount: tutors.length,
      priceRange: "$$",
    }
  );

  const directorySchema = generateTutorDirectorySchema(
    tutors.slice(0, 10).map(t => ({
      username: t.username,
      full_name: t.full_name,
      languages_taught: t.languages_taught,
      average_rating: t.average_rating,
    })),
    {
      language: displayName,
      location: locationData.city,
      pageUrl: `${baseUrl}/tutors/${language}/${location}`,
    }
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(directorySchema) }}
      />

      {/* Breadcrumb */}
      <nav className="px-4 py-3 bg-gray-50 border-b">
        <div className="max-w-6xl mx-auto text-sm text-gray-600">
          <Link href="/tutors" className="hover:text-blue-600">
            Tutors
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/tutors/${language}`} className="hover:text-blue-600">
            {displayName}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{locationData.city}</span>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {displayName} Tutors in {locationData.city}
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Find professional {displayName} language tutors for students in {locationData.city}, {locationData.country}.
            Book online lessons directly with experienced teachers.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              0% Commission
            </span>
            <span>|</span>
            <span>Online Lessons</span>
            <span>|</span>
            <span>Direct Booking</span>
          </div>
        </div>
      </section>

      {/* Tutor Grid */}
      <section className="px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Available {displayName} Tutors
          </h2>

          {tutors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tutors.map(tutor => (
                <Link
                  key={tutor.id}
                  href={`/profile/${tutor.username}`}
                  className="block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      {tutor.avatar_url ? (
                        <img
                          src={tutor.avatar_url}
                          alt={tutor.full_name || tutor.username}
                          className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xl font-bold flex-shrink-0">
                          {(tutor.full_name || tutor.username)?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {tutor.full_name || tutor.username}
                        </h3>
                        {tutor.average_rating && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <span className="text-yellow-500">★</span>
                            <span>{tutor.average_rating.toFixed(1)}</span>
                            {tutor.total_students && tutor.total_students > 0 && (
                              <span className="text-gray-400 ml-2">
                                ({tutor.total_students} students)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    {tutor.tagline && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {tutor.tagline}
                      </p>
                    )}
                    {tutor.languages_taught && Array.isArray(tutor.languages_taught) && (
                      <div className="flex flex-wrap gap-1">
                        {tutor.languages_taught.slice(0, 3).map((lang: string) => (
                          <span
                            key={lang}
                            className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded"
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl">
              <p className="text-gray-600 mb-4">
                No {displayName} tutors specifically serving {locationData.city} yet.
              </p>
              <p className="text-gray-500 mb-6">
                All our tutors teach online, so you can learn from anywhere!
              </p>
              <Link
                href={`/tutors/${language}`}
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse All {displayName} Tutors
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* SEO Content */}
      <section className="px-4 py-12 bg-white">
        <div className="max-w-4xl mx-auto prose prose-gray">
          <h2>Learn {displayName} in {locationData.city}</h2>
          <p>
            Whether you&apos;re in {locationData.city} or anywhere in {locationData.country},
            TutorLingua connects you with professional {displayName} tutors for online lessons.
            Our tutors offer flexible scheduling to accommodate different time zones,
            making it easy to learn {displayName} no matter where you are.
          </p>

          <h3>Why Choose Online {displayName} Tutoring?</h3>
          <ul>
            <li>Learn from the comfort of your home in {locationData.city}</li>
            <li>Access tutors worldwide, not just those in {locationData.country}</li>
            <li>Flexible scheduling to fit your lifestyle</li>
            <li>Save time and money on commuting</li>
            <li>Record lessons for later review (with tutor permission)</li>
          </ul>

          <h3>What to Expect from {displayName} Lessons</h3>
          <p>
            Our tutors offer personalized {displayName} instruction tailored to your goals.
            Whether you&apos;re learning {displayName} for travel, business, exams, or personal
            enrichment, you&apos;ll find a tutor who specializes in your area of interest.
          </p>

          <h3>Getting Started</h3>
          <ol>
            <li>Browse tutor profiles above</li>
            <li>Check their availability and pricing</li>
            <li>Book a trial lesson to find your perfect match</li>
            <li>Start learning {displayName} today!</li>
          </ol>
        </div>
      </section>

      {/* Back Link */}
      <section className="px-4 py-6 border-t">
        <div className="max-w-6xl mx-auto">
          <Link
            href={`/tutors/${language}`}
            className="text-blue-600 hover:underline"
          >
            ← Back to all {displayName} Tutors
          </Link>
        </div>
      </section>
    </div>
  );
}
