import type { Metadata } from "next";
import LevelTestGame from "@/components/tools/level-test/LevelTestGame";

export const metadata: Metadata = {
  title: "Language Level Test | Free CEFR A1-C2 Placement",
  description:
    "Take a 20-question CEFR placement test in English, Spanish, French, or German and get an instant A1-C2 result with next-step guidance.",
  alternates: {
    canonical: "/tools/level-test",
  },
  openGraph: {
    title: "Free CEFR Level Test | 20 Questions, Instant Result",
    description:
      "Measure your language level in 5 minutes with CEFR-aligned scoring and shareable results.",
    url: "/tools/level-test",
    type: "website",
    images: [
      {
        url: "/og-image.png?v=2",
        width: 1200,
        height: 630,
        alt: "TutorLingua free CEFR level test",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free CEFR Level Test | 20 Questions, Instant Result",
    description:
      "Take the 5-minute placement test and get a CEFR level from A1 to C2.",
    images: ["/og-image.png?v=2"],
  },
};

export default function LevelTestPage() {
  return <LevelTestGame />;
}
