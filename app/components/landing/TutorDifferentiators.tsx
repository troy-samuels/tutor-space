import type { LandingCopy } from "@/lib/constants/landing-copy";
import { Reveal } from "./motion";

type Props = {
  comparison: LandingCopy["comparison"];
};

export function TutorDifferentiators({ comparison }: Props) {
  const headers = comparison.tableHeaders ?? {
    feature: "Feature",
    marketplace: "Marketplace",
    platform: "TutorLingua",
  };

  return (
    <section className="bg-muted py-24 sm:py-32 lg:py-40">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center mb-14 sm:mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
              Why tutors switch to TutorLingua.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {comparison.caption}
            </p>
          </div>
        </Reveal>

        {/* Desktop table */}
        <Reveal>
          <div className="hidden lg:block">
            <div className="rounded-2xl bg-background border border-border overflow-hidden shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-5 text-sm font-medium text-muted-foreground">{headers.feature}</th>
                    <th className="text-center p-5 text-sm font-medium text-muted-foreground">{headers.marketplace}</th>
                    <th className="text-center p-5 text-sm font-medium text-primary bg-primary/5">{headers.platform}</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.columns.slice(1).map((row, index) => (
                    <tr key={index} className="border-b border-border last:border-0">
                      <td className="p-5 text-sm font-medium text-foreground">{row.label}</td>
                      <td className="p-5 text-center text-sm text-muted-foreground">{row.marketplace}</td>
                      <td className="p-5 text-center text-sm font-medium text-foreground bg-primary/[0.02]">{row.platform}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>

        {/* Mobile cards */}
        <div className="lg:hidden space-y-3">
          {comparison.columns.slice(1).map((row, index) => (
            <Reveal key={index} delay={index * 0.05}>
              <div className="bg-background rounded-xl border border-border p-4 shadow-sm">
                <p className="text-sm font-semibold text-foreground mb-3">{row.label}</p>
                <div className="flex justify-between items-center gap-4">
                  <div className="flex-1 text-center">
                    <p className="text-[10px] text-muted-foreground mb-1">{headers.marketplace}</p>
                    <p className="text-sm text-muted-foreground">{row.marketplace}</p>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div className="flex-1 text-center">
                    <p className="text-[10px] text-primary mb-1">{headers.platform}</p>
                    <p className="text-sm font-medium text-foreground">{row.platform}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
