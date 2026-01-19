import { redirect } from "next/navigation";

export default function AvailabilityPage() {
  redirect("/calendar?view=availability");
}
