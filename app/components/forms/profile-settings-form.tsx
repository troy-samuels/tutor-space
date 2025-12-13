"use client";

import Image from "next/image";
import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Instagram, Mail, Upload, CalendarClock, Music4, Facebook, Twitter, Globe, Sparkles, ShieldCheck, Link2 } from "lucide-react";
import type { ProfileFormValues } from "@/lib/validators/profile";
import { updateProfile, type ProfileActionState } from "@/lib/actions/profile";
import { setLocale } from "@/lib/i18n/actions";
import { locales } from "@/lib/i18n/config";
import { TimezoneSelect } from "@/components/ui/timezone-select";
import { detectUserTimezone } from "@/lib/utils/timezones";

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  pt: "Português",
};

const initialState: ProfileActionState = {};

export function ProfileSettingsForm({
  initialValues,
}: {
  initialValues: Partial<ProfileFormValues>;
}) {
  const [state, formAction, isPending] = useActionState<ProfileActionState, FormData>(
    updateProfile,
    initialState
  );
  const [bioCount, setBioCount] = useState(initialValues.bio?.length ?? 0);
  const [avatarPreview, setAvatarPreview] = useState(initialValues.avatar_url ?? "");
  const [bufferMinutes, setBufferMinutes] = useState(initialValues.buffer_time_minutes ?? 0);

  const locale = useLocale();
  const router = useRouter();
  const [isLocaleChanging, startLocaleTransition] = useTransition();

  const handleLocaleChange = (newLocale: string) => {
    startLocaleTransition(async () => {
      await setLocale(newLocale);
      router.refresh();
    });
  };

  const mergedValues = useMemo(() => {
    return {
      full_name: "",
      username: "",
      tagline: "",
      bio: "",
      languages_taught: "",
      timezone: detectUserTimezone(),
      website_url: "",
      avatar_url: "",
      instagram_handle: "",
      tiktok_handle: "",
      facebook_handle: "",
      x_handle: "",
      email: "",
      booking_enabled: true,
      auto_accept_bookings: false,
      buffer_time_minutes: 0,
      ...initialValues,
      ...(state.fields ?? {}),
    } satisfies ProfileFormValues;
  }, [initialValues, state.fields]);

  const [timezone, setTimezone] = useState(mergedValues.timezone);

  useEffect(() => {
    if (mergedValues.timezone && mergedValues.timezone !== timezone) {
      setTimezone(mergedValues.timezone);
    }
  }, [mergedValues.timezone, timezone]);

  useEffect(() => {
    if (state?.fields?.avatar_url) {
      setAvatarPreview(state.fields.avatar_url);
    } else if (initialValues.avatar_url) {
      setAvatarPreview(initialValues.avatar_url);
    }
  }, [initialValues.avatar_url, state?.fields?.avatar_url]);

  useEffect(() => {
    if (typeof mergedValues.buffer_time_minutes === "number") {
      setBufferMinutes(mergedValues.buffer_time_minutes);
    }
  }, [mergedValues.buffer_time_minutes]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  const presetBufferTimes = [0, 5, 10, 15, 30, 45, 60];

  return (
    <form action={formAction} className="space-y-8" encType="multipart/form-data">
      <input type="hidden" name="existing_avatar_url" value={mergedValues.avatar_url ?? ""} />

      <section className="rounded-3xl bg-card p-6 shadow-md backdrop-blur">
        <SectionTitle
          icon={<Sparkles className="h-4 w-4 text-primary" />}
          title="Brand identity"
          helper="Upload a photo so people recognize you in emails and on your profile."
        />

        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="relative h-28 w-28 overflow-hidden rounded-3xl shadow-sm bg-muted">
            {avatarPreview ? (
              <Image
                src={avatarPreview}
                alt={mergedValues.full_name || "Tutor avatar preview"}
                fill
                sizes="112px"
                className="object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-primary">
                {(mergedValues.full_name?.slice(0, 1) ??
                  mergedValues.username?.slice(0, 1) ??
                  "T"
                ).toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <p className="text-sm text-muted-foreground">
              Use a friendly headshot. Square images (400×400px or larger) work best.
            </p>
            <label className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90">
              <Upload className="h-4 w-4" />
              <span>{avatarPreview ? "Replace photo" : "Upload photo"}</span>
              <input
                type="file"
                name="avatar"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={handleAvatarChange}
              />
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-card p-6 shadow-md backdrop-blur">
        <SectionTitle
          icon={<ShieldCheck className="h-4 w-4 text-primary" />}
          title="Public profile"
          helper="This shows on your public profile."
        />

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Full name" htmlFor="full_name">
            <input
              id="full_name"
              name="full_name"
              defaultValue={mergedValues.full_name}
              required
              className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </Field>

          <Field label="Username" htmlFor="username" helper="Lowercase, no spaces">
            <input
              id="username"
              name="username"
              defaultValue={mergedValues.username}
              required
              pattern="^[a-z0-9-]+$"
              className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </Field>

          <Field
            label="One-line positioning"
            htmlFor="tagline"
            helper="e.g. Spanish tutor helping students pass DELE B2"
          >
            <input
              id="tagline"
              name="tagline"
              defaultValue={mergedValues.tagline}
              required
              className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </Field>

          <Field label="Languages you teach" htmlFor="languages_taught" helper="Separate with commas">
            <input
              id="languages_taught"
              name="languages_taught"
              defaultValue={mergedValues.languages_taught}
              required
              className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </Field>
        </div>

        <Field label="About you" htmlFor="bio" helper="Visitors see this on your profile.">
          <textarea
            id="bio"
            name="bio"
            defaultValue={mergedValues.bio}
            required
            minLength={40}
            rows={6}
            onChange={(event) => setBioCount(event.target.value.length)}
            className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm leading-relaxed shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <p className="mt-1 text-xs text-muted-foreground">{bioCount} / 600 characters</p>
        </Field>
      </section>

      <section id="availability" className="rounded-3xl shadow-sm bg-white/90 p-6 shadow-sm backdrop-blur">
        <SectionTitle
          icon={<CalendarClock className="h-4 w-4 text-primary" />}
          title="Availability & timezone"
          helper="Students always see your availability in their local time."
        />

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Timezone" htmlFor="timezone">
            <TimezoneSelect
              id="timezone"
              name="timezone"
              value={timezone}
              onChange={setTimezone}
            />
          </Field>

          <Field label="Website" htmlFor="website_url" helper="Optional">
            <input
              id="website_url"
              name="website_url"
              defaultValue={mergedValues.website_url}
              placeholder="https://..."
              className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </Field>
        </div>
      </section>

      <section className="rounded-3xl bg-card p-6 shadow-md backdrop-blur">
        <SectionTitle
          icon={<ShieldCheck className="h-4 w-4 text-primary" />}
          title="Bookings & sessions"
          helper="Control how new bookings are confirmed."
        />

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="flex items-start gap-3 rounded-2xl shadow-sm bg-white/60 px-4 py-4 text-sm text-foreground">
            <input
              type="checkbox"
              name="booking_enabled"
              defaultChecked={mergedValues.booking_enabled}
              className="mt-1 h-4 w-4 rounded border-foreground text-primary focus:ring-primary"
            />
            <span>
              <span className="font-semibold">Accept new bookings</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Turn off to pause bookings. Your profile stays visible.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-2xl shadow-sm bg-white/60 px-4 py-4 text-sm text-foreground">
            <input
              type="checkbox"
              name="auto_accept_bookings"
              defaultChecked={mergedValues.auto_accept_bookings}
              className="mt-1 h-4 w-4 rounded border-foreground text-primary focus:ring-primary"
            />
            <span>
              <span className="font-semibold">Auto-confirm paid sessions</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Bookings confirm automatically when paid.
              </span>
            </span>
          </label>
        </div>

        <div className="mt-4 space-y-3">
          <label
            htmlFor="buffer_time_minutes"
            className="flex flex-col gap-1 text-sm text-foreground"
          >
            <span className="font-medium">Buffer time between lessons</span>
            <span className="text-xs text-muted-foreground">
              Add time between lessons for prep.
            </span>
          </label>
          <input type="hidden" id="buffer_time_minutes" name="buffer_time_minutes" value={bufferMinutes} />
          <div className="flex flex-wrap gap-2">
            {presetBufferTimes.map((minutes) => (
              <button
                key={minutes}
                type="button"
                onClick={() => setBufferMinutes(minutes)}
                className={`inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                  bufferMinutes === minutes
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "border border-foreground/20 bg-white text-foreground/70 hover:border-foreground/40 hover:text-foreground"
                }`}
              >
                {minutes === 0 ? "No buffer" : `${minutes} min`}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-4 flex items-center gap-2 rounded-2xl border border-dashed border-foreground/30 bg-primary/5 px-4 py-3 text-xs text-muted-foreground">
          <CalendarClock className="h-4 w-4 text-primary" />
          Connect your calendar in <strong className="font-semibold">Calendar sync</strong> settings.
        </p>
      </section>

      <section className="rounded-3xl bg-card p-6 shadow-md backdrop-blur">
        <SectionTitle
          icon={<Globe className="h-4 w-4 text-primary" />}
          title="Interface language"
          helper="Choose your dashboard language."
        />

        <div className="mt-6">
          <div className="flex flex-col gap-2 text-sm text-foreground">
            <span className="flex items-center gap-2 font-medium text-foreground">
              <Globe className="h-4 w-4 text-primary" />
              <span>Display language</span>
            </span>
            <select
              value={locale}
              onChange={(event) => handleLocaleChange(event.target.value)}
              disabled={isLocaleChanging}
              className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 sm:w-auto sm:min-w-[200px]"
            >
              {locales.map((value) => (
                <option key={value} value={value}>
                  {LANGUAGE_LABELS[value] ?? value.toUpperCase()}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Changes menus and labels in the app.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-card p-6 shadow-md backdrop-blur">
        <SectionTitle
          icon={<Link2 className="h-4 w-4 text-primary" />}
          title="Contact & Social"
          helper="Add your social profiles."
        />

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <SocialInput
            icon={<Instagram className="h-4 w-4 text-primary" />}
            label="Instagram"
            name="instagram_handle"
            defaultValue={mergedValues.instagram_handle}
            placeholder="@yourhandle"
          />
          <SocialInput
            icon={<Music4 className="h-4 w-4 text-primary" />}
            label="TikTok"
            name="tiktok_handle"
            defaultValue={mergedValues.tiktok_handle}
            placeholder="@yourhandle"
          />
          <SocialInput
            icon={<Facebook className="h-4 w-4 text-primary" />}
            label="Facebook"
            name="facebook_handle"
            defaultValue={mergedValues.facebook_handle}
            placeholder="@yourhandle"
          />
          <SocialInput
            icon={<Twitter className="h-4 w-4 text-primary" />}
            label="X (Twitter)"
            name="x_handle"
            defaultValue={mergedValues.x_handle}
            placeholder="@yourhandle"
          />
          <div className="flex flex-col gap-2 text-sm text-foreground sm:col-span-2">
            <span className="flex items-center gap-2 font-medium text-foreground">
              <Mail className="h-4 w-4 text-primary" />
              <span>Contact Email</span>
            </span>
            <div className="flex items-center gap-2 rounded-xl border border-input bg-muted/30 px-4 py-2.5 text-sm shadow-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-foreground">{mergedValues.email || 'Email not available'}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Students contact you through your profile.
            </p>
          </div>
        </div>
      </section>

      {state?.error && (
        <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </p>
      )}

      {state?.success && (
        <p className="rounded-2xl bg-emerald-100 px-4 py-3 text-sm text-emerald-700">
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Saving..." : "Save profile"}
      </button>
    </form>
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

function SocialInput({
  icon,
  label,
  name,
  defaultValue,
  placeholder,
}: {
  icon: React.ReactNode;
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-foreground">
      <span className="flex items-center gap-2 font-medium text-foreground">
        {icon}
        <span>{label}</span>
      </span>
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder || "handle"}
    className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
  />
</label>
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
