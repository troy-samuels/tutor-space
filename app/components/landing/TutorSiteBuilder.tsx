"use client";

import { useState } from "react";
import { Globe, Palette, Share2, CalendarDays, Instagram, Facebook, Twitter, Youtube, Link2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal, SlideIn } from "./motion";

// Editorial archetype — the default page builder theme
const THEME = {
  background: "#FBFBF9",
  cardBg: "#FFFFFF",
  primary: "#A16207",
  textPrimary: "#44403C",
  textSecondary: "#78716C",
  border: "#E7E5E4",
  borderRadius: "1.5rem", // 3xl
};

const HEADING_FONT = '"DM Serif Display", Georgia, serif';
const BODY_FONT = '"Manrope", system-ui, sans-serif';

// Demo data matching Sofia Martínez
const PROFILE = {
  name: "Sofia Martínez",
  initials: "SM",
  tagline: "Making Spanish feel like home — one conversation at a time.",
  bio: "12 years teaching conversational Spanish. Based in Barcelona. Specialising in travel, expat preparation, and DELE exam coaching. My lessons are relaxed, structured, and built around your real life.",
  languages: [
    { flag: "🇪🇸", name: "Spanish" },
    { flag: "🇧🇷", name: "Portuguese" },
  ],
};

const SERVICES = [
  { name: "Trial Lesson", description: "30-minute introduction", duration: 30, price: "$11" },
  { name: "Conversational Spanish", description: "Build fluency through real dialogue", duration: 50, price: "$22" },
  { name: "DELE Exam Prep", description: "Structured preparation for B1–C1", duration: 60, price: "$28" },
];

const REVIEWS = [
  { author: "James K.", quote: "Sofia's lessons are the highlight of my week. I went from stuttering to having actual conversations in three months." },
  { author: "Mika T.", quote: "Best tutor I've had. She makes grammar click without it feeling like a textbook." },
];

const AVAILABILITY = ["Mon 10:00", "Tue 14:00", "Thu 16:30"];

const SOCIAL_ICONS = [
  { icon: Instagram, label: "Instagram" },
  { icon: Facebook, label: "Facebook" },
  { icon: Youtube, label: "YouTube" },
  { icon: Twitter, label: "X" },
];

type PageTab = "home" | "services" | "faq" | "contact";

