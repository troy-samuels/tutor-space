import { z } from "zod";

// Core optional string with max length helper
const optionalString = (max: number) => z.string().trim().max(max).optional().or(z.literal("").optional());
const optionalUrl = () => z.string().url().optional().or(z.literal("").optional());

// Hex color like #ffffff
const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

// Theme constraints aligned with existing defaults
const themeFont = z
  .enum(["system", "serif", "mono", "rounded", "editorial", "humanist", "grotesk", "playful", "luxury", "tech"])
  .optional();
const themeSpacing = z.enum(["cozy", "comfortable", "compact"]).optional();
const backgroundStyle = z.enum(["solid", "gradient"]).optional();
const layoutOption = z.string().max(32).optional(); // "minimal" | "portrait" | "banner" | "cards" | "list" | "highlight"

export const tutorSiteDataSchema = z
  .object({
    // About
    about_title: optionalString(200),
    about_subtitle: optionalString(240),
    about_body: optionalString(5000),
    hero_image_url: optionalUrl().nullable().optional(),
    gallery_images: z.array(z.string().url()).optional(),

    // Theme
    theme_background: hexColor.optional(),
    theme_background_style: backgroundStyle,
    theme_gradient_from: hexColor.optional(),
    theme_gradient_to: hexColor.optional(),
    theme_primary: hexColor.optional(),
    theme_font: themeFont,
    theme_spacing: themeSpacing,

    // Layouts
    hero_layout: layoutOption,
    lessons_layout: layoutOption,
    reviews_layout: layoutOption,

    // Booking copy
    booking_headline: optionalString(200).nullable().optional(),
    booking_subcopy: optionalString(500).nullable().optional(),
    booking_cta_label: optionalString(60).nullable().optional(),
    booking_cta_url: optionalUrl().nullable().optional(),

    // Visibility toggles
    show_about: z.boolean().optional(),
    show_lessons: z.boolean().optional(),
    show_booking: z.boolean().optional(),
    show_reviews: z.boolean().optional(),
    show_social_page: z.boolean().optional(),
    show_resources: z.boolean().optional(),
    show_contact: z.boolean().optional(),
    show_digital: z.boolean().optional(),
    show_faq: z.boolean().optional(),
    show_social_links: z.boolean().optional(),
    show_social_header_icons: z.boolean().optional(),
    show_social_footer_icons: z.boolean().optional(),

    // Contact CTA
    contact_cta_label: optionalString(120).nullable().optional(),
    contact_cta_url: optionalUrl().nullable().optional(),

    // Additional structured content
    additional_pages: z
      .object({
        faq: z
          .array(
            z.object({
              q: optionalString(240).transform((v) => v ?? ""),
              a: optionalString(2000).transform((v) => v ?? ""),
            })
          )
          .optional(),
        resources: z
          .array(
            z.object({
              title: optionalString(200).transform((v) => v ?? ""),
              url: z.string().url(),
              description: optionalString(400).optional(),
            })
          )
          .optional(),
      })
      .optional(),

    // Lists (IDs or small objects)
    services: z.array(z.string().uuid()).optional(),
    reviews: z
      .array(
        z.object({
          author_name: optionalString(120).transform((v) => v ?? ""),
          quote: optionalString(1000).transform((v) => v ?? ""),
        })
      )
      .optional(),
    resources: z
      .array(
        z.object({
          label: optionalString(120).transform((v) => v ?? ""),
          url: z.string().url(),
          category: optionalString(60).optional(),
        })
      )
      .optional(),
    products: z.array(z.string().uuid()).optional(),

    // Concurrency token (not persisted)
    _prev_updated_at: z.string().datetime().optional(),
  })
  .strict();

export type TutorSiteDataValidated = z.infer<typeof tutorSiteDataSchema>;



