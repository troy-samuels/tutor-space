import { z } from "zod";

export const serviceSchema = z.object({
  name: z.string().min(3),
  description: z.string().max(2000).optional().or(z.literal("")),
  duration_minutes: z.number().int().min(15),
  price_cents: z.number().int().min(0),
  currency: z.string().length(3),
  is_active: z.boolean(),
  requires_approval: z.boolean(),
  max_students_per_session: z.number().int().min(1),
});

export type ServiceInput = z.infer<typeof serviceSchema>;

export const serviceFormSchema = z.object({
  name: z.string().min(3, "Name is required"),
  description: z.string().max(2000).optional().or(z.literal("")),
  duration_minutes: z
    .coerce.number({ invalid_type_error: "Enter a duration" })
    .int()
    .min(15, "Duration must be at least 15 minutes"),
  price: z
    .coerce.number({ invalid_type_error: "Enter a price" })
    .min(0, "Price cannot be negative"),
  currency: z
    .string()
    .min(3, "Use a 3-letter currency code")
    .transform((value) => value.trim().toUpperCase())
    .refine((value) => value.length === 3, { message: "Currency must be 3 letters" }),
  is_active: z.boolean().default(true),
  requires_approval: z.boolean().default(false),
  max_students_per_session: z
    .coerce.number({ invalid_type_error: "Enter max students" })
    .int()
    .min(1, "At least one student"),
});

export type ServiceFormValues = z.infer<typeof serviceFormSchema>;
