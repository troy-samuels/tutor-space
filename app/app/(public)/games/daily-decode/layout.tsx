import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daily Decode | Crack the Cipher, Reveal the Quote",
  description:
    "Play Daily Decode — a cryptogram puzzle where you decipher famous quotes letter by letter. Daily puzzles in English, Spanish, French, and German.",
  alternates: { canonical: "/games/daily-decode" },
  openGraph: {
    title: "Daily Decode | Cryptogram Puzzle",
    description: "Crack the cipher to reveal a famous quote. Play free in 4 languages.",
    url: "/games/daily-decode",
    type: "website",
    images: [{ url: "/og-image.png?v=2", width: 1200, height: 630, alt: "Daily Decode cryptogram game" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Daily Decode | Cryptogram Puzzle",
    description: "Crack the cipher, reveal the quote. Play free in 4 languages.",
    images: ["/og-image.png?v=2"],
  },
};

export default function DailyDecodeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
