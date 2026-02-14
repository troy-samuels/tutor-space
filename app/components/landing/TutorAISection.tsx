"use client";

import { Reveal, SlideIn } from "./motion";
import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

type Props = {
  copy: {
    transcript: {
      recordingLabel: string;
      timer: string;
      tutorLabel: string;
      studentLabel: string;
      lines: string[];
      mispronouncedPrefix: string;
      mispronouncedWord: string;
      mispronouncedSuffix: string;
      mispronouncedHint: string;
      correction: string;
      correctedWord: string;
      correctionHint: string;
    };
    detected: Array<{ word: string; description: string }>;
    practice: Array<{ title: string; description: string }>;
    [key: string]: unknown;
  };
};

export function TutorAISection({ copy }: Props) {
  return (
    <section className="bg-[#FDF8F5] py-24 sm:py-32 lg:py-40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-start">
          {/* Left: Explanation */}
          <SlideIn from="left">
            <div className="md:sticky md:top-32">
              <Reveal>
                <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
                  AI that makes you a better tutor.
                </h2>
                <p className="mt-6 text-xl text-muted-foreground leading-relaxed">
                  Our AI listens during lessons, spots student mistakes in real time,
                  and generates personalised homework automatically.
                </p>

                <div className="mt-10 space-y-6">
                  <div>
                    <h4 className="text-base font-semibold text-foreground">Live error detection</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Pronunciation, grammar, and vocabulary mistakes flagged as they happen.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-foreground">Auto-generated homework</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Practice exercises created from the lesson transcript. Targeted to each student's weak spots.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-foreground">Lesson summaries</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Structured notes sent to both you and your student after every session.
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>
          </SlideIn>

          {/* Right: Live demo visual */}
          <SlideIn from="right">
            <div className="space-y-4">
              {/* Transcript card */}
              <div className="rounded-2xl bg-white border border-border shadow-lg overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-2.5 bg-secondary border-b border-border">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">Live Transcript</span>
                  <span className="text-xs text-muted-foreground ml-auto">{copy.transcript.timer}</span>
                </div>

                <div className="p-5 space-y-4">
                  {/* Tutor line */}
                  <div className="flex gap-3">
                    <span className="text-[10px] font-semibold text-primary uppercase tracking-wider w-12 shrink-0 pt-0.5">
                      Tutor
                    </span>
                    <p className="text-sm text-foreground leading-relaxed">{copy.transcript.lines[0]}</p>
                  </div>

                  {/* Student line with error */}
                  <div className="flex gap-3">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider w-12 shrink-0 pt-0.5">
                      Student
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">
                        {copy.transcript.mispronouncedPrefix}
                        <span className="bg-red-50 text-red-600 px-1 py-0.5 rounded text-xs font-medium">
                          {copy.transcript.mispronouncedWord}
                        </span>
                        {copy.transcript.mispronouncedSuffix}
                      </p>
                      <p className="text-[10px] text-red-500 mt-1">
                        ⚠ {copy.transcript.mispronouncedHint}
                      </p>
                    </div>
                  </div>

                  {/* Correction */}
                  <div className="flex gap-3">
                    <span className="text-[10px] font-semibold text-primary uppercase tracking-wider w-12 shrink-0 pt-0.5">
                      Tutor
                    </span>
                    <p className="text-sm text-foreground">{copy.transcript.correction}</p>
                  </div>

                  {/* Corrected */}
                  <div className="flex gap-3">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider w-12 shrink-0 pt-0.5">
                      Student
                    </span>
                    <div>
                      <span className="bg-emerald-50 text-emerald-600 px-1 py-0.5 rounded text-xs font-medium">
                        {copy.transcript.correctedWord}
                      </span>
                      <p className="text-[10px] text-emerald-600 mt-1">
                        ✓ {copy.transcript.correctionHint}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Generated homework card */}
              <div className="rounded-2xl bg-white border border-border shadow-lg p-5">
                <p className="text-xs font-semibold text-muted-foreground mb-3">Auto-generated Practice</p>
                <div className="space-y-2">
                  {copy.practice.slice(0, 3).map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.4, ease: EASE }}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary border border-border"
                    >
                      <span className="text-primary text-xs">✓</span>
                      <span className="text-sm text-muted-foreground">{item.title}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </SlideIn>
        </div>
      </div>
    </section>
  );
}
