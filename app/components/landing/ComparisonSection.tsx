import type { LandingCopy } from "@/lib/constants/landing-copy";

type ComparisonSectionProps = {
  comparison: LandingCopy["comparison"];
};

export function ComparisonSection({ comparison }: ComparisonSectionProps) {
  const headers = comparison.tableHeaders ?? {
    feature: "Feature",
    marketplace: "Marketplace",
    platform: "TutorLingua",
  };

  return (
    <section className="bg-muted py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
            {comparison.headline}
          </h2>
        </div>

        {/* Mobile: Stacked cards */}
        <div className="mt-10 sm:mt-12 space-y-3 lg:hidden">
          {comparison.columns.slice(1).map((row, index) => (
            <div
              key={index}
              className="bg-brand-white rounded-2xl shadow-sm border border-border p-4"
            >
              <p className="text-sm font-semibold text-foreground mb-3">
                {row.label}
              </p>
              <div className="flex justify-between items-center gap-4">
                <div className="flex-1 text-center">
                  <p className="text-xs text-muted-foreground mb-1">
                    {headers.marketplace}
                  </p>
                  <p className="text-sm text-gray-600">{row.marketplace}</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="flex-1 text-center">
                  <p className="text-xs text-muted-foreground mb-1">
                    {headers.platform}
                  </p>
                  <p className="text-sm font-semibold text-primary">
                    {row.platform}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: Comparison table */}
        <div className="hidden lg:block mx-auto mt-16 overflow-hidden rounded-3xl bg-brand-white shadow-lg">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-primary/5">
                <th className="py-5 px-6 text-left text-base font-semibold text-foreground">
                  {headers.feature}
                </th>
                <th className="py-5 px-6 text-center text-base font-semibold text-gray-600">
                  {headers.marketplace}
                </th>
                <th className="py-5 px-6 text-center text-base font-semibold text-primary">
                  {headers.platform}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {comparison.columns.slice(1).map((row, index) => (
                <tr key={index} className="hover:bg-muted/30 transition-colors">
                  <td className="py-5 px-6 text-sm font-medium text-foreground">
                    {row.label}
                  </td>
                  <td className="py-5 px-6 text-center text-sm text-gray-600">
                    {row.marketplace}
                  </td>
                  <td className="py-5 px-6 text-center text-sm font-semibold text-primary">
                    {row.platform}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Caption */}
        <p className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-gray-600 max-w-3xl mx-auto leading-relaxed">
          {comparison.caption}
        </p>
      </div>
    </section>
  );
}
