import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Odd One Out | Spot the Word That Doesn't Belong",
  description:
    "Play Odd One Out — find the imposter word in each round. Tests vocabulary, grammar categories, and language instincts. Daily puzzles in 4 languages.",
  alternates: { canonical: "/games/odd-one-out" },
  openGraph: {
    title: "Odd One Out | Daily Word Puzzle",
    description: "Spot the word that doesn't belong. Play free in 4 languages.",
    url: "/games/odd-one-out",
    type: "website",
    images: [{ url: "/og-image.png?v=2", width: 1200, height: 630, alt: "Odd One Out word game" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Odd One Out | Daily Word Puzzle",
    description: "Spot the word that doesn't belong. Play free in 4 languages.",
    images: ["/og-image.png?v=2"],
  },
};

export default function OddOneOutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
