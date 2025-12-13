import Image from "next/image";
import { PasswordGateForm } from "@/components/password-gate/PasswordGateForm";
import { redirect } from "next/navigation";
import { getGateSessionFromCookies, isGateEnabled } from "@/lib/password-gate/session";

export const metadata = {
  title: "Access Required",
  robots: "noindex, nofollow",
};

export default async function PasswordGatePage() {
  // If gate is disabled, redirect to home
  if (!isGateEnabled()) {
    redirect("/");
  }

  // If already verified, redirect to home
  const session = await getGateSessionFromCookies();
  if (session?.verified) {
    redirect("/");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <div className="flex flex-col items-center gap-10">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/brand/logo-wordmark.svg"
            alt="TutorLingua"
            width={220}
            height={48}
            priority
            className="dark:invert"
          />
          <p className="text-muted-foreground text-sm">
            Early access preview
          </p>
        </div>

        {/* Password Form */}
        <PasswordGateForm />
      </div>
    </main>
  );
}
