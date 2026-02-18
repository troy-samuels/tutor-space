import type { Metadata } from "next";
import Link from "next/link";
import { TOOL_LANGUAGES } from "@/lib/tools/types";

export const metadata: Metadata = {
  title: "Language Learning Tools",
  description:
    "Free daily tools for language learners. Test your level (A1–C2), master idioms and expressions, and build vocabulary — in English, Spanish, French, German and more.",
};

const TOOLS = [
  {
    href: "/tools/level-test",
    emoji: "🎯",
    title: "Level Test",
    description: "Find out your CEFR level in 20 questions",
    accent: "#D36135",
    accentBg: "rgba(211,97,53,0.08)",
    badge: "Most popular",
  },
  {
    href: "/tools/daily-challenge",
    emoji: "🧩",
    title: "Daily Challenge",
    description: "Phrasal verbs, false friends & expressions — 5 every day",
    accent: "#7C4FD0",
    accentBg: "rgba(124,79,208,0.08)",
    badge: "Daily",
  },
  {
    href: "/tools/vocab",
    emoji: "📖",
    title: "Word of the Day",
    description: "Advanced vocabulary with etymology & a mini quiz",
    accent: "#0D9668",
    accentBg: "rgba(13,150,104,0.08)",
    badge: "Daily",
  },
];

export default function ToolsHubPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <div className="text-center py-4">
        <div className="text-4xl mb-3">🌍</div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Language Learning Tools
        </h1>
        <p className="text-foreground/60 text-base leading-relaxed">
          Free daily tools to take your language skills to the next level.
          <br />
          No login required.
        </p>
      </div>

      {/* Language pills */}
      <div className="bg-white rounded-2xl border border-black/8 p-4 shadow-soft">
        <p className="text-xs font-semibold text-foreground/40 uppercase tracking-wider text-center mb-3">
          Supported Languages
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {TOOL_LANGUAGES.map((lang) => (
            <div key={lang.code} className="flex items-center gap-1.5 text-sm font-medium text-foreground/70">
              <span className="text-base">{lang.flag}</span>
              <span>{lang.name}</span>
            </div>
          ))}
        </div>
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
              <svg className="w-4 h-4 text-foreground/30 flex-shrink-0 mt-1 group-hover:text-foreground/60 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {/* How each tool adapts */}
      <div className="bg-white rounded-2xl border border-black/8 p-5 shadow-soft">
        <p className="text-xs font-semibold text-foreground/40 uppercase tracking-wider mb-4 text-center">
          How tools adapt per language
        </p>
        <div className="space-y-3 text-sm">
          {[
            { flag:"🇬🇧", lang:"English", note:"Phrasal verbs · Advanced vocab · CEFR grammar" },
            { flag:"🇪🇸", lang:"Spanish", note:"Falsos amigos · Ser vs estar · Subjunctive" },
            { flag:"🇫🇷", lang:"French", note:"Faux amis · Passé composé vs imparfait · Subjonctif" },
            { flag:"🇩🇪", lang:"German", note:"Falsche Freunde · Cases & word order · Konjunktiv" },
          ].map(({ flag, lang, note }) => (
            <div key={lang} className="flex items-start gap-3">
              <span className="text-base flex-shrink-0">{flag}</span>
              <div>
                <span className="font-semibold text-foreground">{lang}</span>
                <span className="text-foreground/50 ml-2">{note}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust bar */}
      <div className="grid grid-cols-3 gap-3">
        {[["📊","CEFR-aligned"],["🔒","Free forever"],["🌍","50+ countries"]].map(([icon, label]) => (
          <div key={String(label)} className="bg-white rounded-xl border border-black/8 p-3 text-center shadow-soft">
            <div className="text-xl mb-1">{icon}</div>
            <p className="text-xs font-medium text-foreground/60">{label}</p>
          </div>
        ))}
      </div>

      {/* Cross-link to games */}
      <div className="text-center">
        <p className="text-sm text-foreground/40">
          Also try our{" "}
          <Link href="/games" className="text-primary font-medium hover:underline">
            language games →
          </Link>
        </p>
      </div>
    </div>
  );
}
