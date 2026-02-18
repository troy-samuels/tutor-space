import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "English Learning Tools | TutorLingua",
  description:
    "Free tools for English learners. Test your level (A1–C2), master phrasal verbs, and build vocabulary every day.",
};

const TOOLS = [
  {
    href: "/english/level-test",
    emoji: "🎯",
    title: "English Level Test",
    description: "20 questions · CEFR A1 to C2 · 5 minutes",
    accent: "#D36135",
    accentBg: "rgba(211,97,53,0.08)",
    badge: "Most popular",
  },
  {
    href: "/english/phrasal-verbs",
    emoji: "🧩",
    title: "Phrasal Verb Challenge",
    description: "5 new verbs daily · Fill the gap · Share your score",
    accent: "#7C4FD0",
    accentBg: "rgba(124,79,208,0.08)",
    badge: "Daily",
  },
  {
    href: "/english/vocab",
    emoji: "📖",
    title: "Word of the Day",
    description: "Advanced vocabulary · Etymology · Mini quiz",
    accent: "#0D9668",
    accentBg: "rgba(13,150,104,0.08)",
    badge: "Daily",
  },
];

export default function EnglishHubPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <div className="text-center py-4">
        <div className="text-4xl mb-3">🇬🇧</div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          English Learning Tools
        </h1>
        <p className="text-foreground/60 text-base leading-relaxed">
          Free, daily tools to take your English from good to great.
          <br />
          No login required.
        </p>
      </div>

      {/* Tool cards */}
      <div className="flex flex-col gap-3">
        {TOOLS.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group block bg-white rounded-2xl border border-black/8 p-5 shadow-soft hover:shadow-hover transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: tool.accentBg }}
              >
                {tool.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="font-bold text-foreground text-base">{tool.title}</h2>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ color: tool.accent, background: tool.accentBg }}
                  >
                    {tool.badge}
                  </span>
                </div>
                <p className="text-sm text-foreground/60">{tool.description}</p>
              </div>
              <svg
                className="w-4 h-4 text-foreground/30 flex-shrink-0 mt-1 group-hover:text-foreground/60 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {/* Trust bar */}
      <div className="bg-white rounded-2xl border border-black/8 p-4 shadow-soft">
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            ["🌍", "50+ countries"],
            ["📊", "CEFR-aligned"],
            ["🔒", "Free forever"],
          ].map(([icon, label]) => (
            <div key={label}>
              <div className="text-xl mb-1">{icon}</div>
              <p className="text-xs font-medium text-foreground/60">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Games link */}
      <div className="text-center">
        <p className="text-sm text-foreground/40">
          Also try our{" "}
          <Link
            href="/games"
            className="text-primary font-medium hover:underline"
          >
            language games →
          </Link>
        </p>
      </div>
    </div>
  );
}
