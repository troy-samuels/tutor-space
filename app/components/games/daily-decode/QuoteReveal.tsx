"use client";

import { motion } from "framer-motion";

interface QuoteRevealProps {
  plaintext: string;
  author: string;
}

export default function QuoteReveal({ plaintext, author }: QuoteRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 20,
        delay: 0.2,
      }}
      className="rounded-2xl p-6 text-center"
      style={{
        background: "rgba(62,86,65,0.06)",
        border: "1px solid rgba(62,86,65,0.25)",
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        <p className="text-lg italic leading-relaxed font-medium" style={{ color: "#2D2A26" }}>
          &ldquo;{plaintext}&rdquo;
        </p>
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="mt-3 text-sm font-medium"
          style={{ color: "#6B6560" }}
        >
          — {author}
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
