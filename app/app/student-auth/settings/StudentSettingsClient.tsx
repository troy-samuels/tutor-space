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
  Settings,
  Bell,
  Lock,
  User,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Globe,
  Mail,
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <Tabs defaultValue="account" className="space-y-4">
        <TabsList>
          <TabsTrigger value="account" className="gap-2">
            <User className="h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Settings className="h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="h-4 w-4" />
            Security
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
              <StudentAvatarUpload
                currentAvatarUrl={avatarUrl}
                studentName={accountInfo?.email}
              />

              <div className="border-t pt-4 space-y-4">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{accountInfo?.email || "Not available"}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Member Since</Label>
                  <p className="text-sm text-muted-foreground">
                    {accountInfo?.created_at ? formatDate(accountInfo.created_at) : "Not available"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Connected Tutors</Label>
                  <p className="text-sm text-muted-foreground">
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
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={prefsData.timezone}
                  onValueChange={(value) =>
                    setPrefsData((prev) => ({ ...prev, timezone: value }))
                  }
                >
                  <SelectTrigger id="timezone">
                    <Globe className="h-4 w-4 mr-2" />
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

              <div className="space-y-2">
                <Label htmlFor="language">Preferred Language</Label>
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

              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
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

              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label htmlFor="notification-sound">Notification Sound</Label>
                  <p className="text-xs text-muted-foreground">
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

              <Button
                onClick={handleSavePreferences}
                disabled={prefsSaving}
                className={prefsSuccess ? "bg-green-600 hover:bg-green-700" : ""}
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
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Preferences
                  </>
                )}
              </Button>
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
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label htmlFor="booking-reminders">Booking Reminders</Label>
                  <p className="text-xs text-muted-foreground">
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

              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label htmlFor="lesson-updates">Lesson Updates</Label>
                  <p className="text-xs text-muted-foreground">
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

              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label htmlFor="marketing">Marketing & Tips</Label>
                  <p className="text-xs text-muted-foreground">
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

              <Button
                onClick={handleSaveEmailPreferences}
                disabled={emailSaving}
                className={emailSuccess ? "bg-green-600 hover:bg-green-700" : ""}
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
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Notification Settings
                  </>
                )}
              </Button>
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
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
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

              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))
                  }
                  placeholder="Enter a new password"
                />
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
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

              <Button
                onClick={handleChangePassword}
                disabled={
                  passwordSaving ||
                  !passwordData.currentPassword ||
                  !passwordData.newPassword ||
                  !passwordData.confirmPassword
                }
                className={passwordSuccess ? "bg-green-600 hover:bg-green-700" : ""}
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
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Change Password
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
