"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ServiceFormValues, ServiceInput } from "@/lib/validators/service";
import { serviceFormSchema } from "@/lib/validators/service";

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
  };
  defaultCurrency: string;
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (values: ServiceInput) => void;
};

export function ServiceForm({ initialValues, defaultCurrency, loading, onCancel, onSubmit }: Props) {
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      description: initialValues?.description ?? "",
      duration_minutes: initialValues?.duration_minutes ?? 60,
      price: initialValues ? initialValues.price / 100 : 60,
      currency: initialValues?.currency?.toUpperCase() ?? defaultCurrency.toUpperCase(),
      is_active: initialValues?.is_active ?? true,
      requires_approval: initialValues?.requires_approval ?? false,
      max_students_per_session: initialValues?.max_students_per_session ?? 1,
    },
  });

  return (
    <form
      onSubmit={form.handleSubmit((values) => {
        const payload: ServiceInput = {
          name: values.name,
          description: values.description ?? "",
          duration_minutes: values.duration_minutes,
          price_cents: Math.round(values.price * 100),
          currency: values.currency,
          is_active: values.is_active,
          requires_approval: values.requires_approval,
          max_students_per_session: values.max_students_per_session,
        };
        onSubmit(payload);
      })}
      className="space-y-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Service name" error={form.formState.errors.name?.message}>
          <input
            type="text"
            {...form.register("name")}
            className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm focus:border-brand-brown focus:outline-none focus:ring-1 focus:ring-brand-brown"
            placeholder="E.g. Conversational Spanish (60 min)"
          />
        </Field>
        <div className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-foreground">Visibility</span>
          <label className="flex items-center gap-2 text-xs text-foreground">
            <input
              type="checkbox"
              {...form.register("is_active")}
              className="h-4 w-4 rounded border-brand-brown text-brand-brown focus:ring-brand-brown"
              defaultChecked={form.getValues("is_active")}
            />
            Show on TutorLingua site
          </label>
          <span className="text-xs text-muted-foreground">
            Hidden services stay off your booking page.
          </span>
        </div>
        <Field label="Description" error={form.formState.errors.description?.message} className="sm:col-span-2">
          <textarea
            {...form.register("description")}
            rows={3}
            className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm leading-relaxed shadow-sm focus:border-brand-brown focus:outline-none focus:ring-1 focus:ring-brand-brown"
            placeholder="Who is this for? What results can they expect?"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Duration" error={form.formState.errors.duration_minutes?.message}>
          <div className="relative">
            <input
              type="number"
              min={15}
              step={5}
              {...form.register("duration_minutes", { valueAsNumber: true })}
              className="w-full rounded-xl border border-input bg-background px-4 py-2 pr-12 text-sm shadow-sm focus:border-brand-brown focus:outline-none focus:ring-1 focus:ring-brand-brown"
            />
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs text-muted-foreground">
              min
            </span>
          </div>
        </Field>

        <Field label="Price" error={form.formState.errors.price?.message}>
          <div className="relative">
            <input
              type="number"
              min={0}
              step={1}
              {...form.register("price", { valueAsNumber: true })}
              className="w-full rounded-xl border border-input bg-background px-4 py-2 pr-12 text-sm shadow-sm focus:border-brand-brown focus:outline-none focus:ring-1 focus:ring-brand-brown"
            />
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs text-muted-foreground">
              {form.watch("currency")}
            </span>
          </div>
        </Field>

        <Field label="Currency" error={form.formState.errors.currency?.message}>
          <input
            type="text"
            maxLength={3}
            {...form.register("currency")}
            className="w-full uppercase rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm focus:border-brand-brown focus:outline-none focus:ring-1 focus:ring-brand-brown"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Max students" error={form.formState.errors.max_students_per_session?.message}>
          <input
            type="number"
            min={1}
            {...form.register("max_students_per_session", { valueAsNumber: true })}
            className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm focus:border-brand-brown focus:outline-none focus:ring-1 focus:ring-brand-brown"
          />
        </Field>
        <div className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-foreground">Approval</span>
          <label className="flex items-center gap-2 text-xs text-foreground">
            <input
              type="checkbox"
              {...form.register("requires_approval")}
              className="h-4 w-4 rounded border-brand-brown text-brand-brown focus:ring-brand-brown"
              defaultChecked={form.getValues("requires_approval")}
            />
            Requires approval before confirming
          </label>
          <span className="text-xs text-muted-foreground">
            Require manual confirmation for each booking.
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-10 items-center justify-center rounded-full bg-brand-brown px-6 text-sm font-semibold text-brand-white shadow-sm transition hover:bg-brand-brown/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {initialValues ? "Save changes" : "Create service"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-semibold text-muted-foreground transition hover:text-brand-brown"
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
