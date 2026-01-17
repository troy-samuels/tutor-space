"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  serviceSchema,
  type ServiceInput,
  type ServiceOfferType,
} from "@/lib/validators/service";
import { createLink } from "@/lib/actions/links";
import { getAuthUserResult } from "@/lib/auth";
import {
  archiveStripeServiceProduct,
  canSyncStripeConnectProducts,
  syncServiceToStripeConnect,
  syncPackageToStripeConnect,
} from "@/lib/services/stripe-connect-products";
import { softDeleteService } from "@/lib/repositories/services";
import {
  getTraceId,
  createRequestLogger,
  logStep,
  logStepError,
} from "@/lib/logger";
import { recordAudit } from "@/lib/repositories/audit";

// Note: Import ServiceInput directly from @/lib/validators/service in UI components
// Note: ServiceRecord type moved to @/lib/types/service.ts

type ServiceRecord = {
  id: string;
  tutor_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  currency: string | null;
  price_amount?: number | null;
  price_currency?: string | null;
  is_active: boolean;
  requires_approval: boolean;
  max_students_per_session: number;
  offer_type: ServiceOfferType;
  stripe_product_id?: string | null;
  stripe_price_id?: string | null;
  created_at: string;
  updated_at: string;
};

async function getStripeAccountId(
  supabase: SupabaseClient,
  tutorId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("stripe_account_id")
    .eq("id", tutorId)
    .single<{ stripe_account_id: string | null }>();

  if (error) {
    console.warn("[Services] Failed to load Stripe account ID:", error.message);
    return null;
  }

  const accountId = data?.stripe_account_id ?? null;
  return accountId && accountId.trim().length > 0 ? accountId : null;
}

