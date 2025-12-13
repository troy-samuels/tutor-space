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
import { FlowProgress } from "@/components/flows/FlowProgress";
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
      requires_approval: initialValues?.requires_approval ?? false,
      max_students_per_session: initialValues?.max_students_per_session ?? 1,
      offer_type: initialValues?.offer_type ?? "one_off",
    },
  });

  const [stageIndex, setStageIndex] = useState(0);
  const [subscriptionTiers, setSubscriptionTiers] = useState<TierPricing[]>(
    initialSubscriptionTiers ?? [
      { tier_id: "2_lessons", price: null },
      { tier_id: "4_lessons", price: null },
      { tier_id: "8_lessons", price: null },
    ]
  );
  const selectedOfferType = form.watch("offer_type");
  const stageConfig = useMemo(() => {
    const publishStage = {
      id: "publish",
      title: "Policies & publish",
      helper: "Capacity and approvals",
      fields: ["max_students_per_session"] as const,
    };

    if (selectedOfferType === "subscription") {
      return [
        {
          id: "basics",
          title: "Offer basics",
          helper: "Name, description, and positioning",
          fields: ["name", "description", "offer_type"] as const,
        },
        {
          id: "pricing",
          title: "Pricing & length",
          helper: "Duration, price, and currency",
          fields: ["duration_minutes", "price", "currency"] as const,
        },
        publishStage,
      ];
    }

    return [
      {
        id: "setup",
        title: "Basics & pricing",
        helper: "Name, duration, price, and currency",
        fields: ["name", "description", "offer_type", "duration_minutes", "price", "currency"] as const,
      },
      publishStage,
    ];
  }, [selectedOfferType]);
  const lastStage = stageIndex === stageConfig.length - 1;
  const currentStage = stageConfig[stageIndex] ?? stageConfig[0];

  const submitForm = form.handleSubmit((values) => {
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
      requires_approval: values.requires_approval,
      max_students_per_session: values.max_students_per_session,
      offer_type: values.offer_type,
    };

    // Pass subscription tiers if this is a subscription offer type
    const tiersToSave = values.offer_type === "subscription" ? subscriptionTiers : undefined;
    onSubmit(payload, tiersToSave);
  });

  const handleFlowSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    if (!lastStage) {
      event.preventDefault();
      const fields = currentStage.fields as unknown as (keyof ServiceFormValues)[];
      const valid = fields.length === 0 ? true : await form.trigger(fields);
      if (valid) {
        setStageIndex((prev) => Math.min(prev + 1, stageConfig.length - 1));
      } else {
        const firstErrorField = fields.find((field) => form.formState.errors[field]);
        if (firstErrorField) {
          const el = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement | null;
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
      return;
    }

    submitForm(event);
  };

  const handleBack = () => {
    setStageIndex((prev) => Math.max(prev - 1, 0));
  };

  // Reset stage index if offer type change reduces steps
  useEffect(() => {
    if (stageIndex > stageConfig.length - 1) {
      setStageIndex(stageConfig.length - 1);
    }
  }, [stageConfig.length, stageIndex]);

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
    <form onSubmit={handleFlowSubmit} className="space-y-6">
      <FlowProgress steps={[...stageConfig]} activeIndex={stageIndex} />

      {stageConfig[stageIndex]?.id === "basics" || stageConfig[stageIndex]?.id === "setup" ? (
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
      ) : null}

      {stageConfig[stageIndex]?.id === "pricing" && selectedOfferType === "subscription" ? (
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
      ) : null}

      {stageConfig[stageIndex]?.id === "publish" ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label="Max students"
              error={form.formState.errors.max_students_per_session?.message}
            >
              <input
                type="number"
                min={1}
                max={50}
                {...form.register("max_students_per_session", { valueAsNumber: true })}
                className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Keep class sizes manageable to maintain quality.
              </p>
            </Field>
            <div className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-foreground">Approval</span>
              <label className="flex items-center gap-2 text-xs text-foreground">
                <input
                  type="checkbox"
                  {...form.register("requires_approval")}
                  className="h-4 w-4 rounded text-primary focus:ring-primary"
                  defaultChecked={form.getValues("requires_approval")}
                />
                Requires approval before confirming
              </label>
              <span className="text-xs text-muted-foreground">
                Students submit requests; you approve before it&apos;s confirmed. Good for high-demand slots or new students.
              </span>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-foreground">Visibility</span>
              <label className="flex items-center gap-2 text-xs text-foreground">
                <input
                  type="checkbox"
                  {...form.register("is_active")}
                  className="h-4 w-4 rounded text-primary focus:ring-primary"
                  defaultChecked={form.getValues("is_active")}
                />
                Show on TutorLingua site
              </label>
              <span className="text-xs text-muted-foreground">
                Hidden services stay off your booking page.
              </span>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        {stageIndex > 0 ? (
          <button
            type="button"
            onClick={handleBack}
            className="text-xs font-semibold text-muted-foreground transition hover:text-primary"
            disabled={loading}
          >
            Back
          </button>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Saving..."
            : lastStage
              ? initialValues
                ? "Save changes"
                : "Create service"
              : "Continue"}
        </button>
        <button
          type="button"
          onClick={() => {
            setStageIndex(0);
            onCancel();
          }}
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
