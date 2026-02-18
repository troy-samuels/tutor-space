import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Missing Piece | Fill in the Correct Word",
  description:
    "Play Missing Piece — choose the right word to complete each sentence. Tests grammar, prepositions, tenses, and collocations. Daily puzzles in 4 languages.",
  alternates: { canonical: "/games/missing-piece" },
  openGraph: {
    title: "Missing Piece | Grammar Puzzle",
    description: "Fill in the missing word. Test your grammar in 4 languages.",
    url: "/games/missing-piece",
    type: "website",
    images: [{ url: "/api/og/games?game=missing-piece", width: 1200, height: 630, alt: "Missing Piece grammar game" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Missing Piece | Grammar Puzzle",
    description: "Fill in the missing word. Play free in 4 languages.",
    images: ["/api/og/games?game=missing-piece"],
  },
};

export default function MissingPieceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
