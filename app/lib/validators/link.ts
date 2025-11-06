import { z } from "zod";

const BUTTON_STYLES = ["default", "primary", "secondary", "outline"] as const;

export const linkSchema = z.object({
  title: z.string().min(2, "Add a title so tutors know what this link is for."),
  url: z.string().url("Enter a valid URL starting with http:// or https://"),
  description: z.string().max(160, "Keep descriptions concise.").optional().or(z.literal("")),
  icon_url: z.string().url("Enter a valid icon URL").optional().or(z.literal("")),
  button_style: z.enum(BUTTON_STYLES).default("default"),
  is_visible: z.boolean().default(true),
});

export type LinkFormValues = z.infer<typeof linkSchema>;
export type LinkButtonStyle = (typeof BUTTON_STYLES)[number];

export const buttonStyleOptions = BUTTON_STYLES.map((style) => ({
  value: style,
  label:
    style === "default"
      ? "Standard"
      : style === "primary"
        ? "Highlight"
        : style === "secondary"
          ? "Secondary"
          : "Outline",
}));
