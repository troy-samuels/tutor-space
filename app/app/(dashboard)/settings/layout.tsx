import { SettingsNav } from "@/components/settings/settings-nav";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account and preferences.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-[220px,1fr]">
        <SettingsNav />
        <div className="rounded-2xl border border-border bg-white/90 p-4 shadow-sm md:p-6">{children}</div>
      </div>
    </div>
  );
}
