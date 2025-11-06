import { z } from "zod";

export const profileSchema = z.object({
  full_name: z.string().min(2, "Name is required"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, or hyphens"),
  tagline: z.string().min(10, "Add a short positioning statement"),
  bio: z.string().min(40, "Tell parents about your approach"),
  languages_taught: z.string().min(2, "List the languages you teach"),
  timezone: z.string().min(2, "Select your timezone"),
  website_url: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  avatar_url: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  instagram_handle: z.string().optional().or(z.literal("")),
  tiktok_handle: z.string().optional().or(z.literal("")),
  facebook_handle: z.string().optional().or(z.literal("")),
  x_handle: z.string().optional().or(z.literal("")),
  booking_enabled: z.boolean().default(true),
  auto_accept_bookings: z.boolean().default(false),
  buffer_time_minutes: z.number().min(0, "Buffer time must be zero or more"),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
