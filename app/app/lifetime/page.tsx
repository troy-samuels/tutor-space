import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LifetimePageClient } from "./client";

export const metadata = {
  title: "Lifetime Deal - $99 for Life | TutorLingua",
  description:
    "Get lifetime access to TutorLingua for $99. One-time payment, no monthly fees. The all-in-one platform for language tutors.",
  openGraph: {
    title: "Lifetime Deal - $99 for Life | TutorLingua",
    description:
      "Get lifetime access to TutorLingua for $99. One-time payment, no monthly fees.",
    type: "website",
  },
};

export default async function LifetimePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect logged-in users to dashboard
  if (user) {
    redirect("/dashboard");
  }

  return <LifetimePageClient />;
}
