"use server";

import Stripe from "stripe";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  sessionPackageSchema,
  type SessionPackageInput,
} from "@/lib/validators/session-package";
import type { SessionPackageRecord } from "@/lib/types/session-package";

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

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
let stripeClient: Stripe | null | undefined;

function getStripe(): Stripe | null {
  if (typeof stripeClient !== "undefined") {
    return stripeClient;
  }

  if (!stripeSecretKey) {
    stripeClient = null;
    return stripeClient;
  }

  stripeClient = new Stripe(stripeSecretKey, {
    apiVersion: "2025-09-30.clover",
  });

  return stripeClient;
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

  let stripePriceId: string | null = null;
  const stripe = getStripe();
  if (stripe && parsed.data.price_cents > 0) {
    try {
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

      const product = await stripe.products.create({
        name: `${serviceName} package`,
        metadata: {
          tutor_id: user.id,
          service_id: serviceId ?? "",
        },
      });

      const price = await stripe.prices.create({
        currency: parsed.data.currency.toLowerCase(),
        unit_amount: parsed.data.price_cents,
        product: product.id,
      });

      stripePriceId = price.id;
    } catch (stripeError) {
      console.error("[SessionPackages] Failed to create Stripe price", stripeError);
    }
  }

  const { data, error } = await supabase
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
      stripe_price_id: stripePriceId,
      is_active: parsed.data.is_active,
    })
    .select("*")
    .single<SessionPackageRecord>();

  if (error) {
    return { error: "We couldn’t save that package. Please try again." };
  }

  revalidatePath("/services");
  revalidatePath("/dashboard");
  revalidatePath("/@");

  return { data };
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

  let stripePriceId = existing.stripe_price_id;
  const stripe = getStripe();
  if (
    stripe &&
    (parsed.data.price_cents !== existing.price_cents ||
      parsed.data.currency.toLowerCase() !== existing.currency.toLowerCase()) &&
    parsed.data.price_cents > 0
  ) {
    try {
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

      const product = await stripe.products.create({
        name: `${serviceName} package`,
        metadata: {
          tutor_id: user.id,
          service_id: existing.service_id ?? "",
        },
      });

      const price = await stripe.prices.create({
        currency: parsed.data.currency.toLowerCase(),
        unit_amount: parsed.data.price_cents,
        product: product.id,
      });

      stripePriceId = price.id;
    } catch (stripeError) {
      console.error("[SessionPackages] Failed to update Stripe price", stripeError);
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
      stripe_price_id: stripePriceId,
      is_active: parsed.data.is_active,
    })
    .eq("id", packageId)
    .eq("tutor_id", user.id)
    .select("*")
    .single<SessionPackageRecord>();

  if (error) {
    return { error: "We couldn’t update that package. Please try again." };
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

  const { error } = await supabase
    .from("session_package_templates")
    .delete()
    .eq("id", packageId)
    .eq("tutor_id", user.id);

  if (error) {
    return { error: "We couldn’t delete that package. Please try again." };
  }

  revalidatePath("/services");
  revalidatePath("/dashboard");
  revalidatePath("/@");

  return { success: true };
}
