"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  type StudentPreferences,
  type StudentEmailPreferences,
  updateStudentPreferences,
  updateStudentEmailPreferences,
  changeStudentPassword,
} from "@/lib/actions/student-settings";
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
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Your account details and connected tutors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <StudentAvatarUpload
                currentAvatarUrl={avatarUrl}
                studentName={accountInfo?.email}
              />

              {/* Account Info Fields */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Email Address</p>
                  <p className="text-sm font-medium">
                    {accountInfo?.email || "Not available"}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="text-sm font-medium">
                    {accountInfo?.created_at ? formatDate(accountInfo.created_at) : "Not available"}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Connected Tutors</p>
                  <p className="text-sm font-medium">
                    {accountInfo?.connected_tutors || 0} tutor(s)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>
                Customize your experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Timezone */}
              <div className="space-y-2">
                <Label htmlFor="timezone" className="text-sm font-medium">
                  Timezone
                </Label>
                <Select
                  value={prefsData.timezone}
                  onValueChange={(value) =>
                    setPrefsData((prev) => ({ ...prev, timezone: value }))
                  }
                >
                  <SelectTrigger id="timezone">
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
                <p className="text-xs text-muted-foreground">
                  Used for displaying lesson times in your local time
                </p>
              </div>

              {/* Preferred Language */}
              <div className="space-y-2">
                <Label htmlFor="language" className="text-sm font-medium">
                  Preferred Language
                </Label>
                <Select
                  value={prefsData.preferred_language}
                  onValueChange={(value) =>
                    setPrefsData((prev) => ({ ...prev, preferred_language: value }))
                  }
                >
                  <SelectTrigger id="language">
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
              </div>

              {/* Theme */}
              <div className="space-y-2">
                <Label htmlFor="theme" className="text-sm font-medium">
                  Theme
                </Label>
                <Select
                  value={prefsData.theme}
                  onValueChange={(value) =>
                    setPrefsData((prev) => ({ ...prev, theme: value as "light" | "dark" | "system" }))
                  }
                >
                  <SelectTrigger id="theme">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notification Sound Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notification-sound" className="text-sm font-medium">
                    Notification Sound
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Play a sound when you receive a new message
                  </p>
                </div>
                <Switch
                  id="notification-sound"
                  checked={prefsData.notification_sound}
                  onCheckedChange={(checked) =>
                    setPrefsData((prev) => ({ ...prev, notification_sound: checked }))
                  }
                />
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-border/50">
                <Button
                  onClick={handleSavePreferences}
                  disabled={prefsSaving}
                  className="w-full"
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
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Choose what emails you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="divide-y divide-border/50">
                {/* Booking Reminders */}
                <div className="flex items-center justify-between py-4 first:pt-0">
                  <div>
                    <Label htmlFor="booking-reminders" className="text-sm font-medium">
                      Booking Reminders
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive reminders before your scheduled lessons
                    </p>
                  </div>
                  <Switch
                    id="booking-reminders"
                    checked={emailData.email_booking_reminders}
                    onCheckedChange={(checked) =>
                      setEmailData((prev) => ({ ...prev, email_booking_reminders: checked }))
                    }
                  />
                </div>

                {/* Lesson Updates */}
                <div className="flex items-center justify-between py-4">
                  <div>
                    <Label htmlFor="lesson-updates" className="text-sm font-medium">
                      Lesson Updates
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about lesson confirmations, cancellations, and changes
                    </p>
                  </div>
                  <Switch
                    id="lesson-updates"
                    checked={emailData.email_lesson_updates}
                    onCheckedChange={(checked) =>
                      setEmailData((prev) => ({ ...prev, email_lesson_updates: checked }))
                    }
                  />
                </div>

                {/* Marketing */}
                <div className="flex items-center justify-between py-4 last:pb-0">
                  <div>
                    <Label htmlFor="marketing" className="text-sm font-medium">
                      Marketing & Tips
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive tips, promotions, and updates from your tutors
                    </p>
                  </div>
                  <Switch
                    id="marketing"
                    checked={emailData.email_marketing}
                    onCheckedChange={(checked) =>
                      setEmailData((prev) => ({ ...prev, email_marketing: checked }))
                    }
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-border/50">
                <Button
                  onClick={handleSaveEmailPreferences}
                  disabled={emailSaving}
                  className="w-full"
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
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Password */}
              <div className="space-y-2">
                <Label htmlFor="current-password" className="text-sm font-medium">
                  Current Password
                </Label>
                <Input
                  id="current-password"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))
                  }
                  placeholder="Enter your current password"
                />
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-sm font-medium">
                  New Password
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))
                  }
                  placeholder="Enter a new password"
                />
                <p className="text-sm text-muted-foreground">
                  Must be at least 8 characters
                </p>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-sm font-medium">
                  Confirm New Password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                  }
                  placeholder="Confirm your new password"
                />
              </div>

              {/* Change Password Button */}
              <div className="pt-4 border-t border-border/50">
                <Button
                  onClick={handleChangePassword}
                  disabled={
                    passwordSaving ||
                    !passwordData.currentPassword ||
                    !passwordData.newPassword ||
                    !passwordData.confirmPassword
                  }
                  className="w-full"
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
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
