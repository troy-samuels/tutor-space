import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lesson Recap — TutorLingua",
  description: "Interactive lesson recap from your tutor.",
};

export default function StudentRecapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      {children}
    </div>
  );
}
