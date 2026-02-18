import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lingua Connections | Group 16 Words into 4 Categories",
  description:
    "Play Lingua Connections — a daily word puzzle where you find hidden links between 16 words. Available in English, Spanish, French, and German.",
  alternates: {
    canonical: "/games/connections",
  },
  openGraph: {
    title: "Lingua Connections | Daily Word Puzzle",
    description:
      "Can you group 16 words into 4 hidden categories? Play free in 4 languages.",
    url: "/games/connections",
    type: "website",
    images: [
      {
        url: "/api/og/games?game=connections",
        width: 1200,
        height: 630,
        alt: "Lingua Connections word puzzle game",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lingua Connections | Daily Word Puzzle",
    description: "Group 16 words into 4 hidden categories. Play free in 4 languages.",
    images: ["/api/og/games?game=connections"],
  },
};

export default function ConnectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
