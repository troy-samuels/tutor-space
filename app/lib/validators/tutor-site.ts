import { z } from "zod";

// Core optional string with max length helper
const optionalString = (max: number) => z.string().trim().max(max).optional().or(z.literal("").optional());

export const safeUrlSchema = z
  .string()
  .trim()
  .refine((value) => {
    // Allow relative paths
    if (value.startsWith("/")) return true;

    // Explicitly block dangerous protocols (defense-in-depth)
    const lowerValue = value.toLowerCase().trim();
    if (lowerValue.startsWith("javascript:")) return false;
    if (lowerValue.startsWith("data:")) return false;
    if (lowerValue.startsWith("vbscript:")) return false;

    // Validate allowed protocols via whitelist
    try {
      const parsed = new URL(value);
      return ["https:", "http:", "mailto:", "tel:"].includes(parsed.protocol);
    } catch {
      return false;
    }
  }, "Invalid or unsafe URL. Only https, http, mailto, tel, and relative paths are allowed.");

const optionalSafeUrl = () => safeUrlSchema.or(z.literal("")).optional();
const nullableSafeUrl = () => safeUrlSchema.or(z.literal("")).nullable().optional();

// Hex color like #ffffff
const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

// Theme constraints - Premium Typography Pairings (11 font options)
const themeFont = z
  .enum([
    // Body fonts
    "system",       // Inter
    "rounded",      // Manrope
    "luxury",       // DM Sans
    "source-sans",  // Source Sans 3
    "andika",       // Andika (Creative body)
    // Heading fonts
    "grotesk",      // Space Grotesk
    "serif",        // Playfair Display
    "dm-serif",     // DM Serif Display
    "plus-jakarta", // Plus Jakarta Sans
    "spline-sans",  // Spline Sans (Interface heading)
    "amatic-sc",    // Amatic SC (Creative heading)
  ])
  .optional();

// Teaching Archetype IDs (Language Niche Edition)
const themeArchetypeId = z
  .enum(["professional", "immersion", "academic", "polyglot", "artisan"])
  .optional();

// Legacy palette IDs (deprecated, use archetypeId)
const legacyPaletteId = z.enum([
  "classic-ink",
  "ocean-trust",
  "warm-clay",
  "midnight-gold",
  "lavender-luxe",
]);

const themePaletteId = z.union([legacyPaletteId, themeArchetypeId]).optional();
// Border radius options per archetype
const themeBorderRadius = z.enum(["lg", "xl", "2xl", "3xl"]).optional();

// Font pairing IDs for independent typography selection
const themeFontPairingId = z
  .enum(["minimal", "literary", "heritage", "expressive", "interface", "creative"])
  .optional();

const themeSpacing = z.enum(["cozy", "comfortable", "compact"]).optional();
const backgroundStyle = z.enum(["solid", "gradient"]).optional();

// Hero layout: banner (Cultural Banner), minimal (legacy), portrait (legacy)
const heroLayoutOption = z.enum(["banner", "minimal", "portrait"]).optional();

// Other layouts for services, reviews
const layoutOption = z.string().max(32).optional(); // "cards" | "list" | "highlight"

export const tutorSiteDataSchema = z
  .object({
    // About
    about_title: optionalString(200),
    about_subtitle: optionalString(240),
    about_body: optionalString(5000),
    hero_image_url: nullableSafeUrl(),
    gallery_images: z.array(safeUrlSchema).optional(),

    // Theme
    theme_palette_id: themePaletteId, // Legacy, use archetype_id instead
    theme_archetype_id: themeArchetypeId,
    theme_font_pairing_id: themeFontPairingId,
    theme_background: hexColor.optional(),
    theme_background_style: backgroundStyle,
    theme_gradient_from: hexColor.optional(),
    theme_gradient_to: hexColor.optional(),
    theme_card_bg: hexColor.optional(),
    theme_primary: hexColor.optional(),
    theme_text_primary: hexColor.optional(),
    theme_text_secondary: hexColor.optional(),
    theme_font: themeFont,
    theme_heading_font: themeFont, // NEW: For Academic archetype (serif headings)
    theme_border_radius: themeBorderRadius, // NEW: Per-archetype border radius
    theme_spacing: themeSpacing,

    // Layouts
    hero_layout: heroLayoutOption,
    lessons_layout: layoutOption,
    reviews_layout: layoutOption,

    // Booking copy
    booking_headline: optionalString(200).nullable().optional(),
    booking_subcopy: optionalString(500).nullable().optional(),
    booking_cta_label: optionalString(60).nullable().optional(),
    booking_cta_url: nullableSafeUrl(),

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
    contact_cta_url: nullableSafeUrl(),

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
              url: safeUrlSchema,
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
          url: safeUrlSchema,
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
