"use client";

import { useMemo } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { SessionPackageRecord } from "@/lib/types/session-package";
import type { ServiceRecord } from "@/lib/types/service";
import {
  sessionPackageFormSchema,
  type SessionPackageFormValues,
  type SessionPackageInput,
} from "@/lib/validators/session-package";

type Props = {
  service: ServiceRecord;
  initialValues?: SessionPackageRecord;
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (values: SessionPackageInput) => void;
};

export function PackageForm({ service, initialValues, loading, onCancel, onSubmit }: Props) {
  const form = useForm<SessionPackageFormValues>({
    resolver: zodResolver(sessionPackageFormSchema) as unknown as Resolver<SessionPackageFormValues>,
    defaultValues: {
      name: initialValues?.name ?? `${service.name} bundle`,
      description: initialValues?.description ?? "",
      session_count: initialValues?.session_count ?? null,
      total_minutes: initialValues?.total_minutes ?? service.duration_minutes * 5,
      price: initialValues ? initialValues.price_cents / 100 : Math.round((service.price / 100) * 5),
      currency: initialValues?.currency ?? service.currency ?? "USD",
      is_active: initialValues?.is_active ?? true,
    },
  });

  const watchSessionCount = form.watch("session_count");
  const suggestedMinutes = useMemo(() => {
    if (!watchSessionCount) return form.watch("total_minutes");
    return watchSessionCount * service.duration_minutes;
  }, [watchSessionCount, form, service.duration_minutes]);

  return (
    <form
      onSubmit={form.handleSubmit((values) => {
        const payload: SessionPackageInput = {
          name: values.name,
          description: values.description ?? "",
          session_count: values.session_count,
          total_minutes: values.total_minutes,
          price_cents: Math.round(values.price * 100),
          currency: values.currency,
          is_active: values.is_active,
        };
        onSubmit(payload);
      })}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Package name" error={form.formState.errors.name?.message}>
          <input
            type="text"
            {...form.register("name")}
            className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </Field>
        <Field label="Active" helper="Inactive packages stay off your booking funnel.">
          <label className="flex items-center gap-2 text-xs text-foreground">
            <input
              type="checkbox"
              {...form.register("is_active")}
              className="h-4 w-4 rounded shadow-sm text-primary focus:ring-primary"
              defaultChecked={form.getValues("is_active")}
            />
            Show in booking flow
          </label>
        </Field>
        <Field label="Description" className="sm:col-span-2" error={form.formState.errors.description?.message}>
          <textarea
            rows={2}
            {...form.register("description")}
            className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm leading-relaxed shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="E.g. 5-session conversation boost to prepare for exchange travel."
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Sessions" error={form.formState.errors.session_count?.message}>
          <input
            type="number"
            min={1}
            {...form.register("session_count", {
              setValueAs: (value) => {
                if (value === "" || value === null || typeof value === "undefined") return null;
                const parsed = Number.parseInt(value, 10);
                return Number.isNaN(parsed) ? null : parsed;
              },
            })}
            className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Optional"
          />
        </Field>
        <Field label="Total minutes" error={form.formState.errors.total_minutes?.message}>
          <input
            type="number"
            min={service.duration_minutes}
            {...form.register("total_minutes", { valueAsNumber: true })}
            className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {form.watch("session_count") ? (
            <p className="mt-1 text-[11px] text-muted-foreground">
              Suggested: {suggestedMinutes} minutes ({form.watch("session_count")} × {service.duration_minutes} min)
            </p>
          ) : null}
        </Field>
        <Field label="Package price" error={form.formState.errors.price?.message}>
          <div className="relative">
            <input
              type="number"
              min={0}
            {...form.register("price", { valueAsNumber: true })}
              className="w-full rounded-xl border border-input bg-background px-4 py-2 pr-12 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs text-muted-foreground">
              {form.watch("currency")}
            </span>
          </div>
        </Field>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {initialValues ? "Save package" : "Create package"}
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
