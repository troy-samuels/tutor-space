import { getAvailability } from "@/lib/actions/availability";
import { AvailabilityDashboard } from "@/components/availability/availability-dashboard";

export default async function AvailabilityPage() {
  const { slots } = await getAvailability();

  return <AvailabilityDashboard initialSlots={slots} />;
}
