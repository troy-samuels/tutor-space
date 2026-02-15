import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Practice Any Language · TutorLingua",
  description:
    "Practice any language with instant feedback on grammar, vocabulary, and fluency. No signup required.",
};

export default function PracticeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-[#FDF6F0] sm:flex sm:items-center sm:justify-center sm:p-6">
      {/* Mobile: full-screen immersive. Desktop: centred focus card with blurred backdrop */}
      <div className="min-h-[100dvh] sm:min-h-0 sm:h-[90dvh] sm:max-h-[900px] w-full sm:max-w-[480px] bg-white text-foreground font-sans flex flex-col relative overflow-hidden sm:rounded-3xl sm:shadow-xl sm:ring-1 sm:ring-stone-200/60">
        {children}
      </div>
    </div>
  );
}
