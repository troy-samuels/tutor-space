import Script from "next/script";
import type { Metadata } from "next";
import { TelegramProvider } from "./TelegramProvider";

export const metadata: Metadata = {
  title: "Retro Language Games | TutorLingua",
  description:
    "Play TutorLingua's new retro trilogy: Byte Choice, Pixel Pairs, and Relay Sprint.",
  keywords: [
    "language learning games",
    "word games",
    "vocabulary games",
    "daily word puzzle",
    "language games online",
    "ESL games",
    "word puzzle",
    "retro games",
    "byte choice",
    "pixel pairs",
    "relay sprint",
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
      "Three retro language games designed for intuitive learning and adaptive progression.",
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
      "Three retro language games with adaptive difficulty and sensory feedback.",
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
    "Free retro language trilogy for learners in English and Spanish.",
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
  inLanguage: ["en", "es"],
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
