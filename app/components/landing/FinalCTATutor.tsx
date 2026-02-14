"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export function FinalCTATutor() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      className="relative bg-primary py-28 sm:py-36 lg:py-44 overflow-hidden"
    >
      <motion.div
        className="absolute inset-0 opacity-30"
        animate={{
          background: [
            "radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 60%)",
            "radial-gradient(ellipse at 80% 50%, rgba(255,255,255,0.15) 0%, transparent 60%)",
            "radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 60%)",
          ],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-primary-foreground"
        >
          Ready to teach on your terms?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          className="mt-6 text-xl text-primary-foreground/70"
        >
          Set up your studio in 15 minutes. Free forever.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          className="mt-12"
        >
          <Link
            href="/signup"
            className="inline-flex rounded-full bg-white px-10 py-4.5 text-lg font-semibold text-primary shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 hover:scale-[1.02]"
          >
            Start free trial
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
