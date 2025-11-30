"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  serviceSchema,
  type ServiceInput,
  type ServiceOfferType,
} from "@/lib/validators/service";
import { createLink } from "@/lib/actions/links";
import { getAuthUserResult } from "@/lib/auth";

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
  created_at: string;
  updated_at: string;
};

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

  if (data) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const bookingUrl = `${appUrl.replace(/\/$/, "")}/book?service=${data.id}`;

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
  }

  revalidatePath("/services");
  revalidatePath("/marketing/links");
  revalidatePath("/@");

  return { data };
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
    })
    .eq("id", id)
    .eq("tutor_id", user.id)
    .select("*")
    .single<ServiceRecord>();

  if (error) {
    return { error: "We couldn’t update that service. Please try again." };
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
  const authResult = await getAuthUserResult();
  if (!authResult.success) {
    return { error: authResult.error };
  }
  const user = authResult.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", id)
    .eq("tutor_id", user.id);

  if (error) {
    return { error: "We couldn’t delete that service. Please try again." };
  }

  revalidatePath("/services");
  revalidatePath("/marketing/links");
  revalidatePath("/@");

  return { success: true };
}
