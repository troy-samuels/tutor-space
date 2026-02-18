import Script from "next/script";
import type { Metadata } from "next";
import { TelegramProvider } from "./TelegramProvider";

export const metadata: Metadata = {
  title: "Language Games | Free Daily Word Puzzles | TutorLingua",
  description:
    "Play 7 free daily word games for language learners. Lingua Connections, Word Ladder, Neon Intercept, Daily Decode, and more — in English, Spanish, French, and German. Like NYT Games, but for every language.",
  keywords: [
    "language learning games",
    "word games",
    "vocabulary games",
    "daily word puzzle",
    "language games online",
    "ESL games",
    "word puzzle",
    "connections game",
    "word ladder",
    "cryptogram puzzle",
    "free language games",
    "learn English games",
    "learn Spanish games",
    "learn French games",
    "learn German games",
  ],
  alternates: {
    canonical: "/games",
  },
  openGraph: {
    title: "Daily Language Games — Free Word Puzzles | TutorLingua",
    description:
      "6 daily word puzzles for language learners. Play in English, Spanish, French, and German. Free, no ads.",
    url: "/games",
    siteName: "TutorLingua",
    type: "website",
    locale: "en_GB",
    images: [
      {
        url: "/api/og/games",
        width: 1200,
        height: 630,
        alt: "TutorLingua Games — daily word puzzles for language learners",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Daily Language Games — Free Word Puzzles",
    description:
      "6 word games for language learners. Play in 4 languages. Free, no ads.",
    images: ["/api/og/games"],
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
};

/** JSON-LD structured data for Google rich results */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "TutorLingua Games",
  alternateName: "TutorLingua Language Games",
  description:
    "Free daily word puzzles for language learners. 7 games in English, Spanish, French, and German.",
  url: "https://tutorlingua.co/games",
  applicationCategory: "EducationalApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "GBP",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "127",
    bestRating: "5",
    worstRating: "1",
  },
  author: {
    "@type": "Organization",
    name: "TutorLingua",
    url: "https://tutorlingua.co",
  },
  inLanguage: ["en", "es", "fr", "de"],
  educationalLevel: ["Beginner", "Intermediate", "Advanced"],
  learningResourceType: "Game",
  audience: {
    "@type": "EducationalAudience",
    educationalRole: "student",
    audienceType: "Language Learner",
  },
};

export default function GamesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="beforeInteractive"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TelegramProvider>{children}</TelegramProvider>
    </>
  );
}
