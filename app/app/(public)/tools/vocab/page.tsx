import type { Metadata } from "next";
import VocabBuilder from "@/components/tools/vocab/VocabBuilder";

export const metadata: Metadata = {
  title: "Word of the Day | Advanced Vocabulary Builder",
  description:
    "Learn one advanced word daily in English, Spanish, French, or German with definition, etymology, collocations, and a mini quiz.",
  alternates: {
    canonical: "/tools/vocab",
  },
  openGraph: {
    title: "Word of the Day | Advanced Vocabulary With Context",
    description:
      "Build active vocabulary with daily words, usage examples, collocations, and recall quizzes.",
    url: "/tools/vocab",
    type: "website",
    images: [
      {
        url: "/og-image.png?v=2",
        width: 1200,
        height: 630,
        alt: "TutorLingua word of the day tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Word of the Day | Advanced Vocabulary With Context",
    description:
      "A daily advanced word with etymology, collocations, and a mini quiz.",
    images: ["/og-image.png?v=2"],
  },
};

export default function VocabPage() {
  return <VocabBuilder />;
}
