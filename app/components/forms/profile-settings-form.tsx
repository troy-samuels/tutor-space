"use client";

import Image from "next/image";
import { useActionState, useEffect, useMemo, useState } from "react";
import { Instagram, Facebook, Twitter, Music4, Upload, CalendarClock, Minus, Plus } from "lucide-react";
import type { ProfileFormValues } from "@/lib/validators/profile";
import { updateProfile, type ProfileActionState } from "@/lib/actions/profile";

const initialState: ProfileActionState = {};

const timezones = Intl.supportedValuesOf("timeZone");

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

  const mergedValues = useMemo(() => {
    return {
      full_name: "",
      username: "",
      tagline: "",
      bio: "",
      languages_taught: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      website_url: "",
      avatar_url: "",
      instagram_handle: "",
      tiktok_handle: "",
      facebook_handle: "",
      x_handle: "",
      booking_enabled: true,
      auto_accept_bookings: false,
      buffer_time_minutes: 0,
      ...initialValues,
      ...(state.fields ?? {}),
    } satisfies ProfileFormValues;
  }, [initialValues, state.fields]);

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

  const changeBuffer = (delta: number) => {
    setBufferMinutes((prev) => {
      const next = Math.min(480, Math.max(0, prev + delta));
      return Number.isNaN(next) ? 0 : next;
    });
  };

  const presetBufferTimes = [0, 5, 10, 15, 30, 45, 60];

  return (
    <form action={formAction} className="space-y-8" encType="multipart/form-data">
      <input type="hidden" name="existing_avatar_url" value={mergedValues.avatar_url ?? ""} />

      <section className="rounded-3xl border border-brand-brown/20 bg-white/90 p-6 shadow-sm backdrop-blur">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Brand identity</h2>
          <p className="text-sm text-muted-foreground">
            Upload your tutor photo so families recognise you across booking confirmations and the parent
            credibility page.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="relative h-28 w-28 overflow-hidden rounded-3xl border border-brand-brown/20 bg-brand-cream">
            {avatarPreview ? (
              <Image
                src={avatarPreview}
                alt={mergedValues.full_name || "Tutor avatar preview"}
                fill
                sizes="112px"
                className="object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-brand-brown">
                {(mergedValues.full_name?.slice(0, 1) ??
                  mergedValues.username?.slice(0, 1) ??
                  "T"
                ).toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <p className="text-sm text-muted-foreground">
            Use a bright, welcoming headshot. Square images (min 400×400px) look best on your TutorLingua
              site and marketing graphics.
            </p>
            <label className="inline-flex items-center gap-2 rounded-full bg-brand-brown px-4 py-2 text-xs font-semibold text-brand-white shadow-sm transition hover:bg-brand-brown/90">
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

      <section className="rounded-3xl border border-brand-brown/20 bg-white/90 p-6 shadow-sm backdrop-blur">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Public profile</h2>
          <p className="text-sm text-muted-foreground">
            These details appear on your TutorLingua site and parent credibility page.
          </p>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Full name" htmlFor="full_name">
            <input
              id="full_name"
              name="full_name"
              defaultValue={mergedValues.full_name}
              required
              className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm focus:border-brand-brown focus:outline-none focus:ring-1 focus:ring-brand-brown"
            />
          </Field>

          <Field label="Username" htmlFor="username" helper="Lowercase, no spaces">
            <input
              id="username"
              name="username"
              defaultValue={mergedValues.username}
              required
              pattern="^[a-z0-9-]+$"
              className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm focus:border-brand-brown focus:outline-none focus:ring-1 focus:ring-brand-brown"
            />
          </Field>

          <Field
            label="One-line positioning"
            htmlFor="tagline"
            helper="E.g. Spanish tutor helping teens ace DELE B2 in 6 months"
          >
            <input
              id="tagline"
              name="tagline"
              defaultValue={mergedValues.tagline}
              required
              className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm focus:border-brand-brown focus:outline-none focus:ring-1 focus:ring-brand-brown"
            />
          </Field>

          <Field label="Languages you teach" htmlFor="languages_taught" helper="Separate with commas">
            <input
              id="languages_taught"
              name="languages_taught"
              defaultValue={mergedValues.languages_taught}
              required
              className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm focus:border-brand-brown focus:outline-none focus:ring-1 focus:ring-brand-brown"
            />
          </Field>
        </div>

        <Field label="About you" htmlFor="bio" helper="Parents see this on your credibility page.">
          <textarea
            id="bio"
            name="bio"
            defaultValue={mergedValues.bio}
            required
            minLength={40}
            rows={6}
            onChange={(event) => setBioCount(event.target.value.length)}
            className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm leading-relaxed shadow-sm focus:border-brand-brown focus:outline-none focus:ring-1 focus:ring-brand-brown"
          />
          <p className="mt-1 text-xs text-muted-foreground">{bioCount} / 600 characters</p>
        </Field>
      </section>

      <section className="rounded-3xl border border-brand-brown/20 bg-white/90 p-6 shadow-sm backdrop-blur">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Availability & timezone</h2>
          <p className="text-sm text-muted-foreground">
            Students always see your availability in their local time.
          </p>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Timezone" htmlFor="timezone">
            <select
              id="timezone"
              name="timezone"
              defaultValue={mergedValues.timezone}
              className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm focus:border-brand-brown focus:outline-none focus:ring-1 focus:ring-brand-brown"
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Website" htmlFor="website_url" helper="Optional">
            <input
              id="website_url"
              name="website_url"
              defaultValue={mergedValues.website_url}
              placeholder="https://..."
              className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm focus:border-brand-brown focus:outline-none focus:ring-1 focus:ring-brand-brown"
            />
          </Field>
        </div>
      </section>

      <section className="rounded-3xl border border-brand-brown/20 bg-white/90 p-6 shadow-sm backdrop-blur">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Bookings & sessions</h2>
          <p className="text-sm text-muted-foreground">
            Control how new lessons are confirmed once your TutorLingua booking flow is live.
          </p>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="flex items-start gap-3 rounded-2xl border border-brand-brown/20 bg-brand-brown/5 px-4 py-4 text-sm text-foreground">
            <input
              type="checkbox"
              name="booking_enabled"
              defaultChecked={mergedValues.booking_enabled}
              className="mt-1 h-4 w-4 rounded border-brand-brown text-brand-brown focus:ring-brand-brown"
            />
            <span>
              <span className="font-semibold">Accept new bookings</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Turning this off hides your booking link. Students can still see your profile.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-2xl border border-brand-brown/20 bg-white/60 px-4 py-4 text-sm text-foreground">
            <input
              type="checkbox"
              name="auto_accept_bookings"
              defaultChecked={mergedValues.auto_accept_bookings}
              className="mt-1 h-4 w-4 rounded border-brand-brown text-brand-brown focus:ring-brand-brown"
            />
            <span>
              <span className="font-semibold">Auto-confirm paid sessions</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                New bookings go straight onto your calendar when payment succeeds.
              </span>
            </span>
          </label>
        </div>

        <div>
          <label
            htmlFor="buffer_time_minutes"
            className="flex flex-col gap-2 text-sm text-foreground"
          >
            <span className="font-medium">Buffer time between lessons</span>
            <span className="text-xs text-muted-foreground">
              Give yourself breathing room for notes, prep, and overrun.
            </span>
          </label>
          <div className="mt-4 space-y-3 rounded-3xl border border-brand-brown/25 bg-brand-brown/5 p-5">
            <input type="hidden" id="buffer_time_minutes" name="buffer_time_minutes" value={bufferMinutes} />
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => changeBuffer(-5)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-brown/40 bg-white text-brand-brown shadow-sm transition hover:bg-brand-brown/10 focus:outline-none focus:ring-2 focus:ring-brand-brown/40"
                aria-label="Decrease buffer time"
              >
                <Minus className="h-4 w-4" />
              </button>
              <div className="flex flex-col items-center gap-1 text-brand-brown" aria-live="polite">
                <span className="text-3xl font-semibold">{bufferMinutes}</span>
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-brown/80">
                  minutes
                </span>
              </div>
              <button
                type="button"
                onClick={() => changeBuffer(5)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-brown/40 bg-white text-brand-brown shadow-sm transition hover:bg-brand-brown/10 focus:outline-none focus:ring-2 focus:ring-brand-brown/40"
                aria-label="Increase buffer time"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {presetBufferTimes.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => setBufferMinutes(minutes)}
                  className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand-brown/40 ${
                    bufferMinutes === minutes
                      ? "bg-brand-brown text-brand-white shadow-sm"
                      : "border border-brand-brown/30 bg-white text-brand-brown hover:bg-brand-brown/10"
                  }`}
                >
                  {minutes === 0 ? "No buffer" : `${minutes} min`}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-4 flex items-center gap-2 rounded-2xl border border-dashed border-brand-brown/30 bg-brand-brown/5 px-4 py-3 text-xs text-muted-foreground">
          <CalendarClock className="h-4 w-4 text-brand-brown" />
          Calendar sync is configured from <strong className="font-semibold">Settings → Calendar sync</strong>.
          Once connected, bookings respect your external events automatically.
        </p>
      </section>

      <section className="rounded-3xl border border-brand-brown/20 bg-white/90 p-6 shadow-sm backdrop-blur">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Social proof & contact</h2>
          <p className="text-sm text-muted-foreground">
            Add handles so prospective students can follow you on social media.
          </p>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <SocialInput
            icon={<Instagram className="h-4 w-4 text-brand-brown" />}
            label="Instagram"
            name="instagram_handle"
            defaultValue={mergedValues.instagram_handle}
          />
          <SocialInput
            icon={<Music4 className="h-4 w-4 text-brand-brown" />}
            label="TikTok"
            name="tiktok_handle"
            defaultValue={mergedValues.tiktok_handle}
          />
          <SocialInput
            icon={<Facebook className="h-4 w-4 text-brand-brown" />}
            label="Facebook"
            name="facebook_handle"
            defaultValue={mergedValues.facebook_handle}
          />
          <SocialInput
            icon={<Twitter className="h-4 w-4 text-brand-brown" />}
            label="X (Twitter)"
            name="x_handle"
            defaultValue={mergedValues.x_handle}
          />
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
        className="inline-flex h-11 items-center justify-center rounded-full bg-brand-brown px-6 text-sm font-semibold text-brand-white shadow-sm transition hover:bg-brand-brown/90 disabled:cursor-not-allowed disabled:opacity-70"
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
}: {
  icon: React.ReactNode;
  label: string;
  name: string;
  defaultValue?: string;
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
        placeholder="handle"
        className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm focus:border-brand-brown focus:outline-none focus:ring-1 focus:ring-brand-brown"
      />
    </label>
  );
}
