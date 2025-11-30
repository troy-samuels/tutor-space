import { z } from "zod";

export const availabilitySlotSchema = z.object({
  id: z.string().uuid().optional(),
  day_of_week: z
    .number()
    .int()
    .min(0, { message: "Select a day of the week." })
    .max(6),
  start_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Use HH:MM format for start time"),
  end_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Use HH:MM format for end time"),
  is_available: z.boolean().default(true),
});

export type AvailabilitySlotInput = z.infer<typeof availabilitySlotSchema>;

export const availabilityFormSchema = z.array(availabilitySlotSchema).superRefine((slots, ctx) => {
  slots.forEach((slot, index) => {
    if (slot.start_time >= slot.end_time) {
      ctx.addIssue({
        path: [index, "end_time"],
        message: "End time must be after start time",
        code: "custom",
      });
    }
  });
});

export type AvailabilityFormValues = z.infer<typeof availabilityFormSchema>;
