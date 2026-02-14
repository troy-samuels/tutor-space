"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import TypingIndicator from "./TypingIndicator";

interface ChatBubbleProps {
  type: "ai" | "student";
  content?: string;
  isTyping?: boolean;
  errorText?: string;
}

const springTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
};

export default function ChatBubble({
  type,
  content,
  isTyping = false,
  errorText,
}: ChatBubbleProps) {
  if (type === "ai") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
        className="flex gap-3 px-4 mb-3"
      >
        <div className="w-8 h-8 rounded-full backdrop-blur-md bg-primary/[0.15] border border-primary/30 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div className="backdrop-blur-md bg-white/[0.04] border border-white/[0.08] rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
          {isTyping ? (
            <TypingIndicator />
          ) : (
            <p className="text-sm leading-relaxed">{content}</p>
          )}
        </div>
      </motion.div>
    );
  }

  // Student bubble
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransition}
      className="flex justify-end px-4 mb-3"
    >
      <div className="backdrop-blur-xl bg-primary rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%] shadow-[0_0_20px_-10px_rgba(232,120,77,0.3)]">
        {errorText ? (
          <p className="text-sm text-card leading-relaxed">
            {renderWithError(content || "", errorText)}
          </p>
        ) : (
          <p className="text-sm text-card leading-relaxed">{content}</p>
        )}
      </div>
    </motion.div>
  );
}

// Helper to render text with inline error highlighting
function renderWithError(content: string, errorText: string) {
  const parts = content.split(errorText);
  if (parts.length === 1) {
    return content;
  }

  return (
    <>
      {parts[0]}
      <span className="bg-card/20 px-1 rounded underline decoration-wavy decoration-card/60">
        {errorText}
      </span>
      {parts[1]}
    </>
  );
}
