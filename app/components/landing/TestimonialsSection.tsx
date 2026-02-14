import type { LandingCopy } from "@/lib/constants/landing-copy";

type TestimonialsSectionProps = {
  testimonials: LandingCopy["testimonials"];
};

export function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {

  return (
    <section id="testimonials" className="bg-muted py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Headline with subheadline */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
            {testimonials.headline}
          </h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground">
            {testimonials.subheadline}
          </p>
        </div>

        {/* Featured testimonial */}
        <div className="mx-auto mt-8 sm:mt-12 max-w-3xl">
          <div className="rounded-2xl sm:rounded-3xl bg-card p-6 sm:p-8 lg:p-10 shadow-lg">
            <blockquote className="text-base sm:text-lg lg:text-xl leading-relaxed text-foreground">
              &ldquo;{testimonials.featured.quote}&rdquo;
            </blockquote>
            <div className="mt-4 sm:mt-6 flex items-center gap-x-3 sm:gap-x-4 border-t border-gray-100 pt-4 sm:pt-6">
              <div className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 rounded-full bg-primary flex items-center justify-center text-base sm:text-lg lg:text-xl font-bold text-primary-foreground">
                {testimonials.featured.author.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-foreground text-sm sm:text-base">
                  {testimonials.featured.author}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {testimonials.featured.role}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid of testimonials - centered */}
        <div className="mx-auto mt-8 sm:mt-12 grid max-w-3xl grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
          {testimonials.list.map((testimonial, index) => (
            <div
              key={index}
              className="relative rounded-xl sm:rounded-2xl bg-card p-4 sm:p-6 shadow-md transition-all hover:-translate-y-1 hover:shadow-lg group"
            >
              <blockquote className="text-sm sm:text-base leading-relaxed text-foreground mb-4 sm:mb-6">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-x-2.5 sm:gap-x-3 border-t border-gray-100 pt-4 sm:pt-6">
                <div className="h-9 w-9 sm:h-10 sm:w-10 lg:h-12 lg:w-12 rounded-full bg-primary flex items-center justify-center text-sm sm:text-base lg:text-lg font-bold text-primary-foreground transition-transform group-hover:scale-110">
                  {testimonial.author.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-foreground text-xs sm:text-sm">
                    {testimonial.author}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">
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
