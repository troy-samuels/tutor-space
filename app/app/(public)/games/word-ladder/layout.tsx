import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Word Ladder | Change One Letter at a Time",
  description:
    "Play Word Ladder — transform one word into another by changing a single letter each step. Daily puzzles in English, Spanish, French, and German.",
  alternates: { canonical: "/games/word-ladder" },
  openGraph: {
    title: "Word Ladder | Daily Word Puzzle",
    description: "Change one letter at a time to reach the target word. Play free in 4 languages.",
    url: "/games/word-ladder",
    type: "website",
    images: [{ url: "/og-image.png?v=2", width: 1200, height: 630, alt: "Word Ladder puzzle game" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Word Ladder | Daily Word Puzzle",
    description: "Change one letter at a time. Play free in 4 languages.",
    images: ["/og-image.png?v=2"],
  },
};

export default function WordLadderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
