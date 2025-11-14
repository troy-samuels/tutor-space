import type { LandingCopy } from "@/lib/constants/landing-copy";

type TestimonialsSectionProps = {
  testimonials: LandingCopy["testimonials"];
};

export function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {

  return (
    <section id="testimonials" className="bg-brand-cream py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Headline with subheadline */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-brand-black sm:text-4xl">
            {testimonials.headline}
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Join thousands of tutors earning more and working less with TutorLingua
          </p>
        </div>

        {/* Featured testimonial */}
        <div className="mx-auto mt-16 max-w-4xl">
          <div className="rounded-3xl bg-brand-white p-8 sm:p-10 shadow-lg transition-all hover:shadow-xl">
            <blockquote className="text-lg sm:text-xl leading-relaxed text-brand-black">
              &ldquo;{testimonials.featured.quote}&rdquo;
            </blockquote>
            <div className="mt-6 flex items-center gap-x-4 border-t border-gray-100 pt-6">
              <div className="h-14 w-14 rounded-full bg-brand-brown flex items-center justify-center text-xl font-bold text-brand-white">
                {testimonials.featured.author.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-brand-black">
                  {testimonials.featured.author}
                </div>
                <div className="text-sm text-gray-600">
                  {testimonials.featured.role}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid of testimonials */}
        <div className="mx-auto mt-16 grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.list.map((testimonial, index) => (
            <div
              key={index}
              className="relative rounded-2xl bg-brand-white p-6 sm:p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg group"
            >
              <blockquote className="text-base leading-relaxed text-brand-black mb-6">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-x-3 border-t border-gray-100 pt-6">
                <div className="h-12 w-12 rounded-full bg-brand-brown flex items-center justify-center text-lg font-bold text-brand-white transition-transform group-hover:scale-110">
                  {testimonial.author.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-brand-black text-sm">
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
