import type { Metadata } from "next";
import LevelTestGame from "@/components/tools/level-test/LevelTestGame";

export const metadata: Metadata = {
  title: "Language Level Test — A1 to C2",
  description:
    "Find out your level in English, Spanish, French or German with our free 20-question CEFR placement test. Instant results from A1 to C2.",
  openGraph: {
    title: "What's your language level? Free 5-minute CEFR test",
    description:
      "20 questions in English, Spanish, French or German. Get your CEFR level instantly — shareable like Wordle.",
  },
};

export default function LevelTestPage() {
  return <LevelTestGame />;
}
