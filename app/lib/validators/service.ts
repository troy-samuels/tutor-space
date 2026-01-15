import { z } from "zod";

// ISO 4217 currency codes supported by Stripe
const VALID_CURRENCY_CODES = [
  "USD", "EUR", "GBP", "CAD", "AUD", "NZD", "CHF", "JPY", "CNY", "HKD",
  "SGD", "SEK", "DKK", "NOK", "PLN", "CZK", "HUF", "RON", "BGN", "HRK",
  "ISK", "MXN", "BRL", "ARS", "CLP", "COP", "PEN", "UYU", "INR", "PKR",
  "BDT", "LKR", "NPR", "PHP", "THB", "VND", "IDR", "MYR", "KRW", "TWD",
  "ZAR", "EGP", "MAD", "NGN", "KES", "GHS", "TZS", "UGX", "RWF", "AED",
  "SAR", "QAR", "KWD", "BHD", "OMR", "JOD", "ILS", "TRY", "RUB", "UAH",
] as const;

const offerTypeEnum = z.enum(["subscription", "lesson_block", "one_off", "trial"]);

export type ServiceOfferType = z.infer<typeof offerTypeEnum>;

export const serviceSchema = z.object({
  name: z.string().min(3),
  description: z.string().max(2000).optional().or(z.literal("")),
  duration_minutes: z.number().int().min(15),
  price_cents: z.number().int().min(0),
  currency: z
    .string()
    .length(3)
    .transform((v) => v.toUpperCase())
    .refine(
      (v) => VALID_CURRENCY_CODES.includes(v as (typeof VALID_CURRENCY_CODES)[number]),
      { message: "Invalid currency code" }
    ),
  is_active: z.boolean(),
  requires_approval: z.boolean(),
  max_students_per_session: z
    .number()
    .int()
    .min(1)
    .max(1)
    .default(1),
  offer_type: offerTypeEnum.default("one_off"),
});

export type ServiceInput = z.infer<typeof serviceSchema>;

export const serviceFormSchema = z.object({
  name: z.string().min(3, "Name is required"),
  description: z.string().max(2000).optional().or(z.literal("")),
  duration_minutes: z
    .coerce.number()
    .int()
    .min(15, "Duration must be at least 15 minutes"),
  price: z
    .coerce.number()
    .min(0, "Price cannot be negative"),
  currency: z
    .string()
    .min(3, "Use a 3-letter currency code")
    .transform((value) => value.trim().toUpperCase())
    .refine((value) => value.length === 3, { message: "Currency must be 3 letters" })
    .refine(
      (value) => VALID_CURRENCY_CODES.includes(value as (typeof VALID_CURRENCY_CODES)[number]),
      { message: "Invalid currency code. Use standard codes like USD, EUR, GBP." }
    ),
  is_active: z.boolean().default(true),
  requires_approval: z.boolean().default(false),
  max_students_per_session: z
    .coerce.number()
    .int()
    .min(1, "At least one student")
    .max(1, "Only 1:1 services are supported")
    .default(1),
  offer_type: offerTypeEnum.default("one_off"),
});

export type ServiceFormValues = z.infer<typeof serviceFormSchema>;
