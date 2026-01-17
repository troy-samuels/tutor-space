"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  sessionPackageSchema,
  type SessionPackageInput,
} from "@/lib/validators/session-package";
import type { SessionPackageRecord } from "@/lib/types/session-package";
import {
  canSyncStripeConnectProducts,
  syncPackageToStripeConnect,
  archiveStripePackageProduct,
} from "@/lib/services/stripe-connect-products";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null as null };
  }

  return { supabase, user };
}

async function getTutorStripeAccountId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tutorId: string
): Promise<string | null> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("stripe_account_id")
    .eq("id", tutorId)
    .single();

  if (error) {
    console.warn("[SessionPackages] Failed to load Stripe account ID:", error.message);
    return null;
  }

  const accountId = profile?.stripe_account_id ?? null;
  return accountId && accountId.trim().length > 0 ? accountId.trim() : null;
}

export async function createSessionPackage(
  serviceId: string | null,
  payload: SessionPackageInput
) {
  const { supabase, user } = await requireUser();

  if (!user) {
    return { error: "You need to be signed in to add a package." };
  }

  const parsed = sessionPackageSchema.safeParse(payload);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid package details.";
    return { error: message };
  }

  // Step 1: Insert package to DB first (without Stripe IDs)
  const { data: newPackage, error: insertError } = await supabase
    .from("session_package_templates")
    .insert({
      tutor_id: user.id,
      service_id: serviceId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      session_count: parsed.data.session_count,
      total_minutes: parsed.data.total_minutes,
      price_cents: parsed.data.price_cents,
      currency: parsed.data.currency,
      stripe_product_id: null,
      stripe_price_id: null,
      is_active: parsed.data.is_active,
    })
    .select("*")
    .single<SessionPackageRecord>();

  if (insertError || !newPackage) {
    console.error("[SessionPackages] DB insert failed:", insertError);
    return { error: "We couldn't save that package. Please try again." };
  }

  // Step 2: Sync to Stripe Connect using the real packageId
  const stripeAccountId = await getTutorStripeAccountId(supabase, user.id);

  if (canSyncStripeConnectProducts(stripeAccountId)) {
    // Get service name for the product
    let serviceName = parsed.data.name;
    if (serviceId) {
      const { data: service } = await supabase
        .from("services")
        .select("name")
        .eq("id", serviceId)
        .eq("tutor_id", user.id)
        .maybeSingle();
      if (service?.name) {
        serviceName = service.name;
      }
    }

    try {
      const syncResult = await syncPackageToStripeConnect({
        stripeAccountId,
        packageId: newPackage.id, // Real packageId for Stripe metadata
        tutorId: user.id,
        serviceId,
        serviceName,
        packageName: parsed.data.name,
        priceCents: parsed.data.price_cents,
        currency: parsed.data.currency,
        sessionCount: parsed.data.session_count ?? 1,
        isActive: parsed.data.is_active,
      });

      // Step 3: Update DB with Stripe IDs
      const { data: updated, error: updateError } = await supabase
        .from("session_package_templates")
        .update({
          stripe_product_id: syncResult.stripeProductId,
          stripe_price_id: syncResult.stripePriceId,
        })
        .eq("id", newPackage.id)
        .eq("tutor_id", user.id)
        .select("*")
        .single<SessionPackageRecord>();

      if (updateError || !updated) {
        console.error(
          `[SessionPackages] Failed to update package ${newPackage.id} with Stripe IDs:`,
          updateError
        );
        try {
          await archiveStripePackageProduct({
            stripeAccountId,
            stripeProductId: syncResult.stripeProductId,
            stripePriceId: syncResult.stripePriceId,
          });
        } catch (cleanupError) {
          console.error(
            `[SessionPackages] Failed to archive Stripe items after DB update error for ${newPackage.id}:`,
            cleanupError
          );
        }
        await supabase
          .from("session_package_templates")
          .delete()
          .eq("id", newPackage.id)
          .eq("tutor_id", user.id);
        return { error: "We couldn't sync this package to Stripe. Please try again." };
      }

      newPackage.stripe_product_id = updated.stripe_product_id;
      newPackage.stripe_price_id = updated.stripe_price_id;
    } catch (stripeError) {
      console.error(
        `[SessionPackages] Stripe sync failed for new package ${newPackage.id}:`,
        stripeError
      );
      await supabase
        .from("session_package_templates")
        .delete()
        .eq("id", newPackage.id)
        .eq("tutor_id", user.id);
      return { error: "We couldn't sync this package to Stripe. Please try again." };
    }
  }

  revalidatePath("/services");
  revalidatePath("/dashboard");
  revalidatePath("/@");

  return { data: newPackage };
}

