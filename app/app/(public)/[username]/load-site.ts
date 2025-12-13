"use server";

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseLanguagesWithFlags } from "@/lib/utils/language-flags";

type PageParams = {
  username: string;
};

export type PublicSiteData = Awaited<ReturnType<typeof loadPublicSite>>;

export async function loadPublicSite(
  params: PageParams,
  initialPage: "home" | "services" | "faq" | "contact" = "home"
) {
  const supabase = await createClient();

  // Fetch auth + profile in parallel to reduce round-trips
  const [
    {
      data: { user },
    },
    { data: profile },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("public_profiles")
      .select(
        "id, full_name, username, tagline, bio, avatar_url, email, stripe_payment_link, languages_taught"
      )
      .eq("username", params.username.toLowerCase())
      .single(),
  ]);

  if (!profile) {
    notFound();
  }

  const { data: site } = await supabase
    .from("tutor_sites")
    .select("*")
    .eq("tutor_id", profile.id)
    .eq("status", "published")
    .single();

  if (!site) {
    notFound();
  }

  const [siteServicesResult, reviewsResult, resourcesResult, studentRecordResult] = await Promise.all([
    supabase
      .from("tutor_site_services")
      .select("service_id")
      .eq("tutor_site_id", site.id),
    supabase
      .from("tutor_site_reviews")
      .select("author_name, quote, rating")
      .eq("tutor_site_id", site.id)
      .order("sort_order"),
    supabase
      .from("tutor_site_resources")
      .select("id, label, url")
      .eq("tutor_site_id", site.id),
    user
      ? supabase
          .from("students")
          .select("id, full_name")
          .eq("user_id", user.id)
          .eq("tutor_id", profile.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const siteServices = siteServicesResult.data;
  const reviews = reviewsResult.data;
  const resources = resourcesResult.data;
  const studentRecord = studentRecordResult.data;

  const serviceIds = siteServices?.map((s) => s.service_id) || [];

  const [servicesResult, subscriptionTemplatesResult, completedCountResult] = await Promise.all([
    supabase
      .from("services")
      .select("id, name, description, duration_minutes, price, currency, offer_type")
      .in("id", serviceIds.length > 0 ? serviceIds : ["00000000-0000-0000-0000-000000000000"]),
    supabase
      .from("lesson_subscription_templates")
      .select("id, service_id, template_tier, lessons_per_month, price_cents, currency")
      .in("service_id", serviceIds.length > 0 ? serviceIds : ["00000000-0000-0000-0000-000000000000"])
      .eq("is_active", true)
      .order("lessons_per_month", { ascending: true }),
    studentRecord
      ? supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("tutor_id", profile.id)
          .eq("student_id", studentRecord.id)
          .eq("status", "completed")
      : Promise.resolve({ count: 0 }),
  ]);

  const services = servicesResult.data;
  const subscriptionTemplates = subscriptionTemplatesResult.data;
  const completedCount = completedCountResult.count ?? 0;
  const hasCompletedLesson = studentRecord ? completedCount > 0 : false;

  const defaultDisplayName =
    studentRecord?.full_name ||
    (user?.user_metadata as any)?.full_name ||
    user?.email ||
    "";

  return {
    siteProps: {
      profile: {
        id: profile.id,
        full_name: profile.full_name || "",
        username: profile.username || params.username,
        tagline: profile.tagline || "",
        bio: profile.bio || "",
        avatar_url: profile.avatar_url,
        stripe_payment_link: profile.stripe_payment_link,
        languages_taught: (profile as any).languages_taught || null,
      },
      about: {
        title: site.about_title || profile.full_name || "",
        subtitle: site.about_subtitle || profile.tagline || "",
        body: site.about_body || profile.bio || "",
      },
      services: services || [],
      subscriptionTemplates: subscriptionTemplates?.map((t) => ({
        id: t.id,
        serviceId: t.service_id,
        tier: t.template_tier,
        lessonsPerMonth: t.lessons_per_month,
        priceCents: t.price_cents,
        currency: t.currency,
      })) || [],
      reviews:
        reviews?.map((r) => ({
          author: r.author_name,
          quote: r.quote,
          rating: r.rating,
        })) || [],
      theme: {
        background: site.theme_background || "#ffffff",
        backgroundStyle: (site.theme_background_style as "solid" | "gradient") || "solid",
        gradientFrom: site.theme_gradient_from || "#ffffff",
        gradientTo: site.theme_gradient_to || "#ffffff",
        primary: site.theme_primary || "#2563eb",
        cardBg: (site as any).theme_card_bg || undefined,
        textPrimary: (site as any).theme_text_primary || undefined,
        textSecondary: (site as any).theme_text_secondary || undefined,
        font: (site.theme_font as any) || "system",
        spacing: (site.theme_spacing as "cozy" | "comfortable" | "compact") || "comfortable",
      },
      pageVisibility: {
        hero: (site as any).show_hero ?? true,
        gallery: (site as any).show_gallery ?? true,
        about: site.show_about ?? true,
        lessons: site.show_lessons ?? true,
        booking: site.show_booking ?? true,
        reviews: site.show_reviews ?? true,
        social: site.show_social_page ?? true,
        resources: site.show_resources ?? false,
        contact: site.show_contact ?? false,
        digital: site.show_digital ?? false,
        faq: site.show_faq ?? false,
      },
      heroImageUrl: site.hero_image_url,
      galleryImages: site.gallery_images || [],
      contactCTA: site.show_contact
        ? {
            label: site.contact_cta_label || "Contact me",
            url: site.contact_cta_url || `mailto:${profile.email || ""}`,
          }
        : null,
      socialLinks:
        resources?.map((r) => ({
          id: r.id,
          label: r.label,
          url: r.url,
        })) || [],
      digitalResources: [],
      additionalPages: { faq: [], resources: [] },
      booking: {
        headline: site.booking_headline || "Ready to start?",
        subcopy: site.booking_subcopy || "Pick a time that works for you",
        ctaLabel: site.booking_cta_label || "Book a class",
        ctaUrl: site.booking_cta_url || profile.stripe_payment_link || `/book/${profile.username}`,
        inlineBookingEnabled: site.show_booking ?? true,
      },
      showDigital: site.show_digital ?? false,
      showSocialIconsHeader: false,
      showSocialIconsFooter: true,
      heroStyle: (site.hero_layout as any) || "banner",
      lessonsStyle: (site.lessons_layout as any) || "cards",
      reviewsStyle: (site.reviews_layout as any) || "cards",
      page: initialPage,
      // Cultural Banner props
      languages: parseLanguagesWithFlags((profile as any).languages_taught),
      borderRadius: ((site as any).theme_border_radius as any) || "3xl",
      headingFont: ((site as any).theme_heading_font as any) || undefined,
    },
    reviewFormProps: {
      tutorId: profile.id,
      tutorSiteId: site.id,
      tutorUsername: profile.username || params.username,
      tutorName: profile.full_name || profile.username || params.username,
      isLoggedIn: !!user,
      canSubmit: !!studentRecord && hasCompletedLesson,
      defaultDisplayName,
    },
  };
}
