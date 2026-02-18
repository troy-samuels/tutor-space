import type { Metadata } from "next";
import GameHub from "@/components/games/engine/GameHub";

export const metadata: Metadata = {
  title: "Language Games | Daily Word Games for Learners",
  description:
    "Play daily language games built for real fluency: Connections, Word Ladder, Daily Decode, Synonym Spiral, and more.",
  alternates: {
    canonical: "/games",
  },
  openGraph: {
    title: "Language Games | Daily Word Games for Learners",
    description:
      "Train vocabulary, pattern recognition, and natural phrasing with daily language games.",
    url: "/games",
    type: "website",
    images: [
      {
        url: "/og-image.png?v=2",
        width: 1200,
        height: 630,
        alt: "TutorLingua language games hub",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Language Games | Daily Word Games for Learners",
    description:
      "Play Connections, Word Ladder, Daily Decode, Synonym Spiral, and more.",
    images: ["/og-image.png?v=2"],
  },
};

export default function GamesPage() {
  return <GameHub />;
}
