"use client";

import { useRef, type ReactNode, useCallback } from "react";
import { cn } from "@/lib/utils";

type PhoneFrameProps = {
  children: ReactNode;
  className?: string;
};

export function PhoneFrame({ children, className }: PhoneFrameProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!scrollRef.current) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        scrollRef.current.scrollBy({ top: 100, behavior: "smooth" });
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        scrollRef.current.scrollBy({ top: -100, behavior: "smooth" });
      }
    },
    []
  );

  return (
    <div className={cn("relative", className)}>
      {/* Phone outer shell */}
      <div className="relative mx-auto w-[280px] sm:w-[320px] rounded-[3rem] bg-gray-900 p-3 shadow-2xl">
        {/* Dynamic Island */}
        <div className="absolute left-1/2 top-4 z-20 -translate-x-1/2">
          <div className="h-7 w-28 rounded-full bg-black" />
        </div>

        {/* Screen bezel */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-white">
          {/* Status bar */}
          <div className="absolute top-0 left-0 right-0 z-10 flex h-12 items-center justify-between px-6 text-xs font-medium text-gray-900 bg-[#faf9f7]">
            <span className="pl-1">9:41</span>
            <div className="flex items-center gap-1.5 pr-1">
              <svg
                className="h-3 w-3"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M2 17h2v4H2v-4zm5-5h2v9H7v-9zm5-5h2v14h-2V7zm5-4h2v18h-2V3z" />
              </svg>
              <svg
                className="h-3 w-3"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
              </svg>
              <div className="flex items-center">
                <div className="relative h-2.5 w-5 rounded-sm border border-gray-900 flex items-center">
                  <div className="h-1.5 w-3 ml-0.5 rounded-sm bg-gray-900" />
                </div>
                <div className="h-1 w-0.5 bg-gray-900 rounded-r-full -ml-px" />
              </div>
            </div>
          </div>

          {/* Scrollable content area */}
          <div
            ref={scrollRef}
            tabIndex={0}
            role="region"
            aria-label="Scrollable preview of a tutor website"
            onKeyDown={handleKeyDown}
            className={cn(
              "h-[580px] sm:h-[640px] overflow-y-auto scroll-smooth pt-12",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            )}
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {children}
          </div>
        </div>

        {/* Home indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
          <div className="h-1 w-32 rounded-full bg-gray-600" />
        </div>
      </div>

      {/* Subtle shadow/glow effect */}
      <div
        className="absolute inset-0 -z-10 mx-auto w-[280px] sm:w-[320px] rounded-[3rem] blur-3xl opacity-20"
        style={{
          background:
            "linear-gradient(180deg, rgba(30, 58, 95, 0.3) 0%, rgba(201, 162, 39, 0.2) 100%)",
        }}
      />
    </div>
  );
}
