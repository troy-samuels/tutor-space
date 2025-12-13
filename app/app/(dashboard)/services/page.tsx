import { createClient } from "@/lib/supabase/server";
import type { ServiceRecord } from "@/lib/types/service";
import type { SessionPackageRecord } from "@/lib/types/session-package";
import type { TemplateTier } from "@/lib/subscription";
import { ServiceDashboard } from "@/components/services/service-dashboard";
import type { DigitalProductRecord } from "@/lib/types/digital-product";

type ProfileDefaults = {
  currency: string | null;
  username: string | null;
};

type SubscriptionTemplateRow = {
  id: string;
  service_id: string;
  template_tier: TemplateTier;
  price_cents: number;
};

export default async function ServicesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const servicesResponse = await supabase
    .from("services")
    .select(
      "id, tutor_id, name, description, duration_minutes, price, currency, price_amount, price_currency, is_active, requires_approval, max_students_per_session, offer_type, created_at, updated_at"
    )
    .eq("tutor_id", user.id)
    .order("created_at", { ascending: true });

  const packagesResponse = await supabase
    .from("session_package_templates")
    .select("*")
    .eq("tutor_id", user.id)
    .order("created_at", { ascending: true });

  // Fetch subscription templates for all services
  const subscriptionTemplatesResponse = await supabase
    .from("lesson_subscription_templates")
    .select("id, service_id, template_tier, price_cents")
    .eq("tutor_id", user.id)
    .eq("is_active", true);

  const profileResponse = await supabase
    .from("profiles")
    .select("currency, username")
    .eq("id", user.id)
    .single<ProfileDefaults>();

  const digitalProductsResponse = await supabase
    .from("digital_products")
    .select(
      "id, tutor_id, slug, title, description, price_cents, currency, fulfillment_type, storage_path, external_url, stripe_product_id, stripe_price_id, published, total_sales, total_revenue_cents, created_at, updated_at"
    )
    .eq("tutor_id", user.id)
    .order("created_at", { ascending: false });

  const services = (servicesResponse.data as ServiceRecord[] | null) ?? [];
  const packages = (packagesResponse.data as SessionPackageRecord[] | null) ?? [];
  const subscriptionTemplates = (subscriptionTemplatesResponse.data as SubscriptionTemplateRow[] | null) ?? [];
  const digitalProducts = (digitalProductsResponse.data as DigitalProductRecord[] | null) ?? [];

  const servicesWithPackages = services.map((service) => ({
    ...service,
    packages: packages.filter((pkg) => pkg.service_id === service.id),
    subscriptionTiers: subscriptionTemplates
      .filter((t) => t.service_id === service.id)
      .map((t) => ({
        tier_id: t.template_tier,
        price: t.price_cents / 100, // Convert cents to dollars for the form
      })),
  }));

  return (
    <ServiceDashboard
      services={servicesWithPackages}
      defaultCurrency={profileResponse.data?.currency ?? "USD"}
      digitalProducts={digitalProducts}
      profileUsername={profileResponse.data?.username ?? null}
    />
  );
}
