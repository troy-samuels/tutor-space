import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductPurchaseForm } from "@/components/digital-products/purchase-form";

type PageProps = {
  params: { username: string };
};

export default async function TutorProductsPage({ params }: PageProps) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, bio, username")
    .eq("username", params.username)
    .single();

  if (!profile) {
    notFound();
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
              <p className="mt-2 text-base font-semibold text-brand-brown">
                ${(product.price_cents / 100).toFixed(2)} {product.currency.toUpperCase()}
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
