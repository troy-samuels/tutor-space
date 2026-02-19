import type { Metadata } from "next";
import GameHub from "@/components/games/engine/GameHub";

export const metadata: Metadata = {
  title: "Language Games | TutorLingua",
  description:
    "Play daily language games: Byte Choice, Pixel Pairs, and Relay Sprint. Build vocabulary and track your streak.",
  alternates: {
    canonical: "/games",
  },
  openGraph: {
    title: "Language Games | TutorLingua",
    description:
      "Play daily language games — translate words, match pairs, and intercept translations against the clock.",
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
    title: "Language Games | TutorLingua",
    description:
      "Play daily language games — translate, match, and intercept. Difficulty adapts to your level.",
    images: ["/og-image.png?v=2"],
  },
};

export default function GamesPage() {
  return <GameHub />;
}
