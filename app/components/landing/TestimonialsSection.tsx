import { landingCopy } from "@/lib/constants/landing-copy";

export function TestimonialsSection() {
  const { testimonials } = landingCopy;

  return (
    <section id="testimonials" className="bg-brand-cream py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-brand-black sm:text-4xl">
            {testimonials.headline}
          </h2>
        </div>

        {/* Featured testimonial */}
        <div className="mx-auto mt-16 max-w-4xl">
          <div className="rounded-3xl bg-brand-white p-10 shadow-lg">
            <blockquote className="text-xl leading-relaxed text-gray-700">
              &ldquo;{testimonials.featured.quote}&rdquo;
            </blockquote>
            <div className="mt-6 flex items-center gap-x-4">
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
        <div className="mx-auto mt-12 grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-3">
          {testimonials.list.map((testimonial, index) => (
            <div
              key={index}
              className="rounded-2xl bg-brand-white p-8 shadow-sm"
            >
              <blockquote className="text-base leading-relaxed text-gray-700 mb-6">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-x-3">
                <div className="h-12 w-12 rounded-full bg-brand-brown flex items-center justify-center text-lg font-bold text-brand-white">
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
