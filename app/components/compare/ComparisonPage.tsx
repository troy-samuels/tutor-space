import Link from "next/link";
import { Logo } from "@/components/Logo";

export interface ComparisonFeature {
  feature: string;
  tutorlingua: string;
  competitor: string;
  highlight?: boolean;
}

export interface PainPoint {
  quote: string;
  source: string;
}

export interface ComparisonPageProps {
  competitorName: string;
  competitorSlug: string;
  title: string;
  subtitle: string;
  heroDescription: string;
  features: ComparisonFeature[];
  painPoints: PainPoint[];
  whySwitchReasons: string[];
  otherComparisons: { name: string; slug: string }[];
}

export default function ComparisonPage({
  competitorName,
  title,
  subtitle,
  heroDescription,
  features,
  painPoints,
  whySwitchReasons,
  otherComparisons,
}: ComparisonPageProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border/50 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo variant="wordmark" className="h-6 invert" />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/recap"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Recap Tool
            </Link>
            <Link
              href="/profile-analyser"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110"
            >
              Try Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-16 text-center">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 text-sm font-medium uppercase tracking-wider text-primary">
            {subtitle}
          </p>
          <h1 className="mb-6 font-heading text-4xl leading-tight text-foreground md:text-5xl">
            {title}
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {heroDescription}
          </p>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center font-heading text-2xl text-foreground">
            Feature Comparison
          </h2>
          <div className="overflow-hidden rounded-2xl border border-border/50">
            {/* Header */}
            <div className="grid grid-cols-3 border-b border-border/50 bg-card/50 px-6 py-4">
              <span className="text-sm font-semibold text-muted-foreground">
                Feature
              </span>
              <span className="text-center text-sm font-semibold text-primary">
                TutorLingua
              </span>
              <span className="text-center text-sm font-semibold text-muted-foreground">
                {competitorName}
              </span>
            </div>
            {/* Rows */}
            {features.map((f, i) => (
              <div
                key={i}
                className={`grid grid-cols-3 border-b border-border/30 px-6 py-4 last:border-b-0 ${
                  f.highlight ? "bg-primary/5" : ""
                }`}
              >
                <span className="text-sm font-medium text-foreground">
                  {f.feature}
                </span>
                <span className="text-center text-sm text-foreground">
                  {f.tutorlingua}
                </span>
                <span className="text-center text-sm text-muted-foreground">
                  {f.competitor}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center font-heading text-2xl text-foreground">
            What Tutors Are Saying
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {painPoints.map((pp, i) => (
              <div
                key={i}
                className="rounded-xl border border-border/50 bg-card p-5"
              >
                <p className="mb-3 text-sm italic leading-relaxed text-foreground/80">
                  &ldquo;{pp.quote}&rdquo;
                </p>
                <p className="text-xs text-muted-foreground">
                  — {pp.source}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Switch */}
      <section className="px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center font-heading text-2xl text-foreground">
            Why Tutors Are Making the Switch
          </h2>
          <div className="space-y-4">
            {whySwitchReasons.map((reason, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border border-border/50 bg-card p-4"
              >
                <span className="mt-0.5 text-lg text-primary">✓</span>
                <p className="text-sm leading-relaxed text-foreground/80">
                  {reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="mb-4 font-heading text-3xl text-foreground">
            Ready to take control?
          </h2>
          <p className="mb-8 text-muted-foreground">
            Stop paying commission on students you&apos;ve already built
            relationships with. Start with our free tools.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/profile-analyser"
              className="rounded-xl bg-primary px-8 py-3.5 font-semibold text-white transition-all hover:brightness-110"
            >
              Analyse Your Profile — Free
            </Link>
            <Link
              href="/recap"
              className="rounded-xl border border-border px-8 py-3.5 font-semibold text-foreground transition-all hover:bg-card"
            >
              Try the Recap Tool
            </Link>
          </div>
        </div>
      </section>

      {/* Other comparisons */}
      <section className="border-t border-border/50 px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <h3 className="mb-4 text-center text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Other Comparisons
          </h3>
          <div className="flex justify-center gap-4">
            {otherComparisons.map((c) => (
              <Link
                key={c.slug}
                href={`/compare/${c.slug}`}
                className="rounded-lg border border-border/50 px-4 py-2 text-sm text-foreground transition-all hover:border-primary/50 hover:bg-card"
              >
                vs {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 px-6 py-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Logo variant="wordmark" className="h-4 opacity-40 invert" />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} TutorLingua. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
