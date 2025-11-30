"use server";

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type PageParams = {
  username: string;
};

export type PublicSiteData = Awaited<ReturnType<typeof loadPublicSite>>;

export async function loadPublicSite(
  params: PageParams,
  initialPage: "home" | "services" | "faq" | "contact" = "home"
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, username, tagline, bio, avatar_url, email, stripe_payment_link")
    .eq("username", params.username.toLowerCase())
    .single();

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

  const { data: siteServices } = await supabase
    .from("tutor_site_services")
    .select("service_id")
    .eq("tutor_site_id", site.id);

  const serviceIds = siteServices?.map((s) => s.service_id) || [];

  const { data: services } = await supabase
    .from("services")
    .select("id, name, description, duration_minutes, price, currency")
    .in("id", serviceIds.length > 0 ? serviceIds : ["00000000-0000-0000-0000-000000000000"]);

  const { data: reviews } = await supabase
    .from("tutor_site_reviews")
    .select("author_name, quote, rating")
    .eq("tutor_site_id", site.id)
    .order("sort_order");

  const { data: resources } = await supabase
    .from("tutor_site_resources")
    .select("id, label, url")
    .eq("tutor_site_id", site.id);

  const { data: studentRecord } = user
    ? await supabase
        .from("students")
        .select("id, full_name")
        .eq("user_id", user.id)
        .eq("tutor_id", profile.id)
        .maybeSingle()
    : { data: null };

  let hasCompletedLesson = false;
  if (studentRecord) {
    const { count: completedCount } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("tutor_id", profile.id)
      .eq("student_id", studentRecord.id)
      .eq("status", "completed");

    hasCompletedLesson = (completedCount ?? 0) > 0;
  }

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
      },
      about: {
        title: site.about_title || profile.full_name || "",
        subtitle: site.about_subtitle || profile.tagline || "",
        body: site.about_body || profile.bio || "",
      },
      services: services || [],
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
        font: (site.theme_font as any) || "system",
        spacing: (site.theme_spacing as "cozy" | "comfortable" | "compact") || "comfortable",
      },
      pageVisibility: {
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
      },
      showDigital: site.show_digital ?? false,
      showSocialIconsHeader: false,
      showSocialIconsFooter: true,
      heroStyle: (site.hero_layout as any) || "minimal",
      lessonsStyle: (site.lessons_layout as any) || "cards",
      reviewsStyle: (site.reviews_layout as any) || "cards",
      page: initialPage,
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
