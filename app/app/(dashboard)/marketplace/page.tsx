import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MarketplaceDashboard } from "./marketplace-dashboard";
import {
  listTransactionsWithProducts,
  getMarketplaceSummary,
  getCommissionTierInfo,
} from "@/lib/repositories/marketplace";

export const metadata = {
  title: "Sales Dashboard | TutorLingua",
  description: "Track your digital product sales and commission breakdown",
};

export default async function MarketplacePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/marketplace");
  }

  // Use repository functions for data fetching (single source of truth)
  const [transactions, summary, tierInfo] = await Promise.all([
    listTransactionsWithProducts(supabase, user.id, { limit: 50 }),
    getMarketplaceSummary(supabase, user.id),
    getCommissionTierInfo(supabase, user.id),
  ]);

  // Map tier info to commission tier string
  const commissionTier = tierInfo.isTopTier ? "reduced" : "standard";

  return (
    <MarketplaceDashboard
      transactions={transactions}
      summary={summary}
      commissionTier={commissionTier}
    />
  );
}
