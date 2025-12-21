import Link from "next/link";
import { CalendarDays } from "lucide-react";
import type { SophieMockData } from "../sophie-data";

type MockupBookingCTAProps = {
  booking: SophieMockData["booking"];
  theme: SophieMockData["theme"];
};

export function MockupBookingCTA({ booking, theme }: MockupBookingCTAProps) {
  return (
    <section
      className="px-4 py-8 text-center"
      style={{
        backgroundColor: theme.primary,
      }}
    >
      <h2
        className="text-lg font-bold text-white"
        style={{ fontFamily: '"Merriweather", Georgia, serif' }}
      >
        {booking.headline}
      </h2>
      <p className="mt-2 text-sm text-white/80">{booking.subcopy}</p>

      {/* CTA Button */}
      <Link
        href="/signup"
        className="mt-5 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold shadow-lg transition-all hover:scale-105 hover:shadow-xl"
        style={{
          backgroundColor: "#ffffff",
          color: theme.primary,
        }}
      >
        <CalendarDays className="h-4 w-4" />
        {booking.ctaLabel}
      </Link>

      {/* Trust text */}
      <p className="mt-4 text-xs text-white/60">
        Usually responds within 24 hours
      </p>
    </section>
  );
}
