import { notFound, redirect } from "next/navigation";
import { Lock, Zap, Star, Play } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { ProductPurchaseForm } from "@/components/digital-products/purchase-form";
import { normalizeUsernameSlug } from "@/lib/utils/username-slug";

type PageProps = {
  params: Promise<{ username: string; productId: string }>;
};

function isVideoUrl(url: string | null) {
  if (!url) return false;
  return /(youtube\.com|youtu\.be|vimeo\.com|loom\.com|\.mp4|\.mov|\.mkv|\.avi)/i.test(url);
}

function isPdfUrl(url: string | null) {
  if (!url) return false;
  return /\.pdf($|\?)/i.test(url);
}

export default async function ProductDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const supabase = await createClient();

  const rawLower = resolvedParams.username.trim().toLowerCase();
  const normalized = normalizeUsernameSlug(resolvedParams.username) || rawLower;

  let profileResult = await supabase
    .from("public_profiles")
    .select("id, full_name, username, bio")
    .eq("username", normalized)
    .maybeSingle();

  if (!profileResult.data && rawLower && rawLower !== normalized) {
    profileResult = await supabase
      .from("public_profiles")
      .select("id, full_name, username, bio")
      .eq("username", rawLower)
      .maybeSingle();
  }

  const profile = profileResult.data;

  if (!profile) {
    notFound();
  }

  if (profile.username && profile.username !== resolvedParams.username) {
    redirect(`/products/${profile.username}/${resolvedParams.productId}`);
  }

  const selectFields =
    "id, title, description, price_cents, currency, fulfillment_type, external_url, storage_path, published";

  const byId = await supabase
    .from("digital_products")
    .select(selectFields)
    .eq("tutor_id", profile.id)
    .eq("published", true)
    .eq("id", resolvedParams.productId)
    .maybeSingle();

  const bySlug = byId.data
    ? null
    : await supabase
        .from("digital_products")
        .select(selectFields)
        .eq("tutor_id", profile.id)
        .eq("published", true)
        .eq("slug", resolvedParams.productId)
        .maybeSingle();

  const product = byId.data ?? bySlug?.data;

  if (!product) {
    notFound();
  }

  const priceLabel = formatCurrency(product.price_cents, product.currency?.toUpperCase() || "USD");
  const videoMode = product.fulfillment_type === "link" && isVideoUrl(product.external_url);
  const pdfMode = isPdfUrl(product.storage_path) || isPdfUrl(product.external_url);

  return (
    <div className="bg-gradient-to-b from-white to-stone-50">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 pb-28 pt-10 md:flex-row md:gap-10 md:pb-12 md:pt-16">
        <div className="flex-1 rounded-3xl bg-stone-50 p-6 shadow-inner">
          <div className="relative flex h-full min-h-[380px] items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg">
            {videoMode ? (
              <div className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-br from-stone-900 to-stone-700">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/80 text-stone-900 shadow-lg backdrop-blur">
                    <Play className="h-8 w-8" />
                  </div>
                </div>
                {product.external_url ? (
                  <iframe
                    title={product.title}
                    src={product.external_url}
                    className="h-full w-full opacity-40"
                    allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                ) : null}
              </div>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-8">
                <div className="flex h-56 w-40 items-center justify-center rounded-2xl bg-gradient-to-br from-white to-stone-200 text-muted-foreground shadow-xl">
                  <span className="font-serif text-lg text-stone-700">
                    {pdfMode ? "PDF" : "Preview"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">High-quality preview</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 rounded-3xl border border-border bg-white p-6 shadow-lg md:p-8">
          <div className="space-y-3">
            <p className="font-serif text-4xl text-foreground">{product.title}</p>
            <p className="text-2xl font-medium text-primary">{priceLabel}</p>
            <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
              {product.description || "Self-paced resource for language learners."}
            </p>
          </div>

          <div id="purchase-form" className="mt-8 space-y-4">
            <ProductPurchaseForm
              productId={product.id}
              tutorUsername={profile.username!}
              buttonLabel={`Buy for ${priceLabel}`}
              fullWidth
            />
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1">
                <Lock className="h-3.5 w-3.5" />
                Secure payment via Stripe
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1">
                <Zap className="h-3.5 w-3.5" />
                Instant Access
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1">
                <Star className="h-3.5 w-3.5" />
                100% Satisfaction
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-white/95 px-4 py-3 shadow-2xl md:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Get this resource</p>
            <p className="text-base font-semibold text-primary">{priceLabel}</p>
          </div>
          <a
            href="#purchase-form"
            className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-orange-500 px-4 text-sm font-semibold text-white shadow hover:bg-orange-600"
          >
            Buy for {priceLabel}
          </a>
        </div>
      </div>
    </div>
  );
}
