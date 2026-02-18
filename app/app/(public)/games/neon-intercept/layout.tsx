import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Neon Intercept | Retro Arcade Language Runner",
  description:
    "Play Neon Intercept — a child-friendly retro arcade game where you intercept the correct language answer before it lands. Daily seeded runs in 4 languages.",
  alternates: { canonical: "/games/neon-intercept" },
  openGraph: {
    title: "Neon Intercept | Retro Arcade Language Game",
    description: "Intercept the right word fast. Learn vocabulary, phrases, and false friends in daily runs.",
    url: "/games/neon-intercept",
    type: "website",
    images: [{ url: "/api/og/games?game=neon-intercept", width: 1200, height: 630, alt: "Neon Intercept game" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Neon Intercept | Retro Arcade Language Game",
    description: "A daily 90-second language arcade run in 4 languages.",
    images: ["/api/og/games?game=neon-intercept"],
  },
};

export default function NeonInterceptLayout({ children }: { children: React.ReactNode }) {
  return children;
}

