import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Recap — TutorLingua",
  description: "Turn your lesson into interactive student homework in 10 seconds.",
};

export default function RecapLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      {children}
    </div>
  );
}
