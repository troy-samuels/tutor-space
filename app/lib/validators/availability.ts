import { z } from "zod";

function parseTimeToMinutes(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  if (hours < 0 || hours > 24) return null;
  if (minutes < 0 || minutes > 59) return null;
  if (hours === 24 && minutes !== 0) return null;
  return hours * 60 + minutes;
}

const timeStringSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Use HH:MM format for time")
  .refine((value) => parseTimeToMinutes(value) !== null, {
    message: "Time must be between 00:00 and 24:00",
  });

export const availabilitySlotSchema = z.object({
  id: z.string().uuid().optional(),
  day_of_week: z
    .number()
    .int()
    .min(0, { message: "Select a day of the week." })
    .max(6),
  start_time: timeStringSchema,
  end_time: timeStringSchema,
  is_available: z.boolean().default(true),
});

export type AvailabilitySlotInput = z.infer<typeof availabilitySlotSchema>;

export const availabilityFormSchema = z.array(availabilitySlotSchema).superRefine((slots, ctx) => {
  slots.forEach((slot, index) => {
    const startMinutes = parseTimeToMinutes(slot.start_time);
    const endMinutes = parseTimeToMinutes(slot.end_time);
    if (startMinutes === null || endMinutes === null) {
      ctx.addIssue({
        path: [index, "end_time"],
        message: "Enter a valid time between 00:00 and 24:00",
        code: "custom",
      });
      return;
    }
    if (startMinutes >= endMinutes) {
      ctx.addIssue({
        path: [index, "end_time"],
        message: "End time must be after start time",
        code: "custom",
      });
    }
  });
});

export type AvailabilityFormValues = z.infer<typeof availabilityFormSchema>;
