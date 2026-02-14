"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Calendar,
  CreditCard,
  Users,
  Sparkles,
  ArrowRight,
  Search,
  Zap,
} from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

const FEATURES = [
  { icon: Calendar, label: "Booking pages" },
  { icon: CreditCard, label: "0% commission" },
  { icon: Users, label: "Student CRM" },
  { icon: Sparkles, label: "AI lesson tools" },
];

const SOCIAL_PROOF = [
  "2,400+ tutors analysed",
  "Average profile score: 61/100",
  "Top 10% score 85+",
];

export function HeroTutor() {
  const router = useRouter();
  const [profileUrl, setProfileUrl] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleAnalyse = () => {
    if (profileUrl.trim()) {
      router.push(`/profile-analyser?url=${encodeURIComponent(profileUrl.trim())}`);
    } else {
      router.push("/profile-analyser");
    }
  };

  return (
    <section className="relative overflow-hidden bg-background py-20 sm:py-28 lg:py-36">
      {/* Subtle gradient accent */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-primary/3 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Left: Copy + Profile Analyser CTA */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6"
            >
              <Zap className="h-3.5 w-3.5" />
              Free AI Profile Analysis — no signup needed
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.05 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]"
            >
              Your tutoring profile is leaving money on the table.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.15 }}
              className="mt-6 text-xl text-muted-foreground leading-relaxed"
            >
              Get a free AI analysis of your Preply or iTalki profile. 
              See exactly what&apos;s costing you students — and how to fix it in 5 minutes.
            </motion.p>

            {/* Inline Profile Analyser Input */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.3 }}
              className="mt-8"
            >
              <div
                className={`flex items-center gap-2 rounded-2xl border-2 bg-white p-1.5 transition-all duration-300 ${
                  isFocused
                    ? "border-primary shadow-[0_0_0_4px_rgba(255,90,31,0.1)]"
                    : "border-border shadow-lg"
                }`}
              >
                <Search className="ml-3 h-5 w-5 text-muted-foreground shrink-0" />
                <input
                  type="url"
                  value={profileUrl}
                  onChange={(e) => setProfileUrl(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyse()}
                  placeholder="Paste your Preply or iTalki profile URL..."
                  className="flex-1 bg-transparent border-none outline-none text-base text-foreground placeholder:text-muted-foreground/60 py-2.5 px-1"
                />
                <button
                  onClick={handleAnalyse}
                  className="shrink-0 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary-button hover:shadow-lg active:scale-[0.98]"
                >
                  Analyse free
                  <ArrowRight className="inline-block ml-1.5 h-4 w-4" />
                </button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Works with Preply and iTalki profiles · No sign-up required · Results in 30 seconds
              </p>
            </motion.div>

            {/* Feature pills */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.45 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <span
                    key={f.label}
                    className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3.5 py-1.5 text-sm text-muted-foreground"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {f.label}
                  </span>
                );
              })}
            </motion.div>

            {/* Secondary CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.55 }}
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4"
            >
              <Link
                href="/signup"
                className="rounded-full bg-foreground px-8 py-3.5 text-center text-sm font-semibold text-background transition-all duration-300 hover:bg-foreground/90"
              >
                Start building your site
              </Link>
              <Link
                href="#features"
                className="rounded-full border border-border px-8 py-3.5 text-center text-sm font-semibold text-foreground transition-all duration-300 hover:bg-secondary"
              >
                See how it works
              </Link>
            </motion.div>
          </div>

          {/* Right: Product preview */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.3 }}
          >
            <div className="rounded-2xl bg-white border border-border shadow-xl overflow-hidden">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-secondary border-b border-border">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
                </div>
                <div className="flex-1 mx-3">
                  <div className="bg-background rounded-md px-3 py-1 text-[11px] text-muted-foreground text-center">
                    tutorlingua.com/dashboard
                  </div>
                </div>
              </div>

              {/* Dashboard preview */}
              <div className="p-5 space-y-4">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "This week", value: "12 lessons", color: "text-foreground" },
                    { label: "Earned", value: "$528", color: "text-emerald-600" },
                    { label: "Students", value: "14 active", color: "text-foreground" },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-secondary rounded-xl p-3 text-center">
                      <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                      <p className={`text-sm font-semibold ${stat.color} mt-0.5`}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Today's schedule */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Today</p>
                  <div className="space-y-2">
                    {[
                      { time: "09:00", name: "Emma L.", lang: "🇪🇸 Spanish", status: "Confirmed" },
                      { time: "11:30", name: "Kenji M.", lang: "🇯🇵 Japanese", status: "Confirmed" },
                      { time: "14:00", name: "Sarah K.", lang: "🇫🇷 French", status: "Pending" },
                    ].map((lesson) => (
                      <div key={lesson.time} className="flex items-center gap-3 bg-secondary rounded-xl p-2.5">
                        <span className="text-xs font-mono text-muted-foreground w-10">{lesson.time}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{lesson.name}</p>
                          <p className="text-[10px] text-muted-foreground">{lesson.lang}</p>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          lesson.status === "Confirmed"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-amber-50 text-amber-600"
                        }`}>
                          {lesson.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
