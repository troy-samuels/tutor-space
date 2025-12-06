import type { SophieMockData } from "../sophie-data";

type MockupAboutProps = {
  about: SophieMockData["about"];
  theme: SophieMockData["theme"];
};

export function MockupAbout({ about, theme }: MockupAboutProps) {
  return (
    <section className="px-4 py-6" style={{ backgroundColor: theme.background }}>
      <h2
        className="text-base font-semibold"
        style={{
          color: theme.primary,
          fontFamily: '"Merriweather", Georgia, serif',
        }}
      >
        {about.title}
      </h2>
      <p
        className="mt-2 text-sm leading-relaxed"
        style={{ color: `${theme.text}cc` }}
      >
        {about.body}
      </p>

      {/* Language badges */}
      <div className="mt-4 flex flex-wrap gap-2">
        {about.languages.map((lang) => (
          <span
            key={lang.name}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
            style={{
              backgroundColor: `${theme.primary}10`,
              color: theme.primary,
            }}
          >
            {lang.name}
            <span style={{ color: `${theme.primary}80` }}>({lang.level})</span>
          </span>
        ))}
      </div>
    </section>
  );
}
