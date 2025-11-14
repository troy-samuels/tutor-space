"use server";

import { Buffer } from "buffer";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

const BUCKET = "digital-products";

const productSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().max(2000).optional(),
  price: z.coerce.number().min(1, "Price must be at least $1"),
  currency: z.string().min(3).default("usd"),
  fulfillment_type: z.enum(["file", "link"]).default("file"),
  external_url: z.string().url().optional(),
});

export type ProductFormState = {
  error?: string;
  success?: string;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function uploadDigitalFile(userId: string, file: File) {
  const supabase = await createClient();
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const path = `${userId}/${Date.now()}-${file.name}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  return path;
}

export async function createDigitalProduct(
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const parsed = productSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    price: formData.get("price"),
    currency: formData.get("currency"),
    fulfillment_type: formData.get("fulfillment_type") ?? "file",
    external_url: formData.get("external_url"),
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: issue?.message ?? "Invalid product details." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const slugBase = slugify(parsed.data.title);
  let slug = slugBase;
  let slugAttempt = 1;

  while (true) {
    const { data: existing } = await supabase
      .from("digital_products")
      .select("id")
      .eq("tutor_id", user.id)
      .eq("slug", slug)
      .maybeSingle();

    if (!existing) break;
    slug = `${slugBase}-${slugAttempt++}`;
  }

  let storagePath: string | null = null;

  if (parsed.data.fulfillment_type === "file") {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { error: "Upload a file to sell." };
    }
    try {
      storagePath = await uploadDigitalFile(user.id, file);
    } catch (error) {
      console.error("[DigitalProducts] Failed to upload file", error);
      return { error: "Unable to upload file. Try a smaller file or different format." };
    }
  }

  if (parsed.data.fulfillment_type === "link" && !parsed.data.external_url) {
    return { error: "Provide a download link for link-only products." };
  }

  const priceCents = Math.round(parsed.data.price * 100);

  const stripeProduct = await stripe.products.create({
    name: parsed.data.title,
    description: parsed.data.description,
    metadata: {
      tutorId: user.id,
      slug,
    },
  });

  const stripePrice = await stripe.prices.create({
    product: stripeProduct.id,
    unit_amount: priceCents,
    currency: parsed.data.currency.toLowerCase(),
  });

  const { error: insertError } = await supabase.from("digital_products").insert({
    tutor_id: user.id,
    slug,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    price_cents: priceCents,
    currency: parsed.data.currency.toLowerCase(),
    fulfillment_type: parsed.data.fulfillment_type,
    storage_path: storagePath,
    external_url: parsed.data.external_url ?? null,
    stripe_product_id: stripeProduct.id,
    stripe_price_id: stripePrice.id,
  });

  if (insertError) {
    console.error("[DigitalProducts] Failed to insert product", insertError);
    return { error: "Failed to save product. Try again." };
  }

  revalidatePath("/digital-products");
  return { success: "Digital product saved" };
}

export async function listDigitalProductsForTutor() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data } = await supabase
    .from("digital_products")
    .select("*")
    .eq("tutor_id", user.id)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function toggleDigitalProductPublish(productId: string, publish: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authorized" };

  const { error } = await supabase
    .from("digital_products")
    .update({ published: publish, updated_at: new Date().toISOString() })
    .eq("id", productId)
    .eq("tutor_id", user.id);

  if (error) {
    return { error: "Failed to update product" };
  }

  revalidatePath("/digital-products");
  return { success: "Product updated" };
}

export async function deleteDigitalProduct(productId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authorized" };

  const { error } = await supabase
    .from("digital_products")
    .delete()
    .eq("id", productId)
    .eq("tutor_id", user.id);

  if (error) {
    return { error: "Failed to delete product" };
  }

  revalidatePath("/digital-products");
  return { success: "Deleted" };
}
