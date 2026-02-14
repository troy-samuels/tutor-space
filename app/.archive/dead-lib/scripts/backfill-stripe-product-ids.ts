/**
 * Backfill stripe_product_id for session packages that only have stripe_price_id.
 *
 * This script:
 * 1. Finds all session_package_templates with stripe_price_id but no stripe_product_id
 * 2. For each, retrieves the price from Stripe to get the product ID
 * 3. Updates the package with the product ID
 * 4. Clears invalid Stripe IDs if the resource no longer exists
 *
 * Run with: npx tsx app/lib/scripts/backfill-stripe-product-ids.ts
 */

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

interface BackfillResult {
  totalFound: number;
  updated: number;
  cleared: number;
  skipped: number;
  errors: Array<{ packageId: string; error: string }>;
}

export async function backfillStripeProductIds(): Promise<BackfillResult> {
  const supabase = createServiceRoleClient();

  if (!supabase) {
    throw new Error("Supabase service role client not available");
  }

  const result: BackfillResult = {
    totalFound: 0,
    updated: 0,
    cleared: 0,
    skipped: 0,
    errors: [],
  };

  console.log("[Backfill] Starting stripe_product_id backfill...");

  // Find packages with price ID but no product ID
  const { data: orphanedPackages, error: fetchError } = await supabase
    .from("session_package_templates")
    .select("id, tutor_id, stripe_price_id")
    .not("stripe_price_id", "is", null)
    .is("stripe_product_id", null);

  if (fetchError) {
    throw new Error(`Failed to fetch orphaned packages: ${fetchError.message}`);
  }

  if (!orphanedPackages || orphanedPackages.length === 0) {
    console.log("[Backfill] No orphaned packages found. Nothing to backfill.");
    return result;
  }

  result.totalFound = orphanedPackages.length;
  console.log(`[Backfill] Found ${result.totalFound} packages to process`);

  for (const pkg of orphanedPackages) {
    console.log(`[Backfill] Processing package ${pkg.id}...`);

    // Get tutor's Stripe account ID
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", pkg.tutor_id)
      .single();

    if (profileError || !profile?.stripe_account_id) {
      console.log(`[Backfill] Package ${pkg.id}: No Stripe account for tutor ${pkg.tutor_id}, skipping`);
      result.skipped++;
      continue;
    }

    try {
      // Retrieve price from Stripe to get the product ID
      const price = await stripe.prices.retrieve(
        pkg.stripe_price_id!,
        { stripeAccount: profile.stripe_account_id }
      );

      const productId = typeof price.product === "string"
        ? price.product
        : price.product.id;

      // Update package with product ID
      const { error: updateError } = await supabase
        .from("session_package_templates")
        .update({ stripe_product_id: productId })
        .eq("id", pkg.id);

      if (updateError) {
        console.error(`[Backfill] Package ${pkg.id}: DB update failed:`, updateError.message);
        result.errors.push({ packageId: pkg.id, error: updateError.message });
        continue;
      }

      console.log(`[Backfill] Package ${pkg.id}: Updated with product ${productId}`);
      result.updated++;

    } catch (error: unknown) {
      const stripeError = error as { code?: string; message?: string };

      if (stripeError.code === "resource_missing") {
        // Price no longer exists in Stripe - clear the invalid ID
        console.warn(`[Backfill] Package ${pkg.id}: Price ${pkg.stripe_price_id} not found in Stripe, clearing`);

        const { error: clearError } = await supabase
          .from("session_package_templates")
          .update({ stripe_price_id: null })
          .eq("id", pkg.id);

        if (clearError) {
          result.errors.push({ packageId: pkg.id, error: `Clear failed: ${clearError.message}` });
        } else {
          result.cleared++;
        }
      } else {
        const errorMessage = stripeError.message || "Unknown error";
        console.error(`[Backfill] Package ${pkg.id}: Stripe error:`, errorMessage);
        result.errors.push({ packageId: pkg.id, error: errorMessage });
      }
    }
  }

  console.log("\n[Backfill] Complete!");
  console.log(`  Total found: ${result.totalFound}`);
  console.log(`  Updated: ${result.updated}`);
  console.log(`  Cleared (invalid): ${result.cleared}`);
  console.log(`  Skipped (no Stripe account): ${result.skipped}`);
  console.log(`  Errors: ${result.errors.length}`);

  if (result.errors.length > 0) {
    console.log("\n[Backfill] Errors:");
    for (const err of result.errors) {
      console.log(`  - Package ${err.packageId}: ${err.error}`);
    }
  }

  return result;
}

// Run if executed directly
if (require.main === module) {
  backfillStripeProductIds()
    .then((result) => {
      process.exit(result.errors.length > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error("[Backfill] Fatal error:", error);
      process.exit(1);
    });
}
