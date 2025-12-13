import Image from "next/image";

export function StudioInterfaceMockup() {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-3xl bg-stone-900 shadow-2xl">
      <Image
        src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80"
        alt="Tutor on a warm, professional video call"
        fill
        priority
        sizes="(min-width: 1024px) 960px, 100vw"
        className="object-cover"
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-950/45 via-stone-950/10 to-transparent" />

      <div className="absolute right-0 top-0 m-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </span>
        Listening
      </div>

      <div className="absolute inset-x-0 bottom-0 mb-8 flex justify-center px-4 sm:px-6">
        <div className="max-w-3xl rounded-2xl border border-white/10 bg-black/40 px-8 py-4 text-center text-lg font-medium text-white shadow-lg backdrop-blur-xl">
          <span className="text-white/90">
            Let&apos;s warm up with vowels — give me your best take on{" "}
            <span className="text-orange-300 underline decoration-orange-200/60 underline-offset-4">
              bouquet
            </span>
            .
          </span>
        </div>
      </div>
    </div>
  );
}
