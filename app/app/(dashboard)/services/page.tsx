import { createClient } from "@/lib/supabase/server";
import type { ServiceRecord } from "@/lib/actions/services";
import type { SessionPackageRecord } from "@/lib/actions/session-packages";
import { ServiceDashboard } from "@/components/services/service-dashboard";

type ProfileDefaults = {
  currency: string | null;
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
      "id, tutor_id, name, description, duration_minutes, price, currency, is_active, requires_approval, max_students_per_session, created_at, updated_at"
    )
    .eq("tutor_id", user.id)
    .order("created_at", { ascending: true });

  const packagesResponse = await supabase
    .from("session_package_templates")
    .select("*")
    .eq("tutor_id", user.id)
    .order("created_at", { ascending: true });

  const profileResponse = await supabase
    .from("profiles")
    .select("currency")
    .eq("id", user.id)
    .single<ProfileDefaults>();

  const services = (servicesResponse.data as ServiceRecord[] | null) ?? [];
  const packages = (packagesResponse.data as SessionPackageRecord[] | null) ?? [];

  const servicesWithPackages = services.map((service) => ({
    ...service,
    packages: packages.filter((pkg) => pkg.service_id === service.id),
  }));

  return (
    <ServiceDashboard
      services={servicesWithPackages}
      defaultCurrency={profileResponse.data?.currency ?? "USD"}
    />
  );
}
