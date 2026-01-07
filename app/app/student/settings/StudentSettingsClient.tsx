"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  Lock,
  User,
  Loader2,
  CheckCircle,
  AlertCircle,
  Settings,
} from "lucide-react";
import {
  updateStudentPreferences,
  updateStudentEmailPreferences,
  changeStudentPassword,
} from "@/lib/actions/student-settings";
import type { StudentPreferences, StudentEmailPreferences } from "@/lib/actions/types";
import {
  COMMON_TIMEZONES,
  SUPPORTED_LANGUAGES,
} from "@/lib/constants/student-settings";
import { StudentAvatarUpload } from "@/components/student-auth/StudentAvatarUpload";

interface StudentSettingsClientProps {
  preferences: StudentPreferences | null;
  emailPreferences: StudentEmailPreferences | null;
  accountInfo: {
    email: string;
    full_name: string | null;
    created_at: string;
    connected_tutors: number;
  } | null;
  avatarUrl: string | null;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function StudentSettingsClient({
  preferences,
  emailPreferences,
  accountInfo,
  avatarUrl,
}: StudentSettingsClientProps) {
  const [prefsData, setPrefsData] = useState({
    timezone: preferences?.timezone || "UTC",
    preferred_language: preferences?.preferred_language || "en",
    notification_sound: preferences?.notification_sound ?? true,
    theme: preferences?.theme || "system",
  });

  const [emailData, setEmailData] = useState({
    email_booking_reminders: emailPreferences?.email_booking_reminders ?? true,
    email_lesson_updates: emailPreferences?.email_lesson_updates ?? true,
    email_marketing: emailPreferences?.email_marketing ?? false,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [prefsSaving, setPrefsSaving] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [prefsSuccess, setPrefsSuccess] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const handleSavePreferences = async () => {
    setPrefsSaving(true);
    setError(null);
    setPrefsSuccess(false);

    const result = await updateStudentPreferences(prefsData);

    if (result.success) {
      setPrefsSuccess(true);
      setTimeout(() => setPrefsSuccess(false), 3000);
    } else {
      setError(result.error || "Failed to save preferences");
    }

    setPrefsSaving(false);
  };

  const handleSaveEmailPreferences = async () => {
    setEmailSaving(true);
    setError(null);
    setEmailSuccess(false);

    const result = await updateStudentEmailPreferences(emailData);

    if (result.success) {
      setEmailSuccess(true);
      setTimeout(() => setEmailSuccess(false), 3000);
    } else {
      setError(result.error || "Failed to save email preferences");
    }

    setEmailSaving(false);
  };

  const handleChangePassword = async () => {
    setPasswordSaving(true);
    setError(null);
    setPasswordSuccess(false);

    const result = await changeStudentPassword(passwordData);

    if (result.success) {
      setPasswordSuccess(true);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setPasswordSuccess(false), 3000);
    } else {
      setError(result.error || "Failed to change password");
    }

    setPasswordSaving(false);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 flex items-center gap-3">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <p className="text-sm font-medium text-destructive">{error}</p>
        </div>
      )}

      <Tabs defaultValue="account" className="space-y-6">
        {/* Tab Navigation */}
        <TabsList className="grid w-full grid-cols-4 h-12 p-1 bg-muted/50 rounded-xl gap-1">
          <TabsTrigger
            value="account"
            className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm gap-2 text-sm font-medium transition-all"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
          <TabsTrigger
            value="preferences"
            className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm gap-2 text-sm font-medium transition-all"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Preferences</span>
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm gap-2 text-sm font-medium transition-all"
          >
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm gap-2 text-sm font-medium transition-all"
          >
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="account">
          <section className="rounded-3xl bg-card p-6 shadow-md backdrop-blur">
            <SectionTitle
              icon={<User className="h-4 w-4 text-primary" />}
              title="Account Information"
              helper="Your account details and connected tutors"
            />

            <div className="mt-6 space-y-6">
              {/* Avatar Section */}
              <StudentAvatarUpload
                currentAvatarUrl={avatarUrl}
                studentName={accountInfo?.full_name}
              />

              {/* Account Info Fields */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-foreground">Email Address</span>
                  <span className="text-sm text-muted-foreground">
                    {accountInfo?.email || "Not available"}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-foreground">Member Since</span>
                  <span className="text-sm text-muted-foreground">
                    {accountInfo?.created_at ? formatDate(accountInfo.created_at) : "Not available"}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-foreground">Connected Tutors</span>
                  <span className="text-sm text-muted-foreground">
                    {accountInfo?.connected_tutors || 0} tutor(s)
                  </span>
                </div>
              </div>
            </div>
          </section>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <section className="rounded-3xl bg-card p-6 shadow-md backdrop-blur">
            <SectionTitle
              icon={<Settings className="h-4 w-4 text-primary" />}
              title="Preferences"
              helper="Customize your experience"
            />

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {/* Timezone */}
              <Field
                label="Timezone"
                htmlFor="timezone"
                helper="Used for displaying lesson times in your local time"
              >
                <Select
                  value={prefsData.timezone}
                  onValueChange={(value) =>
                    setPrefsData((prev) => ({ ...prev, timezone: value }))
                  }
                >
                  <SelectTrigger id="timezone" className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {/* Preferred Language */}
              <Field label="Preferred Language" htmlFor="language">
                <Select
                  value={prefsData.preferred_language}
                  onValueChange={(value) =>
                    setPrefsData((prev) => ({ ...prev, preferred_language: value }))
                  }
                >
                  <SelectTrigger id="language" className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {/* Theme */}
              <Field label="Theme" htmlFor="theme">
                <Select
                  value={prefsData.theme}
                  onValueChange={(value) =>
                    setPrefsData((prev) => ({ ...prev, theme: value as "light" | "dark" | "system" }))
                  }
                >
                  <SelectTrigger id="theme" className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {/* Notification Sound Toggle - Card style */}
            <div className="mt-6">
              <label className="flex items-start gap-3 rounded-2xl shadow-sm bg-white/60 px-4 py-4 text-sm text-foreground">
                <Switch
                  id="notification-sound"
                  checked={prefsData.notification_sound}
                  onCheckedChange={(checked) =>
                    setPrefsData((prev) => ({ ...prev, notification_sound: checked }))
                  }
                  className="mt-0.5"
                />
                <span>
                  <span className="font-semibold">Notification Sound</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Play a sound when you receive a new message
                  </span>
                </span>
              </label>
            </div>

            {/* Save Button */}
            <div className="mt-6 pt-4 border-t border-border">
              <button
                type="button"
                onClick={handleSavePreferences}
                disabled={prefsSaving}
                className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {prefsSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : prefsSuccess ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Saved!
                  </>
                ) : (
                  "Save Preferences"
                )}
              </button>
            </div>
          </section>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <section className="rounded-3xl bg-card p-6 shadow-md backdrop-blur">
            <SectionTitle
              icon={<Bell className="h-4 w-4 text-primary" />}
              title="Email Notifications"
              helper="Choose what emails you want to receive"
            />

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {/* Booking Reminders */}
              <label className="flex items-start gap-3 rounded-2xl shadow-sm bg-white/60 px-4 py-4 text-sm text-foreground">
                <Switch
                  id="booking-reminders"
                  checked={emailData.email_booking_reminders}
                  onCheckedChange={(checked) =>
                    setEmailData((prev) => ({ ...prev, email_booking_reminders: checked }))
                  }
                  className="mt-0.5"
                />
                <span>
                  <span className="font-semibold">Booking Reminders</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Receive reminders before your scheduled lessons
                  </span>
                </span>
              </label>

              {/* Lesson Updates */}
              <label className="flex items-start gap-3 rounded-2xl shadow-sm bg-white/60 px-4 py-4 text-sm text-foreground">
                <Switch
                  id="lesson-updates"
                  checked={emailData.email_lesson_updates}
                  onCheckedChange={(checked) =>
                    setEmailData((prev) => ({ ...prev, email_lesson_updates: checked }))
                  }
                  className="mt-0.5"
                />
                <span>
                  <span className="font-semibold">Lesson Updates</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Get notified about lesson confirmations, cancellations, and changes
                  </span>
                </span>
              </label>

              {/* Marketing */}
              <label className="flex items-start gap-3 rounded-2xl shadow-sm bg-white/60 px-4 py-4 text-sm text-foreground sm:col-span-2">
                <Switch
                  id="marketing"
                  checked={emailData.email_marketing}
                  onCheckedChange={(checked) =>
                    setEmailData((prev) => ({ ...prev, email_marketing: checked }))
                  }
                  className="mt-0.5"
                />
                <span>
                  <span className="font-semibold">Marketing & Tips</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Receive tips, promotions, and updates from your tutors
                  </span>
                </span>
              </label>
            </div>

            {/* Save Button */}
            <div className="mt-6 pt-4 border-t border-border">
              <button
                type="button"
                onClick={handleSaveEmailPreferences}
                disabled={emailSaving}
                className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {emailSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : emailSuccess ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Saved!
                  </>
                ) : (
                  "Save Notification Settings"
                )}
              </button>
            </div>
          </section>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <section className="rounded-3xl bg-card p-6 shadow-md backdrop-blur">
            <SectionTitle
              icon={<Lock className="h-4 w-4 text-primary" />}
              title="Change Password"
              helper="Update your password to keep your account secure"
            />

