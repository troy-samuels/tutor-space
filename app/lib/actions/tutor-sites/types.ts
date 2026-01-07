import type { SiteConfig } from "@/lib/types/site";

export type TutorSiteStatus = "draft" | "published";

export type TutorSite = {
  id: string;
  tutor_id: string;
  about_title: string | null;
  about_subtitle: string | null;
  about_body: string | null;
  hero_image_url: string | null;
  gallery_images: string[] | null;
  theme_palette_id: string | null;
  theme_archetype_id: string | null;
  theme_background: string;
  theme_background_style: string | null;
  theme_gradient_from: string | null;
  theme_gradient_to: string | null;
  theme_card_bg: string | null;
  theme_primary: string;
  theme_text_primary: string | null;
  theme_text_secondary: string | null;
  theme_font: string;
  theme_heading_font: string | null;
  theme_border_radius: string | null;
  theme_spacing: string;
  hero_layout: string | null;
  lessons_layout: string | null;
  reviews_layout: string | null;
  booking_headline: string | null;
  booking_subcopy: string | null;
  booking_cta_label: string | null;
  booking_cta_url: string | null;
  show_about: boolean;
  show_lessons: boolean;
  show_booking: boolean | null;
  show_reviews: boolean;
  show_social_page: boolean | null;
  show_resources: boolean;
  show_contact: boolean;
  show_digital: boolean | null;
  show_faq: boolean | null;
  show_social_links: boolean | null;
  show_social_header_icons: boolean | null;
  show_social_footer_icons: boolean | null;
  contact_cta_label: string | null;
  contact_cta_url: string | null;
  additional_pages: AdditionalPages | null;
  config: SiteConfig | null;
  status: TutorSiteStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TutorSiteService = {
  id: string;
  tutor_site_id: string;
  service_id: string;
  sort_order: number;
};

export type TutorSiteReview = {
  id: string;
  tutor_site_id: string;
  author_name: string;
  quote: string;
  sort_order: number;
  student_id?: string | null;
  review_id?: string | null;
  rating?: number | null;
};

export type TutorSiteResource = {
  id: string;
  tutor_site_id: string;
  label: string;
  url: string;
  category: string | null;
  sort_order: number;
};

export type TutorSiteProduct = {
  id: string;
  tutor_site_id: string;
  product_id: string;
  sort_order: number;
};

export type AdditionalPages = {
  faq?: Array<{ q: string; a: string }>;
  resources?: Array<{ title: string; url: string; description?: string }>;
};

export type TutorSiteData = {
  about_title?: string | null;
  about_subtitle?: string | null;
  about_body?: string | null;
  hero_image_url?: string | null;
  gallery_images?: string[];
  theme_palette_id?: string;
  theme_archetype_id?: string;
  theme_background?: string;
  theme_background_style?: string;
  theme_gradient_from?: string;
  theme_gradient_to?: string;
  theme_card_bg?: string;
  theme_primary?: string;
  theme_text_primary?: string;
  theme_text_secondary?: string;
  theme_font?: string;
  theme_heading_font?: string;
  theme_border_radius?: string;
  theme_spacing?: string;
  hero_layout?: string;
  lessons_layout?: string;
  reviews_layout?: string;
  booking_headline?: string | null;
  booking_subcopy?: string | null;
  booking_cta_label?: string | null;
  booking_cta_url?: string | null;
  show_hero?: boolean;
  show_gallery?: boolean;
  show_about?: boolean;
  show_lessons?: boolean;
  show_booking?: boolean;
  show_reviews?: boolean;
  show_social_page?: boolean;
  show_resources?: boolean;
  show_contact?: boolean;
  show_digital?: boolean;
  show_faq?: boolean;
  show_social_links?: boolean;
  show_social_header_icons?: boolean;
  show_social_footer_icons?: boolean;
  contact_cta_label?: string | null;
  contact_cta_url?: string | null;
  additional_pages?: AdditionalPages;
  services?: string[];
  reviews?: Array<{ author_name: string; quote: string }>;
  resources?: Array<{ label: string; url: string; category?: string }>;
  products?: string[];
  _prev_updated_at?: string;
};
