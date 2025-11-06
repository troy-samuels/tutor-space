import type { LandingCopy } from "@/lib/constants/landing-copy";

type ComparisonSectionProps = {
  comparison: LandingCopy["comparison"];
};

export function ComparisonSection({ comparison }: ComparisonSectionProps) {

  return (
    <section className="bg-brand-cream py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-brand-black sm:text-4xl">
            {comparison.headline}
          </h2>
        </div>

        {/* Comparison table */}
        <div className="mx-auto mt-16 overflow-hidden rounded-3xl bg-brand-white shadow-lg">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-brand-brown/5">
                <th className="py-5 px-6 text-left text-base font-semibold text-brand-black">
                  {comparison.tableHeaders.feature}
                </th>
                <th className="py-5 px-6 text-center text-base font-semibold text-gray-600">
                  {comparison.tableHeaders.marketplace}
                </th>
                <th className="py-5 px-6 text-center text-base font-semibold text-brand-brown">
                  {comparison.tableHeaders.platform}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {comparison.columns.slice(1).map((row, index) => (
                <tr key={index} className="hover:bg-brand-cream/30 transition-colors">
                  <td className="py-5 px-6 text-sm font-medium text-brand-black">
                    {row.label}
                  </td>
                  <td className="py-5 px-6 text-center text-sm text-gray-600">
                    {row.marketplace}
                  </td>
                  <td className="py-5 px-6 text-center text-sm font-semibold text-brand-brown">
                    {row.platform}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Caption */}
        <p className="mt-8 text-center text-sm text-gray-600 max-w-3xl mx-auto leading-relaxed">
          {comparison.caption}
        </p>
      </div>
    </section>
  );
}
