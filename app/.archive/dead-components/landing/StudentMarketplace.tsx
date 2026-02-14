import { Users, Search, Zap, TrendingUp } from "lucide-react";

const FEATURES = [
  {
    icon: Users,
    title: "Built-in student marketplace",
    description: "Students find you through our discovery platform — no more cold outreach or expensive ads.",
  },
  {
    icon: Search,
    title: "Searchable profile",
    description: "Your expertise, languages, availability and reviews — all visible to students actively looking for tutors.",
  },
  {
    icon: Zap,
    title: "AI practice drives demand",
    description: "Students use our free gamified practice tool, hit their limits, and come looking for a real tutor. That's you.",
  },
  {
    icon: TrendingUp,
    title: "Grow without commission",
    description: "Unlike marketplaces, you keep 100% of what you earn. We charge a flat platform fee, not a cut of your income.",
  },
];

export function StudentMarketplace() {
  return (
    <section className="bg-muted py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            We bring the students to you.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Most tutor platforms make you choose: build your own site or give up 25% commission.
            TutorLingua gives you both — a professional platform <em>and</em> a stream of students.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-7xl">
          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2">
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="relative rounded-2xl bg-background p-6 sm:p-8 transition-all duration-300 hover:-translate-y-1 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-hover)] group"
                >
                  <div className="mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center transition-transform group-hover:scale-110">
                      <Icon
                        className="text-primary"
                        size={24}
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
