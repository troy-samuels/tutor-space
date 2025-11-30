"use client";

import { useEffect, useMemo, useState } from "react";
import { buttonStyleOptions, linkSchema, type LinkFormValues } from "@/lib/validators/link";

type LinkEditorProps = {
  variant: "create" | "update";
  initialValues?: LinkFormValues;
  disabled?: boolean;
  onSubmit: (values: LinkFormValues, reset: () => void) => void;
};

const DEFAULT_VALUES: LinkFormValues = {
  title: "",
  url: "",
  description: "",
  icon_url: "",
  button_style: "default",
  is_visible: true,
};

export function LinkEditor({
  variant,
  initialValues,
  disabled,
  onSubmit,
}: LinkEditorProps) {
  const [values, setValues] = useState<LinkFormValues>(
    () => ({ ...DEFAULT_VALUES, ...(initialValues ?? {}) })
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setValues({ ...DEFAULT_VALUES, ...(initialValues ?? {}) });
  }, [initialValues, variant]);

  const actionLabel = useMemo(() => (variant === "create" ? "Add link" : "Save changes"), [variant]);

  function handleChange<Key extends keyof LinkFormValues>(key: Key, value: LinkFormValues[Key]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setValues({ ...DEFAULT_VALUES, ...(initialValues ?? {}) });
    setErrors({});
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = linkSchema.safeParse({
      ...values,
      description: values.description ?? "",
      icon_url: values.icon_url ?? "",
    });
    if (!parsed.success) {
      const formErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const path = issue.path[0];
        if (typeof path === "string") {
          formErrors[path] = issue.message;
        }
      });
      setErrors(formErrors);
      return;
    }
    setErrors({});
    onSubmit(parsed.data, resetForm);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Title" htmlFor={`${variant}-title`}>
          <input
            id={`${variant}-title`}
            name="title"
            value={values.title}
            onChange={(event) => handleChange("title", event.target.value)}
            required
            disabled={disabled}
            className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
          />
          {errors.title ? <ErrorText>{errors.title}</ErrorText> : null}
        </Field>

        <Field label="Button style" htmlFor={`${variant}-style`}>
          <select
            id={`${variant}-style`}
            name="button_style"
            value={values.button_style}
            onChange={(event) =>
              handleChange("button_style", event.target.value as LinkFormValues["button_style"])
            }
            disabled={disabled}
            className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {buttonStyleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Destination URL" htmlFor={`${variant}-url`}>
        <input
          id={`${variant}-url`}
          name="url"
          value={values.url}
          onChange={(event) => handleChange("url", event.target.value)}
          type="url"
          required
          disabled={disabled}
          placeholder="https://"
          className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
        />
        {errors.url ? <ErrorText>{errors.url}</ErrorText> : null}
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Short description" htmlFor={`${variant}-description`} helper="Optional">
          <input
            id={`${variant}-description`}
            name="description"
            value={values.description ?? ""}
            onChange={(event) => handleChange("description", event.target.value)}
            disabled={disabled}
            className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
          />
          {errors.description ? <ErrorText>{errors.description}</ErrorText> : null}
        </Field>

        <Field label="Icon URL" htmlFor={`${variant}-icon`} helper="Optional">
          <input
            id={`${variant}-icon`}
            name="icon_url"
            value={values.icon_url ?? ""}
            onChange={(event) => handleChange("icon_url", event.target.value)}
            disabled={disabled}
            placeholder="https://..."
            className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
          />
          {errors.icon_url ? <ErrorText>{errors.icon_url}</ErrorText> : null}
        </Field>
      </div>

      <label className="flex items-center gap-3 text-sm text-foreground">
        <input
          type="checkbox"
          checked={values.is_visible}
          onChange={(event) => handleChange("is_visible", event.target.checked)}
          disabled={disabled}
          className="h-4 w-4 rounded shadow-sm text-primary focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
        />
        Show this link on my public page
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={disabled}
          className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {actionLabel}
        </button>
        {variant === "update" ? (
          <button
            type="button"
            onClick={resetForm}
            disabled={disabled}
            className="text-xs font-semibold text-foreground hover:underline disabled:cursor-not-allowed disabled:opacity-60"
          >
            Reset
          </button>
        ) : null}
      </div>
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
      <span className="font-medium">{label}</span>
      {children}
      {helper ? <span className="text-xs text-muted-foreground">{helper}</span> : null}
    </label>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-medium text-destructive">{children}</span>;
}
