import type { Metadata } from "next";
import DailyChallenge from "@/components/tools/daily-challenge/DailyChallenge";

export const metadata: Metadata = {
  title: "Daily Language Challenge | 5 Questions to Sharpen Accuracy",
  description:
    "Solve five new language traps each day: English phrasal verbs, Spanish falsos amigos, French faux amis, and German false friends.",
  alternates: {
    canonical: "/tools/daily-challenge",
  },
  openGraph: {
    title: "Daily Language Challenge | 5 New Questions Every Day",
    description:
      "Train accuracy with daily traps across English, Spanish, French, and German. Can you hit 5/5?",
    url: "/tools/daily-challenge",
    type: "website",
    images: [
      {
        url: "/og-image.png?v=2",
        width: 1200,
        height: 630,
        alt: "TutorLingua daily language challenge",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Daily Language Challenge | 5 New Questions Every Day",
    description:
      "Solve daily language traps and share your score card.",
    images: ["/og-image.png?v=2"],
  },
};

export default function DailyChallengePage() {
  return <DailyChallenge />;
}
