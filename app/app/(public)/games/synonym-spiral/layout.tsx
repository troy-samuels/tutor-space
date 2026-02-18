import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Synonym Spiral | Climb the Tower of Synonyms",
  description:
    "Play Synonym Spiral — find increasingly advanced synonyms from basic to poetic. Expand your vocabulary across 5 difficulty levels in 4 languages.",
  alternates: { canonical: "/games/synonym-spiral" },
  openGraph: {
    title: "Synonym Spiral | Vocabulary Builder",
    description: "Climb from basic to literary synonyms. Expand your vocabulary in 4 languages.",
    url: "/games/synonym-spiral",
    type: "website",
    images: [{ url: "/og-image.png?v=2", width: 1200, height: 630, alt: "Synonym Spiral vocabulary game" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Synonym Spiral | Vocabulary Builder",
    description: "Climb the tower of synonyms. Play free in 4 languages.",
    images: ["/og-image.png?v=2"],
  },
};

export default function SynonymSpiralLayout({ children }: { children: React.ReactNode }) {
  return children;
}
