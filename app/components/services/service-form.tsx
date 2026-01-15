"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type {
  ServiceFormValues,
  ServiceInput,
  ServiceOfferType,
} from "@/lib/validators/service";
import { serviceFormSchema } from "@/lib/validators/service";
import { SubscriptionTierInput, type TierPricing } from "./SubscriptionTierInput";

const OFFER_OPTIONS: Array<{
  value: ServiceOfferType;
  title: string;
  description: string;
}> = [
  {
    value: "subscription",
    title: "Ongoing subscription",
    description: "Recurring monthly billing for long-term students.",
  },
  {
    value: "lesson_block",
    title: "Lesson block / plan",
    description: "Pre-paid sets of lessons or curriculum blocks.",
  },
  {
    value: "one_off",
    title: "One-off lesson",
    description: "Standard single bookings paid per session.",
  },
  {
    value: "trial",
    title: "Trial or intro",
    description: "Short, lower-friction intro sessions to start relationships.",
  },
];

type Props = {
  initialValues?: {
    id: string;
    name: string;
    description: string | null;
    duration_minutes: number;
    price: number;
    currency: string | null;
    is_active: boolean;
    requires_approval: boolean;
    max_students_per_session: number;
    offer_type: ServiceOfferType;
  };
  initialSubscriptionTiers?: TierPricing[];
  defaultCurrency: string;
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (values: ServiceInput, subscriptionTiers?: TierPricing[]) => void;
  existingNames?: string[];
};

