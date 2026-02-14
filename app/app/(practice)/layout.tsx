import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Practice Any Language · AI-Powered · TutorLingua",
  description:
    "Practice any language with AI. Get instant feedback on grammar, vocabulary, and fluency. No signup required.",
};

export default function PracticeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-background sm:flex sm:items-center sm:justify-center sm:p-6">
      {/* Mobile: full-screen immersive. Desktop: centred focus card with blurred backdrop */}
      <div className="dark min-h-[100dvh] sm:min-h-0 sm:h-[90dvh] sm:max-h-[900px] w-full sm:max-w-[480px] bg-[hsl(40,10%,10%)] text-[hsl(30,20%,95%)] font-sans flex flex-col relative overflow-hidden sm:rounded-3xl sm:shadow-2xl sm:ring-1 sm:ring-white/[0.08]">
        {children}
      </div>
    </div>
  );
}
