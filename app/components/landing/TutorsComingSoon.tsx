"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const EASE = [0.22, 1, 0.36, 1] as const;

const LANGUAGES = [
  { name: "Spanish", flag: "🇪🇸" },
  { name: "French", flag: "🇫🇷" },
  { name: "Japanese", flag: "🇯🇵" },
  { name: "German", flag: "🇩🇪" },
  { name: "Italian", flag: "🇮🇹" },
  { name: "Portuguese", flag: "🇵🇹" },
  { name: "Korean", flag: "🇰🇷" },
  { name: "Mandarin", flag: "🇨🇳" },
  { name: "Arabic", flag: "🇸🇦" },
  { name: "Dutch", flag: "🇳🇱" },
  { name: "Russian", flag: "🇷🇺" },
  { name: "English", flag: "🇬🇧" },
];

export function TutorsComingSoon() {
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function toggleLang(name: string) {
    setSelectedLangs((prev) =>
      prev.includes(name) ? prev.filter((l) => l !== name) : [...prev, name]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: Wire to Supabase waitlist table
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          {/* Premium illustration */}
          <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-amber-50 border border-primary/15 shadow-sm">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary/30" />
              <circle cx="8.5" cy="10" r="1.5" fill="currentColor" className="text-primary" />
              <circle cx="15.5" cy="10" r="1.5" fill="currentColor" className="text-primary" />
              <path d="M8 14.5c0 0 1.5 2.5 4 2.5s4-2.5 4-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-primary" />
              <path d="M4.5 8.5C3.5 7 4 4.5 6.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-primary/40" />
              <path d="M19.5 8.5C20.5 7 20 4.5 17.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-primary/40" />
              <path d="M9 2.5c1-.5 2-.5 3-.5s2 0 3 .5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-primary/50" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Tutors are on their way.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-md mx-auto">
            We're onboarding expert language tutors right now.
            Tell us what you want to learn and we'll notify you first.
          </p>
        </motion.div>

        {!submitted ? (
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
            className="mt-10 space-y-6"
          >
            {/* Language selection */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">
                What languages interest you?
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.name}
                    type="button"
                    onClick={() => toggleLang(lang.name)}
                    className={`
                      flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium
                      border transition-all duration-200
                      ${
                        selectedLangs.includes(lang.name)
                          ? "bg-primary/10 border-primary/40 text-primary"
                          : "bg-white border-border text-muted-foreground hover:border-border"
                      }
                    `}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                required
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 rounded-full border border-border px-5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <button
                type="submit"
                className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:-translate-y-0.5"
              >
                Notify me
              </button>
            </div>
          </motion.form>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="mt-10 rounded-2xl bg-emerald-50 border border-emerald-200 p-6"
          >
            <span className="text-3xl block mb-2">✅</span>
            <p className="text-lg font-semibold text-emerald-800">You're on the list!</p>
            <p className="text-sm text-emerald-600 mt-1">
              We'll email you as soon as {selectedLangs.length > 0 ? selectedLangs.join(", ") : "language"} tutors are available.
            </p>
          </motion.div>
        )}

        {/* Meanwhile CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-10"
        >
          <p className="text-sm text-muted-foreground mb-3">In the meantime</p>
          <Link
            href="/practice"
            className="inline-flex items-center gap-2 rounded-full bg-secondary px-6 py-3 text-sm font-semibold text-foreground transition-all duration-300 hover:bg-secondary hover:-translate-y-0.5"
          >
            🎯 Start practising with AI — it's free
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