            <div className="mt-6 space-y-5">
              {/* Current Password */}
              <Field label="Current Password" htmlFor="current-password">
                <input
                  id="current-password"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))
                  }
                  placeholder="Enter your current password"
                  className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </Field>

              {/* New Password */}
              <Field
                label="New Password"
                htmlFor="new-password"
                helper="Must be at least 8 characters"
              >
                <input
                  id="new-password"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))
                  }
                  placeholder="Enter a new password"
                  className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </Field>

              {/* Confirm Password */}
              <Field label="Confirm New Password" htmlFor="confirm-password">
                <input
                  id="confirm-password"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                  }
                  placeholder="Confirm your new password"
                  className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </Field>
            </div>

            {/* Change Password Button */}
            <div className="mt-6 pt-4 border-t border-border">
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={
                  passwordSaving ||
                  !passwordData.currentPassword ||
                  !passwordData.newPassword ||
                  !passwordData.confirmPassword
                }
                className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {passwordSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing...
                  </>
                ) : passwordSuccess ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Password Changed!
                  </>
                ) : (
                  "Change Password"
                )}
              </button>
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SectionTitle({
  icon,
  title,
  helper,
}: {
  icon: React.ReactNode;
  title: string;
  helper: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            {icon}
          </span>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{helper}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  helper,
  children,
}: {
  label: string;
  htmlFor: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-foreground" htmlFor={htmlFor}>
      <span className="font-medium text-foreground">{label}</span>
      {children}
      {helper ? <span className="text-xs text-muted-foreground">{helper}</span> : null}
    </label>
  );
}
