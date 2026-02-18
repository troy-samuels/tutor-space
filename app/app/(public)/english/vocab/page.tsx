import type { Metadata } from "next";
import VocabBuilder from "@/components/english/vocab/VocabBuilder";

export const metadata: Metadata = {
  title: "Word of the Day — Advanced English Vocabulary",
  description:
    "Expand your English vocabulary with a new advanced word every day. Definition, etymology, synonyms, collocations and a mini quiz.",
  openGraph: {
    title: "English Word of the Day — Learn one new word daily",
    description:
      "Advanced vocabulary with etymology, examples and a mini quiz. Free and daily.",
  },
};

export default function VocabPage() {
  return <VocabBuilder />;
}