export async function createService(payload: ServiceInput) {
  const authResult = await getAuthUserResult();
  if (!authResult.success) {
    return { error: authResult.error };
  }
  const user = authResult.data;

  const supabase = await createClient();
  const parsed = serviceSchema.safeParse(payload);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid service details.";
    return { error: message };
  }

  const { data, error } = await supabase
    .from("services")
    .insert({
      tutor_id: user.id,
      name: parsed.data.name,
      description: parsed.data.description || null,
      duration_minutes: parsed.data.duration_minutes,
      price: parsed.data.price_cents, // legacy column
      currency: parsed.data.currency, // legacy column
      price_amount: parsed.data.price_cents,
      price_currency: parsed.data.currency,
      is_active: parsed.data.is_active,
      requires_approval: parsed.data.requires_approval,
      max_students_per_session: parsed.data.max_students_per_session,
      offer_type: parsed.data.offer_type,
    })
    .select("*")
    .single<ServiceRecord>();

  if (error) {
    console.error("[Services] Create service error:", error.message, error.details, error.hint);
    return { error: `Failed to save service: ${error.message}` };
  }

  if (!data) {
    return { error: "We couldn’t save that service. Please try again." };
  }

  let serviceRecord = data;
  const stripeAccountId = await getStripeAccountId(supabase, user.id);
  if (canSyncStripeConnectProducts(stripeAccountId)) {
    try {
      const stripeSync = await syncServiceToStripeConnect({
        stripeAccountId,
        serviceId: data.id,
        tutorId: user.id,
        name: parsed.data.name,
        description: parsed.data.description || null,
        priceCents: parsed.data.price_cents,
        currency: parsed.data.currency,
        durationMinutes: parsed.data.duration_minutes,
        offerType: parsed.data.offer_type,
        isActive: parsed.data.is_active,
        existingProductId: data.stripe_product_id ?? null,
        existingPriceId: data.stripe_price_id ?? null,
        existingPriceCents: data.price_amount ?? data.price ?? null,
        existingCurrency: data.price_currency ?? data.currency ?? null,
      });

      const { data: updated, error: updateError } = await supabase
        .from("services")
        .update({
          stripe_product_id: stripeSync.stripeProductId,
          stripe_price_id: stripeSync.stripePriceId,
        })
        .eq("id", data.id)
        .eq("tutor_id", user.id)
        .select("*")
        .single<ServiceRecord>();

      if (updateError || !updated) {
        await archiveStripeServiceProduct({
          stripeAccountId,
          stripeProductId: stripeSync.stripeProductId,
          stripePriceId: stripeSync.stripePriceId,
        });
        await supabase.from("services").delete().eq("id", data.id).eq("tutor_id", user.id);
        return { error: "We couldn’t sync that service to Stripe. Please try again." };
      }

      serviceRecord = updated;
    } catch (syncError) {
      console.error("[Services] Stripe sync failed:", syncError);
      await supabase.from("services").delete().eq("id", data.id).eq("tutor_id", user.id);
      return { error: "We couldn’t sync that service to Stripe. Please try again." };
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const bookingUrl = `${appUrl.replace(/\/$/, "")}/book?service=${serviceRecord.id}`;

  const { data: existingLink } = await supabase
    .from("links")
    .select("id")
    .eq("tutor_id", user.id)
    .eq("url", bookingUrl)
    .maybeSingle();

  if (!existingLink) {
    await createLink({
      title: `Book ${parsed.data.name}`,
      description: "Secure a spot for this lesson in TutorLingua.",
      url: bookingUrl,
      icon_url: "",
      button_style: "primary",
      is_visible: parsed.data.is_active,
    });
  }

  revalidatePath("/services");
  revalidatePath("/marketing/links");
  revalidatePath("/@");

  return { data: serviceRecord };
}

export async function updateService(id: string, payload: ServiceInput) {
  const authResult = await getAuthUserResult();
  if (!authResult.success) {
    return { error: authResult.error };
  }
  const user = authResult.data;

  const supabase = await createClient();
  const parsed = serviceSchema.safeParse(payload);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid service details.";
    return { error: message };
  }

  const { data: existing, error: existingError } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .eq("tutor_id", user.id)
    .single<ServiceRecord>();

  if (existingError || !existing) {
    return { error: "We couldn’t find that service. Please try again." };
  }

  const stripeAccountId = await getStripeAccountId(supabase, user.id);
  let stripeProductId = existing.stripe_product_id ?? null;
  let stripePriceId = existing.stripe_price_id ?? null;

  if (canSyncStripeConnectProducts(stripeAccountId)) {
    try {
      const stripeSync = await syncServiceToStripeConnect({
        stripeAccountId,
        serviceId: existing.id,
        tutorId: user.id,
        name: parsed.data.name,
        description: parsed.data.description || null,
        priceCents: parsed.data.price_cents,
        currency: parsed.data.currency,
        durationMinutes: parsed.data.duration_minutes,
        offerType: parsed.data.offer_type,
        isActive: parsed.data.is_active,
        existingProductId: stripeProductId,
        existingPriceId: stripePriceId,
        existingPriceCents: existing.price_amount ?? existing.price ?? null,
        existingCurrency: existing.price_currency ?? existing.currency ?? null,
      });
      stripeProductId = stripeSync.stripeProductId;
      stripePriceId = stripeSync.stripePriceId;
    } catch (syncError) {
      console.error("[Services] Stripe sync failed:", syncError);
      return { error: "We couldn’t sync that service to Stripe. Please try again." };
    }
  }

  const { data, error } = await supabase
    .from("services")
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      duration_minutes: parsed.data.duration_minutes,
      price: parsed.data.price_cents, // legacy column
      currency: parsed.data.currency, // legacy column
      price_amount: parsed.data.price_cents,
      price_currency: parsed.data.currency,
      is_active: parsed.data.is_active,
      requires_approval: parsed.data.requires_approval,
      max_students_per_session: parsed.data.max_students_per_session,
      offer_type: parsed.data.offer_type,
      stripe_product_id: stripeProductId,
      stripe_price_id: stripePriceId,
    })
    .eq("id", id)
    .eq("tutor_id", user.id)
    .select("*")
    .single<ServiceRecord>();

  if (error) {
    return { error: "We couldn't update that service. Please try again." };
  }

  // Record audit if price changed
  const priceChanged =
    (existing.price_amount ?? existing.price) !== parsed.data.price_cents ||
    (existing.price_currency ?? existing.currency) !== parsed.data.currency;

  if (priceChanged) {
    await recordAudit(supabase, {
      actorId: user.id,
      targetId: id,
      entityType: "billing",
      actionType: "update",
      metadata: {
        change_type: "service_pricing",
        service_name: existing.name,
        before: {
          price_amount: existing.price_amount ?? existing.price,
          price_currency: existing.price_currency ?? existing.currency,
        },
        after: {
          price_amount: parsed.data.price_cents,
          price_currency: parsed.data.currency,
        },
      },
    });

    // Auto-update linked session packages when service price changes
    const { data: linkedPackages, error: linkedPackagesError } = await supabase
      .from("session_package_templates")
      .select("id, name, session_count, price_cents, currency, stripe_product_id, stripe_price_id, is_active")
      .eq("service_id", id)
      .eq("tutor_id", user.id);

    if (linkedPackagesError) {
      console.error("[Services] Failed to load linked packages:", linkedPackagesError);
      return { error: "We couldn't update linked packages. Please try again." };
    }

    if (linkedPackages && linkedPackages.length > 0) {
      for (const pkg of linkedPackages) {
        const newPackagePrice = (pkg.session_count ?? 1) * parsed.data.price_cents;

        let newStripeProductId = pkg.stripe_product_id;
        let newStripePriceId = pkg.stripe_price_id;

        // Sync to Stripe Connect if tutor has connected account
        if (canSyncStripeConnectProducts(stripeAccountId)) {
          try {
            const syncResult = await syncPackageToStripeConnect({
              stripeAccountId,
              packageId: pkg.id,
              tutorId: user.id,
              serviceId: id,
              serviceName: parsed.data.name,
              packageName: pkg.name || `${pkg.session_count ?? 1} Lesson Package`,
              priceCents: newPackagePrice,
              currency: parsed.data.currency,
              sessionCount: pkg.session_count ?? 1,
              isActive: pkg.is_active,
              existingProductId: pkg.stripe_product_id,
              existingPriceId: pkg.stripe_price_id,
              existingPriceCents: pkg.price_cents,
              existingCurrency: pkg.currency,
            });
            newStripeProductId = syncResult.stripeProductId;
            newStripePriceId = syncResult.stripePriceId;
          } catch (syncError) {
            console.error(`[Services] Package ${pkg.id} Stripe sync failed:`, syncError);
            return { error: "We couldn't sync linked packages to Stripe. Please try again." };
          }
        }

        const { error: updateError } = await supabase
          .from("session_package_templates")
          .update({
            price_cents: newPackagePrice,
            currency: parsed.data.currency,
            stripe_product_id: newStripeProductId,
            stripe_price_id: newStripePriceId,
          })
          .eq("id", pkg.id)
          .eq("tutor_id", user.id);

        if (updateError) {
          console.error(`[Services] Package ${pkg.id} DB update failed:`, updateError);
          return { error: "We couldn't update linked packages. Please try again." };
        }
      }
    }
  }

  if (data) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const bookingUrl = `${appUrl.replace(/\/$/, "")}/book?service=${data.id}`;

    const { data: existingLink } = await supabase
      .from("links")
      .select("id")
      .eq("tutor_id", user.id)
      .eq("url", bookingUrl)
      .maybeSingle();

    if (existingLink) {
      await supabase
        .from("links")
        .update({
          title: `Book ${parsed.data.name}`,
          description: "Secure a spot for this lesson in TutorLingua.",
          is_visible: parsed.data.is_active,
        })
        .eq("id", existingLink.id);
    } else if (parsed.data.is_active) {
      await createLink({
        title: `Book ${parsed.data.name}`,
        description: "Secure a spot for this lesson in TutorLingua.",
        url: bookingUrl,
        icon_url: "",
        button_style: "primary",
        is_visible: true,
      });
    }
  }

  revalidatePath("/services");
  revalidatePath("/marketing/links");
  revalidatePath("/@");

  return { data };
}

