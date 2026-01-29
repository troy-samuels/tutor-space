import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { generateTutorDirectorySchema } from "@/lib/utils/structured-data";
import { getLocationsForLanguage, getTopLocations } from "@/lib/marketing/location-data";

// Supported languages for directory
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
  hindi: { display: "Hindi", variants: ["Hindi", "हिन्दी"] },
  turkish: { display: "Turkish", variants: ["Turkish", "Türkçe"] },
  polish: { display: "Polish", variants: ["Polish", "Polski"] },
  vietnamese: { display: "Vietnamese", variants: ["Vietnamese", "Tiếng Việt"] },
  thai: { display: "Thai", variants: ["Thai", "ภาษาไทย"] },
  greek: { display: "Greek", variants: ["Greek", "Ελληνικά"] },
  swedish: { display: "Swedish", variants: ["Swedish", "Svenska"] },
  hebrew: { display: "Hebrew", variants: ["Hebrew", "עברית"] },
};

type Props = {
  params: Promise<{ language: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { language } = await params;
  const langData = SUPPORTED_LANGUAGES[language.toLowerCase()];

  if (!langData) {
    return { title: "Language Tutors | TutorLingua" };
  }

  const displayName = langData.display;
  return {
    title: `${displayName} Tutors | Find ${displayName} Teachers Online`,
    description: `Find professional ${displayName} language tutors online. Browse profiles, read reviews, and book lessons directly. 0% platform fees.`,
    keywords: [`${displayName} tutors`, `${displayName} teachers`, `learn ${displayName}`, `${displayName} lessons online`],
    openGraph: {
      title: `${displayName} Tutors | TutorLingua`,
      description: `Find professional ${displayName} language tutors online. Book directly with zero commission fees.`,
      type: "website",
      url: `/tutors/${language}`,
    },
  };
}

export async function generateStaticParams() {
  return Object.keys(SUPPORTED_LANGUAGES).map(language => ({ language }));
}

export default async function LanguageTutorDirectoryPage({ params }: Props) {
  const { language } = await params;
  const langData = SUPPORTED_LANGUAGES[language.toLowerCase()];

  if (!langData) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";
  const displayName = langData.display;
  const variants = langData.variants;

  const supabaseAdmin = createServiceRoleClient();
  const supabase = supabaseAdmin ?? (await createClient());

  // Fetch tutors who teach this language
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
  }) || [];

  // Get locations for this language
  const locations = getLocationsForLanguage(displayName).slice(0, 12);

  // Generate structured data
  const structuredData = generateTutorDirectorySchema(
    tutors.slice(0, 10).map(t => ({
      username: t.username,
      full_name: t.full_name,
      languages_taught: t.languages_taught,
      average_rating: t.average_rating,
    })),
    { language: displayName, pageUrl: `${baseUrl}/tutors/${language}` }
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Breadcrumb */}
      <nav className="px-4 py-3 bg-gray-50 border-b">
        <div className="max-w-6xl mx-auto text-sm text-gray-600">
          <Link href="/tutors" className="hover:text-blue-600">
            Tutors
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{displayName}</span>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {displayName} Tutors
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            {tutors.length > 0
              ? `Browse ${tutors.length} professional ${displayName} tutors available for online lessons.`
              : `Find professional ${displayName} tutors for online lessons.`}
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              0% Commission
            </span>
            <span>|</span>
            <span>Direct Booking</span>
            <span>|</span>
            <span>Online Lessons</span>
          </div>
        </div>
      </section>

      {/* Tutor Grid */}
      <section className="px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {tutors.length > 0 ? (
            <>
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
                            className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-2xl font-bold flex-shrink-0">
                            {(tutor.full_name || tutor.username)?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h2 className="font-semibold text-gray-900 truncate">
                            {tutor.full_name || tutor.username}
                          </h2>
                          {tutor.tagline && (
                            <p className="text-sm text-gray-600 line-clamp-1">
                              {tutor.tagline}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-1">
                            {tutor.average_rating && (
                              <span className="flex items-center gap-1 text-sm text-gray-600">
                                <span className="text-yellow-500">★</span>
                                {tutor.average_rating.toFixed(1)}
                              </span>
                            )}
                            {tutor.total_students && tutor.total_students > 0 && (
                              <span className="text-sm text-gray-500">
                                {tutor.total_students} students
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {tutor.bio && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {tutor.bio}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        {tutor.languages_taught && Array.isArray(tutor.languages_taught) && (
                          <div className="flex flex-wrap gap-1">
                            {tutor.languages_taught.slice(0, 2).map((lang: string) => (
                              <span
                                key={lang}
                                className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded"
                              >
                                {lang}
                              </span>
                            ))}
                          </div>
                        )}
                        <span className="text-sm text-blue-600 font-medium">
                          View Profile →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">
                No {displayName} tutors found yet. Check back soon!
              </p>
              <Link
                href="/tutors"
                className="text-blue-600 hover:underline"
              >
                Browse all tutors
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Browse by Location */}
      {locations.length > 0 && (
        <section className="px-4 py-12 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {displayName} Tutors by Location
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {locations.map(loc => (
                <Link
                  key={loc.slug}
                  href={`/tutors/${language}/${loc.slug}`}
                  className="px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-gray-700 hover:text-blue-700"
                >
                  {displayName} Tutors in {loc.city}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SEO Content */}
      <section className="px-4 py-12">
        <div className="max-w-4xl mx-auto prose prose-gray">
          <h2>Learn {displayName} with Professional Tutors</h2>
          <p>
            Finding the right {displayName} tutor is the key to language learning success.
            Our directory features verified tutors who specialize in {displayName} instruction,
            from complete beginners to advanced learners preparing for exams.
          </p>
          <h3>Why Choose TutorLingua for {displayName} Lessons?</h3>
          <ul>
            <li>
              <strong>Direct booking</strong> - Connect directly with tutors, no middleman
            </li>
            <li>
              <strong>Zero platform fees</strong> - Tutors keep 100%, meaning better rates for you
            </li>
            <li>
              <strong>Verified tutors</strong> - Each tutor creates their own professional profile
            </li>
            <li>
              <strong>Flexible scheduling</strong> - Book lessons that fit your schedule
            </li>
            <li>
              <strong>Online lessons</strong> - Learn from anywhere via video call
            </li>
          </ul>
          <h3>Types of {displayName} Lessons Available</h3>
          <p>
            Our tutors offer various lesson types including conversation practice,
            grammar instruction, exam preparation, business {displayName}, and lessons for kids.
            Whether you need help with pronunciation, writing, or reading comprehension,
            you&apos;ll find a tutor who matches your learning goals.
          </p>
        </div>
      </section>
    </div>
  );
}
