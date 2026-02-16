import type { Metadata } from "next";
import GameHub from "@/components/games/engine/GameHub";

export const metadata: Metadata = {
  title: "Language Games | TutorLingua",
  description:
    "Daily word games to sharpen your language skills. Play Lingua Connections, Word Ladder, and more.",
  openGraph: {
    title: "Language Games | TutorLingua",
    description:
      "Daily word games to sharpen your language skills. Play Lingua Connections, Word Ladder, and more.",
  },
};

export default function GamesPage() {
  return <GameHub />;
}
