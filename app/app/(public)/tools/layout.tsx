import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: {
    template: "%s | TutorLingua",
    default: "Language Learning Tools | TutorLingua",
  },
  description:
    "Free learner tools to test your CEFR level, practise daily language traps, and build active vocabulary in English, Spanish, French, and German.",
  alternates: {
    canonical: "/tools",
  },
  openGraph: {
    title: "Language Learning Tools | TutorLingua",
    description:
      "Train with a CEFR level test, daily challenge sets, and advanced vocabulary drills.",
    url: "/tools",
    type: "website",
    siteName: "TutorLingua",
    images: [
      {
        url: "/og-image.png?v=2",
        width: 1200,
        height: 630,
        alt: "TutorLingua language learning tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Language Learning Tools | TutorLingua",
    description:
      "CEFR level test, daily challenge sets, and vocabulary drills for serious language learners.",
    images: ["/og-image.png?v=2"],
  },
};

const TOOLS = [
  { href: "/tools/level-test", label: "Level Test", emoji: "🎯" },
  { href: "/tools/daily-challenge", label: "Daily Challenge", emoji: "🧩" },
  { href: "/tools/vocab", label: "Word of the Day", emoji: "📖" },
];

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh]" style={{ background: "var(--background)" }}>
      <nav
        className="sticky top-0 z-40 px-4 py-3 backdrop-blur-sm"
        style={{
          background: "rgba(253,248,245,0.92)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <Logo href="/tools" variant="wordmark" className="h-7" />
          <div className="flex items-center gap-1">
            {TOOLS.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="text-xs font-medium text-foreground/60 hover:text-foreground px-2.5 py-1.5 rounded-lg hover:bg-black/5 transition-colors"
              >
                <span>{t.emoji}</span>
                <span className="hidden sm:inline ml-1">{t.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-lg mx-auto px-4 py-6 pb-24">
        <Suspense>{children}</Suspense>
      </main>
    </div>
  );
}
