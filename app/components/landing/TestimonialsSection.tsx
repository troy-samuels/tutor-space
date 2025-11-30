import type { LandingCopy } from "@/lib/constants/landing-copy";

type TestimonialsSectionProps = {
  testimonials: LandingCopy["testimonials"];
};

export function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {

  return (
    <section id="testimonials" className="bg-muted py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Headline with subheadline */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {testimonials.headline}
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Join thousands of tutors earning more and working less with TutorLingua
          </p>
        </div>

        {/* Featured testimonial */}
        <div className="mx-auto mt-12 max-w-3xl">
          <div className="rounded-3xl bg-card p-8 sm:p-10 shadow-lg">
            <blockquote className="text-lg sm:text-xl leading-relaxed text-foreground">
              &ldquo;{testimonials.featured.quote}&rdquo;
            </blockquote>
            <div className="mt-6 flex items-center gap-x-4 border-t border-gray-100 pt-6">
              <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center text-xl font-bold text-primary-foreground">
                {testimonials.featured.author.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-foreground">
                  {testimonials.featured.author}
                </div>
                <div className="text-sm text-gray-600">
                  {testimonials.featured.role}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid of testimonials - centered */}
        <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
          {testimonials.list.map((testimonial, index) => (
            <div
              key={index}
              className="relative rounded-2xl bg-card p-6 shadow-md transition-all hover:-translate-y-1 hover:shadow-lg group"
            >
              <blockquote className="text-base leading-relaxed text-foreground mb-6">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-x-3 border-t border-gray-100 pt-6">
                <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-lg font-bold text-primary-foreground transition-transform group-hover:scale-110">
                  {testimonial.author.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-foreground text-sm">
                    {testimonial.author}
                  </div>
                  <div className="text-xs text-gray-600">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
