"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { linkSchema, type LinkFormValues } from "@/lib/validators/link";
import type { LinkRecord } from "@/lib/actions/types";

export async function createLink(values: LinkFormValues) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be signed in to add links." };
  }

  const parsed = linkSchema.safeParse(values);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid link data.";
    return { error: message };
  }

  const { data: existingLinks, error: fetchError } = await supabase
    .from("links")
    .select("sort_order")
    .eq("tutor_id", user.id)
    .order("sort_order", { ascending: false })
    .limit(1);

  if (fetchError) {
    return { error: "We couldn't prepare the new link. Try again." };
  }

  const nextSortOrder =
    existingLinks && existingLinks.length > 0 ? (existingLinks[0].sort_order ?? 0) + 1 : 0;

  const { data, error } = await supabase
    .from("links")
    .insert({
      tutor_id: user.id,
      title: parsed.data.title,
      url: parsed.data.url,
      description: parsed.data.description || null,
      icon_url: parsed.data.icon_url || null,
      button_style: parsed.data.button_style,
      is_visible: parsed.data.is_visible,
      sort_order: nextSortOrder,
    })
    .select("*")
    .single<LinkRecord>();

  if (error) {
    return { error: "We couldn’t create that link. Please try again." };
  }

  revalidatePath("/marketing/links");
  revalidatePath("/dashboard");

  return { data };
}

export async function updateLink(id: string, values: LinkFormValues) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be signed in to update links." };
  }

  const parsed = linkSchema.safeParse(values);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid link data.";
    return { error: message };
  }

  const { data, error } = await supabase
    .from("links")
    .update({
      title: parsed.data.title,
      url: parsed.data.url,
      description: parsed.data.description || null,
      icon_url: parsed.data.icon_url || null,
      button_style: parsed.data.button_style,
      is_visible: parsed.data.is_visible,
    })
    .eq("id", id)
    .eq("tutor_id", user.id)
    .select("*")
    .single<LinkRecord>();

  if (error) {
    return { error: "We couldn’t update that link. Please try again." };
  }

  revalidatePath("/marketing/links");
  revalidatePath("/dashboard");

  return { data };
}

export async function deleteLink(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be signed in to delete links." };
  }

  const { error } = await supabase.from("links").delete().eq("id", id).eq("tutor_id", user.id);

  if (error) {
    return { error: "We couldn’t delete that link. Please try again." };
  }

  revalidatePath("/marketing/links");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function updateLinksOrder(updates: Array<{ id: string; sort_order: number }>) {
  if (updates.length === 0) {
    return { success: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be signed in to reorder links." };
  }

  const results = await Promise.all(
    updates.map((item) =>
      supabase
        .from("links")
        .update({ sort_order: item.sort_order })
        .eq("id", item.id)
        .eq("tutor_id", user.id)
    )
  );

  const failed = results.find(({ error }) => error);

  if (failed?.error) {
    return { error: "We couldn't reorder your links. Please try again." };
  }

  revalidatePath("/marketing/links");
  revalidatePath("/dashboard");

  return { success: true };
}
