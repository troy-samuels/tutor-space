import type { Metadata } from "next";
import LevelTestGame from "@/components/english/level-test/LevelTestGame";

export const metadata: Metadata = {
  title: "English Level Test — A1 to C2",
  description:
    "Find out your English level with our free 20-question CEFR placement test. Get an instant result from A1 (Beginner) to C2 (Mastery).",
  openGraph: {
    title: "What's your English level? Take the free 5-minute test",
    description:
      "20 questions covering grammar, vocabulary and usage. Get your CEFR level instantly.",
  },
};

export default function LevelTestPage() {
  return <LevelTestGame />;
}