export async function deleteService(id: string) {
  const traceId = await getTraceId();
  const authResult = await getAuthUserResult();
  if (!authResult.success) {
    return { error: authResult.error };
  }
  const user = authResult.data;
  const log = createRequestLogger(traceId, user.id);

  logStep(log, "deleteService:start", { serviceId: id });

  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("services")
    .select("id, stripe_product_id, stripe_price_id")
    .eq("id", id)
    .eq("tutor_id", user.id)
    .is("deleted_at", null)
    .single<Pick<ServiceRecord, "id" | "stripe_product_id" | "stripe_price_id">>();

  if (existingError || !existing) {
    logStep(log, "deleteService:not_found", { serviceId: id });
    return { error: "We couldn't find that service. Please try again." };
  }

  const stripeAccountId = await getStripeAccountId(supabase, user.id);
  if (canSyncStripeConnectProducts(stripeAccountId) && existing.stripe_product_id) {
    try {
      await archiveStripeServiceProduct({
        stripeAccountId,
        stripeProductId: existing.stripe_product_id ?? null,
        stripePriceId: existing.stripe_price_id ?? null,
      });
      logStep(log, "deleteService:stripe_archived", { serviceId: id });
    } catch (syncError) {
      logStepError(log, "deleteService:stripe_archive_failed", syncError, { serviceId: id });
      return { error: "We couldn't remove that Stripe product. Please try again." };
    }
  }

  logStep(log, "softDelete:service", { serviceId: id, deletedAt: new Date().toISOString() });
  const result = await softDeleteService(supabase, id, user.id);

  if (!result.success) {
    logStepError(log, "softDelete:service:failed", result.error, { serviceId: id });
    return { error: "We couldn't delete that service. Please try again." };
  }

  revalidatePath("/services");
  revalidatePath("/marketing/links");
  revalidatePath("/@");

  logStep(log, "deleteService:success", { serviceId: id });
  return { success: true };
}
