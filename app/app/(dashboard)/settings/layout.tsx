import Link from "next/link";
import { SettingsNav } from "@/components/settings/settings-nav";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your profile, services, calendar sync, and billing across TutorLingua.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="hidden text-sm font-semibold text-brand-brown hover:underline md:inline-flex"
        >
          Back to dashboard
        </Link>
      </div>
      <SettingsNav />
      {children}
    </div>
  );
}
