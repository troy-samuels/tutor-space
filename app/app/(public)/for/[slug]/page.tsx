import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NICHE_DATA, type NicheSlug } from "@/lib/marketing/niche-data";

type PageParams = {
  slug: string;
};

function getNiche(slug: string) {
  return NICHE_DATA[slug as NicheSlug];
}

export async function generateStaticParams(): Promise<PageParams[]> {
  const slugs = Object.keys(NICHE_DATA) as NicheSlug[];
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { slug } = await params;
  const niche = getNiche(slug);

  if (!niche) {
    return { title: "TutorLingua | Niche not found" };
  }

  return {
    title: `${niche.metaTitle} | TutorLingua`,
    description: niche.description,
  };
}

export default async function NicheLandingPage({ params }: { params: Promise<PageParams> }) {
  const { slug } = await params;
  const niche = getNiche(slug);

  if (!niche) {
    notFound();
  }

  const features = [
    {
      title: "AI Conversation Practice",
      body: `Let your ${niche.language} students practice speaking between lessons. You track their progress.`,
    },
    {
      title: "Audio Feedback",
      body: `Correct pronunciation with native voice notes directly in the chat. Perfect for ${niche.language} nuances.`,
    },
    {
      title: "0% Commission",
      body: `Move your loyal students off ${niche.marketplaceComparison} and keep 100% of the fee.`,
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#FDF8F5] font-sans text-foreground">
      <main className="mx-auto max-w-6xl px-4 pb-28 sm:px-6 lg:px-8">
        <section className="py-24 text-center">
          <h1 className="font-serif text-5xl leading-[1.1] text-foreground md:text-7xl">
            <span className="block">The OS for</span>
            <span className="text-primary italic">{niche.language}</span>{" "}
            <span className="md:inline">tutors</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl font-sans text-lg md:text-xl text-muted-foreground">
            A dedicated operating system for {niche.language} tutors. Replace Calendly, Stripe, and Dropbox.
          </p>
          <div className="mt-10 flex justify-center">
            <Link
              href="/signup"
              className="inline-flex h-14 items-center justify-center rounded-full bg-primary px-8 text-lg font-medium text-white shadow-lg transition-all hover:shadow-xl"
            >
              Claim Founder Account
            </Link>
          </div>
        </section>

        <section className="py-16">
          <h2 className="text-center font-serif text-3xl tracking-tight text-foreground">
            The problem with {niche.marketplaceComparison}.
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {niche.painPoints.map((point) => (
              <div
                key={point}
                className="rounded-3xl border border-stone-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-900">
                  X
                </div>
                <p className="font-sans text-lg text-stone-700">{point}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-20">
          <div className="mb-10 text-center">
            <h3 className="font-serif text-3xl tracking-tight text-foreground">Studio-grade tools for independents</h3>
            <p className="mt-3 font-sans text-base text-muted-foreground">
              Build your studio around your students, not a marketplace.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex flex-col gap-3 rounded-3xl border border-stone-100 bg-white p-8 shadow-sm"
              >
                <h4 className="font-serif text-2xl text-foreground">{feature.title}</h4>
                <p className="font-sans text-base text-stone-700">{feature.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-4 z-30 px-4">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 rounded-3xl border border-stone-100 bg-white/90 px-5 py-4 shadow-lg backdrop-blur">
          <span className="font-sans text-base text-foreground">Teach {niche.language} on your own terms.</span>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:shadow-lg"
          >
            Start Free Trial
          </Link>
        </div>
      </div>
    </div>
  );
}
