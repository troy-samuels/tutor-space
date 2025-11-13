import { createClient } from "@/lib/supabase/server";
import { ProfileSettingsForm } from "@/components/forms/profile-settings-form";

export default async function ProfileSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, username, tagline, bio, languages_taught, timezone, website_url, avatar_url, instagram_handle, tiktok_handle, facebook_handle, x_handle, email, booking_enabled, auto_accept_bookings, buffer_time_minutes"
    )
    .eq("id", user?.id ?? "")
    .single();

  const initialValues = profile
    ? {
        ...profile,
        email: profile.email ?? user?.email ?? "",
        languages_taught: Array.isArray(profile.languages_taught)
          ? profile.languages_taught.join(", ")
          : profile.languages_taught ?? "",
        booking_enabled: profile.booking_enabled ?? true,
        auto_accept_bookings: profile.auto_accept_bookings ?? false,
        buffer_time_minutes: profile.buffer_time_minutes ?? 0,
        avatar_url: profile.avatar_url ?? "",
      }
    : {};

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">TutorLingua profile</h1>
        <p className="text-sm text-muted-foreground">
          Stand out to parents and students with a polished public presence and up-to-date information.
        </p>
      </div>
      <ProfileSettingsForm initialValues={initialValues} />
    </div>
  );
}
