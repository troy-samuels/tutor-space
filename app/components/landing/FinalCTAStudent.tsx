"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export function FinalCTAStudent() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      className="relative bg-primary py-20 sm:py-24 lg:py-28 overflow-hidden"
    >
      {/* Animated gradient shimmer */}
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
          Your next language starts now.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          className="mt-5 text-lg text-primary-foreground/70"
        >
          Pick a language. Try a free exercise. See how far you can go.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          className="mt-10"
        >
          <Link
            href="/practice"
            className="inline-flex rounded-full bg-white px-10 py-4 text-lg font-semibold text-primary shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 hover:scale-[1.02]"
          >
            Start practising free
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
