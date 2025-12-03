import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MarketplaceDashboard } from "./marketplace-dashboard";

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

  // Fetch marketplace transactions for this tutor
  const { data: transactions } = await supabase
    .from("marketplace_transactions")
    .select(`
      id,
      gross_amount_cents,
      platform_commission_cents,
      net_amount_cents,
      commission_rate,
      status,
      created_at,
      products:digital_products (
        id,
        title,
        slug,
        category
      )
    `)
    .eq("tutor_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  // Fetch summary stats
  const { data: summaryData } = await supabase
    .from("marketplace_transactions")
    .select("gross_amount_cents, platform_commission_cents, net_amount_cents")
    .eq("tutor_id", user.id)
    .eq("status", "completed");

  const summary = {
    totalGross: summaryData?.reduce((sum, t) => sum + (t.gross_amount_cents || 0), 0) || 0,
    totalCommission: summaryData?.reduce((sum, t) => sum + (t.platform_commission_cents || 0), 0) || 0,
    totalNet: summaryData?.reduce((sum, t) => sum + (t.net_amount_cents || 0), 0) || 0,
    transactionCount: summaryData?.length || 0,
  };

  // Calculate current commission tier
  const commissionTier = summary.totalGross >= 50000 ? "reduced" : "standard";

  return (
    <MarketplaceDashboard
      transactions={transactions || []}
      summary={summary}
      commissionTier={commissionTier}
    />
  );
}
