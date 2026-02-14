"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Reveal, SlideIn } from "./motion";

const EASE = [0.22, 1, 0.36, 1] as const;

// ─── Scheduling visual ───
function ScheduleVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  const slots = [
    { time: "09:00", name: "Emma L.", booked: true },
    { time: "10:30", name: "", booked: false },
    { time: "13:00", name: "Kenji M.", booked: true },
    { time: "15:00", name: "", booked: false },
    { time: "16:30", name: "Sarah K.", booked: true },
  ];

  return (
    <div ref={ref} className="rounded-2xl bg-white border border-border shadow-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-foreground">Tuesday</p>
        <span className="text-xs text-muted-foreground">3 booked</span>
      </div>
      <div className="space-y-2">
        {slots.map((slot, i) => (
          <motion.div
            key={slot.time}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06, duration: 0.35, ease: EASE }}
            className={`flex items-center gap-3 p-2.5 rounded-xl ${
              slot.booked ? "bg-primary/5 border border-primary/10" : "bg-secondary border border-border"
            }`}
          >
            <span className="text-xs font-mono text-muted-foreground w-10">{slot.time}</span>
            {slot.booked ? (
              <span className="text-sm text-foreground">{slot.name}</span>
            ) : (
              <span className="text-sm text-muted-foreground italic">Open</span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Payment visual with Stripe reference ───
function PaymentVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <div ref={ref} className="rounded-2xl bg-white border border-border shadow-lg p-5">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm font-semibold text-foreground">Earnings</p>
        <span className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
          <svg className="h-2.5 w-auto" viewBox="0 0 60 25" fill="none">
            <path d="M5 12.5C5 6.15 9.92 1.25 16.25 1.25h27.5C50.08 1.25 55 6.15 55 12.5S50.08 23.75 43.75 23.75h-27.5C9.92 23.75 5 18.85 5 12.5z" fill="#635BFF"/>
            <path d="M28.5 9.2c0-1.03.84-1.42 2.23-1.42 2 0 4.52.6 6.52 1.68V4.04A17.4 17.4 0 0030.73 3c-4.47 0-7.44 2.33-7.44 6.23 0 6.08 8.37 5.11 8.37 7.73 0 1.21-1.05 1.6-2.53 1.6-2.19 0-4.99-.9-7.21-2.11v5.53c2.46 1.05 4.94 1.5 7.21 1.5 4.58 0 7.73-2.26 7.73-6.22-.02-6.56-8.36-5.4-8.36-7.86z" fill="white"/>
          </svg>
          Powered by Stripe
        </span>
      </div>

      <div className="text-center mb-5">
        <motion.span
          className="text-4xl font-bold text-foreground"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5, ease: EASE }}
        >
          $2,340
        </motion.span>
        <p className="text-sm text-muted-foreground mt-1">this month</p>
      </div>

      <div className="space-y-2">
        {[
          { label: "32 lessons completed", amount: "+$2,340" },
          { label: "Platform fee", amount: "-$29" },
          { label: "Next payout (Fri)", amount: "$2,311", bold: true },
        ].map((row, i) => (
          <motion.div
            key={row.label}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.08, duration: 0.35, ease: EASE }}
            className={`flex items-center justify-between py-2 ${
              row.bold ? "border-t border-border pt-3 mt-1" : ""
            }`}
          >
            <span className={`text-sm ${row.bold ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
              {row.label}
            </span>
            <span className={`text-sm ${
              row.bold ? "font-semibold text-emerald-600" : row.amount.startsWith("-") ? "text-muted-foreground" : "text-muted-foreground"
            }`}>
              {row.amount}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Student growth visual ───
function StudentGrowthVisual() {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} className="rounded-2xl bg-white border border-border shadow-lg p-5">
      <p className="text-sm font-semibold text-foreground mb-4">Your students</p>
      <div className="space-y-2.5">
        {[
          { name: "Emma L.", lessons: "12 lessons", status: "Active" },
          { name: "Kenji M.", lessons: "8 lessons", status: "Active" },
          { name: "Sarah K.", lessons: "3 lessons", status: "New" },
          { name: "Lucas P.", lessons: "1 lesson", status: "Trial" },
        ].map((s, i) => (
          <motion.div
            key={s.name}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.08, duration: 0.4, ease: EASE }}
            className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary border border-border"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-stone-200 to-stone-100 flex items-center justify-center text-[10px] font-bold text-muted-foreground">
              {s.name.split(" ").map(n => n[0]).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
              <p className="text-[10px] text-muted-foreground">{s.lessons}</p>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
              s.status === "Active" ? "bg-emerald-50 text-emerald-600" :
              s.status === "New" ? "bg-blue-50 text-blue-600" :
              "bg-amber-50 text-amber-600"
            }`}>
              {s.status}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function TutorValueProps() {
  return (
    <section id="features" className="py-24 sm:py-32 lg:py-40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground max-w-lg mb-20 sm:mb-28">
            Everything you need to run your business.
          </h2>
        </Reveal>

        <div className="space-y-24 sm:space-y-32">
          {/* Row 1: Scheduling */}
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            <SlideIn from="left">
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                  Scheduling that runs itself.
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Set your availability. Students book directly.
                  Time zones, reminders, and rescheduling — handled.
                </p>
              </div>
            </SlideIn>
            <SlideIn from="right">
              <ScheduleVisual />
            </SlideIn>
          </div>

          {/* Row 2: Payments (reversed) */}
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            <SlideIn from="left" className="order-2 md:order-1">
              <PaymentVisual />
            </SlideIn>
            <SlideIn from="right" className="order-1 md:order-2">
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                  Get paid after every lesson.
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Secure payments via Stripe. Automatic invoicing.
                  Set your own rates. Money hits your account weekly.
                </p>
              </div>
            </SlideIn>
          </div>

          {/* Row 3: Student management */}
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            <SlideIn from="left">
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                  Know your students.
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Track lesson history, notes, and progress for every student.
                  See who's active, who needs follow-up.
                </p>
              </div>
            </SlideIn>
            <SlideIn from="right">
              <StudentGrowthVisual />
            </SlideIn>
          </div>
        </div>
      </div>
    </section>
  );
}
