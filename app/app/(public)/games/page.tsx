import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Language Games | TutorLingua",
  description:
    "Daily word games to sharpen your language skills. Play Lingua Connections and more.",
  openGraph: {
    title: "Language Games | TutorLingua",
    description:
      "Daily word games to sharpen your language skills. Play Lingua Connections and more.",
  },
};

const GAMES = [
  {
    slug: "connections",
    name: "Lingua Connections",
    description: "Group 16 words into 4 hidden categories. Watch out for false friends!",
    emoji: "🔗",
    status: "live" as const,
  },
];

export default function GamesPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-lg">
        <header className="mb-8 text-center">
          <h1 className="font-heading text-3xl text-foreground">Language Games</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Daily puzzles to level up your vocabulary
          </p>
        </header>

        <div className="grid gap-4">
          {GAMES.map((game) => (
            <Link
              key={game.slug}
              href={`/games/${game.slug}`}
              className="group rounded-2xl border border-border/50 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg"
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl">{game.emoji}</span>
                <div className="flex-1">
                  <h2 className="font-heading text-lg text-foreground group-hover:text-primary transition-colors">
                    {game.name}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {game.description}
                  </p>
                </div>
                <span className="mt-1 text-muted-foreground transition-transform group-hover:translate-x-1">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          New games coming soon — one daily puzzle, every day.
        </p>
      </div>
    </div>
  );
}
