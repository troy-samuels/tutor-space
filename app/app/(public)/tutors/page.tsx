import { Metadata } from "next";
import Link from "next/link";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { generateTutorDirectorySchema } from "@/lib/utils/structured-data";

export const metadata: Metadata = {
  title: "Find Language Tutors | TutorLingua Directory",
  description: "Browse professional language tutors worldwide. Find your perfect tutor for Spanish, French, German, Japanese, Korean, Mandarin, and 20+ more languages. Book directly with zero commission fees.",
  keywords: ["language tutors", "find a tutor", "language teachers", "online tutoring", "private language lessons"],
  openGraph: {
    title: "Find Language Tutors | TutorLingua Directory",
    description: "Browse professional language tutors worldwide. Book directly with zero commission fees.",
    type: "website",
    url: "/tutors",
  },
};

// Popular languages for the directory
const POPULAR_LANGUAGES = [
  { name: "Spanish", slug: "spanish", emoji: "🇪🇸" },
  { name: "French", slug: "french", emoji: "🇫🇷" },
  { name: "German", slug: "german", emoji: "🇩🇪" },
  { name: "Italian", slug: "italian", emoji: "🇮🇹" },
  { name: "Portuguese", slug: "portuguese", emoji: "🇵🇹" },
  { name: "Japanese", slug: "japanese", emoji: "🇯🇵" },
  { name: "Korean", slug: "korean", emoji: "🇰🇷" },
  { name: "Mandarin", slug: "mandarin", emoji: "🇨🇳" },
  { name: "Arabic", slug: "arabic", emoji: "🇸🇦" },
  { name: "Russian", slug: "russian", emoji: "🇷🇺" },
  { name: "Dutch", slug: "dutch", emoji: "🇳🇱" },
  { name: "English", slug: "english", emoji: "🇬🇧" },
];

export default async function TutorDirectoryPage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";

  const supabaseAdmin = createServiceRoleClient();
  const supabase = supabaseAdmin ?? (await createClient());

  // Fetch tutors with basic info
  const { data: tutors, count } = await supabase
    .from("profiles")
    .select("id, username, full_name, tagline, avatar_url, languages_taught, average_rating, total_students", {
      count: "exact",
    })
    .eq("role", "tutor")
    .eq("onboarding_completed", true)
    .eq("account_status", "active")
    .order("average_rating", { ascending: false, nullsFirst: false })
    .limit(20);

  // Get unique languages count
  const uniqueLanguages = new Set<string>();
  tutors?.forEach(t => {
    const langs = Array.isArray(t.languages_taught) ? t.languages_taught : [];
    langs.forEach((l: string) => uniqueLanguages.add(l));
  });

  // Generate structured data
  const structuredData = generateTutorDirectorySchema(
    tutors?.map(t => ({
      username: t.username,
      full_name: t.full_name,
      languages_taught: t.languages_taught,
      average_rating: t.average_rating,
    })) || [],
    { pageUrl: `${baseUrl}/tutors` }
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Hero Section */}
      <section className="px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Find Your Perfect Language Tutor
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Browse {count || "100"}+ professional tutors teaching {uniqueLanguages.size || "20"}+ languages.
            Book directly with zero platform fees.
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

      {/* Browse by Language */}
      <section className="px-4 py-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Browse by Language
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {POPULAR_LANGUAGES.map(lang => (
              <Link
                key={lang.slug}
                href={`/tutors/${lang.slug}`}
                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <span className="text-2xl">{lang.emoji}</span>
                <span className="font-medium text-gray-800">{lang.name} Tutors</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Tutors */}
      <section className="px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Top-Rated Tutors
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tutors?.slice(0, 8).map(tutor => (
              <Link
                key={tutor.id}
                href={`/profile/${tutor.username}`}
                className="block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    {tutor.avatar_url ? (
                      <img
                        src={tutor.avatar_url}
                        alt={tutor.full_name || tutor.username}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xl font-bold">
                        {(tutor.full_name || tutor.username)?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {tutor.full_name || tutor.username}
                      </h3>
                      {tutor.average_rating && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <span className="text-yellow-500">★</span>
                          <span>{tutor.average_rating.toFixed(1)}</span>
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
                      {tutor.languages_taught.length > 3 && (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                          +{tutor.languages_taught.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Can&apos;t find what you&apos;re looking for?{" "}
              <Link href="/" className="text-blue-600 hover:underline">
                Search our full directory
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* SEO Content */}
      <section className="px-4 py-12 bg-white">
        <div className="max-w-4xl mx-auto prose prose-gray">
          <h2>Why Book Language Tutors on TutorLingua?</h2>
          <p>
            TutorLingua connects you directly with independent language tutors worldwide.
            Unlike traditional marketplaces that charge 15-33% commission, TutorLingua lets
            tutors keep 100% of their lesson fees, which means better rates and more motivated teachers.
          </p>
          <h3>How It Works</h3>
          <ol>
            <li>Browse our directory of verified language tutors</li>
            <li>View profiles, reviews, and available lesson types</li>
            <li>Book directly with your chosen tutor</li>
            <li>Learn online via video call from anywhere</li>
          </ol>
          <h3>Popular Languages</h3>
          <p>
            Our tutors teach over 20 languages including Spanish, French, German, Italian, Portuguese,
            Japanese, Korean, Mandarin Chinese, Arabic, Russian, Dutch, and English as a second language (ESL).
            Whether you&apos;re preparing for IELTS, DELE, DELF, or JLPT exams, or just want conversation practice,
            you&apos;ll find the right tutor here.
          </p>
        </div>
      </section>
    </div>
  );
}