function SiteReplica() {
  const [page, setPage] = useState<PageTab>("home");

  const pageNav: Array<{ id: PageTab; label: string }> = [
    { id: "home", label: "Home" },
    { id: "services", label: "Services" },
    { id: "faq", label: "FAQ" },
    { id: "contact", label: "Contact" },
  ];

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: THEME.background, fontFamily: BODY_FONT, borderRadius: "0 0 1rem 1rem" }}
    >
      {/* ── Cultural Banner Hero ── */}
      <section className="relative w-full">
        {/* Banner gradient */}
        <div
          className="relative h-36 w-full overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${THEME.primary}20, ${THEME.primary}05)`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
        </div>

        {/* Profile content — overlaps banner */}
        <div
          className="relative px-5 pb-5 text-center"
          style={{ backgroundColor: THEME.background }}
        >
          {/* Avatar */}
          <div className="relative -mt-12 inline-block">
            <div
              className="h-24 w-24 rounded-full shadow-lg flex items-center justify-center overflow-hidden"
              style={{
                background: `linear-gradient(135deg, #E8B4B8, ${THEME.primary})`,
                boxShadow: `0 0 0 4px ${THEME.background}`,
              }}
            >
              <span className="font-semibold text-white" style={{ fontSize: "2rem" }}>
                {PROFILE.initials}
              </span>
            </div>
          </div>

          {/* Identity Stack */}
          <div className="mt-2.5">
            <h3
              className="text-lg font-bold tracking-tight"
              style={{ color: THEME.textPrimary, fontFamily: HEADING_FONT }}
            >
              {PROFILE.name}
            </h3>

            {/* Language Row */}
            <div className="flex items-center justify-center gap-2 mt-1.5 text-xs font-semibold">
              {PROFILE.languages.map((lang, i) => (
                <span key={lang.name} style={{ color: THEME.textPrimary }}>
                  {i > 0 && (
                    <span className="mx-1" style={{ color: THEME.textSecondary, opacity: 0.4 }}>•</span>
                  )}
                  {lang.flag} {lang.name}
                </span>
              ))}
            </div>

            {/* Tagline */}
            <p className="text-xs font-medium mt-1" style={{ color: THEME.textSecondary }}>
              {PROFILE.tagline}
            </p>
          </div>

          {/* Social icons */}
          <div className="mt-3 flex justify-center gap-2 opacity-60">
            {SOCIAL_ICONS.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full"
                style={{
                  border: `1px solid ${THEME.border}`,
                  backgroundColor: THEME.cardBg,
                  color: THEME.textSecondary,
                }}
              >
                <Icon className="h-2.5 w-2.5" />
              </span>
            ))}
          </div>

          {/* Trust indicator */}
          <div
            className="mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium"
            style={{
              backgroundColor: `${THEME.primary}10`,
              color: THEME.primary,
            }}
          >
            <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Trial lesson available
          </div>
        </div>
      </section>

      {/* ── Tab Navigation ── */}
      <div className="flex justify-center gap-6 px-4 pb-3">
        {pageNav.map((nav) => (
          <button
            key={nav.id}
            type="button"
            onClick={() => setPage(nav.id)}
            className={cn(
              "pb-1.5 text-[11px] font-semibold transition-all",
              page === nav.id ? "border-b-2" : "opacity-40 hover:opacity-70"
            )}
            style={{
              color: THEME.textPrimary,
              borderColor: page === nav.id ? THEME.primary : "transparent",
            }}
          >
            {nav.label}
          </button>
        ))}
      </div>

      {/* ── Page Content ── */}
      <main className="px-4 pb-4 space-y-4">
        {page === "home" && (
          <>
            {/* About */}
            <section
              className="rounded-2xl p-4 text-center"
              style={{ border: `1px solid ${THEME.border}`, backgroundColor: THEME.cardBg }}
            >
              <h4 className="text-sm font-bold tracking-tight" style={{ color: THEME.textPrimary, fontFamily: HEADING_FONT }}>
                About
              </h4>
              <p className="mt-1.5 text-[11px] leading-relaxed" style={{ color: THEME.textSecondary }}>
                {PROFILE.bio}
              </p>
            </section>

            {/* Review */}
            <section
              className="rounded-2xl p-4 text-center"
              style={{ border: `1px solid ${THEME.border}`, backgroundColor: THEME.cardBg }}
            >
              <h4 className="text-sm font-bold tracking-tight" style={{ color: THEME.textPrimary, fontFamily: HEADING_FONT }}>
                What Students Say
              </h4>
              <blockquote
                className="mt-2 rounded-xl p-3 text-[11px]"
                style={{ border: `1px solid ${THEME.border}`, backgroundColor: THEME.background }}
              >
                <div className="flex justify-center gap-0.5 mb-1.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p style={{ color: THEME.textSecondary }}>"{REVIEWS[0].quote}"</p>
                <footer className="mt-1.5 text-[10px] font-semibold" style={{ color: THEME.textPrimary }}>
                  — {REVIEWS[0].author}
                </footer>
              </blockquote>
            </section>
          </>
        )}

        {page === "services" && (
          <section
            className="rounded-2xl p-4 text-center"
            style={{ border: `1px solid ${THEME.border}`, backgroundColor: THEME.cardBg }}
          >
            <h4 className="text-sm font-bold tracking-tight" style={{ color: THEME.textPrimary, fontFamily: HEADING_FONT }}>
              Services & Pricing
            </h4>
            <p className="mt-1 text-[10px]" style={{ color: THEME.textSecondary }}>
              Choose a lesson type that fits your goals
            </p>
            <div className="mt-3 space-y-2">
              {SERVICES.map((svc) => (
                <div
                  key={svc.name}
                  className="rounded-xl p-3 text-center"
                  style={{ border: `1px solid ${THEME.border}`, backgroundColor: THEME.background }}
                >
                  <p className="text-xs font-semibold" style={{ color: THEME.textPrimary }}>{svc.name}</p>
                  <p className="mt-0.5 text-[10px]" style={{ color: THEME.textSecondary }}>{svc.description}</p>
                  <div className="mt-1 flex items-center justify-center gap-2">
                    <span className="text-[10px]" style={{ color: THEME.textSecondary }}>{svc.duration} min</span>
                    <span className="text-xs font-semibold" style={{ color: THEME.textPrimary, fontFamily: HEADING_FONT }}>
                      {svc.price}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {page === "faq" && (
          <section
            className="rounded-2xl p-4 text-center"
            style={{ border: `1px solid ${THEME.border}`, backgroundColor: THEME.cardBg }}
          >
            <h4 className="text-sm font-bold tracking-tight" style={{ color: THEME.textPrimary, fontFamily: HEADING_FONT }}>
              Frequently Asked Questions
            </h4>
            <div className="mt-3 space-y-2">
              {[
                { q: "What's your teaching style?", a: "Conversational and structured. We work with real scenarios — ordering food, job interviews, travel — so you learn language you'll actually use." },
                { q: "Do you offer trial lessons?", a: "Yes! 30-minute trial for $11. No commitment, just a chance to see if we're a good fit." },
                { q: "How do online lessons work?", a: "We meet on Zoom or Google Meet. I share materials during the call and send a summary after each lesson." },
              ].map((item, i) => (
                <div
                  key={i}
                  className="rounded-xl p-3 text-left"
                  style={{ border: `1px solid ${THEME.border}`, backgroundColor: THEME.background }}
                >
                  <p className="text-[11px] font-semibold" style={{ color: THEME.textPrimary }}>{item.q}</p>
                  <p className="mt-1 text-[10px] leading-relaxed" style={{ color: THEME.textSecondary }}>{item.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {page === "contact" && (
          <section
            className="rounded-2xl p-5 text-center"
            style={{ border: `1px solid ${THEME.border}`, backgroundColor: THEME.cardBg }}
          >
            <h4 className="text-base font-bold" style={{ color: THEME.textPrimary, fontFamily: HEADING_FONT }}>
              Ready to start?
            </h4>
            <p className="mt-1 text-[11px]" style={{ color: THEME.textSecondary }}>
              Pick a time that works — we'll map out goals in the first call.
            </p>

            {/* Availability slots */}
            <div
              className="mt-3 rounded-xl p-3"
              style={{ backgroundColor: THEME.background, border: `1px solid ${THEME.border}` }}
            >
              <p className="text-[10px] font-medium mb-2" style={{ color: THEME.textSecondary }}>Next available</p>
              <div className="grid grid-cols-3 gap-1.5">
                {AVAILABILITY.map((slot) => (
                  <div
                    key={slot}
                    className="text-center py-1.5 rounded-lg text-[10px] font-medium"
                    style={{
                      backgroundColor: THEME.cardBg,
                      border: `1px solid ${THEME.primary}25`,
                      color: THEME.primary,
                    }}
                  >
                    {slot}
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="mt-4 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:scale-[1.03]"
              style={{ backgroundColor: THEME.primary }}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Book a class
            </button>
            <p className="mt-2 text-[10px]" style={{ color: THEME.textSecondary, opacity: 0.7 }}>
              Usually responds within 24 hours
            </p>
          </section>
        )}
      </main>

      {/* ── Sticky bottom CTA ── */}
      {page !== "contact" && (
        <div className="sticky bottom-3 z-30 px-4 pb-3">
          <button
            type="button"
            onClick={() => setPage("contact")}
            className="w-full rounded-full py-2.5 text-xs font-bold text-white shadow-xl transition-all hover:-translate-y-0.5 active:scale-[0.98]"
            style={{
              backgroundColor: THEME.primary,
              boxShadow: `0 10px 25px -5px ${THEME.primary}30, 0 8px 10px -6px ${THEME.primary}20`,
            }}
          >
            Book a class →
          </button>
        </div>
      )}
    </div>
  );
}

export function TutorSiteBuilder() {
  return (
    <section className="bg-[#FDF8F5] py-24 sm:py-32 lg:py-40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Left: Site Replica in browser frame */}
          <SlideIn from="left">
            <div className="rounded-2xl bg-white border border-stone-200 shadow-xl overflow-hidden max-w-[380px] mx-auto">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-stone-50 border-b border-stone-100">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
                </div>
                <div className="flex-1 mx-3">
                  <div className="bg-stone-100 rounded-md px-3 py-1 text-[11px] text-stone-400 text-center">
                    tutorlingua.com/@sofia-martinez
                  </div>
                </div>
              </div>

              {/* Scrollable site preview */}
              <div className="h-[520px] overflow-y-auto overflow-x-hidden">
                <SiteReplica />
              </div>
            </div>
          </SlideIn>

          {/* Right: Copy */}
          <SlideIn from="right">
            <div>
              <Reveal>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-6">
                  Your booking page, ready to share.
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="text-lg text-stone-500 leading-relaxed mb-8">
                  A professional profile page where students see your bio, availability,
                  reviews, and book instantly. Choose from 5 teaching archetypes — or
                  customise everything.
                </p>
              </Reveal>

              <div className="space-y-5">
                <Reveal delay={0.2}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                      <Palette className="h-4 w-4 text-stone-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">5 teaching archetypes</p>
                      <p className="text-sm text-stone-500">Executive, Editorial, Scholar, Modernist, Artisan — each with curated colours and fonts.</p>
                    </div>
                  </div>
                </Reveal>
                <Reveal delay={0.3}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                      <Globe className="h-4 w-4 text-stone-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Your own URL</p>
                      <p className="text-sm text-stone-500">tutorlingua.com/@your-name — share it everywhere.</p>
                    </div>
                  </div>
                </Reveal>
                <Reveal delay={0.4}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                      <Share2 className="h-4 w-4 text-stone-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Services, reviews, booking</p>
                      <p className="text-sm text-stone-500">Students see your pricing, read reviews, and book — all in one page.</p>
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>
          </SlideIn>
        </div>
      </div>
    </section>
  );
}
