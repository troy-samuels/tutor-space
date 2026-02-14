import { Suspense } from "react";
import type { Metadata } from "next";
import { ProfileAnalyserClient } from "./ProfileAnalyserClient";

export const metadata: Metadata = {
  title: "Free AI Profile Analyser for Tutors | TutorLingua",
  description:
    "Get instant AI-powered feedback on your Preply or iTalki profile. See your score, get specific recommendations, and attract more students.",
  keywords: [
    "tutor profile review",
    "Preply profile tips",
    "iTalki profile optimisation",
    "online tutor profile",
    "tutor profile feedback",
    "language tutor marketing",
    "Preply profile analyser",
    "iTalki profile analyser",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://tutorlingua.co/profile-analyser",
    title: "Free AI Profile Analyser for Tutors | TutorLingua",
    description:
      "Get instant AI-powered feedback on your Preply or iTalki profile. See your score and get actionable recommendations.",
    siteName: "TutorLingua",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free AI Profile Analyser for Tutors",
    description:
      "Paste your Preply or iTalki URL and get instant feedback on how to improve your profile and attract more students.",
  },
  robots: { index: true, follow: true },
};

export default function ProfileAnalyserPage() {
  return (
    <Suspense>
      <ProfileAnalyserClient />
    </Suspense>
  );
}
