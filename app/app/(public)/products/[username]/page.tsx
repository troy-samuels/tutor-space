import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductPurchaseForm } from "@/components/digital-products/purchase-form";
import { formatCurrency } from "@/lib/utils";
import { normalizeUsernameSlug } from "@/lib/utils/username-slug";

type PageProps = {
  params: Promise<{ username: string }>;
};

export default async function TutorProductsPage({ params }: PageProps) {
  const resolvedParams = await params;
  const supabase = await createClient();
  const rawLower = resolvedParams.username.trim().toLowerCase();
  const normalized = normalizeUsernameSlug(resolvedParams.username) || rawLower;

  let profileResult = await supabase
    .from("public_profiles")
    .select("id, full_name, bio, username")
    .eq("username", normalized)
    .maybeSingle();

  if (!profileResult.data && rawLower && rawLower !== normalized) {
    profileResult = await supabase
      .from("public_profiles")
      .select("id, full_name, bio, username")
      .eq("username", rawLower)
      .maybeSingle();
  }

  const profile = profileResult.data;

  if (!profile) {
    notFound();
  }

  if (profile.username && profile.username !== resolvedParams.username) {
    redirect(`/products/${profile.username}`);
  }

  const { data: products } = await supabase
    .from("digital_products")
    .select("id, title, description, price_cents, currency, slug")
    .eq("tutor_id", profile.id)
    .eq("published", true)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-12">
      <header className="space-y-2 text-center">
        <p className="text-3xl font-semibold text-foreground">{profile.full_name}</p>
        <p className="text-sm text-muted-foreground">{profile.bio}</p>
      </header>

      {!products || products.length === 0 ? (
        <div className="rounded-3xl border border-border/70 bg-white/90 p-6 text-center text-sm text-muted-foreground">
          No digital products available yet.
        </div>
      ) : (
        <div className="grid gap-4">
          {products.map((product) => (
            <div key={product.id} className="rounded-3xl border border-border bg-white/90 p-6 shadow-sm">
              <p className="text-lg font-semibold text-foreground">{product.title}</p>
              <p className="text-sm text-muted-foreground">{product.description}</p>
              <p className="mt-2 text-base font-semibold text-primary">
                {product.price_cents != null
                  ? formatCurrency(product.price_cents, product.currency?.toUpperCase() || "USD")
                  : "Free"}
              </p>
              <div className="mt-4">
                <ProductPurchaseForm productId={product.id} tutorUsername={profile.username!} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
