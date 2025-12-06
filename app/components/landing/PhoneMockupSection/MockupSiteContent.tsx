"use client";

import { SOPHIE_DATA } from "./sophie-data";
import { MockupHero } from "./mockup-site-sections/MockupHero";
import { MockupAbout } from "./mockup-site-sections/MockupAbout";
import { MockupServices } from "./mockup-site-sections/MockupServices";
import { MockupReviews } from "./mockup-site-sections/MockupReviews";
import { MockupBookingCTA } from "./mockup-site-sections/MockupBookingCTA";
import { MockupFooter } from "./mockup-site-sections/MockupFooter";

export function MockupSiteContent() {
  const data = SOPHIE_DATA;

  return (
    <div
      className="min-h-full"
      style={{
        backgroundColor: data.theme.background,
        fontFamily: '"Manrope", system-ui, sans-serif',
      }}
    >
      <MockupHero
        profile={data.profile}
        social={data.social}
        theme={data.theme}
      />

      <MockupAbout about={data.about} theme={data.theme} />

      <MockupServices services={data.services} theme={data.theme} />

      <MockupReviews reviews={data.reviews} theme={data.theme} />

      <MockupBookingCTA booking={data.booking} theme={data.theme} />

      <MockupFooter social={data.social} theme={data.theme} />
    </div>
  );
}