export function ServiceForm({
  initialValues,
  initialSubscriptionTiers,
  defaultCurrency,
  loading,
  onCancel,
  onSubmit,
  existingNames = [],
}: Props) {
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema) as unknown as Resolver<ServiceFormValues>,
    defaultValues: {
      name: initialValues?.name ?? "",
      description: initialValues?.description ?? "",
      duration_minutes: initialValues?.duration_minutes ?? 60,
      price: initialValues ? initialValues.price / 100 : 60,
      currency: initialValues?.currency?.toUpperCase() ?? defaultCurrency.toUpperCase(),
      is_active: initialValues?.is_active ?? true,
      // Inverted: UI shows "auto-book" (true = auto-book enabled = requires_approval false)
      requires_approval: initialValues ? !initialValues.requires_approval : true,
      max_students_per_session: 1, // Enforce 1:1 lessons
      offer_type: initialValues?.offer_type ?? "one_off",
    },
  });

  const [subscriptionTiers, setSubscriptionTiers] = useState<TierPricing[]>(
    initialSubscriptionTiers ?? [
      { tier_id: "2_lessons", price: null },
      { tier_id: "4_lessons", price: null },
      { tier_id: "8_lessons", price: null },
    ]
  );
  const selectedOfferType = form.watch("offer_type");

  const handleSubmit = form.handleSubmit((values) => {
    // Convert price to cents using string manipulation to avoid floating-point precision issues
    // E.g., 19.99 should become 1999 cents, not 1998 or 2000
    const priceString = values.price.toFixed(2);
    const [dollars, cents] = priceString.split(".");
    const priceCents = parseInt(dollars, 10) * 100 + parseInt(cents || "0", 10);

    const payload: ServiceInput = {
      name: values.name,
      description: values.description ?? "",
      duration_minutes: values.duration_minutes,
      price_cents: priceCents,
      currency: values.currency,
      is_active: values.is_active,
      requires_approval: !values.requires_approval, // Inverted: UI shows "auto-book", DB stores "requires_approval"
      max_students_per_session: 1, // Enforce 1:1 lessons
      offer_type: values.offer_type,
    };

    // Pass subscription tiers if this is a subscription offer type
    const tiersToSave = values.offer_type === "subscription" ? subscriptionTiers : undefined;
    onSubmit(payload, tiersToSave);
  });

  // Duplicate name warning
  const existingNameSet = useMemo(
    () =>
      new Set(
        (existingNames || [])
          .filter((name) => name && name.toLowerCase() !== initialValues?.name?.toLowerCase())
          .map((name) => name.toLowerCase())
      ),
    [existingNames, initialValues?.name]
  );

  const nameValue = form.watch("name");
  const isDuplicateName = nameValue ? existingNameSet.has(nameValue.trim().toLowerCase()) : false;

  useEffect(() => {
    if (isDuplicateName) {
      form.setError("name", { type: "manual", message: "You already have a service with this name." });
    } else if (form.formState.errors.name?.type === "manual") {
      form.clearErrors("name");
    }
  }, [form, isDuplicateName]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basics section */}
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Service name" error={form.formState.errors.name?.message}>
            <input
              type="text"
              {...form.register("name")}
              className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="E.g. Conversational Spanish (60 min)"
            />
            {isDuplicateName ? (
              <p className="mt-1 text-xs font-semibold text-destructive">
                You already use this name. Try a different label to avoid confusion.
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">Avoid duplicate names so students can tell offers apart.</p>
            )}
          </Field>
          <Field
            label="Description"
            error={form.formState.errors.description?.message}
            className="sm:col-span-2"
          >
            <textarea
              {...form.register("description")}
              rows={3}
              className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm leading-relaxed shadow-sm focus:border-brand-yellow focus:outline-none focus:ring-1 focus:ring-brand-yellow"
              placeholder="Who is this for? What results can they expect?"
            />
          </Field>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">Offer type</span>
            {form.formState.errors.offer_type ? (
              <span className="text-xs font-medium text-destructive">
                {form.formState.errors.offer_type.message}
              </span>
            ) : null}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {OFFER_OPTIONS.map((option) => {
              const isSelected = selectedOfferType === option.value;
              return (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-sm shadow-sm transition ${
                    isSelected ? "border-primary bg-primary/10" : "border-border hover:border-primary/70"
                  }`}
                >
                  <input
                    type="radio"
                    value={option.value}
                    {...form.register("offer_type")}
                    className="mt-1 h-4 w-4 rounded text-primary focus:ring-primary"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{option.title}</span>
                      {option.value === "trial" ? (
                        <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                          conversion boost
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pricing section */}
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Duration" error={form.formState.errors.duration_minutes?.message}>
            <div className="relative">
              <input
                type="number"
                min={15}
                step={5}
                {...form.register("duration_minutes", { valueAsNumber: true })}
                className="w-full rounded-xl border border-input bg-background px-4 py-2 pr-12 text-sm shadow-sm focus:border-brand-yellow focus:outline-none focus:ring-1 focus:ring-brand-yellow"
              />
              <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs text-muted-foreground">
                min
              </span>
            </div>
          </Field>

          {selectedOfferType !== "subscription" ? (
            <>
              <Field label="Price" error={form.formState.errors.price?.message}>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    step={1}
                    {...form.register("price", { valueAsNumber: true })}
                    className="w-full rounded-xl border border-input bg-background px-4 py-2 pr-12 text-sm shadow-sm focus:border-brand-yellow focus:outline-none focus:ring-1 focus:ring-brand-yellow"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs text-muted-foreground">
                    {form.watch("currency")}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Typical conversation lessons: $25–40/hr. Adjust for your experience and prep time.
                </p>
              </Field>

              <Field label="Currency" error={form.formState.errors.currency?.message}>
                <input
                  type="text"
                  maxLength={3}
                  {...form.register("currency")}
                  className="w-full uppercase rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm focus:border-brand-yellow focus:outline-none focus:ring-1 focus:ring-brand-yellow"
                />
              </Field>
            </>
          ) : (
            <Field label="Currency" error={form.formState.errors.currency?.message}>
              <input
                type="text"
                maxLength={3}
                {...form.register("currency")}
                className="w-full uppercase rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm focus:border-brand-yellow focus:outline-none focus:ring-1 focus:ring-brand-yellow"
              />
            </Field>
          )}
        </div>

        {/* Subscription tier pricing */}
        {selectedOfferType === "subscription" ? (
          <div className="mt-4">
            <SubscriptionTierInput
              values={subscriptionTiers}
              currency={form.watch("currency")}
              onChange={setSubscriptionTiers}
              disabled={loading}
            />
          </div>
        ) : null}
      </div>

      {/* Settings section */}
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-foreground">Booking</span>
            <label className="flex items-center gap-2 text-xs text-foreground">
              <input
                type="checkbox"
                {...form.register("requires_approval")}
                className="h-4 w-4 rounded text-primary focus:ring-primary"
              />
              Auto-book when students request
            </label>
            <span className="text-xs text-muted-foreground">
              When enabled, bookings are confirmed instantly. Turn off to manually approve each request.
            </span>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-foreground">Visibility</span>
            <label className="flex items-center gap-2 text-xs text-foreground">
              <input
                type="checkbox"
                {...form.register("is_active")}
                className="h-4 w-4 rounded text-primary focus:ring-primary"
              />
              Show on TutorLingua site
            </label>
            <span className="text-xs text-muted-foreground">
              Hidden services stay off your booking page.
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Saving..."
            : initialValues
              ? "Save changes"
              : "Create service"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-semibold text-muted-foreground transition hover:text-primary"
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  helper,
  children,
  className,
}: {
  label: string;
  error?: string;
  helper?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-foreground">{label}</span>
        {children}
        {helper ? <span className="text-xs text-muted-foreground">{helper}</span> : null}
        {error ? <span className="text-xs font-medium text-destructive">{error}</span> : null}
      </div>
    </div>
  );
}
