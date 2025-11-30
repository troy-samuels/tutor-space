import { z } from "zod";

export const sessionPackageSchema = z.object({
  name: z.string().min(3),
  description: z.string().max(500).optional().or(z.literal("")),
  session_count: z.number().int().min(1).nullable(),
  total_minutes: z.number().int().min(30),
  price_cents: z.number().int().min(0),
  currency: z.string().length(3),
  is_active: z.boolean(),
});

export type SessionPackageInput = z.infer<typeof sessionPackageSchema>;

export const sessionPackageFormSchema = z.object({
  name: z.string().min(3, "Package name is required"),
  description: z.string().max(500).optional().or(z.literal("")),
  session_count: z
    .union([z.number().int().min(1, "Session count must be a positive number"), z.null()])
    .transform((value) => (value === null ? null : value)),
  total_minutes: z
    .coerce.number()
    .int()
    .min(30, "Include at least 30 minutes"),
  price: z
    .coerce.number()
    .min(0, "Price cannot be negative"),
  currency: z
    .string()
    .min(3, "Use a 3-letter currency code")
    .transform((value) => value.trim().toUpperCase())
    .refine((value) => value.length === 3, { message: "Currency must be 3 letters" }),
  is_active: z.boolean().default(true),
});

export type SessionPackageFormValues = z.infer<typeof sessionPackageFormSchema>;
