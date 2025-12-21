"use client";

import { useEffect } from "react";

export function ReadingProgress() {
  useEffect(() => {
    const progressBar = document.getElementById("reading-progress");
    const article = document.querySelector("article");
    if (!progressBar || !article) return;

    let frame = 0;
    const updateProgress = () => {
      frame = 0;
      const articleTop = (article as HTMLElement).offsetTop;
      const articleHeight = (article as HTMLElement).offsetHeight;
      const windowHeight = window.innerHeight;
      const scrollY = window.scrollY;

      const progress = Math.min(
        100,
        Math.max(0, ((scrollY - articleTop + windowHeight * 0.3) / articleHeight) * 100)
      );

      (progressBar as HTMLElement).style.width = `${progress}%`;
    };

    const onScroll = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(updateProgress);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    updateProgress();

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="fixed top-16 left-0 right-0 z-30 h-1 bg-gray-100">
      <div
        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-150"
        style={{ width: "0%" }}
        id="reading-progress"
      />
    </div>
  );
}