export async function updateSessionPackage(
  packageId: string,
  payload: SessionPackageInput
) {
  const { supabase, user } = await requireUser();

  if (!user) {
    return { error: "You need to be signed in to update packages." };
  }

  const parsed = sessionPackageSchema.safeParse(payload);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid package details.";
    return { error: message };
  }

  const { data: existing, error: fetchError } = await supabase
    .from("session_package_templates")
    .select("*")
    .eq("id", packageId)
    .eq("tutor_id", user.id)
    .single<SessionPackageRecord>();

  if (fetchError || !existing) {
    return { error: "We couldn't find that package to update." };
  }

  // Get tutor's Stripe Connect account ID
  const stripeAccountId = await getTutorStripeAccountId(supabase, user.id);

  let stripeProductId = existing.stripe_product_id;
  let stripePriceId = existing.stripe_price_id;

  // Sync to Stripe Connect if tutor has connected account
  if (canSyncStripeConnectProducts(stripeAccountId)) {
    // Get service name for the product
    let serviceName = parsed.data.name;
    if (existing.service_id) {
      const { data: service } = await supabase
        .from("services")
        .select("name")
        .eq("id", existing.service_id)
        .eq("tutor_id", user.id)
        .maybeSingle();
      if (service?.name) {
        serviceName = service.name;
      }
    }

    try {
      const syncResult = await syncPackageToStripeConnect({
        stripeAccountId,
        packageId,
        tutorId: user.id,
        serviceId: existing.service_id,
        serviceName,
        packageName: parsed.data.name,
        priceCents: parsed.data.price_cents,
        currency: parsed.data.currency,
        sessionCount: parsed.data.session_count ?? 1,
        isActive: parsed.data.is_active,
        existingProductId: existing.stripe_product_id,
        existingPriceId: existing.stripe_price_id,
        existingPriceCents: existing.price_cents,
        existingCurrency: existing.currency,
      });

      stripeProductId = syncResult.stripeProductId;
      stripePriceId = syncResult.stripePriceId;
    } catch (stripeError) {
      console.error("[SessionPackages] Stripe sync failed:", stripeError);
      return { error: "We couldn't sync this package to Stripe. Please try again." };
    }
  }

  const { data, error } = await supabase
    .from("session_package_templates")
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      session_count: parsed.data.session_count,
      total_minutes: parsed.data.total_minutes,
      price_cents: parsed.data.price_cents,
      currency: parsed.data.currency,
      stripe_product_id: stripeProductId,
      stripe_price_id: stripePriceId,
      is_active: parsed.data.is_active,
    })
    .eq("id", packageId)
    .eq("tutor_id", user.id)
    .select("*")
    .single<SessionPackageRecord>();

  if (error) {
    return { error: "We couldn't update that package. Please try again." };
  }

  revalidatePath("/services");
  revalidatePath("/dashboard");
  revalidatePath("/@");

  return { data };
}

export async function hasActivePackage(
  studentId: string,
  tutorId: string
): Promise<boolean> {
  const { supabase } = await requireUser();

  try {
    // Check if there are any active, non-expired purchases for this student
    // from packages belonging to this tutor
    const { data: purchases, error } = await supabase
      .from("session_package_purchases")
      .select(`
        id,
        remaining_minutes,
        expires_at,
        status,
        package:session_package_templates!inner (
          tutor_id
        )
      `)
      .eq("student_id", studentId)
      .eq("status", "active")
      .eq("package.tutor_id", tutorId);

    if (error) {
      console.error("[session-packages] Error checking active packages:", error);
      return false;
    }

    if (!purchases || purchases.length === 0) {
      return false;
    }

    // Check if any purchase has remaining minutes and hasn't expired
    const now = new Date();
    const hasActive = purchases.some((purchase) => {
      const remainingMinutes = purchase.remaining_minutes || 0;
      const isExpired = purchase.expires_at
        ? new Date(purchase.expires_at) < now
        : false;

      return remainingMinutes > 0 && !isExpired;
    });

    return hasActive;
  } catch (err) {
    console.error("[session-packages] Unexpected error in hasActivePackage:", err);
    return false;
  }
}

export async function deleteSessionPackage(packageId: string) {
  const { supabase, user } = await requireUser();

  if (!user) {
    return { error: "You need to be signed in to delete packages." };
  }

  // Fetch existing package to get Stripe IDs
  const { data: existing, error: fetchError } = await supabase
    .from("session_package_templates")
    .select("stripe_product_id, stripe_price_id")
    .eq("id", packageId)
    .eq("tutor_id", user.id)
    .single();

  if (fetchError || !existing) {
    return { error: "We couldn't find that package to delete." };
  }

  // Archive Stripe items if they exist
  const stripeAccountId = await getTutorStripeAccountId(supabase, user.id);
  if (canSyncStripeConnectProducts(stripeAccountId) && existing.stripe_product_id) {
    try {
      await archiveStripePackageProduct({
        stripeAccountId,
        stripeProductId: existing.stripe_product_id,
        stripePriceId: existing.stripe_price_id,
      });
    } catch (stripeError) {
      console.error("[SessionPackages] Failed to archive Stripe items:", stripeError);
      // Continue with deletion - Stripe items being orphaned is better than blocking delete
    }
  }

  const { error } = await supabase
    .from("session_package_templates")
    .delete()
    .eq("id", packageId)
    .eq("tutor_id", user.id);

  if (error) {
    return { error: "We couldn't delete that package. Please try again." };
  }

  revalidatePath("/services");
  revalidatePath("/dashboard");
  revalidatePath("/@");

  return { success: true };
}
